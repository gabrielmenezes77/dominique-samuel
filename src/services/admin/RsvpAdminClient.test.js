import { describe, expect, it, vi } from "vitest";
import RsvpAdminClient from "./RsvpAdminClient";
import { HttpError } from "../../utils/http/HttpError";

const CONFIG = {
  rsvpAdminApiBaseUrl: "https://dominique-samuel.com",
  timeoutMs: 15_000,
};

function createClient(fetcher) {
  return new RsvpAdminClient({
    accessToken: "access-token",
    config: CONFIG,
    fetcher,
  });
}

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status || 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("RsvpAdminClient", () => {
  it("builds documented list query parameters and auth header", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse({
        items: [],
        count: 0,
        nextToken: null,
      }),
    );
    const client = createClient(fetcher);

    await client.listRsvps({
      limit: 50,
      nextToken: "cursor",
      status: "ATTENDING",
    });

    expect(fetcher).toHaveBeenCalledWith(
      "https://dominique-samuel.com/admin/rsvp?limit=50&nextToken=cursor&status=ATTENDING",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
      { timeoutMs: 15_000 },
    );
  });

  it("sends create payload to POST /admin/rsvp", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse({
        ok: true,
        rsvpId: "abc",
      }, { status: 201 }),
    );
    const client = createClient(fetcher);

    await client.createRsvp({
      nome: "Ana",
      sobrenome: "Lima",
      email: "ana@example.com",
      confirmacao: "sim",
      acompanhantes: 0,
      obs: "",
    });

    const [, options] = fetcher.mock.calls[0];
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({
      nome: "Ana",
      sobrenome: "Lima",
      email: "ana@example.com",
      confirmacao: "sim",
      acompanhantes: 0,
      obs: "",
    });
  });

  it("sends only changed fields to PATCH /admin/rsvp/{id}", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse({
        rsvpId: "abc",
        nome: "Ana",
        sobrenome: "Lima",
        email: "ana@example.com",
        confirmacao: "nao",
        acompanhantes: 0,
        attendeeCount: 1,
        obs: "",
        createdAt: "2026-06-10T00:00:00.000Z",
        updatedAt: "2026-06-10T00:00:00.000Z",
        submissionCount: 1,
      }),
    );
    const client = createClient(fetcher);
    const original = {
      rsvpId: "abc",
      nome: "Ana",
      sobrenome: "Lima",
      email: "ana@example.com",
      confirmacao: "sim",
      acompanhantes: 0,
      obs: "",
    };

    await client.updateRsvp(original, {
      ...original,
      confirmacao: "nao",
    });

    const [url, options] = fetcher.mock.calls[0];
    expect(url).toBe("https://dominique-samuel.com/admin/rsvp/abc");
    expect(options.method).toBe("PATCH");
    expect(JSON.parse(options.body)).toEqual({ confirmacao: "nao" });
  });

  it("calls DELETE /admin/rsvp/{id}", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const client = createClient(fetcher);

    await client.deleteRsvp("abc");

    expect(fetcher).toHaveBeenCalledWith(
      "https://dominique-samuel.com/admin/rsvp/abc",
      expect.objectContaining({ method: "DELETE" }),
      { timeoutMs: 15_000 },
    );
  });

  it("normalizes documented error statuses", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(jsonResponse({ ok: false, message: "Conflito" }, { status: 409 }));
    const client = createClient(fetcher);

    await expect(
      client.createRsvp({
        nome: "Ana",
        sobrenome: "Lima",
        email: "ana@example.com",
        confirmacao: "sim",
        acompanhantes: 0,
      }),
    ).rejects.toMatchObject({
      name: "HttpError",
      status: 409,
      message: "Conflito",
    });
  });

  it("throws 401 when access token is missing", async () => {
    const client = new RsvpAdminClient({
      accessToken: "",
      config: CONFIG,
      fetcher: vi.fn(),
    });

    await expect(client.listRsvps()).rejects.toBeInstanceOf(HttpError);
  });
});
