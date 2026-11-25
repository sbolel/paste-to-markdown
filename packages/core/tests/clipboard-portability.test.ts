import { describe, expect, it } from "vitest";
import { marked } from "marked";
import { convertClipboardData, convertHtmlToMarkdown } from "../src/index.js";

for (const gfm of [true, false]) {
  describe(`clipboard and portability (gfm=${gfm})`, () => {
    const convert = (html: string) => convertHtmlToMarkdown(html, { gfm });

    it("preserves literal plain text without importing HTML or Markdown", () => {
      const plain =
        "# literal heading?\n*literal emphasis?*\n<strong>literal</strong>\n";
      expect(
        convertClipboardData(
          { getData: (type) => (type === "text/plain" ? plain : "") },
          { gfm },
        ),
      ).toBe(plain);
    });

    it("prefers meaningful HTML and falls back for whitespace-only HTML", () => {
      expect(
        convertClipboardData(
          {
            getData: (type) =>
              type === "text/html" ? "<strong>Sample</strong>" : "Sample",
          },
          { gfm },
        ),
      ).toBe("**Sample**");
      expect(
        convertClipboardData(
          { getData: (type) => (type === "text/html" ? " \n" : "Sample") },
          { gfm },
        ),
      ).toBe("Sample");
    });

    it("preserves partial inline and list text without introducing neighbors", () => {
      expect(
        convert("<!--StartFragment--><strong>beta</strong><!--EndFragment-->"),
      ).toBe("**beta**");
      expect(convert("<ul><li>cond item</li></ul>")).toBe("-   cond item");
    });

    it("keeps adjacent selected cell values separate in a standalone table fragment", () => {
      const markdown = convert("<td>A</td><td>Cell B</td>");
      expect(marked.parse(markdown, { gfm })).toBe(
        "<p>Table (cell coordinates refer to the supplied fragment):</p>\n<ul>\n<li><p>Row 1</p>\n<ul>\n<li><p>Column 1</p>\n<p>A</p>\n</li>\n<li><p>Column 2</p>\n<p>Cell B</p>\n</li>\n</ul>\n</li>\n</ul>\n",
      );
    });

    it("accepts clipboard metadata before selected cells without merging them", () => {
      expect(convert('<meta charset="utf-8"><td>A</td><td>Cell B</td>')).toBe(
        convert("<td>A</td><td>Cell B</td>"),
      );
    });

    it("keeps prose after a selected cell fragment in source order", () => {
      const cells = convert("<td>A</td><td>Cell B</td>");
      expect(convert("<td>A</td><td>Cell B</td><p>After</p>")).toBe(
        `${cells}\n\nAfter`,
      );
    });

    it.each(["script", "style", "textarea", "title"])(
      "keeps table-looking text inside %s opaque when adding fragment context",
      (tag) => {
        const markdown = convert(
          `<td>Alpha<${tag}>const sample = "</td>";</${tag}>Tail</td><td>Sibling</td><p>After</p>`,
        );
        expect(markdown.endsWith("\n\nAfter")).toBe(true);
        expect(markdown.indexOf("Column 1")).toBeLessThan(
          markdown.indexOf("Column 2"),
        );
        expect(markdown.indexOf("Alpha")).toBeLessThan(
          markdown.indexOf("Sibling"),
        );
      },
    );

    it("identifies unresolved relative links without guessing an origin", () => {
      const markdown = convert('<a href="../guide">Read the guide</a>');
      expect(markdown).toBe("Read the guide (unresolved link)");
      expect(marked.parse(markdown, { gfm })).toBe(
        "<p>Read the guide (unresolved link)</p>\n",
      );
    });

    it("does not infer a base from source context or protocol-relative paths", () => {
      expect(
        convert(
          '<base href="https://example.invalid/source/"><a href="../guide">Guide</a>',
        ),
      ).toBe("Guide (unresolved link)");
      expect(convert('<a href="//example.invalid/guide">Guide</a>')).toBe(
        "Guide (unresolved link)",
      );
    });

    it("preserves a linked image destination independently from an unresolved image", () => {
      const markdown = convert(
        '<a href="https://example.invalid/details"><img src="/media/sample.png" alt="Sample diagram"></a>',
      );
      expect(markdown).toBe(
        "[Sample diagram (unresolved image)](https://example.invalid/details)",
      );
      expect(marked.parse(markdown, { gfm })).toBe(
        '<p><a href="https://example.invalid/details">Sample diagram (unresolved image)</a></p>\n',
      );
    });

    it("retains useful text for revoked temporary images and links", () => {
      expect(
        convert(
          '<img src="blob:https://example.invalid/synthetic" alt="Sample diagram">',
        ),
      ).toBe("Sample diagram (temporary image)");
      expect(
        convert(
          '<a href="blob:https://example.invalid/synthetic">Attachment</a>',
        ),
      ).toBe("Attachment (temporary link)");
    });

    it("does not turn unsupported schemes or missing alt text into active links", () => {
      expect(convert('<a href="javascript:alert(1)">Label</a>')).toBe(
        "Label (unresolved link)",
      );
      expect(convert('<img src="file:///sample.png">')).toBe(
        "Image (unresolved image)",
      );
    });
  });
}
