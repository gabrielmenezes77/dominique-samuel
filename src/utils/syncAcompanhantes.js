/**
 * Pure function that mirrors the syncAcompanhantesState logic from RSVPSection.
 * When confirmacao is 'nao', acompanhantes is reset to '0'.
 *
 * @param {Object} prev - Previous form state
 * @param {string} name - Changed field name
 * @param {string} value - New field value
 * @returns {Object} Next form state
 */
export function syncAcompanhantes(prev, name, value) {
  const next = { ...prev, [name]: value };
  if (name === "confirmacao" && value === "nao") {
    next.acompanhantes = "0";
  }
  return next;
}
