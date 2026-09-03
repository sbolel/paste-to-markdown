import createDOMPurify from "dompurify";
import { marked, type Tokens } from "marked";

export interface MarkdownExtensions {
  yamlFrontMatter: boolean;
  footnotes: boolean;
  taskLists: boolean;
  tables: boolean;
  strikethrough: boolean;
  definitionLists: boolean;
}

/** Compact only single-line siblings in a top-level list recognized by Markdown. */
export function compactListSpacing(markdown: string): string {
  const offsets: number[] = [];
  let normalized = "";
  for (let index = 0; index < markdown.length; index += 1) {
    if (markdown[index] === "\r" && markdown[index + 1] === "\n") continue;
    offsets.push(index);
    normalized += markdown[index];
  }
  offsets.push(markdown.length);
  const removals: Array<[number, number]> = [];
  let cursor = 0;
  for (const token of marked.lexer(normalized, { gfm: true })) {
    const start = normalized.indexOf(token.raw, cursor);
    if (start < 0) continue;
    cursor = start + token.raw.length;
    if (token.type !== "list") continue;
    const list = token as Tokens.List;
    if (
      list.items.length < 2 ||
      !list.items.every((item) => {
        const blocks = item.tokens.filter((block) => block.type !== "space");
        return (
          blocks.length === 1 &&
          (blocks[0].type === "text" || blocks[0].type === "paragraph") &&
          !/[\r\n]/.test(item.raw.trimEnd())
        );
      })
    )
      continue;
    // The lexer has already ruled out code, nested lists, and multi-paragraph items.
    const gaps = /\n([ \t]*\n)+(?= {0,3}(?:[-+*]|\d+[.)])[ \t]+\S)/g;
    for (const gap of token.raw.matchAll(gaps)) {
      const from = start + gap.index + 1;
      const to = start + gap.index + gap[0].length;
      // Include the CR belonging to a removed newline, while retaining the first EOL.
      const originalFrom =
        offsets[from] -
        (normalized[from] === "\n" && markdown[offsets[from] - 1] === "\r"
          ? 1
          : 0);
      const originalTo = offsets[to];
      removals.push([originalFrom, originalTo]);
    }
  }
  let result = markdown;
  for (const [start, end] of removals.reverse()) {
    result = result.slice(0, start) + result.slice(end);
  }
  return result;
}

/** Detection is informational; it never decides whether clipboard HTML is converted. */
export function detectMarkdownExtensions(markdown: string): MarkdownExtensions {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const tokens = marked.lexer(normalized, { gfm: true });
  const prose = tokens
    .filter((token) => token.type !== "code")
    .map((token) => token.raw)
    .join("");
  const detected: MarkdownExtensions = {
    yamlFrontMatter: /^---\n[\s\S]*?\n---(?:\n|$)/.test(normalized.trimStart()),
    footnotes: /\[\^[^\]\n]+\]/.test(prose),
    taskLists: false,
    tables: false,
    strikethrough: false,
    definitionLists:
      /^(?:[^\n]+\n):[ \t]+\S/m.test(prose) ||
      /<dt\b[^>]*>[\s\S]*?<\/dt>\s*<dd\b/i.test(prose),
  };
  marked.walkTokens(tokens, (token) => {
    if (token.type === "table") detected.tables = true;
    if (token.type === "del") detected.strikethrough = true;
    if (token.type === "list_item" && token.task) detected.taskLists = true;
  });
  return detected;
}

function isAllowedPreviewImageSource(source: string): boolean {
  const normalized = source.trim().replace(/[\t\n\r]/g, "");
  if (!normalized || /^[\\/]{2}/.test(normalized)) return false;
  if (/^data:/i.test(normalized)) {
    return /^data:image\/(?:png|jpeg|gif|webp|avif)(?:;base64)?,/i.test(
      normalized,
    );
  }
  try {
    const url = new URL(normalized, window.location.href);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.origin === window.location.origin
    );
  } catch {
    return false;
  }
}

/** Keep local and embedded raster images without permitting external resource loads. */
export function sanitizedPreview(markdown: string): string {
  const rendered = marked.parse(markdown, {
    async: false,
    gfm: true,
    breaks: false,
  });
  // Hooks belong to this sanitizer only; other uses of DOMPurify retain their policy.
  const purifier = createDOMPurify(window);
  purifier.addHook("uponSanitizeAttribute", (node, attribute) => {
    if (attribute.attrName === "src") {
      attribute.keepAttr =
        node.nodeName === "IMG" &&
        isAllowedPreviewImageSource(attribute.attrValue);
    }
  });
  return purifier.sanitize(rendered, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: [
      "style",
      "iframe",
      "object",
      "embed",
      "link",
      "meta",
      "base",
      "video",
      "audio",
      "source",
      "track",
    ],
    FORBID_ATTR: [
      "srcset",
      "sizes",
      "poster",
      "background",
      "style",
      "ping",
      "action",
      "formaction",
    ],
  });
}

export function markdownFilename(filename: string): string {
  const safeCharacters = Array.from(filename.trim(), (character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127 ? "-" : character;
  }).join("");
  const cleaned = safeCharacters
    .replace(/[<>:"/\\|?*]/g, "-")
    .replace(/[. ]+$/g, "");
  const stem = cleaned.replace(/\.md$/i, "").trim() || "markdown";
  return `${stem}.md`;
}
