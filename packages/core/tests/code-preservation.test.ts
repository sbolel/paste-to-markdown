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

  it("retains highlighted text, indentation, and an authored final newline", () => {
    const html =
      '<pre><code class="language-js"><span class="keyword">const</span> total = <span class="number">12</span>;\n  total += 1;\n</code></pre><p>After.</p>';

    expect(render(html)).toBe(
      '<pre><code class="language-js">const total = 12;\n  total += 1;\n</code></pre>\n<p>After.</p>\n',
    );
  });

  it.each([
    [
      "break elements",
      "<span>const total = 12;</span><br><span>  return total;</span>",
    ],
    [
      "explicit span line wrappers",
      '<span class="line">const total = 12;</span><span class="line">  return total;</span>',
    ],
    [
      "block line wrappers",
      "<div>const total = 12;</div><div>  return total;</div>",
    ],
  ])("preserves newlines represented by %s", (_name, content) => {
    expect(
      render(
        `<pre><code class="language-js">${content}</code></pre><p>After.</p>`,
      ),
    ).toBe(
      '<pre><code class="language-js">const total = 12;\n  return total;\n</code></pre>\n<p>After.</p>\n',
    );
  });

  it("preserves empty lines and spaces in highlighted line wrappers", () => {
    expect(
      render(
        '<pre><code><span class="line">  a  </span><span class="line"></span><span class="line">\tb</span></code></pre>',
      ),
    ).toBe("<pre><code>  a  \n\n\tb\n</code></pre>\n");
  });

  it("retains a final empty highlighted line and separate following prose", () => {
    const markdown = convertHtmlToMarkdown(
      '<pre><code><span class="line">a</span><span class="line"></span></code></pre><p>After.</p>',
      options,
    );
    // marked's renderer normalizes a final LF; lexer values retain that line.
    const blocks = marked
      .lexer(markdown, { gfm: options.gfm !== false })
      .filter((token) => token.type !== "space")
      .map((token) => ({ type: token.type, text: token.text }));
    expect(blocks).toEqual([
      { type: "code", text: "a\n" },
      { type: "paragraph", text: "After." },
    ]);
  });

  it("keeps fence-looking lines reconstructed from highlights inside one block", () => {
    expect(
      render(
        '<pre><code class="language-md"><span>alpha</span><br><span>   ```</span><br><span>~~~</span><br><span>omega</span></code></pre><p>After.</p>',
      ),
    ).toBe(
      '<pre><code class="language-md">alpha\n   ```\n~~~\nomega\n</code></pre>\n<p>After.</p>\n',
    );
  });

  it("retains the language declared on the preformatted wrapper", () => {
    expect(
      render(
        '<pre class="language-c++"><code><span class="line">int total = 12;</span><span class="line">  total += 1;</span></code></pre>',
      ),
    ).toBe(
      '<pre><code class="language-c++">int total = 12;\n  total += 1;\n</code></pre>\n',
    );
  });

  it("does not add a second boundary for line wrappers already separated by newlines", () => {
    expect(
      render(
        '<pre><code><span class="line">a</span>\n<span class="line">  b</span>\n</code></pre>',
      ),
    ).toBe("<pre><code>a\n  b\n</code></pre>\n");
  });

  it("excludes an explicitly decorative adjacent gutter and retains a numeric literal", () => {
    const html =
      '<div class="highlight"><div class="gutter" aria-hidden="true">1<br>2</div><pre><code class="language-js"><span class="line">const total = <span class="number">12</span>;</span><span class="line">  return total;</span></code></pre></div><p>After.</p>';

    expect(render(html)).toBe(
      '<pre><code class="language-js">const total = 12;\n  return total;\n</code></pre>\n<p>After.</p>\n',
    );
  });

  it("retains hidden code text and gutter-like content without the decorative markers", () => {
    const html =
      '<div class="gutter">1</div><pre><code><span aria-hidden="true">12</span> + <span class="number">7</span></code></pre><p aria-hidden="true">Hidden prose.</p><div class="gutter" aria-hidden="true">Unrelated label.</div>';

    expect(render(html)).toBe(
      "<p>1</p>\n<pre><code>12 + 7\n</code></pre>\n<p>Hidden prose.</p>\n<p>Unrelated label.</p>\n",
    );
  });

  it("excludes explicitly decorative gutters inside highlighted code", () => {
    expect(
      render(
        '<pre><code><span class="line"><span class="gutter" aria-hidden="true">1</span>value = <span class="number">12</span>;</span><span class="line"><span class="gutter" aria-hidden="true">2</span>  value++;</span></code></pre>',
      ),
    ).toBe("<pre><code>value = 12;\n  value++;\n</code></pre>\n");
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
