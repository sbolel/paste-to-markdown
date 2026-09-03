import { afterEach, describe, expect, it, vi } from "vitest";
import { marked } from "marked";
import type { MarkdownFlavor } from "@paste-to-markdown/core";
import {
  applyMarkdownFormatToTextarea,
  getMarkdownFormatEdit,
  getMarkdownShortcut,
  type MarkdownFormatType,
} from "../../src/lib/markdown-formatting";

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("editor formatting", () => {
  const presets: Array<{
    flavor: MarkdownFlavor;
    strong: string;
    emphasis: string;
    bullet: string;
    headings: [string, string];
    emptyHeadings: [string, string];
    block: string;
    emptyBlock: string;
  }> = [
    {
      flavor: "github",
      strong: "**",
      emphasis: "_",
      bullet: "-",
      headings: ["# sample", "## sample"],
      emptyHeadings: ["# ", "## "],
      block: "```\nsample\nsecond\n```",
      emptyBlock: "```\n\n```",
    },
    {
      flavor: "commonmark",
      strong: "**",
      emphasis: "*",
      bullet: "-",
      headings: ["# sample", "## sample"],
      emptyHeadings: ["# ", "## "],
      block: "```\nsample\nsecond\n```",
      emptyBlock: "```\n\n```",
    },
    {
      flavor: "strict",
      strong: "**",
      emphasis: "*",
      bullet: "*",
      headings: ["# sample", "## sample"],
      emptyHeadings: ["# ", "## "],
      block: "    sample\n    second",
      emptyBlock: "    ",
    },
    {
      flavor: "custom",
      strong: "__",
      emphasis: "_",
      bullet: "+",
      headings: ["sample\n======", "sample\n------"],
      emptyHeadings: ["\n===", "\n---"],
      block: "```\nsample\nsecond\n```",
      emptyBlock: "```\n\n```",
    },
  ];

  for (const preset of presets) {
    for (const selectedText of ["", "sample"]) {
      it(`uses ${preset.flavor} syntax with ${selectedText ? "selected" : "empty"} text`, () => {
        const cases: Array<[MarkdownFormatType, string]> = [
          ["bold", `${preset.strong}${selectedText}${preset.strong}`],
          ["italic", `${preset.emphasis}${selectedText}${preset.emphasis}`],
          ["list", `${preset.bullet} ${selectedText}`],
          [
            "heading1",
            selectedText ? preset.headings[0] : preset.emptyHeadings[0],
          ],
          [
            "heading2",
            selectedText ? preset.headings[1] : preset.emptyHeadings[1],
          ],
          ["heading3", `### ${selectedText}`],
          ["strikethrough", `~~${selectedText}~~`],
        ];
        for (const [format, expected] of cases) {
          expect(
            getMarkdownFormatEdit(format, selectedText, preset.flavor)
              .replacement,
          ).toBe(expected);
        }
        const block = getMarkdownFormatEdit(
          "code-block",
          selectedText ? "sample\nsecond" : "",
          preset.flavor,
        );
        expect(block.replacement).toBe(
          selectedText ? preset.block : preset.emptyBlock,
        );
        if (!selectedText) expect(block.cursorOffset).toBe(4);
      });
    }
  }

  for (const flavor of ["github", "commonmark", "custom"] as const) {
    for (const source of [
      "before\n```\nafter",
      "````\ncode\n````",
      "inline ````` example",
      "first\r\n```\r\nlast",
    ]) {
      it(`keeps embedded backticks inside one ${flavor} code block: ${JSON.stringify(source)}`, () => {
        const edit = getMarkdownFormatEdit("code-block", source, flavor);
        const tokens = marked.lexer(edit.replacement);
        expect(tokens).toHaveLength(1);
        expect(tokens[0]).toMatchObject({
          type: "code",
          text: source.replace(/\r\n/g, "\n"),
        });
        const openingFence = edit.replacement.split("\n")[0];
        expect(openingFence.length).toBeGreaterThan(
          Math.max(
            ...Array.from(source.matchAll(/`+/g), (match) => match[0].length),
          ),
        );
        expect(edit.cursorOffset).toBe(openingFence.length + 1);
      });
    }
  }

  for (const native of [true, false]) {
    for (const selectedText of ["", "label"]) {
      it(`places the link caret before its URL with ${selectedText ? "selected" : "empty"} text using ${native ? "native" : "fallback"} insertion`, () => {
        const editor = document.createElement("textarea");
        document.body.appendChild(editor);
        editor.value = `before ${selectedText} after`;
        editor.setSelectionRange(7, 7 + selectedText.length);
        Object.defineProperty(document, "execCommand", {
          configurable: true,
          value: native
            ? vi.fn((_name, _ui, value: string) => {
                editor.setRangeText(value);
                return true;
              })
            : undefined,
        });
        const result = applyMarkdownFormatToTextarea(editor, "link");
        const label = selectedText || "link text";
        expect(editor.value).toBe(`before [${label}](url) after`);
        expect(result.selectionStart).toBe(7 + label.length + 3);
        expect(result.selectionEnd).toBe(result.selectionStart);
        expect(
          editor.value.slice(result.selectionStart, result.selectionStart + 3),
        ).toBe("url");
      });
    }
  }

  it("inserts through the native editing command so the browser can retain undo history", () => {
    const editor = document.createElement("textarea");
    document.body.appendChild(editor);
    editor.value = "selected";
    editor.setSelectionRange(0, editor.value.length);
    const command = vi.fn((_name, _ui, value: string) => {
      editor.setRangeText(value);
      return true;
    });
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: command,
    });
    const result = applyMarkdownFormatToTextarea(editor, "strikethrough");
    expect(command).toHaveBeenCalledWith("insertText", false, "~~selected~~");
    expect(editor.value).toBe("~~selected~~");
    expect(result.selectionStart).toBe(12);
    expect(document.activeElement).toBe(editor);
  });

  it("updates only the selection when native editing is unavailable", () => {
    const editor = document.createElement("textarea");
    editor.value = "before selected after";
    editor.setSelectionRange(7, 15);
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: undefined,
    });
    const input = vi.fn();
    editor.addEventListener("input", input);
    applyMarkdownFormatToTextarea(editor, "bold");
    expect(editor.value).toBe("before **selected** after");
    expect(input).toHaveBeenCalledOnce();
  });

  it("maps formatting keys without claiming undo, redo, or modified unrelated keys", () => {
    const base = {
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    };
    expect(getMarkdownShortcut({ ...base, key: "d" })).toBe("strikethrough");
    expect(getMarkdownShortcut({ ...base, key: "C", shiftKey: true })).toBe(
      "code-block",
    );
    expect(getMarkdownShortcut({ ...base, key: "z" })).toBeNull();
    expect(
      getMarkdownShortcut({ ...base, key: "z", shiftKey: true }),
    ).toBeNull();
    expect(getMarkdownShortcut({ ...base, key: "d", altKey: true })).toBeNull();
    expect(
      getMarkdownShortcut({ ...base, key: "d", shiftKey: true }),
    ).toBeNull();
  });
});
