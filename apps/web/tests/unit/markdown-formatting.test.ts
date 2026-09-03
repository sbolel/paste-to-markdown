import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyMarkdownFormatToTextarea,
  getMarkdownShortcut,
} from "../../src/lib/markdown-formatting";

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("editor formatting", () => {
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
