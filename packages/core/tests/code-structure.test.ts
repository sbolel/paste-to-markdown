import { describe, expect, it } from "vitest";
import { marked } from "marked";
import { convertHtmlToMarkdown } from "../src/index.js";

const cases = [
  {
    name: "normalizes explicit inline-code breaks into separators",
    html: "<p>Use <code>a<br>b</code> here.</p>",
    markdown: "Use `a b` here.",
    rendered: "<p>Use <code>a b</code> here.</p>\n",
  },
];

describe.each([true, false])("code review regressions (gfm=%s)", (gfm) => {
  it.each(cases)("$name", ({ html, markdown, rendered }) => {
    const result = convertHtmlToMarkdown(html, { gfm });
    expect(result).toBe(markdown);
    expect(marked.parse(result, { gfm })).toBe(rendered);
  });
});
