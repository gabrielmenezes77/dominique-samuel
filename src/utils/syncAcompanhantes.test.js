import { describe, it, expect } from "vitest";
import { syncAcompanhantes } from "./syncAcompanhantes";

describe("syncAcompanhantes", () => {
  const baseForm = {
    nome: "Test",
    sobrenome: "User",
    email: "test@example.com",
    confirmacao: "sim",
    acompanhantes: "2",
    obs: "",
  };

  it('resets acompanhantes to "0" when confirmacao changes to "nao"', () => {
    const result = syncAcompanhantes(baseForm, "confirmacao", "nao");
    expect(result.confirmacao).toBe("nao");
    expect(result.acompanhantes).toBe("0");
  });

  it('does not reset acompanhantes when confirmacao changes to "sim"', () => {
    const form = { ...baseForm, confirmacao: "nao", acompanhantes: "0" };
    const result = syncAcompanhantes(form, "confirmacao", "sim");
    expect(result.confirmacao).toBe("sim");
    expect(result.acompanhantes).toBe("0");
  });

  it("does not affect acompanhantes when other fields change", () => {
    const result = syncAcompanhantes(baseForm, "nome", "Maria");
    expect(result.nome).toBe("Maria");
    expect(result.acompanhantes).toBe("2");
  });

  it("preserves all other fields", () => {
    const result = syncAcompanhantes(baseForm, "confirmacao", "nao");
    expect(result.nome).toBe(baseForm.nome);
    expect(result.sobrenome).toBe(baseForm.sobrenome);
    expect(result.email).toBe(baseForm.email);
    expect(result.obs).toBe(baseForm.obs);
  });
});
