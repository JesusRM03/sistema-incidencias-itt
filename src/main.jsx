import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

try {
  const theme = localStorage.getItem("itt:tema");
  if (["normal", "oscuro", "bosque"].includes(theme)) document.documentElement.dataset.theme = theme;
} catch { /* El tema normal funciona sin almacenamiento local. */ }

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
