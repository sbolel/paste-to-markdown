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
});
