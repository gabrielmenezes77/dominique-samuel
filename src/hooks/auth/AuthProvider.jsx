import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import CognitoAuthClient from "../../services/auth/CognitoAuthClient";
import AuthSessionService from "../../services/auth/AuthSessionService";

const AuthContext = createContext(null);

export function AuthProvider({
  children,
  sessionService = new AuthSessionService(),
  authClientFactory = () => new CognitoAuthClient(),
}) {
  const sessionServiceRef = useRef(sessionService);
  const authClientFactoryRef = useRef(authClientFactory);
  const [session, setSession] = useState(() =>
    sessionServiceRef.current.getSession(),
  );
  const [status, setStatus] = useState(session ? "authenticated" : "anonymous");

  const clearSession = useCallback(() => {
    sessionServiceRef.current.clear();
    setSession(null);
    setStatus("anonymous");
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setStatus("authenticating");

    try {
      const nextSession = await authClientFactoryRef.current().login({
        email,
        password,
      });

      sessionServiceRef.current.save(nextSession);
      setSession(nextSession);
      setStatus("authenticated");
      return nextSession;
    } catch (error) {
      setStatus("anonymous");
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const invalidateSession = useCallback(() => {
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    if (!session) {
      return undefined;
    }

    if (session.isExpired) {
      clearSession();
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      if (sessionServiceRef.current.getSession() === null) {
        clearSession();
      }
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, [clearSession, session]);

  const value = useMemo(
    () => ({
      accessToken: session?.accessToken || "",
      isAuthenticated: Boolean(session && !session.isExpired),
      login,
      logout,
      invalidateSession,
      session,
      status,
    }),
    [invalidateSession, login, logout, session, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return value;
}
