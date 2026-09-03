import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { convertClipboardData } from "@paste-to-markdown/core";
import { useMarkdownDocument } from "../../src/hooks/use-markdown-document";
import { readClipboard } from "../../src/lib/clipboard";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@paste-to-markdown/core", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@paste-to-markdown/core")>();
  return {
    ...actual,
    convertClipboardData: vi.fn(actual.convertClipboardData),
  };
});
vi.mock("../../src/lib/clipboard", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../src/lib/clipboard")>();
  return { ...actual, readClipboard: vi.fn(actual.readClipboard) };
});

let root: Root;
let api: ReturnType<typeof useMarkdownDocument>;
function Harness() {
  api = useMarkdownDocument();
  return null;
}
function mount() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(createElement(Harness)));
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  if (root) act(() => root.unmount());
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

describe("Markdown document state", () => {
  it("converts HTML first and keeps the clipboard source separate from edited output", () => {
    mount();
    act(() => {
      api.importClipboard({ html: "<h1>Rich</h1>", text: "**plain**" });
    });
    expect(api.markdownOutput).toBe("# Rich");
    const generated = api.generatedOutput;
    act(() => api.setMarkdownOutput("manually edited"));
    expect(api.source).toEqual({ html: "<h1>Rich</h1>", text: "**plain**" });
    expect(api.generatedOutput).toBe(generated);
    expect(api.hasEdits).toBe(true);
  });

  it("keeps plain Markdown literal and only compacts list spacing when enabled", () => {
    mount();
    act(() => api.handleRemoveBlankLinesChange(false));
    const plain =
      "# Heading\r\n\r\n- first\r\n\r\n- second\r\n\r\n<div>literal plain text</div>";
    act(() => {
      api.importClipboard({ html: "", text: plain });
    });
    expect(api.markdownOutput).toBe(plain);
    act(() => api.handleRemoveBlankLinesChange(true));
    expect(api.markdownOutput).toContain("- first\r\n- second");
    expect(api.markdownOutput).toContain("<div>literal plain text</div>");
  });

  it("requires confirmation to replace edits and cancel retains text and settings", () => {
    mount();
    act(() => {
      api.importClipboard({ html: "<h1>Heading</h1>", text: "Heading" });
    });
    act(() => api.setMarkdownOutput("edited heading"));
    act(() => api.handleFlavorChange("custom"));
    expect(api.pendingPreferences?.markdownFlavor).toBe("custom");
    expect(api.markdownFlavor).toBe("github");
    expect(JSON.parse(localStorage.getItem("markdown-flavor")!)).toBe("github");
    expect(api.markdownOutput).toBe("edited heading");
    act(() => api.cancelPreferences());
    expect(api.pendingPreferences).toBeNull();
    expect(api.markdownOutput).toBe("edited heading");
    expect(api.markdownFlavor).toBe("github");
    act(() => api.handleFlavorChange("custom"));
    act(() => {
      expect(api.confirmPreferences()).toBe(true);
    });
    expect(api.markdownOutput).toBe("Heading\n=======");
    expect(api.markdownFlavor).toBe("custom");
    expect(api.hasEdits).toBe(false);
  });

  it("treats deletion of the entire output as an edit and can restore it", () => {
    mount();
    act(() => {
      api.importClipboard({ html: "<p>Original</p>", text: "Original" });
    });
    act(() => api.setMarkdownOutput(""));
    expect(api.source).not.toBeNull();
    expect(api.hasEdits).toBe(true);
    act(() => api.handleRemoveBlankLinesChange(false));
    expect(api.pendingPreferences?.removeBlankLines).toBe(false);
    act(() => api.cancelPreferences());
    act(() => api.clear());
    expect(api.canRestore).toBe(true);
    act(() => api.restore());
    expect(api.source).not.toBeNull();
    expect(api.markdownOutput).toBe("");
    expect(api.hasEdits).toBe(true);
  });

  it("clear and restore preserve the complete edited document and options without reconversion", () => {
    mount();
    act(() => api.handleFlavorChange("strict"));
    act(() => api.handleRemoveBlankLinesChange(false));
    act(() => {
      api.importClipboard({ html: "<p>Original</p>", text: "Original" });
    });
    act(() => api.setMarkdownOutput("edited ~~document~~"));
    act(() => api.setPreviewMode("preview"));
    act(() => api.clear());
    expect(api.source).toBeNull();
    expect(api.markdownOutput).toBe("");
    act(() => api.handleFlavorChange("custom"));
    act(() => api.handleRemoveBlankLinesChange(true));
    const conversionCount = vi.mocked(convertClipboardData).mock.calls.length;
    act(() => api.restore());
    expect(vi.mocked(convertClipboardData).mock.calls).toHaveLength(
      conversionCount,
    );
    expect(api.markdownOutput).toBe("edited ~~document~~");
    expect(api.generatedOutput).toBe("Original");
    expect(api.markdownFlavor).toBe("strict");
    expect(api.removeBlankLines).toBe(false);
    expect(api.previewMode).toBe("preview");
    expect(api.detectedExtensions.strikethrough).toBe(true);
    expect(api.canRestore).toBe(false);
  });

  it("preserves existing content and settings when conversion fails", () => {
    mount();
    act(() => {
      api.importClipboard({ html: "<p>Original</p>", text: "Original" });
    });
    act(() => api.setMarkdownOutput("edited"));
    vi.mocked(convertClipboardData).mockImplementationOnce(() => {
      throw new Error("conversion failed");
    });
    act(() => {
      expect(api.importClipboard({ html: "<p>New</p>", text: "New" })).toBe(
        false,
      );
    });
    expect(api.source?.text).toBe("Original");
    expect(api.markdownOutput).toBe("edited");
    act(() => api.handleFlavorChange("strict"));
    vi.mocked(convertClipboardData).mockImplementationOnce(() => {
      throw new Error("conversion failed");
    });
    act(() => {
      expect(api.confirmPreferences()).toBe(false);
    });
    expect(api.markdownFlavor).toBe("github");
    expect(api.markdownOutput).toBe("edited");
  });

  it("ignores invalid persisted values and stores only preferences", () => {
    localStorage.setItem("markdown-flavor", JSON.stringify("unrecognized"));
    localStorage.setItem("remove-blank-lines", JSON.stringify("false"));
    mount();
    expect(api.markdownFlavor).toBe("github");
    expect(api.removeBlankLines).toBe(true);
    act(() => {
      api.importClipboard({ html: "", text: "private source" });
    });
    act(() => api.setMarkdownOutput("private edit"));
    expect(Object.keys(localStorage).sort()).toEqual([
      "markdown-flavor",
      "remove-blank-lines",
    ]);
    expect(Object.values(localStorage).join(" ")).not.toContain("private");
  });

  it("handles unavailable preference storage", () => {
    const getItem = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    mount();
    expect(api.markdownFlavor).toBe("github");
    act(() => api.handleFlavorChange("strict"));
    expect(api.markdownFlavor).toBe("strict");
    getItem.mockRestore();
    setItem.mockRestore();
  });

  it("does not reintroduce an asynchronous clipboard result after clear", async () => {
    mount();
    let resolveRead!: (value: { html: string; text: string }) => void;
    vi.mocked(readClipboard).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRead = resolve;
      }),
    );
    const pending = api.pasteClipboard();
    act(() => api.clear());
    await act(async () => {
      resolveRead({ html: "<p>Delayed</p>", text: "Delayed" });
      expect(await pending).toBe(false);
    });
    expect(api.source).toBeNull();
    expect(api.markdownOutput).toBe("");
  });
});
