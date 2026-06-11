import { createAuthSessionFromCognitoResponse } from "../../models/auth/AuthSession";
import { fetchWithTimeout } from "../../utils/http/fetchWithTimeout";
import { NetworkError, TimeoutError } from "../../utils/http/HttpError";
import { AuthError } from "./AuthError";
import getAuthConfig from "./authConfig";

const COGNITO_TARGET = "AWSCognitoIdentityProviderService.InitiateAuth";

function normalizeUsername(email) {
  return String(email || "").trim().toLowerCase();
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function cognitoMessageFor(code) {
  switch (code) {
    case "NotAuthorizedException":
    case "UserNotFoundException":
      return "Email ou senha invalidos.";
    case "UserNotConfirmedException":
      return "A conta ainda precisa ser confirmada antes do acesso.";
    case "PasswordResetRequiredException":
      return "A senha precisa ser redefinida antes do acesso.";
    case "TooManyRequestsException":
    case "LimitExceededException":
      return "Muitas tentativas. Aguarde alguns instantes e tente novamente.";
    default:
      return "Nao foi possivel autenticar agora. Tente novamente.";
  }
}

function extractCognitoCode(body) {
  const rawCode = body?.__type || body?.code || body?.Code;
  return rawCode ? String(rawCode).split("#").pop() : "CognitoError";
}

export default class CognitoAuthClient {
  constructor({ config = getAuthConfig(), fetcher = fetchWithTimeout } = {}) {
    this.config = config;
    this.fetcher = fetcher;
  }

  buildInitiateAuthRequest({ email, password }) {
    const username = normalizeUsername(email);

    if (!username || !password) {
      throw new AuthError("Informe email e senha para entrar.", {
        code: "VALIDATION_ERROR",
      });
    }

    if (this.config.authFlow !== "USER_PASSWORD_AUTH") {
      throw new AuthError(
        "O fluxo USER_SRP_AUTH esta documentado no Cognito, mas o frontend v1 usa USER_PASSWORD_AUTH.",
        { code: "UNSUPPORTED_AUTH_FLOW" },
      );
    }

    return {
      username,
      request: {
        method: "POST",
        headers: {
          "Content-Type": "application/x-amz-json-1.1",
          "X-Amz-Target": COGNITO_TARGET,
        },
        body: JSON.stringify({
          AuthFlow: this.config.authFlow,
          ClientId: this.config.appClientId,
          AuthParameters: {
            USERNAME: username,
            PASSWORD: password,
          },
        }),
      },
    };
  }

  async login(credentials) {
    const { username, request } = this.buildInitiateAuthRequest(credentials);

    try {
      const response = await this.fetcher(this.config.cognitoEndpoint, request, {
        timeoutMs: this.config.timeoutMs,
      });
      const body = await readJson(response);

      if (!response.ok) {
        const code = extractCognitoCode(body);
        throw new AuthError(cognitoMessageFor(code), { code });
      }

      if (body?.ChallengeName) {
        throw new AuthError(
          "Esta conta exige uma etapa de login ainda nao suportada nesta tela.",
          { code: "UNSUPPORTED_CHALLENGE" },
        );
      }

      return createAuthSessionFromCognitoResponse(body, username);
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }

      if (error instanceof TimeoutError) {
        throw new AuthError("Tempo de autenticacao esgotado. Tente novamente.", {
          code: "TIMEOUT",
          cause: error,
        });
      }

      if (error instanceof NetworkError) {
        throw new AuthError("Falha de conexao. Verifique sua internet.", {
          code: "NETWORK_ERROR",
          cause: error,
        });
      }

      throw new AuthError("Nao foi possivel autenticar agora. Tente novamente.", {
        code: "UNKNOWN_AUTH_ERROR",
        cause: error,
      });
    }
  }
}
