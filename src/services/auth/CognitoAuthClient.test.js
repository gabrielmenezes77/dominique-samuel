import { describe, expect, it, vi } from "vitest";
import CognitoAuthClient from "./CognitoAuthClient";
import { AuthError } from "./AuthError";

const CONFIG = {
  appClientId: "client-id",
  authFlow: "USER_PASSWORD_AUTH",
  cognitoEndpoint: "https://cognito-idp.us-east-1.amazonaws.com/",
  timeoutMs: 15_000,
};

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status || 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("CognitoAuthClient", () => {
  it("builds a USER_PASSWORD_AUTH InitiateAuth request", () => {
    const client = new CognitoAuthClient({
      config: CONFIG,
      fetcher: vi.fn(),
    });

    const { username, request } = client.buildInitiateAuthRequest({
      email: "ADMIN@EXAMPLE.COM",
      password: "secret",
    });

    expect(username).toBe("admin@example.com");
    expect(request.method).toBe("POST");
    expect(request.headers).toMatchObject({
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
    });
    expect(JSON.parse(request.body)).toEqual({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: "client-id",
      AuthParameters: {
        USERNAME: "admin@example.com",
        PASSWORD: "secret",
      },
    });
  });

  it("normalizes successful Cognito responses into an auth session", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse({
        AuthenticationResult: {
          AccessToken: "access-token",
          ExpiresIn: 3600,
          TokenType: "Bearer",
        },
      }),
    );
    const client = new CognitoAuthClient({ config: CONFIG, fetcher });

    const session = await client.login({
      email: "admin@example.com",
      password: "secret",
    });

    expect(fetcher).toHaveBeenCalledWith(
      CONFIG.cognitoEndpoint,
      expect.objectContaining({ method: "POST" }),
      { timeoutMs: 15_000 },
    );
    expect(session.accessToken).toBe("access-token");
    expect(session.username).toBe("admin@example.com");
  });

  it("normalizes invalid credentials into a safe AuthError", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          __type: "NotAuthorizedException",
          message: "raw cognito detail",
        },
        { status: 400 },
      ),
    );
    const client = new CognitoAuthClient({ config: CONFIG, fetcher });

    await expect(
      client.login({ email: "admin@example.com", password: "bad" }),
    ).rejects.toMatchObject({
      name: "AuthError",
      code: "NotAuthorizedException",
      message: "Email ou senha invalidos.",
    });
  });

  it("rejects unsupported USER_SRP_AUTH in the v1 client", () => {
    const client = new CognitoAuthClient({
      config: { ...CONFIG, authFlow: "USER_SRP_AUTH" },
      fetcher: vi.fn(),
    });

    expect(() =>
      client.buildInitiateAuthRequest({
        email: "admin@example.com",
        password: "secret",
      }),
    ).toThrow(AuthError);
  });
});
