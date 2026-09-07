// @vitest-environment node
import { describe, expect, it } from "vitest";
import { injectHomepage } from "../../scripts/prerender-html.mjs";

describe("homepage injection", () => {
  it("preserves the surrounding template and inserts rendered dollars literally", () => {
    const before =
      '<!doctype html><html><head><title>Keep me</title></head><body><div id="root">';
    const after =
      '</div><script src="/paste-to-markdown/assets/main.js"></script></body></html>';
    const markup = "<h1>Cost $& $` $' $$</h1>";
    expect(injectHomepage(before + after, markup)).toBe(
      before + markup + after,
    );
  });

  it.each([
    '<div id="other"></div>',
    '<div id="root"></div><div id="root"></div>',
    '<div id="root">Already rendered</div>',
    '<main id="root"></main>',
    '<div id="root">',
  ])("rejects an invalid root: %s", (template) => {
    expect(() => injectHomepage(template, "<h1>Ready</h1>")).toThrow();
  });

  it.each(["", "  ", undefined, null])(
    "rejects empty renderer output: %s",
    (markup) => {
      expect(() => injectHomepage('<div id="root"></div>', markup)).toThrow(
        /empty markup/,
      );
    },
  );
});
