/**
 * RSVP API service.
 *
 * Fixes the As-Is bug: the original fetch had no timeout, so a hanging API
 * request would leave the user waiting indefinitely. This implementation uses
 * AbortController with a 15-second timeout.
 */

const RSVP_ENDPOINT = "https://www.dominique-samuel.com/api/rsvp";
const TIMEOUT_MS = 15_000;

/**
 * Submits the RSVP payload to the API.
 *
 * @param {Object} payload - Sanitised payload from buildPayload()
 * @returns {Promise<Object>} Parsed JSON response on success
 * @throws {Error} On non-2xx response, timeout, or network failure
 */
export async function submitRSVP(payload) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(RSVP_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    let responseData = null;
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }

    if (!response.ok) {
      throw new Error(
        responseData?.error ||
          responseData?.message ||
          "Não foi possível registrar sua confirmação agora.",
      );
    }

    return responseData;
  } catch (error) {
    // AbortController fires with a DOMException named 'AbortError'
    if (error.name === "AbortError") {
      throw new Error("Erro de conexão. Tente novamente.");
    }

    // Re-throw with a user-friendly message for unexpected network errors,
    // but preserve structured errors thrown above (they already have a message).
    if (error instanceof Error && error.message !== "Failed to fetch") {
      throw error;
    }

    throw new Error("Erro de conexão. Tente novamente.");
  } finally {
    clearTimeout(timeoutId);
  }
}
