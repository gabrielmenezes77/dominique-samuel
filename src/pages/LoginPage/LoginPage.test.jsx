import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../hooks/auth/AuthProvider";
import ProtectedRoute from "../../hooks/auth/useProtectedRoute";
import { AuthSession } from "../../models/auth/AuthSession";
import { AuthError } from "../../services/auth/AuthError";
import LoginPage from "./LoginPage";

function renderWithAuth({
  authClientFactory = () => ({ login: vi.fn() }),
  initialEntries = ["/login"],
  routes,
} = {}) {
  render(
    <AuthProvider
      sessionService={{
        getSession: () => null,
        save: vi.fn(),
        clear: vi.fn(),
      }}
      authClientFactory={authClientFactory}
    >
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          {routes || (
            <>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin" element={<div>Admin area</div>} />
            </>
          )}
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

function LoginLocation() {
  const location = useLocation();
  return <div>Login route {location.search}</div>;
}

describe("LoginPage", () => {
  it("shows field validation errors", async () => {
    renderWithAuth();

    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Informe o email.")).toBeInTheDocument();
    expect(screen.getByText("Informe a senha.")).toBeInTheDocument();
  });

  it("logs in and redirects to /admin by default", async () => {
    const session = new AuthSession({
      accessToken: "token",
      expiresAt: Date.now() + 60_000,
    });

    renderWithAuth({
      authClientFactory: () => ({
        login: vi.fn().mockResolvedValue(session),
      }),
    });

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(screen.getByText("Admin area")).toBeInTheDocument());
  });

  it("shows safe auth errors", async () => {
    renderWithAuth({
      authClientFactory: () => ({
        login: vi.fn().mockRejectedValue(
          new AuthError("Email ou senha invalidos.", {
            code: "NotAuthorizedException",
          }),
        ),
      }),
    });

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "bad" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email ou senha invalidos.",
    );
  });

  it("redirects unauthenticated /admin visits to login with destination", async () => {
    renderWithAuth({
      initialEntries: ["/admin"],
      routes: (
        <>
          <Route
            path="/admin"
            element={
            <ProtectedRoute>
              <div>Admin area</div>
            </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginLocation />} />
        </>
      ),
    });

    expect(await screen.findByText("Login route ?redirect=%2Fadmin")).toBeInTheDocument();
  });
});
