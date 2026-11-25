import {
  markdownFlavorOptions,
  type MarkdownFlavor,
} from "@paste-to-markdown/core";

export type MarkdownFormatType =
  | "bold"
  | "italic"
  | "strikethrough"
  | "code"
  | "code-block"
  | "link"
  | "heading1"
  | "heading2"
  | "heading3"
  | "list"
  | "ordered-list"
  | "quote";

interface MarkdownFormatEdit {
  replacement: string;
  cursorOffset: number;
  useCursorOffsetWithSelection?: boolean;
  successMessage: string;
}

export interface AppliedMarkdownFormat {
  selectionStart: number;
  selectionEnd: number;
  successMessage: string;
}

export function getMarkdownShortcut(
  event: Pick<
    KeyboardEvent,
    "key" | "ctrlKey" | "metaKey" | "shiftKey" | "altKey"
  >,
): MarkdownFormatType | null {
  if ((!event.ctrlKey && !event.metaKey) || event.altKey) return null;
  const key = event.key.toLowerCase();
  const shortcuts: Record<string, MarkdownFormatType> = event.shiftKey
    ? { c: "code-block", q: "quote", l: "list", o: "ordered-list" }
    : {
        b: "bold",
        i: "italic",
        d: "strikethrough",
        e: "code",
        k: "link",
        "1": "heading1",
        "2": "heading2",
        "3": "heading3",
      };
  // Undo/redo and browser shortcuts are untouched unless explicitly listed.
  return shortcuts[key] ?? null;
}

export const getMarkdownFormatEdit = (
  formatType: MarkdownFormatType,
  selectedText: string,
  flavor: MarkdownFlavor = "github",
): MarkdownFormatEdit => {
  const preset = markdownFlavorOptions[flavor];
  switch (formatType) {
    case "bold":
      return {
        replacement: `${preset.strongDelimiter}${selectedText}${preset.strongDelimiter}`,
        cursorOffset: preset.strongDelimiter.length,
        successMessage: "Applied bold formatting",
      };
    case "italic":
      return {
        replacement: `${preset.emDelimiter}${selectedText}${preset.emDelimiter}`,
        cursorOffset: preset.emDelimiter.length,
        successMessage: "Applied italic formatting",
      };
    case "strikethrough":
      return {
        replacement: `~~${selectedText}~~`,
        cursorOffset: 2,
        successMessage: "Applied strikethrough formatting",
      };
    case "code":
      return {
        replacement: `\`${selectedText}\``,
        cursorOffset: 1,
        successMessage: "Applied inline code formatting",
      };
    case "code-block": {
      if (preset.codeBlockStyle === "indented") {
        return {
          replacement: `    ${selectedText.replace(/\n/g, "\n    ")}`,
          cursorOffset: 4,
          successMessage: "Applied code block formatting",
        };
      }
      const longestRun = Array.from(selectedText.matchAll(/`+/g)).reduce(
        (longest, match) => Math.max(longest, match[0].length),
        0,
      );
      const fence = "`".repeat(Math.max(3, longestRun + 1));
      return {
        replacement: `${fence}\n${selectedText}\n${fence}`,
        cursorOffset: fence.length + 1,
        successMessage: "Applied code block formatting",
      };
    }
    case "link": {
      const label = selectedText || "link text";
      return {
        replacement: `[${label}](url)`,
        cursorOffset: label.length + 3,
        useCursorOffsetWithSelection: true,
        successMessage: "Applied link formatting",
      };
    }
    case "heading1":
    case "heading2": {
      const level = formatType === "heading1" ? 1 : 2;
      if (preset.headingStyle === "setext") {
        const underline = (level === 1 ? "=" : "-").repeat(
          Math.max(3, selectedText.length),
        );
        return {
          replacement: `${selectedText}\n${underline}`,
          cursorOffset: 0,
          successMessage: `Applied heading ${level} formatting`,
        };
      }
      return {
        replacement: `${"#".repeat(level)} ${selectedText}`,
        cursorOffset: level + 1,
        successMessage: `Applied heading ${level} formatting`,
      };
    }
    case "heading3":
      return {
        replacement: `### ${selectedText}`,
        cursorOffset: 4,
        successMessage: "Applied heading 3 formatting",
      };
    case "list":
      return {
        replacement: `${preset.bulletListMarker} ${selectedText}`,
        cursorOffset: 2,
        successMessage: "Applied list formatting",
      };
    case "ordered-list":
      return {
        replacement: `1. ${selectedText}`,
        cursorOffset: 3,
        successMessage: "Applied ordered list formatting",
      };
    case "quote":
      return {
        replacement: `> ${selectedText}`,
        cursorOffset: 2,
        successMessage: "Applied quote formatting",
      };
  }
};

export const applyMarkdownFormatToTextarea = (
  textarea: HTMLTextAreaElement,
  formatType: MarkdownFormatType,
  flavor: MarkdownFlavor = "github",
): AppliedMarkdownFormat => {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.slice(start, end);
  const edit = getMarkdownFormatEdit(formatType, selectedText, flavor);
  const selectionPosition =
    selectedText && !edit.useCursorOffsetWithSelection
      ? start + edit.replacement.length
      : start + edit.cursorOffset;
  const ownerDocument = textarea.ownerDocument;
  const supportsNativeInsertText =
    typeof ownerDocument.execCommand === "function";

  if (supportsNativeInsertText) {
    textarea.focus();
    textarea.setSelectionRange(start, end);
    let applied = false;
    try {
      applied = ownerDocument.execCommand(
        "insertText",
        false,
        edit.replacement,
      );
    } catch {
      // The fallback keeps formatting available if native insertion is disabled.
    }

    if (!applied) {
      textarea.setRangeText(edit.replacement, start, end, "end");
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }
  } else {
    textarea.setRangeText(edit.replacement, start, end, "end");
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }

  return {
    selectionStart: selectionPosition,
    selectionEnd: selectionPosition,
    successMessage: edit.successMessage,
  };
};
