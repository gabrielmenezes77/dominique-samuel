const EXPIRY_SKEW_MS = 30_000;

export class AuthSession {
  constructor({
    accessToken,
    tokenType = "Bearer",
    expiresAt,
    issuedAt = Date.now(),
    username = "",
  }) {
    this.accessToken = accessToken;
    this.tokenType = tokenType;
    this.expiresAt = expiresAt;
    this.issuedAt = issuedAt;
    this.username = username;
  }

  get isExpired() {
    return Date.now() >= this.expiresAt - EXPIRY_SKEW_MS;
  }

  toJSON() {
    return {
      accessToken: this.accessToken,
      tokenType: this.tokenType,
      expiresAt: this.expiresAt,
      issuedAt: this.issuedAt,
      username: this.username,
    };
  }

  static fromStorage(value) {
    if (!value || typeof value !== "object") {
      return null;
    }

    if (!value.accessToken || !Number.isFinite(value.expiresAt)) {
      return null;
    }

    return new AuthSession(value);
  }
}

export function createAuthSessionFromCognitoResponse(response, username = "") {
  const result = response?.AuthenticationResult;
  const accessToken = result?.AccessToken;
  const expiresIn = Number(result?.ExpiresIn);

  if (!accessToken || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    throw new Error("Cognito response did not include a valid access token.");
  }

  const issuedAt = Date.now();

  return new AuthSession({
    accessToken,
    tokenType: result?.TokenType || "Bearer",
    expiresAt: issuedAt + expiresIn * 1000,
    issuedAt,
    username,
  });
}
