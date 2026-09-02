import TurndownService from "turndown";
import type { ClipboardDataLike, ConversionOptions } from "./types.js";

/** Minimal structural type matching Turndown's internal node interface for blankReplacement. */
interface TurndownNode {
  isBlock: boolean;
  nodeName: string;
  parentNode?: { nodeName: string } | null;
  type?: string;
  checked?: boolean;
}

function createTurndownService(
  options: ConversionOptions = {},
): TurndownService {
  const td = new TurndownService({
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    fence: "```",
    emDelimiter: "_",
    strongDelimiter: "**",
    linkStyle: "inlined",
    preformattedCode: false,
    blankReplacement: (content, node) => {
      // Turndown attaches `isBlock` to nodes internally to indicate block-level elements.
      return (node as unknown as TurndownNode).isBlock ? "\n\n" : "";
    },
  });

  if (options.gfm !== false) {
    td.addRule("strikethrough", {
      filter: ["del", "s"],
      replacement: (content) => `~~${content}~~`,
    });

    td.addRule("taskListItems", {
      filter: (node) => {
        const n = node as unknown as TurndownNode;
        return (
          n.nodeName === "INPUT" &&
          n.type === "checkbox" &&
          n.parentNode?.nodeName === "LI"
        );
      },
      replacement: (_content, node) => {
        return (node as unknown as TurndownNode).checked ? "[x] " : "[ ] ";
      },
    });
  }

  return td;
}

/**
 * Converts an HTML string to Markdown.
 */
export function convertHtmlToMarkdown(
  html: string,
  options: ConversionOptions = {},
): string {
  if (!html || !html.trim()) {
    return "";
  }
  const td = createTurndownService(options);
  return td.turndown(html);
}

/**
 * Converts clipboard DataTransfer data to Markdown.
 * Falls back to plain text if no HTML is available.
 */
export function convertClipboardData(
  clipboardData: ClipboardDataLike,
  options: ConversionOptions = {},
): string {
  const html = clipboardData.getData("text/html");
  if (html && html.trim()) {
    return convertHtmlToMarkdown(html, options);
  }
  const text = clipboardData.getData("text/plain");
  return text || "";
}
