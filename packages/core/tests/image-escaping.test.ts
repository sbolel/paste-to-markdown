import { describe, expect, it } from "vitest";
import { marked } from "marked";
import { convertHtmlToMarkdown } from "../src/index.js";

describe.each([true, false])("image escaping (gfm=%s)", (gfm) => {
  it("preserves image syntax while escaping its label, destination, and title", () => {
    const markdown = convertHtmlToMarkdown(
      '<img src="https://example.invalid/a(b).png" alt="A [diagram]" title="A &quot;draft&quot;">',
      { gfm },
    );
    expect(markdown).toBe(
      '![A \\[diagram\\]](https://example.invalid/a\\(b\\).png "A \\"draft\\"")',
    );
    expect(marked.parse(markdown, { gfm })).toBe(
      '<p><img src="https://example.invalid/a(b).png" alt="A [diagram]" title="A &quot;draft&quot;"></p>\n',
    );
  });
});
