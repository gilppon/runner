import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import { audio } from "./game/audio";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary
      gameName="Dimension Shift Runner"
      accent="#a855f7"
      saveKeys={["dimension-shift-runner-save-v1"]}
      onCrash={() => audio.stopMusic()}
    >
      <App />
    </ErrorBoundary>
  </StrictMode>
);
