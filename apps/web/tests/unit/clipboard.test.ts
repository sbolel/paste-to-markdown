import { afterEach, describe, expect, it, vi } from "vitest";
import { copyMarkdown, readClipboard } from "../../src/lib/clipboard";

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("clipboard reading", () => {
  it("prefers HTML and retains the available plain-text representation", async () => {
    const readText = vi.fn();
    const clipboard = {
      read: vi.fn().mockResolvedValue([
        {
          types: ["text/html", "text/plain"],
          getType: vi.fn(async (type: string) => ({
            text: async () => (type === "text/html" ? "<b>rich</b>" : "rich"),
          })),
        },
      ]),
      readText,
    } as unknown as Clipboard;
    expect(await readClipboard(clipboard)).toEqual({
      html: "<b>rich</b>",
      text: "rich",
    });
    expect(readText).not.toHaveBeenCalled();
  });

  it("falls back when rich clipboard reading is rejected", async () => {
    const clipboard = {
      read: vi.fn().mockRejectedValue(new Error("denied")),
      readText: vi.fn().mockResolvedValue("**plain markdown**"),
    } as unknown as Clipboard;
    expect(await readClipboard(clipboard)).toEqual({
      html: "",
      text: "**plain markdown**",
    });
  });

  it("retains rich HTML even when the item's plain-text representation is inaccessible", async () => {
    const clipboard = {
      read: async () => [
        {
          types: ["text/html", "text/plain"],
          getType: async (type: string) => {
            if (type === "text/plain") throw new Error("unavailable");
            return { text: async () => "<b>rich</b>" };
          },
        },
      ],
      readText: vi.fn().mockRejectedValue(new Error("denied")),
    } as unknown as Clipboard;
    expect(await readClipboard(clipboard)).toEqual({
      html: "<b>rich</b>",
      text: "",
    });
    expect(clipboard.readText).not.toHaveBeenCalled();
  });

  it("supports readText-only browsers and reports denied access", async () => {
    expect(
      await readClipboard({ readText: async () => "plain" } as Clipboard),
    ).toEqual({ html: "", text: "plain" });
    await expect(
      readClipboard({
        readText: async () => {
          throw new Error("denied");
        },
      } as Clipboard),
    ).rejects.toThrow("denied");
  });
});

describe("copy with fallback", () => {
  it("uses asynchronous writeText when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    await copyMarkdown("edited output", { writeText } as unknown as Clipboard);
    expect(writeText).toHaveBeenCalledWith("edited output");
    expect(document.querySelector("textarea")).toBeNull();
  });

  it("falls back and restores editor focus and selection", async () => {
    const editor = document.createElement("textarea");
    editor.value = "editing";
    document.body.appendChild(editor);
    editor.focus();
    editor.setSelectionRange(1, 4);
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: execCommand,
    });
    await copyMarkdown("edited output", {
      writeText: async () => {
        throw new Error("denied");
      },
    } as Clipboard);
    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(document.activeElement).toBe(editor);
    expect([editor.selectionStart, editor.selectionEnd]).toEqual([1, 4]);
    expect(document.querySelectorAll("textarea")).toHaveLength(1);
  });

  it("offers manual guidance and removes the buffer when every method fails", async () => {
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: vi.fn(() => false),
    });
    await expect(copyMarkdown("output", {} as Clipboard)).rejects.toThrow(
      "Select the Markdown and press Ctrl+C or ⌘+C",
    );
    expect(document.querySelector("textarea")).toBeNull();
  });
});
