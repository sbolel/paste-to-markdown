import { describe, expect, it } from "vitest";
import { convertClipboardData, convertHtmlToMarkdown } from "../src/index.js";
import type { ClipboardDataLike } from "../src/index.js";

describe("convertHtmlToMarkdown", () => {
  it("converts a simple paragraph", () => {
    const html = "<p>Hello, world!</p>";
    const result = convertHtmlToMarkdown(html);
    expect(result).toBe("Hello, world!");
  });

  it("converts headings", () => {
    expect(convertHtmlToMarkdown("<h1>Title</h1>")).toBe("# Title");
    expect(convertHtmlToMarkdown("<h2>Subtitle</h2>")).toBe("## Subtitle");
    expect(convertHtmlToMarkdown("<h3>Section</h3>")).toBe("### Section");
  });

  it("converts bold and italic", () => {
    expect(convertHtmlToMarkdown("<strong>bold</strong>")).toBe("**bold**");
    expect(convertHtmlToMarkdown("<em>italic</em>")).toBe("_italic_");
  });

  it("converts links", () => {
    const result = convertHtmlToMarkdown(
      '<a href="https://example.com">Example</a>',
    );
    expect(result).toBe("[Example](https://example.com)");
  });

  it("converts unordered lists", () => {
    const html = "<ul><li>Item 1</li><li>Item 2</li></ul>";
    const result = convertHtmlToMarkdown(html);
    expect(result).toBe("-   Item 1\n-   Item 2");
  });

  it("converts ordered lists", () => {
    const html = "<ol><li>First</li><li>Second</li></ol>";
    const result = convertHtmlToMarkdown(html);
    expect(result).toBe("1.  First\n2.  Second");
  });

  it("converts code blocks", () => {
    const html = "<pre><code>const x = 1;</code></pre>";
    const result = convertHtmlToMarkdown(html);
    expect(result).toContain("const x = 1;");
  });

  it("converts inline code", () => {
    const result = convertHtmlToMarkdown("<code>console.log()</code>");
    expect(result).toBe("`console.log()`");
  });

  it("converts blockquotes", () => {
    const result = convertHtmlToMarkdown(
      "<blockquote><p>Quote text</p></blockquote>",
    );
    expect(result).toBe("> Quote text");
  });

  it("converts horizontal rules", () => {
    const result = convertHtmlToMarkdown("<hr>");
    expect(result).toBe("---");
  });

  it("returns empty string for empty input", () => {
    expect(convertHtmlToMarkdown("")).toBe("");
    expect(convertHtmlToMarkdown("   ")).toBe("");
  });

  it("converts strikethrough (GFM)", () => {
    const result = convertHtmlToMarkdown("<del>deleted</del>");
    expect(result).toBe("~~deleted~~");
  });

  it("converts nested lists", () => {
    const html =
      "<ul><li>Item 1<ul><li>Nested</li></ul></li><li>Item 2</li></ul>";
    const result = convertHtmlToMarkdown(html);
    expect(result).toContain("Item 1");
    expect(result).toContain("Nested");
    expect(result).toContain("Item 2");
  });
});

describe("convertClipboardData", () => {
  function makeClipboardData(data: Record<string, string>): ClipboardDataLike {
    return {
      getData: (type: string) => data[type] ?? "",
    };
  }

  it("converts HTML from clipboard", () => {
    const cd = makeClipboardData({ "text/html": "<p>Hello</p>" });
    const result = convertClipboardData(cd);
    expect(result).toBe("Hello");
  });

  it("falls back to plain text when no HTML", () => {
    const cd = makeClipboardData({ "text/plain": "plain text" });
    const result = convertClipboardData(cd);
    expect(result).toBe("plain text");
  });

  it("prefers HTML over plain text", () => {
    const cd = makeClipboardData({
      "text/html": "<strong>bold</strong>",
      "text/plain": "bold",
    });
    const result = convertClipboardData(cd);
    expect(result).toBe("**bold**");
  });

  it("returns empty string when no data", () => {
    const cd = makeClipboardData({});
    const result = convertClipboardData(cd);
    expect(result).toBe("");
  });
});
