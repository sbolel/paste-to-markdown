import { createRoot, hydrateRoot } from "react-dom/client";
import { Application, APPLICATION_ID_PREFIX } from "./Application";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing application root");
if (import.meta.env.DEV) {
  createRoot(root, { identifierPrefix: APPLICATION_ID_PREFIX }).render(
    <Application />,
  );
} else {
  if (!root.firstElementChild) {
    throw new Error("Missing prerendered application content");
  }
  hydrateRoot(root, <Application />, {
    identifierPrefix: APPLICATION_ID_PREFIX,
    onRecoverableError(error) {
      console.error("Application hydration failed", error);
    },
  });
}
