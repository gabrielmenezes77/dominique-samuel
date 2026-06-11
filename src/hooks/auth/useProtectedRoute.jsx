import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

export default function ProtectedRoute({ children }) {
  const auth = useAuth();
  const location = useLocation();

  if (!auth.isAuthenticated) {
    const redirect = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(redirect)}`}
        replace
      />
    );
  }

  return children;
}
