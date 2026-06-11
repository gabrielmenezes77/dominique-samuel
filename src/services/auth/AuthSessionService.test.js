import { describe, expect, it, vi } from "vitest";
import { AuthSession } from "../../models/auth/AuthSession";
import AuthSessionService from "./AuthSessionService";

function storageMock() {
  const values = new Map();

  return {
    getItem: vi.fn((key) => values.get(key) || null),
    setItem: vi.fn((key, value) => values.set(key, value)),
    removeItem: vi.fn((key) => values.delete(key)),
  };
}

describe("AuthSessionService", () => {
  it("saves and hydrates a valid session", () => {
    const storage = storageMock();
    const service = new AuthSessionService({ storage, storageKey: "test" });
    const session = new AuthSession({
      accessToken: "token",
      expiresAt: Date.now() + 60_000,
    });

    service.save(session);

    expect(service.getSession()).toMatchObject({
      accessToken: "token",
    });
  });

  it("clears expired sessions during hydration", () => {
    const storage = storageMock();
    const service = new AuthSessionService({ storage, storageKey: "test" });
    const session = new AuthSession({
      accessToken: "token",
      expiresAt: Date.now() - 1_000,
    });

    service.save(session);

    expect(service.getSession()).toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith("test");
  });

  it("clears malformed storage values", () => {
    const storage = storageMock();
    storage.getItem.mockReturnValueOnce("{bad json");
    const service = new AuthSessionService({ storage, storageKey: "test" });

    expect(service.getSession()).toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith("test");
  });
});
