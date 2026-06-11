export class AuthError extends Error {
  constructor(message, { code = "AUTH_ERROR", cause = null } = {}) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.cause = cause;
  }
}
