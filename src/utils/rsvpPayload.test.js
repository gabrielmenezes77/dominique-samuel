import { describe, it, expect } from "vitest";
import { buildPayload } from "./rsvpPayload";

describe("buildPayload", () => {
  it("trims whitespace from string fields", () => {
    const result = buildPayload({
      nome: "  João  ",
      sobrenome: "  Silva  ",
      email: "  test@example.com  ",
      confirmacao: "  sim  ",
      acompanhantes: "2",
      obs: "  nenhuma  ",
    });
    expect(result.nome).toBe("João");
    expect(result.sobrenome).toBe("Silva");
    expect(result.obs).toBe("nenhuma");
  });

  it("lowercases email", () => {
    const result = buildPayload({
      nome: "Test",
      sobrenome: "User",
      email: "TEST@EXAMPLE.COM",
      confirmacao: "sim",
      acompanhantes: "0",
      obs: "",
    });
    expect(result.email).toBe("test@example.com");
  });

  it("parses acompanhantes as integer", () => {
    const result = buildPayload({
      nome: "Test",
      sobrenome: "User",
      email: "test@example.com",
      confirmacao: "sim",
      acompanhantes: "3",
      obs: "",
    });
    expect(result.acompanhantes).toBe(3);
    expect(typeof result.acompanhantes).toBe("number");
  });

  it("handles empty acompanhantes as 0", () => {
    const result = buildPayload({
      nome: "Test",
      sobrenome: "User",
      email: "test@example.com",
      confirmacao: "nao",
      acompanhantes: "",
      obs: "",
    });
    expect(result.acompanhantes).toBe(0);
  });

  it("trims and lowercases email together", () => {
    const result = buildPayload({
      nome: "Test",
      sobrenome: "User",
      email: "  UPPER@CASE.COM  ",
      confirmacao: "sim",
      acompanhantes: "1",
      obs: "",
    });
    expect(result.email).toBe("upper@case.com");
  });
});
