import {
  normalizeRsvpListResponse,
  normalizeRsvpRecord,
} from "../../models/rsvp/rsvpMappers";
import {
  validateCreateRsvpPayload,
  validateListParams,
  validatePatchRsvpPayload,
} from "../../models/rsvp/rsvpValidators";
import { fetchWithTimeout } from "../../utils/http/fetchWithTimeout";
import { HttpError, NetworkError, TimeoutError } from "../../utils/http/HttpError";
import getAuthConfig from "../auth/authConfig";

async function readJson(response) {
  if (response.status === 204) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

function messageForStatus(status, body) {
  if (body?.message) {
    return body.message;
  }

  switch (status) {
    case 400:
      return "Dados invalidos para a operacao.";
    case 401:
      return "Sessao expirada. Entre novamente.";
    case 403:
      return "Voce nao tem permissao para esta operacao.";
    case 404:
      return "RSVP nao encontrado.";
    case 409:
      return "Ja existe um RSVP para este email.";
    default:
      return "Nao foi possivel concluir a operacao.";
  }
}

function statusCode(status) {
  return `HTTP_${status}`;
}

export default class RsvpAdminClient {
  constructor({
    accessToken,
    config = getAuthConfig(),
    fetcher = fetchWithTimeout,
  } = {}) {
    this.accessToken = accessToken;
    this.config = config;
    this.fetcher = fetcher;
  }

  buildUrl(path, query = {}) {
    const url = new URL(path, this.config.rsvpAdminApiBaseUrl);

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });

    return url.toString();
  }

  async request(path, { method = "GET", query, body } = {}) {
    if (!this.accessToken) {
      throw new HttpError("Sessao ausente. Entre novamente.", {
        status: 401,
        code: "HTTP_401",
      });
    }

    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${this.accessToken}`,
    };

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    try {
      const response = await this.fetcher(
        this.buildUrl(path, query),
        {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
        },
        { timeoutMs: this.config.timeoutMs },
      );
      const responseBody = await readJson(response);

      if (!response.ok) {
        throw new HttpError(messageForStatus(response.status, responseBody), {
          status: response.status,
          code: statusCode(response.status),
          body: responseBody,
        });
      }

      return responseBody;
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      if (error instanceof TimeoutError) {
        throw new HttpError("Tempo de resposta esgotado. Tente novamente.", {
          status: 0,
          code: "TIMEOUT",
          body: null,
        });
      }

      if (error instanceof NetworkError) {
        throw new HttpError("Falha de conexao. Tente novamente.", {
          status: 0,
          code: "NETWORK_ERROR",
          body: null,
        });
      }

      throw error;
    }
  }

  async listRsvps({ limit = 20, nextToken = null, status = "" } = {}) {
    const params = validateListParams({ limit, status });
    const response = await this.request("/admin/rsvp", {
      query: {
        limit: params.limit,
        nextToken,
        status: params.status,
      },
    });

    return normalizeRsvpListResponse(response);
  }

  async createRsvp(input) {
    const payload = validateCreateRsvpPayload(input);
    const response = await this.request("/admin/rsvp", {
      method: "POST",
      body: payload,
    });

    return response;
  }

  async getRsvp(rsvpId) {
    const response = await this.request(`/admin/rsvp/${encodeURIComponent(rsvpId)}`);
    return normalizeRsvpRecord(response);
  }

  async updateRsvp(original, input) {
    const patch = validatePatchRsvpPayload(original, input);
    const response = await this.request(
      `/admin/rsvp/${encodeURIComponent(original.rsvpId)}`,
      {
        method: "PATCH",
        body: patch,
      },
    );

    return normalizeRsvpRecord(response);
  }

  async deleteRsvp(rsvpId) {
    await this.request(`/admin/rsvp/${encodeURIComponent(rsvpId)}`, {
      method: "DELETE",
    });
  }
}
