/**
 * Builds the RSVP API payload from the controlled form state.
 *
 * @param {Object} formState - Form field values
 * @param {string} formState.nome
 * @param {string} formState.sobrenome
 * @param {string} formState.email
 * @param {string} formState.confirmacao
 * @param {string|number} formState.acompanhantes
 * @param {string} formState.obs
 * @returns {Object} Sanitised payload ready for JSON serialisation
 */
export function buildPayload(formState) {
  const { nome, sobrenome, email, confirmacao, acompanhantes, obs } = formState;

  return {
    nome: String(nome || "").trim(),
    sobrenome: String(sobrenome || "").trim(),
    email: String(email || "")
      .trim()
      .toLowerCase(),
    confirmacao: String(confirmacao || "").trim(),
    acompanhantes: Number.parseInt(String(acompanhantes || "0"), 10),
    obs: String(obs || "").trim(),
  };
}
