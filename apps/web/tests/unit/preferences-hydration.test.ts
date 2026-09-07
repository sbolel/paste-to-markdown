import { act, createElement, StrictMode, useLayoutEffect } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { convertClipboardData } from "@paste-to-markdown/core";
import { useMarkdownDocument } from "../../src/hooks/use-markdown-document";
import { readClipboard } from "../../src/lib/clipboard";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
vi.mock("@paste-to-markdown/core", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@paste-to-markdown/core")>();
  return {
    ...actual,
    convertClipboardData: vi.fn(actual.convertClipboardData),
  };
});
vi.mock("../../src/lib/clipboard", () => ({ readClipboard: vi.fn() }));

type Preferences = { markdownFlavor: string; removeBlankLines: boolean };
type StorageEvent =
  | { type: "read"; key: string }
  | { type: "commit"; ready: boolean; preferences: Preferences }
  | { type: "write"; key: string; value: string };
const defaults: Preferences = {
  markdownFlavor: "github",
  removeBlankLines: true,
};
const saved: Preferences = {
  markdownFlavor: "custom",
  removeBlankLines: false,
};
let root: Root | null = null;
let api: ReturnType<typeof useMarkdownDocument>;
let events: StorageEvent[];
let earlyImports: boolean[];
let earlyPastes: Promise<boolean>[];

function Harness() {
  api = useMarkdownDocument();
  useLayoutEffect(() => {
    events.push({
      type: "commit",
      ready: api.preferencesReady,
      preferences: {
        markdownFlavor: api.markdownFlavor,
        removeBlankLines: api.removeBlankLines,
      },
    });
    if (!api.preferencesReady) {
      earlyImports.push(
        api.importClipboard({ html: "<h1>Too early</h1>", text: "" }),
      );
      earlyPastes.push(api.pasteClipboard());
    }
  });
  return null;
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  events = [];
  earlyImports = [];
  earlyPastes = [];
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  if (root) act(() => root!.unmount());
  root = null;
  document.body.innerHTML = "";
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("preference hydration", () => {
  it.each([
    {
      name: "saved preferences",
      flavor: '"custom"',
      spacing: "false",
      expected: saved,
    },
    { name: "fresh storage", flavor: null, spacing: null, expected: defaults },
    {
      name: "malformed JSON",
      flavor: "{bad",
      spacing: "undefined",
      expected: defaults,
    },
    {
      name: "wrong types",
      flavor: "42",
      spacing: '"false"',
      expected: defaults,
    },
    {
      name: "unknown flavor",
      flavor: '"unknown"',
      spacing: "false",
      expected: { ...defaults, removeBlankLines: false },
    },
    {
      name: "read denied",
      flavor: '"custom"',
      spacing: "false",
      readDenied: true,
      expected: defaults,
    },
    {
      name: "one read denied",
      flavor: '"custom"',
      spacing: "false",
      flavorReadDenied: true,
      expected: { ...defaults, removeBlankLines: false },
    },
    {
      name: "write denied",
      flavor: '"custom"',
      spacing: "false",
      writeDenied: true,
      expected: saved,
    },
  ])(
    "restores $name before any persistence or conversion",
    async (scenario) => {
      const values = new Map<string, string>([
        ["unrelated-setting", "keep me"],
      ]);
      if (scenario.flavor !== null)
        values.set("markdown-flavor", scenario.flavor);
      if (scenario.spacing !== null)
        values.set("remove-blank-lines", scenario.spacing);
      vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
        events.push({ type: "read", key });
        if (
          scenario.readDenied ||
          (scenario.flavorReadDenied && key === "markdown-flavor")
        ) {
          throw new Error("storage read denied");
        }
        return values.get(key) ?? null;
      });
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(
        (key, value) => {
          events.push({ type: "write", key, value });
          if (scenario.writeDenied) throw new Error("storage write denied");
          values.set(key, value);
        },
      );
      const tree = createElement(StrictMode, null, createElement(Harness));
      const container = document.createElement("div");
      container.innerHTML = renderToString(tree);
      document.body.append(container);
      expect(events).toEqual([]);
      expect(api.preferencesReady).toBe(false);
      expect(api.markdownFlavor).toBe("github");
      expect(api.removeBlankLines).toBe(true);
      expect(api.source).toBeNull();
      expect(api.markdownOutput).toBe("");
      expect(api.previewMode).toBe("raw");

      const recoverable = vi.fn();
      await act(async () => {
        root = hydrateRoot(container, tree, {
          onRecoverableError: recoverable,
        });
      });
      expect(recoverable).not.toHaveBeenCalled();
      expect(earlyImports.length).toBeGreaterThan(0);
      expect(earlyImports.every((result) => result === false)).toBe(true);
      expect(
        (await Promise.all(earlyPastes)).every((result) => result === false),
      ).toBe(true);
      expect(readClipboard).not.toHaveBeenCalled();
      expect(convertClipboardData).not.toHaveBeenCalled();
      expect(api.preferencesReady).toBe(true);
      expect(api.markdownFlavor).toBe(scenario.expected.markdownFlavor);
      expect(api.removeBlankLines).toBe(scenario.expected.removeBlankLines);
      expect(api.source).toBeNull();
      expect(api.markdownOutput).toBe("");
      expect(api.generatedOutput).toBe("");
      expect(api.previewMode).toBe("raw");

      const reads = new Set<string>();
      let readyCommitted = false;
      let writes = 0;
      for (const event of events) {
        if (event.type === "read") reads.add(event.key);
        if (event.type === "commit" && event.ready) {
          expect(event.preferences).toEqual(scenario.expected);
          readyCommitted = true;
        }
        if (event.type === "write") {
          writes += 1;
          expect(reads).toEqual(
            new Set(["markdown-flavor", "remove-blank-lines"]),
          );
          expect(readyCommitted).toBe(true);
          const key =
            event.key === "markdown-flavor"
              ? "markdownFlavor"
              : "removeBlankLines";
          expect(["markdown-flavor", "remove-blank-lines"]).toContain(
            event.key,
          );
          expect(JSON.parse(event.value)).toBe(scenario.expected[key]);
        }
      }
      expect(writes).toBeGreaterThan(0);
      expect(values.get("unrelated-setting")).toBe("keep me");
      expect([...values.keys()].sort()).toEqual([
        "markdown-flavor",
        "remove-blank-lines",
        "unrelated-setting",
      ]);

      // Isolate the hook's spacing preference from the converter's own list preset.
      vi.mocked(convertClipboardData).mockReturnValueOnce("- One\n\n- Two");
      act(() => {
        expect(
          api.importClipboard({
            html: "<ul><li>One</li><li>Two</li></ul>",
            text: "",
          }),
        ).toBe(true);
      });
      expect(convertClipboardData).toHaveBeenLastCalledWith(expect.anything(), {
        flavor: scenario.expected.markdownFlavor,
      });
      expect(api.markdownOutput).toBe(
        scenario.expected.removeBlankLines ? "- One\n- Two" : "- One\n\n- Two",
      );

      act(() => api.handleFlavorChange("strict"));
      expect(api.markdownFlavor).toBe("strict");
      if (!scenario.writeDenied)
        expect(values.get("markdown-flavor")).toBe('"strict"');
      expect(values.get("unrelated-setting")).toBe("keep me");
    },
  );
});
