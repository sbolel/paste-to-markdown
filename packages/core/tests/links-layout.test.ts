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
    name: "preserves inline formatting inside nested linked headings",
    html: '<a href="https://example.invalid/items/alpha"><div><h3><strong>Alpha</strong> <em>draft</em></h3><p>Details</p></div></a>',
    markdown:
      "[**Alpha** _draft_ Details](https://example.invalid/items/alpha)",
    rendered:
      '<p><a href="https://example.invalid/items/alpha"><strong>Alpha</strong> <em>draft</em> Details</a></p>\n',
  },
  {
    name: "preserves paragraphs around a linked card",
    html: '<p>Before</p><a href="https://example.invalid/items/alpha"><p>Alpha</p><span>Details</span></a><p>After</p>',
    markdown:
      "Before\n\n[Alpha Details](https://example.invalid/items/alpha)\n\nAfter",
    rendered:
      '<p>Before</p>\n<p><a href="https://example.invalid/items/alpha">Alpha Details</a></p>\n<p>After</p>\n',
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
