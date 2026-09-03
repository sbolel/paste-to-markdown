import type TurndownService from "turndown";
import type { MarkdownFlavor } from "./types.js";

/** Shared syntax styles for conversion and manual editing. */
export const markdownFlavorOptions = {
  github: {
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "_",
    strongDelimiter: "**",
  },
  commonmark: {
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "*",
    strongDelimiter: "**",
  },
  strict: {
    headingStyle: "atx",
    codeBlockStyle: "indented",
    bulletListMarker: "*",
    emDelimiter: "*",
    strongDelimiter: "**",
  },
  custom: {
    headingStyle: "setext",
    codeBlockStyle: "fenced",
    bulletListMarker: "+",
    emDelimiter: "_",
    strongDelimiter: "__",
  },
} as const satisfies Record<
  MarkdownFlavor,
  Pick<
    TurndownService.Options,
    | "headingStyle"
    | "codeBlockStyle"
    | "bulletListMarker"
    | "emDelimiter"
    | "strongDelimiter"
  >
>;
