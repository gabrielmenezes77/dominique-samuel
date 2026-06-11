import { AuthProvider } from "../../hooks/auth/AuthProvider.jsx";

export default function AppProviders({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
