import TurndownService from "turndown";
import { addCodeRules, preserveBlankCode } from "./code-rules.js";
import { addTableRules } from "./table-rules.js";
import type { ClipboardDataLike, ConversionOptions } from "./types.js";

/** Minimal structural type matching the Turndown node properties used here. */
interface TurndownNode {
  isBlock: boolean;
  nodeName: string;
  parentNode?: { nodeName: string } | null;
  type?: string;
  checked?: boolean;
  getAttribute?(name: string): string | null;
}

function normalizeInlineLinkContent(content: string): string {
  return content.replace(/[ \t]*\r?\n+[ \t]*/g, " ").trim();
}

function escapeInlineLinkHref(href: string): string {
  return href.replace(/([\\()])/g, "\\$1");
}

function formatInlineLinkTitle(title: string | null): string {
  const cleaned = title ? title.replace(/(\n+\s*)+/g, "\n") : "";
  if (!cleaned) return "";
  return ` "${cleaned.replace(/([\\"])/g, "\\$1")}"`;
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
    preformattedCode: true,
    blankReplacement: (content, node) => {
      const code = preserveBlankCode(content, node);
      if (code !== undefined) return code;
      // Turndown attaches `isBlock` to nodes internally to indicate block-level elements.
      return (node as unknown as TurndownNode).isBlock ? "\n\n" : "";
    },
  });

  addCodeRules(td);
  addTableRules(td);

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

  td.addRule("normalizedInlineLink", {
    filter: (node) => {
      const n = node as unknown as TurndownNode;
      return n.nodeName === "A" && Boolean(n.getAttribute?.("href"));
    },
    replacement: (content, node) => {
      const n = node as unknown as TurndownNode;
      const href = n.getAttribute?.("href") ?? "";
      const title = n.getAttribute?.("title") ?? null;

      return `[${normalizeInlineLinkContent(content)}](${escapeInlineLinkHref(href)}${formatInlineLinkTitle(title)})`;
    },
  });

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
