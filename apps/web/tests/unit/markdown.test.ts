import { describe, expect, it } from "vitest";
import DOMPurify from "dompurify";
import {
  compactListSpacing,
  detectMarkdownExtensions,
  markdownFilename,
  sanitizedPreview,
} from "../../src/lib/markdown";

describe("compactListSpacing", () => {
  it.each([
    ["- first\n\n- second", "- first\n- second"],
    ["1. first\n\n2. second\n\nAfter", "1. first\n2. second\n\nAfter"],
    ["- [ ] first\n\n- [x] second", "- [ ] first\n- [x] second"],
    [
      "Before\n\n+ first\r\n\r\n+ second\r\n\r\nAfter",
      "Before\n\n+ first\r\n+ second\r\n\r\nAfter",
    ],
  ])("compacts only the recognized sibling gap", (input, expected) => {
    expect(compactListSpacing(input)).toBe(expected);
  });

  it.each([
    "```markdown\n- first\n\n- second\n```",
    "~~~markdown\n- first\n\n- second\n~~~",
    "    - first\n\n    - second",
    "- parent\n  - child\n\n- sibling",
    "- first paragraph\n\n  second paragraph\n\n- sibling",
    "- first\n  continued\n\n- sibling",
    "- first\n\n* a separate list",
    "A paragraph\n\nA second paragraph",
    "> - quoted\n>\n> - list",
    "- first\n\n      indented code\n\n- sibling",
  ])("preserves complex Markdown byte-for-byte", (input) => {
    expect(compactListSpacing(input)).toBe(input);
  });

  it("does not alter a fence identical to a later real list", () => {
    const input = "```\n- first\n\n- second\n```\n\n- first\n\n- second";
    expect(compactListSpacing(input)).toBe(
      "```\n- first\n\n- second\n```\n\n- first\n- second",
    );
  });
});

describe("informational extension detection", () => {
  it("detects a table that follows prose and other supported extension hints", () => {
    const detected = detectMarkdownExtensions(
      "---\r\ntitle: Sample\r\n---\r\n\r\nA paragraph[^1].\r\n\r\n| A | B |\r\n| --- | --- |\r\n| x | y |\r\n\r\n- [x] ~~done~~\r\n\r\nTerm\r\n: Meaning",
    );
    expect(Object.values(detected)).toEqual([
      true,
      true,
      true,
      true,
      true,
      true,
    ]);
  });

  it("does not count fenced examples as task lists, tables, or strikethrough", () => {
    const detected = detectMarkdownExtensions(
      "```md\n- [x] ~~done~~\n\n| A | B |\n| --- | --- |\n```",
    );
    expect(detected.taskLists).toBe(false);
    expect(detected.tables).toBe(false);
    expect(detected.strikethrough).toBe(false);
  });
});

describe("sanitized preview", () => {
  it.each([
    "/images/local.png",
    "images/local.png",
    `${window.location.origin}/images/local.png`,
    "data:image/png;base64,iVBORw0KGgo=",
    "data:image/jpeg;base64,/9j/",
    "data:image/gif;base64,R0lGODlh",
    "data:image/webp;base64,UklGRg==",
    "data:image/avif;base64,AAAAIA==",
  ])("retains an allowed local or raster image: %s", (source) => {
    const html = sanitizedPreview(`<img src="${source}" alt="Sample">`);
    const container = document.createElement("div");
    container.innerHTML = html;
    expect(container.querySelector("img")?.getAttribute("src")).toBe(source);
    expect(container.querySelector("img")?.getAttribute("alt")).toBe("Sample");
  });

  it.each([
    "https://example.invalid/image.png",
    "//example.invalid/image.png",
    `//${window.location.host}/image.png`,
    "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
    "data:text/html;base64,PGgxPkhlbGxvPC9oMT4=",
    "javascript:alert(1)",
  ])("removes a disallowed image source: %s", (source) => {
    const html = sanitizedPreview(`<img src="${source}" alt="Sample">`);
    const container = document.createElement("div");
    container.innerHTML = html;
    expect(container.querySelector("img")?.hasAttribute("src")).toBe(false);
    expect(container.querySelector("img")?.getAttribute("alt")).toBe("Sample");
  });

  it("removes other resource attributes even on allowed images and preserves navigational links", () => {
    const html = sanitizedPreview(
      '<img src="/images/local.png" srcset="https://example.invalid/remote.png 2x" style="background:url(https://example.invalid/pixel)"><a href="https://example.invalid/page" ping="https://example.invalid/ping">Link</a><input type="image" src="/images/local.png">',
    );
    const container = document.createElement("div");
    container.innerHTML = html;
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "/images/local.png",
    );
    expect(
      container.querySelector("[srcset], [style], [ping], input[src]"),
    ).toBeNull();
    expect(container.querySelector("a")?.getAttribute("href")).toBe(
      "https://example.invalid/page",
    );
  });

  it("does not attach resource-policy hooks to the shared DOMPurify instance", () => {
    sanitizedPreview('<img src="https://example.invalid/remote.png">');
    expect(
      DOMPurify.sanitize('<img src="https://example.invalid/remote.png">'),
    ).toContain('src="https://example.invalid/remote.png"');
  });

  it("renders GFM and retains safe links without executable or resource attributes", () => {
    const html = sanitizedPreview(
      '# Heading\n\n~~done~~ [link](https://example.invalid/page)\n\n<img src="https://example.invalid/pixel" srcset="https://example.invalid/2x 2x" onerror="alert(1)" style="background:url(https://example.invalid/a)"><script>alert(1)</script><iframe src="https://example.invalid/frame"></iframe><a href="javascript:alert(1)" ping="https://example.invalid/ping">unsafe</a>',
    );
    const container = document.createElement("div");
    container.innerHTML = html;
    expect(container.querySelector("h1")?.textContent).toBe("Heading");
    expect(container.querySelector("del")?.textContent).toBe("done");
    expect(container.querySelector("a")?.getAttribute("href")).toBe(
      "https://example.invalid/page",
    );
    expect(
      container.querySelector(
        "script, iframe, [src], [srcset], [style], [onerror], [ping]",
      ),
    ).toBeNull();
    expect(html).not.toContain("javascript:");
  });
});

describe("download filename", () => {
  it.each([
    ["", "markdown.md"],
    [" notes.md ", "notes.md"],
    ["../notes", "..-notes.md"],
    ["...", "markdown.md"],
  ])("normalizes %s", (input, output) => {
    expect(markdownFilename(input)).toBe(output);
  });
});
