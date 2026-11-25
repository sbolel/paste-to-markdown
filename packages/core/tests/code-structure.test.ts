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
  {
    name: "keeps every sibling code container and its explicit line boundaries",
    html: '<pre><code><span class="line">alpha</span></code><code><span class="line">beta</span></code></pre>',
    markdown: "```\nalpha\nbeta\n```",
    rendered: "<pre><code>alpha\nbeta\n</code></pre>\n",
  },
  {
    name: "preserves authored blank lines and indentation between code siblings",
    html: "<pre><code>  alpha  </code>\n\n<code>\tbeta</code></pre>",
    markdown: "```\n  alpha  \n\n\tbeta\n```",
    rendered: "<pre><code>  alpha  \n\n\tbeta\n</code></pre>\n",
  },
  {
    name: "does not duplicate authored boundaries between structured code siblings",
    html: '<pre><code><span class="line">alpha</span></code>\n\n<code><span class="line">beta</span></code></pre>',
    markdown: "```\nalpha\n\nbeta\n```",
    rendered: "<pre><code>alpha\n\nbeta\n</code></pre>\n",
  },
  {
    name: "retains a final empty highlighted line before the next code sibling",
    html: '<pre><code><span class="line">alpha</span><span class="line"></span></code><code><span class="line">beta</span></code></pre>',
    markdown: "```\nalpha\n\nbeta\n```",
    rendered: "<pre><code>alpha\n\nbeta\n</code></pre>\n",
  },
  {
    name: "retains preformatted text before and after a structured code child",
    html: "<pre>  <code>alpha<br>beta</code>  gamma\n</pre>",
    markdown: "```\n  alpha\nbeta  gamma\n```",
    rendered: "<pre><code>  alpha\nbeta  gamma\n</code></pre>\n",
  },
  {
    name: "does not invent a boundary between adjacent inline code children",
    html: "<pre><code>alpha</code><code>beta</code></pre>",
    markdown: "```\nalphabeta\n```",
    rendered: "<pre><code>alphabeta\n</code></pre>\n",
  },
  {
    name: "retains a whitespace-only preformatted code block",
    html: "<pre><code>   </code></pre>",
    markdown: "```\n   \n```",
    rendered: "<pre><code>   \n</code></pre>\n",
  },
  {
    name: "retains spaces in every otherwise blank highlighted line",
    html: '<pre><code><span class="line">  </span><span class="line"> </span></code></pre>',
    markdown: "```\n  \n \n```",
    rendered: "<pre><code>  \n \n</code></pre>\n",
  },
];

describe.each([true, false])("code review regressions (gfm=%s)", (gfm) => {
  it.each(cases)("$name", ({ html, markdown, rendered }) => {
    const result = convertHtmlToMarkdown(html, { gfm });
    expect(result).toBe(markdown);
    expect(marked.parse(result, { gfm })).toBe(rendered);
  });

  it("retains two empty highlighted lines in the code token", () => {
    const result = convertHtmlToMarkdown(
      '<pre><code><span class="line"></span><span class="line"></span></code></pre>',
      { gfm },
    );
    expect(result).toBe("```\n\n\n```");
    expect(
      marked.lexer(result, { gfm }).map(({ type, text }) => ({ type, text })),
    ).toEqual([{ type: "code", text: "\n" }]);
  });
});
