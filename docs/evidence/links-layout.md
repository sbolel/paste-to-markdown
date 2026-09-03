# Link and layout conversion evidence

> Historical evidence: this report retains pre-stack lane and combined-working-tree observations. Any test counts, pass statements or runtime details below apply to those recorded runs, not to an individual PR or cumulative stack prefix. Fresh results belong in [the stack delivery report](../formatting-delivery.md#combined-verification-and-delivery-results).


Baseline: `b142f18561163edd9f9ad9ed37aa0a02e115947a`. This evidence covers children #47, #48, #56, #57, and #58 using authored synthetic HTML only. Runtime: Node 24.20.0, Turndown 7.2.2, Marked 18.0.11, Vitest 4.1.2. Dependencies installed with `pnpm install --frozen-lockfile`.

The final 32 scenarios were replayed against the exact baseline converter: **26 failed and 38 passed** (each scenario runs with default options and `{ gfm: false }`). The historical lane run recorded **98 passing core tests**, including all 64 new assertions of exact Markdown and exact `marked.parse` output, with focused ESLint and core TypeScript checks.

## Findings and scope

- #47: Paragraph, image, and empty-block labels already worked. Heading syntax leaked into labels; adjacent linked cards with block descendants lacked separation. Headings inside anchors now keep their inline content and existing strong/emphasis markup. The surrounding linked card receives a block boundary.
- #48: Semantic grid markup already retained card associations. Explicit inline `display:block` spans concatenated titles and descriptions. Only explicit block display values on spans and anchors supply additional boundaries; DOM order is retained. Computed CSS, width, reordering, and generated content are not inferred.
- #56: Escaped brackets, backslashes, parentheses, and quoted titles already worked when the destination contained no space. A destination space truncated the rendered anchor and leaked destination/title text into prose. Whitespace and Markdown delimiter hazards in destinations are percent-encoded before existing backslash/parenthesis escaping.
- #57: Semantic headings, strong text, and lists already worked; font styling alone remains plain text. A literal numbered prefix split across spans bypassed Turndown's per-text-node escaping and fabricated an ordered list. Prose paragraph/div/block-span rules escape the composed marker; list/pre descendants are protected so real lists and code retain their syntax.
- #58: Explicit prose `br`, non-breaking spaces, and fenced pre/code whitespace already worked. Link label normalization discarded explicit breaks; a scoped `<br>` output now retains even repeated breaks without creating a blank line inside Markdown link syntax.

## Deliberate fallbacks and remaining checks

CSS `white-space:pre-wrap` newlines and repeated ASCII spaces can collapse before Turndown rules see them. The fallback retains readable text in source order. Exact CSS-preserved spacing requires semantic `pre/code` or serialized `br`; no HTML tokenizer, browser layout engine, or width-derived line breaks were added. Non-breaking spaces remain U+00A0, not ordinary spaces. The baseline collapses repeated spaces in inline code; fenced `pre/code` keeps internal spaces and newlines. The companion #55 code change intentionally preserves those inline-code spaces: its integrated expectation for `keeps prose collapse separate from fenced code whitespace` is `inline  code` (two spaces), superseding this subtask's baseline-equal one-space control. Markdown cannot preserve heading levels inside a link label, exact grid geometry, or empty-block height.

This file records direct converter and renderer execution. Browser native-copy/clipboard MIME checks remain pending in this subtask and are performed separately by the coordinator. No native-copy result is claimed here.

## Reproduced failures and corrected output

Strings below are JSON-escaped so spaces, backslashes, and line breaks are explicit. The recorded default and GFM-disabled rendered output is identical for these fixtures. The `test` value names its regression in `packages/core/tests/links-layout.test.ts`.

### #47: heading

```json
{
  "test": "keeps linked heading content without leaking heading markers",
  "html": "<a href=\"https://example.invalid/items/alpha\"><h2>Item Alpha</h2><p>A <strong>bold</strong> description</p></a>",
  "baselineMarkdown": "[## Item Alpha A **bold** description](https://example.invalid/items/alpha)",
  "baselineRendered": "<p><a href=\"https://example.invalid/items/alpha\">## Item Alpha A <strong>bold</strong> description</a></p>\n",
  "correctedMarkdown": "[Item Alpha A **bold** description](https://example.invalid/items/alpha)",
  "correctedRendered": "<p><a href=\"https://example.invalid/items/alpha\">Item Alpha A <strong>bold</strong> description</a></p>\n"
}
```

### #47: heading-literal

```json
{
  "test": "preserves a literal hash inside a linked heading",
  "html": "<a href=\"https://example.invalid/items/alpha\"><h2># Item Alpha</h2><p>A <em>short</em> description</p></a>",
  "baselineMarkdown": "[## \\# Item Alpha A _short_ description](https://example.invalid/items/alpha)",
  "baselineRendered": "<p><a href=\"https://example.invalid/items/alpha\">## # Item Alpha A <em>short</em> description</a></p>\n",
  "correctedMarkdown": "[\\# Item Alpha A _short_ description](https://example.invalid/items/alpha)",
  "correctedRendered": "<p><a href=\"https://example.invalid/items/alpha\"># Item Alpha A <em>short</em> description</a></p>\n"
}
```

### #47: adjacent-cards

```json
{
  "test": "separates adjacent block-backed linked cards",
  "html": "<a href=\"https://example.invalid/items/alpha\"><p>Alpha</p><span>First description</span></a><a href=\"https://example.invalid/items/beta\"><p>Beta</p><span>Second description</span></a>",
  "baselineMarkdown": "[Alpha First description](https://example.invalid/items/alpha)[Beta Second description](https://example.invalid/items/beta)",
  "baselineRendered": "<p><a href=\"https://example.invalid/items/alpha\">Alpha First description</a><a href=\"https://example.invalid/items/beta\">Beta Second description</a></p>\n",
  "correctedMarkdown": "[Alpha First description](https://example.invalid/items/alpha)\n\n[Beta Second description](https://example.invalid/items/beta)",
  "correctedRendered": "<p><a href=\"https://example.invalid/items/alpha\">Alpha First description</a></p>\n<p><a href=\"https://example.invalid/items/beta\">Beta Second description</a></p>\n"
}
```

### #48: styled-grid

```json
{
  "test": "separates explicit block spans in grid cards",
  "html": "<span style=\"display:grid\"><span style=\"display:block\"><a href=\"https://example.invalid/items/alpha\">Alpha</a><span style=\"display:block\">First description</span></span><span style=\"display:block\"><a href=\"https://example.invalid/items/beta\">Beta</a><span style=\"display:block\">Second description</span></span></span>",
  "baselineMarkdown": "[Alpha](https://example.invalid/items/alpha)First description[Beta](https://example.invalid/items/beta)Second description",
  "baselineRendered": "<p><a href=\"https://example.invalid/items/alpha\">Alpha</a>First description<a href=\"https://example.invalid/items/beta\">Beta</a>Second description</p>\n",
  "correctedMarkdown": "[Alpha](https://example.invalid/items/alpha)\n\nFirst description\n\n[Beta](https://example.invalid/items/beta)\n\nSecond description",
  "correctedRendered": "<p><a href=\"https://example.invalid/items/alpha\">Alpha</a></p>\n<p>First description</p>\n<p><a href=\"https://example.invalid/items/beta\">Beta</a></p>\n<p>Second description</p>\n"
}
```

### #48: styled-link

```json
{
  "test": "separates block span labels and block anchors",
  "html": "<a href=\"https://example.invalid/items/alpha\" style=\"display:block\"><span style=\"display:block\">Alpha</span><span style=\"display:block\">First description</span></a><a href=\"https://example.invalid/items/beta\" style=\"display:block\">Beta</a>",
  "baselineMarkdown": "[AlphaFirst description](https://example.invalid/items/alpha)[Beta](https://example.invalid/items/beta)",
  "baselineRendered": "<p><a href=\"https://example.invalid/items/alpha\">AlphaFirst description</a><a href=\"https://example.invalid/items/beta\">Beta</a></p>\n",
  "correctedMarkdown": "[Alpha First description](https://example.invalid/items/alpha)\n\n[Beta](https://example.invalid/items/beta)",
  "correctedRendered": "<p><a href=\"https://example.invalid/items/alpha\">Alpha First description</a></p>\n<p><a href=\"https://example.invalid/items/beta\">Beta</a></p>\n"
}
```

### #56: punctuation

```json
{
  "test": "preserves punctuated labels, destinations, titles, and adjacent prose",
  "html": "<p>Read <a href=\"https://example.invalid/a\\(b) c\" title=\"A &quot;quoted&quot; \\ title\">[Alpha] \\ (draft)!</a>, then <a href=\"https://example.invalid/next\">Beta?</a>.</p>",
  "baselineMarkdown": "Read [\\[Alpha\\] \\\\ (draft)!](https://example.invalid/a\\\\\\(b\\) c \"A \\\"quoted\\\" \\\\ title\"), then [Beta?](https://example.invalid/next).",
  "baselineRendered": "<p>Read <a href=\"https://example.invalid/a%5C(b%5C\">[Alpha] \\ (draft)!</a> c &quot;A &quot;quoted&quot; \\ title&quot;), then <a href=\"https://example.invalid/next\">Beta?</a>.</p>\n",
  "correctedMarkdown": "Read [\\[Alpha\\] \\\\ (draft)!](https://example.invalid/a\\\\\\(b\\)%20c \"A \\\"quoted\\\" \\\\ title\"), then [Beta?](https://example.invalid/next).",
  "correctedRendered": "<p>Read <a href=\"https://example.invalid/a%5C(b)%20c\" title=\"A &quot;quoted&quot; \\ title\">[Alpha] \\ (draft)!</a>, then <a href=\"https://example.invalid/next\">Beta?</a>.</p>\n"
}
```

### #57: split-prefix

```json
{
  "test": "does not fabricate a list from a prefix split across inline spans",
  "html": "<p><span>1</span><span>. Literal numbered prose</span></p>",
  "baselineMarkdown": "1. Literal numbered prose",
  "baselineRendered": "<ol>\n<li>Literal numbered prose</li>\n</ol>\n",
  "correctedMarkdown": "1\\. Literal numbered prose",
  "correctedRendered": "<p>1. Literal numbered prose</p>\n"
}
```

### #58: link-br

```json
{
  "test": "preserves explicit line breaks within a link",
  "html": "<a href=\"https://example.invalid/items/alpha\">First<br>Second</a>",
  "baselineMarkdown": "[First Second](https://example.invalid/items/alpha)",
  "baselineRendered": "<p><a href=\"https://example.invalid/items/alpha\">First Second</a></p>\n",
  "correctedMarkdown": "[First<br>Second](https://example.invalid/items/alpha)",
  "correctedRendered": "<p><a href=\"https://example.invalid/items/alpha\">First<br>Second</a></p>\n"
}
```

### #48: css-order

```json
{
  "test": "uses DOM order without inferring CSS order",
  "html": "<span style=\"display:grid\"><span style=\"display:block;order:2\">First</span><span style=\"display:block;order:1\">Second</span></span>",
  "baselineMarkdown": "FirstSecond",
  "baselineRendered": "<p>FirstSecond</p>\n",
  "correctedMarkdown": "First\n\nSecond",
  "correctedRendered": "<p>First</p>\n<p>Second</p>\n"
}
```

### #58: repeated-link-br

```json
{
  "test": "preserves repeated explicit breaks inside a valid link label",
  "html": "<a href=\"https://example.invalid/items/alpha\">First<br><br>Second</a>",
  "baselineMarkdown": "[First  Second](https://example.invalid/items/alpha)",
  "baselineRendered": "<p><a href=\"https://example.invalid/items/alpha\">First  Second</a></p>\n",
  "correctedMarkdown": "[First<br><br>Second](https://example.invalid/items/alpha)",
  "correctedRendered": "<p><a href=\"https://example.invalid/items/alpha\">First<br><br>Second</a></p>\n"
}
```

### #48: empty-styled-block

```json
{
  "test": "preserves the boundary of an empty styled block",
  "html": "<span>First</span><span style=\"display:block\"></span><span>Second</span>",
  "baselineMarkdown": "FirstSecond",
  "baselineRendered": "<p>FirstSecond</p>\n",
  "correctedMarkdown": "First\n\nSecond",
  "correctedRendered": "<p>First</p>\n<p>Second</p>\n"
}
```

### #57: div-split-prefix

```json
{
  "test": "does not fabricate a list from a split prefix in a div",
  "html": "<div><span>1</span><span>. Literal prose</span></div>",
  "baselineMarkdown": "1. Literal prose",
  "baselineRendered": "<ol>\n<li>Literal prose</li>\n</ol>\n",
  "correctedMarkdown": "1\\. Literal prose",
  "correctedRendered": "<p>1. Literal prose</p>\n"
}
```

### #47: nested-heading

```json
{
  "test": "preserves inline formatting inside nested linked headings",
  "html": "<a href=\"https://example.invalid/items/alpha\"><div><h3><strong>Alpha</strong> <em>draft</em></h3><p>Details</p></div></a>",
  "baselineMarkdown": "[### **Alpha** _draft_ Details](https://example.invalid/items/alpha)",
  "baselineRendered": "<p><a href=\"https://example.invalid/items/alpha\">### <strong>Alpha</strong> <em>draft</em> Details</a></p>\n",
  "correctedMarkdown": "[**Alpha** _draft_ Details](https://example.invalid/items/alpha)",
  "correctedRendered": "<p><a href=\"https://example.invalid/items/alpha\"><strong>Alpha</strong> <em>draft</em> Details</a></p>\n"
}
```

## Already-passing controls and documented fallbacks

The named tests contain exact synthetic HTML, baseline-equal raw output, and renderer assertions in both modes.

| Scenario                | Regression test                                                        | Status                             |
| ----------------------- | ---------------------------------------------------------------------- | ---------------------------------- |
| paragraph               | preserves paragraph-backed label and target                            | Already passing                    |
| image                   | preserves a linked image and accompanying label                        | Already passing                    |
| empty-block             | ignores empty block content while separating label words               | Already passing                    |
| semantic-grid           | preserves semantic grid card associations in DOM order                 | Already passing                    |
| semantic-text           | preserves heading, strong, unordered, and ordered semantics            | Already passing                    |
| font-size               | does not infer headings or strong markup from font styling             | Deliberate semantic-only fallback  |
| literal-prefix          | does not fabricate lists from literal prose prefixes                   | Already passing                    |
| br                      | preserves explicit prose line breaks                                   | Already passing                    |
| prewrap                 | documents collapsed CSS pre-wrap whitespace as readable prose          | Documented CSS whitespace fallback |
| nbsp                    | retains non-breaking spaces in prose                                   | Already passing                    |
| prose-code              | keeps prose collapse separate from fenced code whitespace              | Already passing                    |
| styled-lists            | preserves semantic ordered lists inside styled spans                   | Already passing                    |
| styled-code             | preserves fenced code inside styled spans                              | Already passing                    |
| display-override        | respects an inline display override without inventing block boundaries | Already passing                    |
| generated-content       | does not infer generated content from CSS                              | Already passing                    |
| link-nbsp               | preserves non-breaking spaces inside a block-backed label              | Already passing                    |
| prose-around-block-link | preserves paragraphs around a linked card                              | Already passing                    |
| title-blank-line        | preserves readable title text while cleaning repeated title newlines   | Already passing                    |
| destination-control     | preserves escaped punctuation without a destination space              | Already passing                    |

## Verification commands

```sh
rtk proxy pnpm install --frozen-lockfile
rtk proxy pnpm --filter @paste-to-markdown/core test
rtk proxy pnpm --filter @paste-to-markdown/core typecheck
rtk proxy pnpm exec eslint packages/core/src/convert.ts packages/core/src/inline-layout.ts packages/core/tests/links-layout.test.ts
```

The installed Node executable directly invoked the same local Vitest, TypeScript, and ESLint entrypoints during verification because the sandboxed mise shim attempted writes to its global cache. This did not require dependency or lockfile changes.
