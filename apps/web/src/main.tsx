import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";
import App from "./App";
import { ErrorFallback } from "./ErrorFallback";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing application root");
createRoot(root).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <MotionConfig reducedMotion="user">
      <App />
      <Toaster theme="dark" richColors closeButton />
    </MotionConfig>
  </ErrorBoundary>,
);
