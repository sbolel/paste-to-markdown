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
});
