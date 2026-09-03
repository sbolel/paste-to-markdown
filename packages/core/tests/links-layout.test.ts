import { marked } from "marked";
import { describe, expect, it } from "vitest";
import { convertHtmlToMarkdown } from "../src/index.js";

// Authored synthetic HTML; every rendered expectation is checked in both modes.
const cases = [
  {
    name: "preserves paragraph-backed label and target",
    html: '<a href="https://example.invalid/items/alpha"><p>Item Alpha</p><span>Short description</span></a>',
    markdown:
      "[Item Alpha Short description](https://example.invalid/items/alpha)",
    rendered:
      '<p><a href="https://example.invalid/items/alpha">Item Alpha Short description</a></p>\n',
  },
  {
    name: "keeps linked heading content without leaking heading markers",
    html: '<a href="https://example.invalid/items/alpha"><h2>Item Alpha</h2><p>A <strong>bold</strong> description</p></a>',
    markdown:
      "[Item Alpha A **bold** description](https://example.invalid/items/alpha)",
    rendered:
      '<p><a href="https://example.invalid/items/alpha">Item Alpha A <strong>bold</strong> description</a></p>\n',
  },
  {
    name: "preserves a literal hash inside a linked heading",
    html: '<a href="https://example.invalid/items/alpha"><h2># Item Alpha</h2><p>A <em>short</em> description</p></a>',
    markdown:
      "[\\# Item Alpha A _short_ description](https://example.invalid/items/alpha)",
    rendered:
      '<p><a href="https://example.invalid/items/alpha"># Item Alpha A <em>short</em> description</a></p>\n',
  },
  {
    name: "preserves a linked image and accompanying label",
    html: '<a href="https://example.invalid/items/alpha"><img src="https://example.invalid/images/alpha.png" alt="Alpha preview"><p>Item Alpha</p></a>',
    markdown:
      "[![Alpha preview](https://example.invalid/images/alpha.png) Item Alpha](https://example.invalid/items/alpha)",
    rendered:
      '<p><a href="https://example.invalid/items/alpha"><img src="https://example.invalid/images/alpha.png" alt="Alpha preview"> Item Alpha</a></p>\n',
  },
  {
    name: "ignores empty block content while separating label words",
    html: '<a href="https://example.invalid/items/alpha"><p></p><span>Item Alpha</span><div></div><span>Details</span></a>',
    markdown: "[Item Alpha Details](https://example.invalid/items/alpha)",
    rendered:
      '<p><a href="https://example.invalid/items/alpha">Item Alpha Details</a></p>\n',
  },
  {
    name: "separates adjacent block-backed linked cards",
    html: '<a href="https://example.invalid/items/alpha"><p>Alpha</p><span>First description</span></a><a href="https://example.invalid/items/beta"><p>Beta</p><span>Second description</span></a>',
    markdown:
      "[Alpha First description](https://example.invalid/items/alpha)\n\n[Beta Second description](https://example.invalid/items/beta)",
    rendered:
      '<p><a href="https://example.invalid/items/alpha">Alpha First description</a></p>\n<p><a href="https://example.invalid/items/beta">Beta Second description</a></p>\n',
  },
  {
    name: "preserves semantic grid card associations in DOM order",
    html: '<section style="display:grid"><article><h2><a href="https://example.invalid/items/alpha">Alpha</a></h2><p>First description</p></article><article><h2><a href="https://example.invalid/items/beta">Beta</a></h2><p>Second description</p></article></section>',
    markdown:
      "## [Alpha](https://example.invalid/items/alpha)\n\nFirst description\n\n## [Beta](https://example.invalid/items/beta)\n\nSecond description",
    rendered:
      '<h2><a href="https://example.invalid/items/alpha">Alpha</a></h2>\n<p>First description</p>\n<h2><a href="https://example.invalid/items/beta">Beta</a></h2>\n<p>Second description</p>\n',
  },
  {
    name: "separates explicit block spans in grid cards",
    html: '<span style="display:grid"><span style="display:block"><a href="https://example.invalid/items/alpha">Alpha</a><span style="display:block">First description</span></span><span style="display:block"><a href="https://example.invalid/items/beta">Beta</a><span style="display:block">Second description</span></span></span>',
    markdown:
      "[Alpha](https://example.invalid/items/alpha)\n\nFirst description\n\n[Beta](https://example.invalid/items/beta)\n\nSecond description",
    rendered:
      '<p><a href="https://example.invalid/items/alpha">Alpha</a></p>\n<p>First description</p>\n<p><a href="https://example.invalid/items/beta">Beta</a></p>\n<p>Second description</p>\n',
  },
  {
    name: "separates block span labels and block anchors",
    html: '<a href="https://example.invalid/items/alpha" style="display:block"><span style="display:block">Alpha</span><span style="display:block">First description</span></a><a href="https://example.invalid/items/beta" style="display:block">Beta</a>',
    markdown:
      "[Alpha First description](https://example.invalid/items/alpha)\n\n[Beta](https://example.invalid/items/beta)",
    rendered:
      '<p><a href="https://example.invalid/items/alpha">Alpha First description</a></p>\n<p><a href="https://example.invalid/items/beta">Beta</a></p>\n',
  },
  {
    name: "preserves punctuated labels, destinations, titles, and adjacent prose",
    html: '<p>Read <a href="https://example.invalid/a\\(b) c" title="A &quot;quoted&quot; \\ title">[Alpha] \\ (draft)!</a>, then <a href="https://example.invalid/next">Beta?</a>.</p>',
    markdown:
      'Read [\\[Alpha\\] \\\\ (draft)!](https://example.invalid/a\\\\\\(b\\)%20c "A \\"quoted\\" \\\\ title"), then [Beta?](https://example.invalid/next).',
    rendered:
      '<p>Read <a href="https://example.invalid/a%5C(b)%20c" title="A &quot;quoted&quot; \\ title">[Alpha] \\ (draft)!</a>, then <a href="https://example.invalid/next">Beta?</a>.</p>\n',
  },
  {
    name: "preserves heading, strong, unordered, and ordered semantics",
    html: "<h2>Section</h2><p><strong>Important</strong> detail.</p><ul><li>First</li><li>Second</li></ul><ol><li>Step one</li><li>Step two</li></ol>",
    markdown:
      "## Section\n\n**Important** detail.\n\n-   First\n-   Second\n\n1.  Step one\n2.  Step two",
    rendered:
      "<h2>Section</h2>\n<p><strong>Important</strong> detail.</p>\n<ul>\n<li>First</li>\n<li>Second</li>\n</ul>\n<ol>\n<li>Step one</li>\n<li>Step two</li>\n</ol>\n",
  },
  {
    name: "does not infer headings or strong markup from font styling",
    html: '<p style="font-size:32px">Large text</p><p style="font-weight:bold">Styled text</p>',
    markdown: "Large text\n\nStyled text",
    rendered: "<p>Large text</p>\n<p>Styled text</p>\n",
  },
  {
    name: "does not fabricate lists from literal prose prefixes",
    html: "<p>1. Literal numbered prose</p><p>• Literal bullet prose</p>",
    markdown: "1\\. Literal numbered prose\n\n• Literal bullet prose",
    rendered:
      "<p>1. Literal numbered prose</p>\n<p>• Literal bullet prose</p>\n",
  },
  {
    name: "does not fabricate a list from a prefix split across inline spans",
    html: "<p><span>1</span><span>. Literal numbered prose</span></p>",
    markdown: "1\\. Literal numbered prose",
    rendered: "<p>1. Literal numbered prose</p>\n",
  },
  {
    name: "preserves explicit prose line breaks",
    html: "<p>First<br>Second<br>Third</p>",
    markdown: "First  \nSecond  \nThird",
    rendered: "<p>First<br>Second<br>Third</p>\n",
  },
  {
    name: "preserves explicit line breaks within a link",
    html: '<a href="https://example.invalid/items/alpha">First<br>Second</a>',
    markdown: "[First<br>Second](https://example.invalid/items/alpha)",
    rendered:
      '<p><a href="https://example.invalid/items/alpha">First<br>Second</a></p>\n',
  },
  {
    name: "documents collapsed CSS pre-wrap whitespace as readable prose",
    html: '<p style="white-space:pre-wrap">First\nSecond  item</p>',
    markdown: "First Second item",
    rendered: "<p>First Second item</p>\n",
  },
  {
    name: "retains non-breaking spaces in prose",
    html: "<p>First&nbsp;Second&nbsp;&nbsp;Third</p>",
    markdown: "First Second  Third",
    rendered: "<p>First Second  Third</p>\n",
  },
  {
    name: "keeps prose collapse separate from fenced code whitespace",
    html: "<p>Prose\n  wraps here</p><p><code>inline  code</code></p><pre><code>first\n  second\n\nthird</code></pre>",
    markdown:
      "Prose wraps here\n\n`inline  code`\n\n```\nfirst\n  second\n\nthird\n```",
    rendered:
      "<p>Prose wraps here</p>\n<p><code>inline  code</code></p>\n<pre><code>first\n  second\n\nthird\n</code></pre>\n",
  },
  {
    name: "uses DOM order without inferring CSS order",
    html: '<span style="display:grid"><span style="display:block;order:2">First</span><span style="display:block;order:1">Second</span></span>',
    markdown: "First\n\nSecond",
    rendered: "<p>First</p>\n<p>Second</p>\n",
  },
  {
    name: "preserves repeated explicit breaks inside a valid link label",
    html: '<a href="https://example.invalid/items/alpha">First<br><br>Second</a>',
    markdown: "[First<br><br>Second](https://example.invalid/items/alpha)",
    rendered:
      '<p><a href="https://example.invalid/items/alpha">First<br><br>Second</a></p>\n',
  },
  {
    name: "preserves semantic ordered lists inside styled spans",
    html: '<span style="display:block"><ol><li>First</li><li>Second</li></ol></span>',
    markdown: "1.  First\n2.  Second",
    rendered: "<ol>\n<li>First</li>\n<li>Second</li>\n</ol>\n",
  },
  {
    name: "preserves fenced code inside styled spans",
    html: '<span style="display:block"><pre><code>1. raw\n  second</code></pre></span>',
    markdown: "```\n1. raw\n  second\n```",
    rendered: "<pre><code>1. raw\n  second\n</code></pre>\n",
  },
  {
    name: "preserves the boundary of an empty styled block",
    html: '<span>First</span><span style="display:block"></span><span>Second</span>',
    markdown: "First\n\nSecond",
    rendered: "<p>First</p>\n<p>Second</p>\n",
  },
  {
    name: "does not fabricate a list from a split prefix in a div",
    html: "<div><span>1</span><span>. Literal prose</span></div>",
    markdown: "1\\. Literal prose",
    rendered: "<p>1. Literal prose</p>\n",
  },
  {
    name: "respects an inline display override without inventing block boundaries",
    html: '<span style="display:block;display:inline">First</span> <span>Second</span>',
    markdown: "First Second",
    rendered: "<p>First Second</p>\n",
  },
  {
    name: "does not infer generated content from CSS",
    html: '<span style="content:attr(data-label)" data-label="Absent">Visible</span>',
    markdown: "Visible",
    rendered: "<p>Visible</p>\n",
  },
  {
    name: "preserves inline formatting inside nested linked headings",
    html: '<a href="https://example.invalid/items/alpha"><div><h3><strong>Alpha</strong> <em>draft</em></h3><p>Details</p></div></a>',
    markdown:
      "[**Alpha** _draft_ Details](https://example.invalid/items/alpha)",
    rendered:
      '<p><a href="https://example.invalid/items/alpha"><strong>Alpha</strong> <em>draft</em> Details</a></p>\n',
  },
  {
    name: "preserves non-breaking spaces inside a block-backed label",
    html: '<a href="https://example.invalid/items/alpha"><p>Alpha&nbsp;Beta</p><span>Details</span></a>',
    markdown: "[Alpha Beta Details](https://example.invalid/items/alpha)",
    rendered:
      '<p><a href="https://example.invalid/items/alpha">Alpha Beta Details</a></p>\n',
  },
  {
    name: "preserves paragraphs around a linked card",
    html: '<p>Before</p><a href="https://example.invalid/items/alpha"><p>Alpha</p><span>Details</span></a><p>After</p>',
    markdown:
      "Before\n\n[Alpha Details](https://example.invalid/items/alpha)\n\nAfter",
    rendered:
      '<p>Before</p>\n<p><a href="https://example.invalid/items/alpha">Alpha Details</a></p>\n<p>After</p>\n',
  },
  {
    name: "preserves readable title text while cleaning repeated title newlines",
    html: '<a href="https://example.invalid/items/alpha" title="First\n\nSecond">Alpha</a>',
    markdown: '[Alpha](https://example.invalid/items/alpha "First\nSecond")',
    rendered:
      '<p><a href="https://example.invalid/items/alpha" title="First\nSecond">Alpha</a></p>\n',
  },
  {
    name: "preserves escaped punctuation without a destination space",
    html: '<p>Read <a href="https://example.invalid/a\\(b)" title="A &quot;quoted&quot; \\ title">[Alpha] \\ (draft)!</a>, then <a href="https://example.invalid/next">Beta?</a>.</p>',
    markdown:
      'Read [\\[Alpha\\] \\\\ (draft)!](https://example.invalid/a\\\\\\(b\\) "A \\"quoted\\" \\\\ title"), then [Beta?](https://example.invalid/next).',
    rendered:
      '<p>Read <a href="https://example.invalid/a%5C(b)" title="A &quot;quoted&quot; \\ title">[Alpha] \\ (draft)!</a>, then <a href="https://example.invalid/next">Beta?</a>.</p>\n',
  },
];

describe.each([
  { name: "default", options: {}, renderer: {} },
  { name: "GFM disabled", options: { gfm: false }, renderer: { gfm: false } },
])("links and layout: $name", ({ options, renderer }) => {
  it.each(cases)("$name", ({ html, markdown, rendered }) => {
    const result = convertHtmlToMarkdown(html, options);
    expect(result).toBe(markdown);
    expect(marked.parse(result, renderer)).toBe(rendered);
  });
});
