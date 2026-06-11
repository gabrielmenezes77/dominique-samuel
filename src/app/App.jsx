/**
 * src/app/App.jsx
 *
 * Application root component.
 *
 * Responsibilities:
 *   - Mount the react-router-dom RouterProvider with the application router.
 *   - Compose any application-wide providers that wrap all routes (auth
 *     provider added in task 3.4, see AppProviders).
 *   - Keep this file thin: it orchestrates providers and routing only.
 *
 * The public invitation page composition (Loader, Nav, CanvasAnimation, etc.)
 * lives in the route-level component rendered at "/" — currently src/App.jsx
 * (renamed to PublicInvitationPage in task 2.2).
 */

import { RouterProvider } from "react-router-dom";
import AppProviders from "./providers/AppProviders.jsx";
import router from "./routes.jsx";

export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
