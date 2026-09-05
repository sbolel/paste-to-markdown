import { act, createElement, StrictMode } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Application, APPLICATION_ID_PREFIX } from "../../src/Application";

let root: Root | undefined;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: () => true,
  }));
  localStorage.clear();
});

afterEach(() => {
  if (root) act(() => root!.unmount());
  root = undefined;
  document.body.innerHTML = "";
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it.each([
  { strict: false, saved: false },
  { strict: false, saved: true },
  { strict: true, saved: false },
  { strict: true, saved: true },
])(
  "hydrates the shared tree with StrictMode=$strict and saved preferences=$saved",
  async ({ strict, saved }) => {
    if (saved) {
      localStorage.setItem("markdown-flavor", '"strict"');
      localStorage.setItem("remove-blank-lines", "false");
    }
    const errors = vi.spyOn(console, "error");
    const warnings = vi.spyOn(console, "warn");
    const reads = vi.spyOn(Storage.prototype, "getItem");
    const listeners = vi.spyOn(document, "addEventListener");
    const tree = strict
      ? createElement(StrictMode, null, createElement(Application))
      : createElement(Application);
    const container = document.createElement("div");
    container.innerHTML = renderToString(tree, {
      identifierPrefix: APPLICATION_ID_PREFIX,
    });
    document.body.append(container);
    expect(reads).not.toHaveBeenCalled();
    const publicNodes = [...container.querySelectorAll("h1,h2,p,a")];
    expect(publicNodes.length).toBeGreaterThan(5);
    const ids = [...container.querySelectorAll("[id]")].map((node) => node.id);
    const paste = [...container.querySelectorAll("button")].find((node) =>
      node.textContent?.includes("Paste from Clipboard"),
    )!;
    expect(paste.disabled).toBe(true);

    const recoverable = vi.fn();
    await act(async () => {
      root = hydrateRoot(container, tree, {
        identifierPrefix: APPLICATION_ID_PREFIX,
        onRecoverableError: recoverable,
      });
    });

    expect(recoverable).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    expect(warnings).not.toHaveBeenCalled();
    expect([...container.querySelectorAll("h1,h2,p,a")]).toEqual(publicNodes);
    expect(publicNodes.every((node) => node.isConnected)).toBe(true);
    expect(
      [...container.querySelectorAll("[id]")].map((node) => node.id),
    ).toEqual(ids);
    expect(new Set(ids).size).toBe(ids.length);
    expect(paste.isConnected).toBe(true);
    expect(paste.disabled).toBe(false);
    expect(listeners.mock.calls.some(([name]) => name === "paste")).toBe(true);
    expect(localStorage.getItem("markdown-flavor")).toBe(
      saved ? '"strict"' : '"github"',
    );
    expect(localStorage.getItem("remove-blank-lines")).toBe(
      saved ? "false" : "true",
    );
  },
);
