import { describe, expect, it } from "vitest";
import {
  validateCreateRsvpPayload,
  validatePatchRsvpPayload,
  validateListParams,
  ValidationError,
} from "./rsvpValidators";

const VALID_CREATE = {
  nome: "Dominique",
  sobrenome: "Silva",
  email: "DOMINIQUE@EXAMPLE.COM",
  confirmacao: "sim",
  acompanhantes: "2",
  obs: "Mesa proxima da familia",
};

describe("rsvpValidators", () => {
  it("normalizes a valid create payload", () => {
    expect(validateCreateRsvpPayload(VALID_CREATE)).toEqual({
      nome: "Dominique",
      sobrenome: "Silva",
      email: "dominique@example.com",
      confirmacao: "sim",
      acompanhantes: 2,
      obs: "Mesa proxima da familia",
    });
  });

  it("rejects invalid create values", () => {
    expect(() =>
      validateCreateRsvpPayload({
        nome: "",
        sobrenome: "",
        email: "not-email",
        confirmacao: "talvez",
        acompanhantes: -1,
      }),
    ).toThrow(ValidationError);
  });

  it("builds a patch with only changed allowed fields", () => {
    const original = validateCreateRsvpPayload(VALID_CREATE);
    expect(
      validatePatchRsvpPayload(original, {
        ...original,
        nome: "Samuel",
        acompanhantes: 1,
      }),
    ).toEqual({
      nome: "Samuel",
      acompanhantes: 1,
    });
  });

  it("rejects an empty patch", () => {
    const original = validateCreateRsvpPayload(VALID_CREATE);
    expect(() => validatePatchRsvpPayload(original, original)).toThrow(
      ValidationError,
    );
  });

  it("validates list limit and status", () => {
    expect(validateListParams({ limit: "50", status: "ATTENDING" })).toEqual({
      limit: 50,
      status: "ATTENDING",
    });

    expect(() => validateListParams({ limit: 101 })).toThrow(ValidationError);
    expect(() => validateListParams({ status: "MAYBE" })).toThrow(
      ValidationError,
    );
  });
});
