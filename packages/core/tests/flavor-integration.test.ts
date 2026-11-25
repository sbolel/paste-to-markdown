import { describe, expect, it } from "vitest";
import { marked } from "marked";
import { convertHtmlToMarkdown, type MarkdownFlavor } from "../src/index.js";

const flavors: MarkdownFlavor[] = ["github", "commonmark", "strict", "custom"];

describe.each(flavors)("reliability rules with the %s preset", (flavor) => {
  it("preserves structured code and fence-looking lines with the selected block style", () => {
    const html =
      '<p>Before.</p><pre><code class="language-md"><span class="line">alpha</span><span class="line">   ```</span><span class="line">  omega</span></code></pre><p>After.</p>';
    const markdown = convertHtmlToMarkdown(html, { flavor });
    const tokens = marked
      .lexer(markdown)
      .filter((token) => token.type !== "space");
    expect(tokens.map((token) => token.type)).toEqual([
      "paragraph",
      "code",
      "paragraph",
    ]);
    expect(tokens[1].text).toBe("alpha\n   ```\n  omega");
    if (flavor === "strict")
      expect(markdown).toContain("\n\n    alpha\n       ```\n      omega\n\n");
    else expect(markdown).toContain("````md\nalpha\n   ```\n  omega\n````");
  });

  it("keeps inline-code padding and embedded backticks", () => {
    const output = convertHtmlToMarkdown(
      "<p>Use <code>  a`b  </code> here.</p>",
      { flavor },
    );
    expect(marked.parse(output)).toBe(
      "<p>Use <code>  a`b  </code> here.</p>\n",
    );
  });

  it("applies flavor precedence to tables without losing literal pipes", () => {
    const output = convertHtmlToMarkdown(
      "<table><tr><th>Value</th></tr><tr><td>A|B</td></tr></table>",
      { flavor, gfm: flavor !== "github" },
    );
    if (flavor === "github") {
      expect(output).toBe("| Value |\n| --- |\n| A\\|B |");
      expect(marked.parse(output)).toContain("<td>A|B</td>");
    } else {
      const bullet =
        flavor === "strict" ? "*" : flavor === "custom" ? "+" : "-";
      expect(output).toContain(
        `${bullet} Row 1\n\n  ${bullet} Column 1 (header)`,
      );
      expect(output).toContain("A|B");
      expect(marked.parse(output)).toContain("<li>");
      expect(marked.parse(output)).not.toContain("<table>");
    }
  });

  it("keeps complex table cell ownership, wrapped task states, and portable links", () => {
    const output = convertHtmlToMarkdown(
      '<table><tr><td colspan="2"><ul><li><label><input type="checkbox" checked> Done</label></li></ul><p><a href="https://example.invalid/a_(b)">Guide</a></p></td></tr></table>',
      { flavor },
    );
    expect(output).toContain("Columns 1-2");
    expect(output).toContain(
      flavor === "github" ? "[x] Done" : "(checked) Done",
    );
    expect(output).toContain("[Guide](https://example.invalid/a_\\(b\\))");
    expect(marked.parse(output)).toContain("Done");
    expect(marked.parse(output)).not.toContain("<table>");
  });

  it("does not infer origins for partial fragments or nonportable image references", () => {
    const output = convertHtmlToMarkdown(
      '<td><a href="/guide">Guide</a><img src="blob:example" alt="Sketch"></td><p>After.</p>',
      { flavor },
    );
    expect(output).toContain("Column 1");
    expect(output).toContain("Guide (unresolved link)");
    expect(output).toContain("Sketch (temporary image)");
    expect(output).toContain("After.");
  });
});

describe("Strict code with unrepresentable indentation-only boundaries", () => {
  it.each(["   ", "\nalpha\n\n", "\n&lt;script&gt;literal&lt;/script&gt;\n\n"])(
    "retains boundary whitespace safely: %j",
    (source) => {
      const output = convertHtmlToMarkdown(
        `<pre><code>${source}</code></pre>`,
        { flavor: "strict" },
      );
      expect(output).toBe(`<pre><code>${source}</code></pre>`);
      expect(marked.parse(output)).toContain(
        `<pre><code>${source}</code></pre>`,
      );
    },
  );
});
