import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app/App";
import "./styles/react.css";

const mountNode = document.getElementById("react-root");

if (mountNode) {
  createRoot(mountNode).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
