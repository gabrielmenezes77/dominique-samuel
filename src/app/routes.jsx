import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "../hooks/auth/useProtectedRoute.jsx";
import AdminPage from "../pages/AdminPage";
import LoginPage from "../pages/LoginPage";
import PublicInvitationPage from "../pages/PublicInvitationPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicInvitationPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <AdminPage />
      </ProtectedRoute>
    ),
  },
]);

export default router;
