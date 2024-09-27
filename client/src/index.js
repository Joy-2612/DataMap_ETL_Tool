// client/src/index.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css"; // Optional: Import global styles here
import { Toaster } from "sonner";
import { UserProvider } from "./context/UserContext";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <UserProvider>
      <Toaster richColors />
      <App />
    </UserProvider>
  </React.StrictMode>
);
