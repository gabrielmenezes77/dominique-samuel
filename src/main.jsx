import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/globals.css";
import "./styles/animations.css";
// Route layer introduced in task 2.1.
// src/app/App.jsx mounts RouterProvider; src/App.jsx (public page) is still
// the component rendered at "/" until task 2.2 moves it to PublicInvitationPage.
import App from "./app/App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
