const SUPPORTED_AUTH_FLOWS = Object.freeze([
  "USER_PASSWORD_AUTH",
  "USER_SRP_AUTH",
]);

export const AUTH_STORAGE_KEY = "ds_admin_session";
export const DEFAULT_AUTH_TIMEOUT_MS = 15_000;

export class AuthConfigError extends Error {
  constructor(errors) {
    const message = [
      "[authConfig] Missing or invalid environment variables:",
      ...errors.map((error) => `  - ${error}`),
      "",
      "Copy .env.example to .env and fill in the required values.",
    ].join("\n");

    super(message);
    this.name = "AuthConfigError";
    this.errors = errors;
  }
}

export function validateAuthConfig(env = import.meta.env) {
  const errors = [];
  // const region = env.VITE_AWS_REGION;
  // const clientId = env.VITE_COGNITO_ADMIN_APP_CLIENT_ID;
  // const apiBaseUrl = env.VITE_RSVP_ADMIN_API_BASE_URL;
  // const authFlow = env.VITE_AUTH_FLOW;
  const region = "us-east-1";
  const clientId = "1dskg3o5jdq1suv06a2tot7c0b";
  const apiBaseUrl = "https://dominique-samuel.com";
  const authFlow = "USER_PASSWORD_AUTH";

  if (!region || region.trim() === "") {
    errors.push(
      "VITE_AWS_REGION is required. Set it in your .env file (example: us-east-1).",
    );
  }

  if (!clientId || clientId.trim() === "") {
    errors.push(
      "VITE_COGNITO_ADMIN_APP_CLIENT_ID is required. Set it in your .env file.",
    );
  }

  if (!apiBaseUrl || apiBaseUrl.trim() === "") {
    errors.push(
      "VITE_RSVP_ADMIN_API_BASE_URL is required. Set it in your .env file (example: https://dominique-samuel.com).",
    );
  }

  if (!authFlow || authFlow.trim() === "") {
    errors.push(
      `VITE_AUTH_FLOW is required. Allowed values: ${SUPPORTED_AUTH_FLOWS.join(", ")}.`,
    );
  } else if (!SUPPORTED_AUTH_FLOWS.includes(authFlow.trim())) {
    errors.push(
      `VITE_AUTH_FLOW has an unsupported value "${authFlow}". Allowed values: ${SUPPORTED_AUTH_FLOWS.join(", ")}.`,
    );
  }

  return errors;
}

export function getAuthConfig(env = import.meta.env) {
  const errors = validateAuthConfig(env);

  if (errors.length > 0) {
    throw new AuthConfigError(errors);
  }

  const region = env.VITE_AWS_REGION.trim();
  const apiBaseUrl = env.VITE_RSVP_ADMIN_API_BASE_URL.trim().replace(/\/$/, "");

  return Object.freeze({
    region,
    appClientId: env.VITE_COGNITO_ADMIN_APP_CLIENT_ID.trim(),
    authFlow: env.VITE_AUTH_FLOW.trim(),
    cognitoEndpoint: `https://cognito-idp.${region}.amazonaws.com/`,
    rsvpAdminApiBaseUrl: apiBaseUrl,
    tokenLifetimes: Object.freeze({
      accessTokenSeconds: 60 * 60,
      idTokenSeconds: 60 * 60,
      refreshTokenSeconds: 30 * 24 * 60 * 60,
    }),
    storageKey: AUTH_STORAGE_KEY,
    timeoutMs: DEFAULT_AUTH_TIMEOUT_MS,
  });
}

export default getAuthConfig;
