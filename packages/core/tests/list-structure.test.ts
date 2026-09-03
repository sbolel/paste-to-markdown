import { marked } from "marked";
import { describe, expect, it } from "vitest";
import { convertHtmlToMarkdown } from "../src/index.js";

describe.each([true, false])("list structure (gfm=%s)", (gfm) => {
  it("keeps continuation blocks and multiple list depths in their owning item", () => {
    const html =
      '<ol start="9"><li><p>Outer first</p><ul><li>Child one<ol start="3"><li>Deep one</li><li>Deep two</li></ol></li><li>Child two</li></ul><p>First continuation</p><blockquote><p>First quote</p></blockquote><pre><code>alpha\nbeta\n</code></pre></li><li>Outer second</li></ol>';
    const markdown = convertHtmlToMarkdown(html, { gfm });
    expect(marked.parse(markdown, { gfm, async: false })).toBe(
      '<ol start="9">\n' +
        '<li><p>Outer first</p>\n<ul>\n<li>Child one<ol start="3">\n' +
        "<li>Deep one</li>\n<li>Deep two</li>\n</ol>\n</li>\n" +
        "<li>Child two</li>\n</ul>\n<p>First continuation</p>\n" +
        "<blockquote>\n<p>First quote</p>\n</blockquote>\n" +
        "<pre><code>alpha\nbeta\n</code></pre>\n</li>\n" +
        "<li><p>Outer second</p>\n</li>\n</ol>\n",
    );
  });
});
