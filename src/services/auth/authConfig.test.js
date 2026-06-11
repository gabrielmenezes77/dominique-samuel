import { describe, expect, it } from "vitest";
import { getAuthConfig, validateAuthConfig } from "./authConfig";

const VALID_ENV = {
  VITE_AWS_REGION: "us-east-1",
  VITE_COGNITO_ADMIN_APP_CLIENT_ID: "test-client-id",
  VITE_RSVP_ADMIN_API_BASE_URL: "https://dominique-samuel.com",
  VITE_AUTH_FLOW: "USER_PASSWORD_AUTH",
};

describe("authConfig - valid configuration", () => {
  it("exports the trimmed region", () => {
    const config = getAuthConfig(VALID_ENV);
    expect(config.region).toBe("us-east-1");
  });

  it("exports the trimmed appClientId", () => {
    const config = getAuthConfig(VALID_ENV);
    expect(config.appClientId).toBe("test-client-id");
  });

  it("exports the trimmed authFlow", () => {
    const config = getAuthConfig(VALID_ENV);
    expect(config.authFlow).toBe("USER_PASSWORD_AUTH");
  });

  it("builds the cognitoEndpoint from region", () => {
    const config = getAuthConfig(VALID_ENV);
    expect(config.cognitoEndpoint).toBe(
      "https://cognito-idp.us-east-1.amazonaws.com/",
    );
  });

  it("exports rsvpAdminApiBaseUrl without trailing slash", () => {
    const config = getAuthConfig({
      ...VALID_ENV,
      VITE_RSVP_ADMIN_API_BASE_URL: "https://dominique-samuel.com/",
    });
    expect(config.rsvpAdminApiBaseUrl).toBe("https://dominique-samuel.com");
  });

  it("exports documented token lifetimes", () => {
    const config = getAuthConfig(VALID_ENV);
    expect(config.tokenLifetimes.accessTokenSeconds).toBe(3600);
    expect(config.tokenLifetimes.refreshTokenSeconds).toBe(30 * 24 * 60 * 60);
  });

  it("exports the storageKey constant", () => {
    const config = getAuthConfig(VALID_ENV);
    expect(config.storageKey).toBe("ds_admin_session");
  });

  it("accepts USER_SRP_AUTH as a documented auth flow", () => {
    const config = getAuthConfig({
      ...VALID_ENV,
      VITE_AUTH_FLOW: "USER_SRP_AUTH",
    });
    expect(config.authFlow).toBe("USER_SRP_AUTH");
  });

  it("is frozen", () => {
    const config = getAuthConfig(VALID_ENV);
    expect(() => {
      config.region = "eu-west-1";
    }).toThrow();
  });
});

describe("authConfig - missing required variables", () => {
  it("throws when VITE_AWS_REGION is missing", () => {
    expect(() => getAuthConfig({ ...VALID_ENV, VITE_AWS_REGION: "" })).toThrow(
      "VITE_AWS_REGION",
    );
  });

  it("throws when VITE_COGNITO_ADMIN_APP_CLIENT_ID is missing", () => {
    expect(() =>
      getAuthConfig({ ...VALID_ENV, VITE_COGNITO_ADMIN_APP_CLIENT_ID: "" }),
    ).toThrow("VITE_COGNITO_ADMIN_APP_CLIENT_ID");
  });

  it("throws when VITE_RSVP_ADMIN_API_BASE_URL is missing", () => {
    expect(() =>
      getAuthConfig({ ...VALID_ENV, VITE_RSVP_ADMIN_API_BASE_URL: "" }),
    ).toThrow("VITE_RSVP_ADMIN_API_BASE_URL");
  });

  it("throws when VITE_AUTH_FLOW is missing", () => {
    expect(() => getAuthConfig({ ...VALID_ENV, VITE_AUTH_FLOW: "" })).toThrow(
      "VITE_AUTH_FLOW",
    );
  });

  it("validation lists all missing variables", () => {
    const errors = validateAuthConfig({
      ...VALID_ENV,
      VITE_AWS_REGION: "",
      VITE_COGNITO_ADMIN_APP_CLIENT_ID: "",
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("VITE_AWS_REGION"),
        expect.stringContaining("VITE_COGNITO_ADMIN_APP_CLIENT_ID"),
      ]),
    );
  });
});

describe("authConfig - invalid variable values", () => {
  it("throws when VITE_AUTH_FLOW is unsupported", () => {
    expect(() =>
      getAuthConfig({
        ...VALID_ENV,
        VITE_AUTH_FLOW: "ADMIN_USER_PASSWORD_AUTH",
      }),
    ).toThrow("unsupported value");
  });

  it("error message mentions the unsupported flow value", () => {
    expect(() =>
      getAuthConfig({ ...VALID_ENV, VITE_AUTH_FLOW: "BOGUS_FLOW" }),
    ).toThrow("BOGUS_FLOW");
  });

  it("error message includes .env.example guidance", () => {
    expect(() => getAuthConfig({ ...VALID_ENV, VITE_AWS_REGION: "" })).toThrow(
      ".env.example",
    );
  });
});
