import { NetworkError, TimeoutError } from "./HttpError";

export async function fetchWithTimeout(
  input,
  init = {},
  { timeoutMs = 15_000 } = {},
) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new TimeoutError();
    }

    if (error instanceof TypeError) {
      throw new NetworkError();
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
