import { marked } from "marked";
import { describe, expect, it } from "vitest";
import { convertHtmlToMarkdown } from "../src/index.js";

describe.each([true, false])("review structure regressions (gfm=%s)", (gfm) => {
  const render = (html: string) =>
    marked.parse(convertHtmlToMarkdown(html, { gfm }), { gfm, async: false });

  it("keeps a checked state and nested list when the parent has no inline label", () => {
    expect(
      render(
        '<ul><li><label><input type="checkbox" checked></label><ul><li>Child</li></ul></li></ul>',
      ),
    ).toBe(
      "<ul>\n<li><p>(checked) </p>\n<ul>\n<li>Child</li>\n</ul>\n</li>\n</ul>\n",
    );
  });

  it("keeps an unchecked state separate from a following quote", () => {
    expect(
      render(
        '<ul><li><input type="checkbox"><blockquote><p>Quoted label</p></blockquote></li></ul>',
      ),
    ).toBe(
      "<ul>\n<li><p>(unchecked) </p>\n<blockquote>\n<p>Quoted label</p>\n</blockquote>\n</li>\n</ul>\n",
    );
  });

  it("keeps a table-cell checkbox with its label instead of checking the outer list item", () => {
    expect(
      render(
        '<ul><li>Outer<table><tr><td><label><input type="checkbox" checked>Cell option</label></td></tr></table></li></ul>',
      ),
    ).toBe(
      "<ul>\n<li><p>Outer</p>\n<p>Table (cell coordinates refer to the supplied fragment):</p>\n<ul>\n<li><p>Row 1</p>\n<ul>\n<li><p>Column 1</p>\n<p>(checked) Cell option</p>\n</li>\n</ul>\n</li>\n</ul>\n</li>\n</ul>\n",
    );
  });

  it("retains split numeric prose before and after a genuine ordered list", () => {
    expect(
      render(
        '<div><span>1</span><span>. Before</span><ol start="3"><li>Real item</li></ol><span>2</span><span>. After</span></div>',
      ),
    ).toBe(
      '<p>1. Before</p>\n<ol start="3">\n<li>Real item</li>\n</ol>\n<p>2. After</p>\n',
    );
  });

  it("keeps literal prose and an actual unordered list as separate blocks", () => {
    expect(
      render(
        "<div><span>1</span><span>. Literal prose</span><ul><li>Child</li></ul></div>",
      ),
    ).toBe("<p>1. Literal prose</p>\n<ul>\n<li>Child</li>\n</ul>\n");
  });

  it("escapes composed prose without changing code in a styled block", () => {
    expect(
      render(
        '<span style="display:block"><span>1</span><span>. Before</span><pre><code>2. code</code></pre><span>3</span><span>. After</span></span>',
      ),
    ).toBe(
      "<p>1. Before</p>\n<pre><code>2. code\n</code></pre>\n<p>3. After</p>\n",
    );
  });
});
