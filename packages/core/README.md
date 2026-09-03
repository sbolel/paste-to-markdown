# `@paste-to-markdown/core`

Shared HTML-to-Markdown conversion logic used by the web app.

## Conversion behavior

`convertHtmlToMarkdown(html, options?)` converts semantic HTML in DOM order.
`convertClipboardData(data, options?)` prefers nonblank `text/html`, then returns
`text/plain` unchanged, including Markdown-looking characters. The browser app
uses the default options through native paste; it has no mode selector or
clipboard-read button.

Default GFM output supports strikethrough, task checkboxes, and simple rectangular
tables with a genuine header row. `{ gfm: false }` retains checkbox states as
readable `(checked)` / `(unchecked)` text and uses the table fallback below.

- Linked cards retain readable labels, inline emphasis/images, and separate block
  boundaries. Explicit line breaks within links use `<br>`.
- Nested lists retain source starting numbers and continuation-block ownership.
  Label/span wrappers do not change which list item owns a checkbox. A checkbox
  followed only by nested blocks uses readable state instead of inventing a GFM
  task label; table-cell checkboxes stay with their cell.
- Table cells containing literal pipes retain their values. Complex spans,
  headerless tables, block-containing cells and representations that cannot be
  safely expressed as GFM pipe tables use nested Markdown lists of row/column
  coordinates. Coordinates refer only to the supplied fragment; no missing
  values or headers are invented. Spans and cell-owned blocks remain explicit.
- Fenced and highlighted code retain source characters, indentation, authored
  line boundaries, and safe delimiters. Inline-code boundary/all-space content
  is preserved; CommonMark normalizes inline newlines to spaces. Only explicitly
  hidden `gutter` elements adjacent to or inside code are treated as decorative.
- Absolute HTTP(S) links/images are retained; links also support `mailto:` and
  `tel:`. Relative, protocol-relative, data, file and other unsupported references
  become useful label/alt text plus an unresolved marker. Blob references receive
  a temporary marker. A linked image's usable link survives independently.
  There is no base-URL option: callers with a trusted source base must resolve
  relative references before conversion. The converter never guesses the source
  from its own location or an embedded `<base>` tag.
- Explicit `<br>` and semantic `<pre>` preserve authored breaks. Nonbreaking
  spaces remain nonbreaking. Inline CSS `display:block`-like spans retain block
  boundaries, but computed styles, CSS ordering, generated content and visual
  heading/list inference are unsupported. CSS `white-space:pre-wrap` alone uses
  ordinary prose whitespace normalization; use `<br>`/`<pre>` for portable breaks.
  Container width does not define hard breaks.

Browser selection fragments containing orphan cells or rows receive only the
table ancestors needed for parsing. Native platform clipboard headers and RTF are
outside the `text/html` contract. Image-only paste is unsupported and leaves
existing work intact with explanatory feedback.

The acceptance matrix and exact synthetic reproduction evidence are in
[`docs/formatting-delivery.md`](../../docs/formatting-delivery.md).

## Runtime compatibility

The package exposes ESM JavaScript and TypeScript declarations. Its TypeScript
build targets ES2020; that compiler target alone does not establish runtime
compatibility for the package and its Turndown dependency.

Standalone Node.js consumer compatibility has no verified version matrix. The
package therefore omits `engines.node`, leaving consumer compatibility unspecified.
This omission does not promise support for every Node.js version, and older Node
releases have not been validated by the workspace's Node 24 CI. Validate the built
package and its dependencies in the intended consumer runtime before relying on it.

## Workspace development

Building, testing, and maintaining this package in the repository uses the root
workspace toolchain: Node.js `>=24.15.0`, with Node 24 selected by `.nvmrc` and CI.
That tooling requirement does not define a minimum Node.js version for consumers
of the built library.
