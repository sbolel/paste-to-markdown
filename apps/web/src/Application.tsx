import { ErrorBoundary } from "react-error-boundary";
import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";
import App from "./App";
import { ErrorFallback } from "./ErrorFallback";

export const APPLICATION_ID_PREFIX = "ptm-";

/** The same tree is rendered at build time and hydrated in the browser. */
export function Application() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <MotionConfig reducedMotion="user">
        <App />
        <Toaster theme="dark" richColors closeButton />
      </MotionConfig>
    </ErrorBoundary>
  );
}
