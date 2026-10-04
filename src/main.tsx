import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import { audio } from "./game/audio";

const unlockAudio = () => {
  audio.unlock();
  audio.startLobbyMusic();
  window.removeEventListener('pointerdown', unlockAudio);
  window.removeEventListener('keydown', unlockAudio);
};
window.addEventListener('pointerdown', unlockAudio, { once: true });
window.addEventListener('keydown', unlockAudio, { once: true });

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
