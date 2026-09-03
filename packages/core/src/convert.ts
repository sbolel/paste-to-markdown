import TurndownService from "turndown";
import { addCodeRules, preserveBlankCode } from "./code-rules.js";
import {
  addInlineLayoutRules,
  hasBlockLinkContent,
  hasExplicitBlockDisplay,
} from "./inline-layout.js";
import { addTaskListRules } from "./list-rules.js";
import { addTableRules } from "./table-rules.js";
import { withTableContext } from "./table-fragment.js";
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

function referenceKind(
  value: string,
  image = false,
): "portable" | "temporary" | "unresolved" {
  if (/^blob:/i.test(value)) return "temporary";
  if (/^https?:\/\/[^\s/]+/i.test(value)) return "portable";
  if (!image && /^(mailto|tel):\S+/i.test(value)) return "portable";
  return "unresolved";
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

      const kind = referenceKind(href);
      const link =
        kind === "portable"
          ? `[${normalizeInlineLinkContent(content)}](${escapeInlineLinkHref(href)}${formatInlineLinkTitle(title)})`
          : `${normalizeInlineLinkContent(content) || "Link"} (${kind} link)`;
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
      const kind = referenceKind(src, true);
      if (kind !== "portable") return `${alt || "Image"} (${kind} image)`;
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
  return td.turndown(withTableContext(html));
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
