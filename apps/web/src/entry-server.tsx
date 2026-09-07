import { renderToString } from "react-dom/server";
import { Application, APPLICATION_ID_PREFIX } from "./Application";

/** Build-only entry: no browser APIs or document data enter this renderer. */
export function render(): string {
  return renderToString(<Application />, {
    identifierPrefix: APPLICATION_ID_PREFIX,
  });
}
