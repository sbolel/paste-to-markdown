import TurndownService from "turndown";
import { addCodeRules, preserveBlankCode } from "./code-rules.js";
import {
  addInlineLayoutRules,
  hasBlockLinkContent,
  hasExplicitBlockDisplay,
} from "./inline-layout.js";
import { addTaskListRules } from "./list-rules.js";
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
  return href
    .replace(/[\s<>"]/g, (character) => encodeURIComponent(character))
    .replace(/([\\()])/g, "\\$1");
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
      return (node as unknown as TurndownNode).isBlock ||
        hasExplicitBlockDisplay(node)
        ? "\n\n"
        : "";
    },
  });

  addInlineLayoutRules(td);
  addCodeRules(td);
  addTaskListRules(td, options.gfm !== false);
  addTableRules(td, options.gfm !== false);

  if (options.gfm !== false) {
    td.addRule("strikethrough", {
      filter: ["del", "s"],
      replacement: (content) => `~~${content}~~`,
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

      const link = `[${normalizeInlineLinkContent(content)}](${escapeInlineLinkHref(href)}${formatInlineLinkTitle(title)})`;
      return hasExplicitBlockDisplay(node) || hasBlockLinkContent(node)
        ? `\n\n${link}\n\n`
        : link;
    },
  });

  td.addRule("portableImage", {
    filter: "img",
    replacement: (_content, node) => {
      const src = node.getAttribute("src") ?? "";
      const alt = td.escape(
        normalizeInlineLinkContent(node.getAttribute("alt") ?? ""),
      );
      if (!src) return "";
      return `![${alt}](${escapeInlineLinkHref(src)}${formatInlineLinkTitle(node.getAttribute("title"))})`;
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
