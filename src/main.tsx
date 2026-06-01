import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { useGame } from "./game/store";
import "./styles.css";

// Dev hook: window.__game gives console access to the game store
if (typeof window !== "undefined" && import.meta.env.DEV) {
  (window as any).__game = useGame;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
