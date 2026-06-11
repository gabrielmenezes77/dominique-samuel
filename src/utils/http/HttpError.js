export class HttpError extends Error {
  constructor(message, { status = 0, code = "HTTP_ERROR", body = null } = {}) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

export class TimeoutError extends Error {
  constructor(message = "Request timed out.") {
    super(message);
    this.name = "TimeoutError";
    this.code = "TIMEOUT";
  }
}

export class NetworkError extends Error {
  constructor(message = "Network request failed.") {
    super(message);
    this.name = "NetworkError";
    this.code = "NETWORK_ERROR";
  }
}
