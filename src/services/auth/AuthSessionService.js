import { AuthSession } from "../../models/auth/AuthSession";
import { AUTH_STORAGE_KEY } from "./authConfig";

function getDefaultStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage;
}

export default class AuthSessionService {
  constructor({
    storage = getDefaultStorage(),
    storageKey = AUTH_STORAGE_KEY,
  } = {}) {
    this.storage = storage;
    this.storageKey = storageKey;
  }

  getSession() {
    if (!this.storage) {
      return null;
    }

    try {
      const raw = this.storage.getItem(this.storageKey);
      const session = AuthSession.fromStorage(raw ? JSON.parse(raw) : null);

      if (!session || session.isExpired) {
        this.clear();
        return null;
      }

      return session;
    } catch {
      this.clear();
      return null;
    }
  }

  save(session) {
    if (!this.storage) {
      return;
    }

    this.storage.setItem(this.storageKey, JSON.stringify(session.toJSON()));
  }

  clear() {
    this.storage?.removeItem(this.storageKey);
  }

  isAuthenticated() {
    return Boolean(this.getSession());
  }
}
