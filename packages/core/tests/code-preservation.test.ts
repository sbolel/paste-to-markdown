import { marked } from "marked";
import { describe, expect, it } from "vitest";
import { convertHtmlToMarkdown } from "../src/index.js";
import type { ConversionOptions } from "../src/index.js";

const modes: { name: string; options: ConversionOptions }[] = [
  { name: "default GFM", options: {} },
  { name: "GFM disabled", options: { gfm: false } },
];

describe.each(modes)("code preservation: $name", ({ options }) => {
  const render = (html: string) =>
    marked.parse(convertHtmlToMarkdown(html, options), {
      async: false,
      gfm: options.gfm !== false,
    });

  it("keeps standalone backtick and tilde fence lines inside one code block", () => {
    const html =
      '<p>Before code.</p><pre><code class="language-md">alpha\n```\nbeta\n`````\ngamma\n~~~\nomega</code></pre><p>After code.</p>';

    expect(render(html)).toBe(
      '<p>Before code.</p>\n<pre><code class="language-md">alpha\n```\nbeta\n`````\ngamma\n~~~\nomega\n</code></pre>\n<p>After code.</p>\n',
    );
  });

  it.each([
    ["embedded delimiters", "a`b``c", "a`b``c"],
    ["delimiters on both edges", "`literal`", "`literal`"],
    ["only backticks", "```", "```"],
    ["both padded edges", "  value  ", "  value  "],
    ["leading spaces", "  value", "  value"],
    ["trailing spaces", "value  ", "value  "],
    ["repeated internal spaces", "a  b", "a  b"],
    ["only spaces", "   ", "   "],
    ["entities and literal markup", "a &lt; b &amp; c", "a &lt; b &amp; c"],
    ["line-ending normalization", "a\nb\r\nc\rd", "a b c d"],
  ])(
    "retains the rendered inline-code value with %s",
    (_name, input, value) => {
      expect(render(`<p>Use <code>${input}</code> now.</p>`)).toBe(
        `<p>Use <code>${value}</code> now.</p>\n`,
      );
    },
  );

  it("retains spaces across inline highlighting nodes", () => {
    expect(
      render("<p>Use <code><span>a</span><span>  </span>b</code> now.</p>"),
    ).toBe("<p>Use <code>a  b</code> now.</p>\n");
  });

  it("retains whitespace-only code inside otherwise blank wrappers", () => {
    expect(render("<div><p><code>   </code></p></div>")).toBe(
      "<p><code>   </code></p>\n",
    );
  });

  it("retains ordinary prose normalization beside preformatted inline code", () => {
    expect(render("<p>  Before   <code>  a  b  </code>   after.  </p>")).toBe(
      "<p>Before <code>  a  b  </code> after.</p>\n",
    );
  });
});
