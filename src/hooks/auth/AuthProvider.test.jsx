import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthSession } from "../../models/auth/AuthSession";
import { AuthProvider, useAuth } from "./AuthProvider";

function storageMock() {
  const values = new Map();

  return {
    getItem: vi.fn((key) => values.get(key) || null),
    setItem: vi.fn((key, value) => values.set(key, value)),
    removeItem: vi.fn((key) => values.delete(key)),
  };
}

function AuthHarness() {
  const auth = useAuth();

  return (
    <div>
      <p data-testid="status">{auth.status}</p>
      <p data-testid="token">{auth.accessToken || "none"}</p>
      <button
        type="button"
        onClick={() => auth.login({ email: "admin@example.com", password: "pw" })}
      >
        Login
      </button>
      <button type="button" onClick={auth.logout}>
        Logout
      </button>
    </div>
  );
}

describe("AuthProvider", () => {
  it("hydrates as anonymous without a stored session", () => {
    render(
      <AuthProvider
        sessionService={{
          getSession: () => null,
          save: vi.fn(),
          clear: vi.fn(),
        }}
      >
        <AuthHarness />
      </AuthProvider>,
    );

    expect(screen.getByTestId("status")).toHaveTextContent("anonymous");
    expect(screen.getByTestId("token")).toHaveTextContent("none");
  });

  it("logs in, persists the session, and logs out", async () => {
    const save = vi.fn();
    const clear = vi.fn();
    const session = new AuthSession({
      accessToken: "token",
      expiresAt: Date.now() + 60_000,
    });

    render(
      <AuthProvider
        sessionService={{
          getSession: () => null,
          save,
          clear,
        }}
        authClientFactory={() => ({
          login: vi.fn().mockResolvedValue(session),
        })}
      >
        <AuthHarness />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated"),
    );
    expect(screen.getByTestId("token")).toHaveTextContent("token");
    expect(save).toHaveBeenCalledWith(session);

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(clear).toHaveBeenCalled();
    expect(screen.getByTestId("status")).toHaveTextContent("anonymous");
  });

  it("hydrates an existing session from session storage", () => {
    const storage = storageMock();
    const session = new AuthSession({
      accessToken: "stored-token",
      expiresAt: Date.now() + 60_000,
    });
    storage.setItem("session", JSON.stringify(session.toJSON()));

    render(
      <AuthProvider
        sessionService={{
          getSession: () => session,
          save: vi.fn(),
          clear: vi.fn(),
        }}
      >
        <AuthHarness />
      </AuthProvider>,
    );

    expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
    expect(screen.getByTestId("token")).toHaveTextContent("stored-token");
  });
});
