# Code preservation baseline evidence

> Historical evidence: this report retains pre-stack lane and combined-working-tree observations. Any test counts, pass statements or runtime details below apply to those recorded runs, not to an individual PR or cumulative stack prefix. Fresh results belong in [the stack delivery report](../formatting-delivery.md#combined-verification-and-delivery-results).


Baseline: `b142f18561163edd9f9ad9ed37aa0a02e115947a`. Captured before implementation, using Turndown 7.2.2 and marked 18.0.11 in Node.js 24.20.0. Inputs below are newly authored generic HTML. No browser integration is claimed. JSON strings preserve exact spaces, newlines, and delimiters.

## fences

```````json
{
  "html": "<p>Before code.</p><pre><code class=\"language-md\">alpha\n```\nbeta\n`````\ngamma\n~~~\nomega</code></pre><p>After code.</p>"
}
{
  "options": {},
  "markdown": "Before code.\n\n``````md\nalpha\n```\nbeta\n`````\ngamma\n~~~\nomega\n``````\n\nAfter code.",
  "rendered": "<p>Before code.</p>\n<pre><code class=\"language-md\">alpha\n```\nbeta\n`````\ngamma\n~~~\nomega\n</code></pre>\n<p>After code.</p>\n"
}
{
  "options": {
    "gfm": false
  },
  "markdown": "Before code.\n\n``````md\nalpha\n```\nbeta\n`````\ngamma\n~~~\nomega\n``````\n\nAfter code.",
  "rendered": "<p>Before code.</p>\n<pre><code class=\"language-md\">alpha\n```\nbeta\n`````\ngamma\n~~~\nomega\n</code></pre>\n<p>After code.</p>\n"
}
```````

## highlighted text

````json
{
  "html": "<pre><code class=\"language-js\"><span class=\"keyword\">const</span> total = <span class=\"number\">12</span>;\n  total += 1;\n</code></pre><p>After.</p>"
}
{
  "options": {},
  "markdown": "```js\nconst total = 12;\n  total += 1;\n```\n\nAfter.",
  "rendered": "<pre><code class=\"language-js\">const total = 12;\n  total += 1;\n</code></pre>\n<p>After.</p>\n"
}
{
  "options": {
    "gfm": false
  },
  "markdown": "```js\nconst total = 12;\n  total += 1;\n```\n\nAfter.",
  "rendered": "<pre><code class=\"language-js\">const total = 12;\n  total += 1;\n</code></pre>\n<p>After.</p>\n"
}
````

## breaks

````json
{
  "html": "<pre><code class=\"language-js\"><span>const total = 12;</span><br><span>  return total;</span></code></pre><p>After.</p>"
}
{
  "options": {},
  "markdown": "```js\nconst total = 12;  return total;\n```\n\nAfter.",
  "rendered": "<pre><code class=\"language-js\">const total = 12;  return total;\n</code></pre>\n<p>After.</p>\n"
}
{
  "options": {
    "gfm": false
  },
  "markdown": "```js\nconst total = 12;  return total;\n```\n\nAfter.",
  "rendered": "<pre><code class=\"language-js\">const total = 12;  return total;\n</code></pre>\n<p>After.</p>\n"
}
````

## line wrappers

````json
{
  "html": "<pre><code class=\"language-js\"><span class=\"line\">const total = 12;</span><span class=\"line\">  return total;</span></code></pre><p>After.</p>"
}
{
  "options": {},
  "markdown": "```js\nconst total = 12;  return total;\n```\n\nAfter.",
  "rendered": "<pre><code class=\"language-js\">const total = 12;  return total;\n</code></pre>\n<p>After.</p>\n"
}
{
  "options": {
    "gfm": false
  },
  "markdown": "```js\nconst total = 12;  return total;\n```\n\nAfter.",
  "rendered": "<pre><code class=\"language-js\">const total = 12;  return total;\n</code></pre>\n<p>After.</p>\n"
}
````

## block wrappers

````json
{
  "html": "<pre><code class=\"language-js\"><div>const total = 12;</div><div>  return total;</div></code></pre><p>After.</p>"
}
{
  "options": {},
  "markdown": "```js\nconst total = 12;  return total;\n```\n\nAfter.",
  "rendered": "<pre><code class=\"language-js\">const total = 12;  return total;\n</code></pre>\n<p>After.</p>\n"
}
{
  "options": {
    "gfm": false
  },
  "markdown": "```js\nconst total = 12;  return total;\n```\n\nAfter.",
  "rendered": "<pre><code class=\"language-js\">const total = 12;  return total;\n</code></pre>\n<p>After.</p>\n"
}
````

## adjacent decorative gutter

````json
{
  "html": "<div class=\"highlight\"><div class=\"gutter\" aria-hidden=\"true\">1<br>2</div><pre><code class=\"language-js\"><span class=\"line\">const total = <span class=\"number\">12</span>;</span><span class=\"line\">  return total;</span></code></pre></div><p>After.</p>"
}
{
  "options": {},
  "markdown": "1  \n2\n\n```js\nconst total = 12;  return total;\n```\n\nAfter.",
  "rendered": "<p>1<br>2</p>\n<pre><code class=\"language-js\">const total = 12;  return total;\n</code></pre>\n<p>After.</p>\n"
}
{
  "options": {
    "gfm": false
  },
  "markdown": "1  \n2\n\n```js\nconst total = 12;  return total;\n```\n\nAfter.",
  "rendered": "<p>1<br>2</p>\n<pre><code class=\"language-js\">const total = 12;  return total;\n</code></pre>\n<p>After.</p>\n"
}
````

## inline embedded ticks

````json
{
  "html": "<p>Use <code>a`b``c</code> now.</p>"
}
{
  "options": {},
  "markdown": "Use ```a`b``c``` now.",
  "rendered": "<p>Use <code>a`b``c</code> now.</p>\n"
}
{
  "options": {
    "gfm": false
  },
  "markdown": "Use ```a`b``c``` now.",
  "rendered": "<p>Use <code>a`b``c</code> now.</p>\n"
}
````

## inline edge ticks

```json
{
  "html": "<p>Use <code>`literal`</code> now.</p>"
}
{
  "options": {},
  "markdown": "Use `` `literal` `` now.",
  "rendered": "<p>Use <code>`literal`</code> now.</p>\n"
}
{
  "options": {
    "gfm": false
  },
  "markdown": "Use `` `literal` `` now.",
  "rendered": "<p>Use <code>`literal`</code> now.</p>\n"
}
```

## inline edge spaces

```json
{
  "html": "<p>Use <code>  value  </code> now.</p>"
}
{
  "options": {},
  "markdown": "Use `value` now.",
  "rendered": "<p>Use <code>value</code> now.</p>\n"
}
{
  "options": {
    "gfm": false
  },
  "markdown": "Use `value` now.",
  "rendered": "<p>Use <code>value</code> now.</p>\n"
}
```

## inline all spaces

```json
{
  "html": "<p>Use <code>   </code> now.</p>"
}
{
  "options": {},
  "markdown": "Use now.",
  "rendered": "<p>Use now.</p>\n"
}
{
  "options": {
    "gfm": false
  },
  "markdown": "Use now.",
  "rendered": "<p>Use now.</p>\n"
}
```

## inline repeated spaces

```json
{
  "html": "<p>Use <code>a  b</code> now.</p>"
}
{
  "options": {},
  "markdown": "Use `a b` now.",
  "rendered": "<p>Use <code>a b</code> now.</p>\n"
}
{
  "options": {
    "gfm": false
  },
  "markdown": "Use `a b` now.",
  "rendered": "<p>Use <code>a b</code> now.</p>\n"
}
```

## inline line endings

```json
{
  "html": "<p>Use <code>a\nb\r\nc\rd</code> now.</p>"
}
{
  "options": {},
  "markdown": "Use `a b c d` now.",
  "rendered": "<p>Use <code>a b c d</code> now.</p>\n"
}
{
  "options": {
    "gfm": false
  },
  "markdown": "Use `a b c d` now.",
  "rendered": "<p>Use <code>a b c d</code> now.</p>\n"
}
```

# Verified result

The initial historical run of 44 structural regressions produced 26 failures and 18 passes on the baseline. The subsequent lane run recorded 86 passing core tests, including 52 code-preservation checks in both default GFM and `gfm: false`, with focused ESLint and core TypeScript checks. The dependency install used `pnpm install --frozen-lockfile` with network access for pnpm version verification; local checks ran the installed Node.js binary directly because the mise shim stalled inside the sandbox.

| Issue | Baseline finding                                                                                                              | Result                                                                                                                                                                     |
| ----- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #53   | Standalone backtick and tilde fence lines already stay inside one block; following prose stays separate.                      | Regression coverage; ordinary fenced blocks continue to use Turndown. The structured-highlight path also has a fence collision test.                                       |
| #54   | Highlighted spans with literal newlines already pass. BR and line wrappers flatten; decorative adjacent gutters leak numbers. | Reconstruct explicit line boundaries, retain authored text/indentation, preserve language classes, and omit only a gutter marked aria-hidden=true in or adjacent to a PRE. |
| #55   | Embedded and edge backticks already pass. Leading/trailing/repeated spaces collapse; all-space inline code disappears.        | Preserve inline code before whitespace collapse; derive delimiters from its text and add CommonMark padding; retain all-space values even inside otherwise blank wrappers. |

## Format boundaries

- The public converter exposes only `gfm`; there is no indented-code mode or UI mode to validate.
- Inline code line endings become spaces under CommonMark. HTML parsing also normalizes CR/CRLF before conversion. Empty inline code has no nonempty code-span representation; these fixtures cover nonempty values, including all-space values.
- Fenced Markdown supplies a final line break even when the HTML code text has none. The structured extractor retains empty wrapper lines. marked 18.0.11 lexes Markdown "`\na\n\n`" as a code token whose text is "a\n", but its default HTML renderer normalizes that final LF. The final-empty-line regression checks exact code and following-paragraph tokens so this renderer behavior cannot hide a conversion loss.
- Line reconstruction recognizes BR, DIV/P wrappers, and explicit line/code-line class tokens inside PRE. It does not infer visual lines from external CSS or recover text absent from HTML. General numeric text, hidden code text, and unrelated gutter-like content are retained.
- This evidence exercises Turndown's Node parser and a Markdown parser. Real-browser clipboard integration is a separate parent-task check.

## Post-fix raw Markdown and rendered output

For each authored baseline input above, both GFM settings produced the same result below. JSON preserves exact whitespace.

```````json
{
  "html": "<p>Before code.</p><pre><code class=\"language-md\">alpha\n```\nbeta\n`````\ngamma\n~~~\nomega</code></pre><p>After code.</p>",
  "markdown": "Before code.\n\n``````md\nalpha\n```\nbeta\n`````\ngamma\n~~~\nomega\n``````\n\nAfter code.",
  "rendered": "<p>Before code.</p>\n<pre><code class=\"language-md\">alpha\n```\nbeta\n`````\ngamma\n~~~\nomega\n</code></pre>\n<p>After code.</p>\n"
}
```````

````json
{
  "html": "<pre><code class=\"language-js\"><span class=\"keyword\">const</span> total = <span class=\"number\">12</span>;\n  total += 1;\n</code></pre><p>After.</p>",
  "markdown": "```js\nconst total = 12;\n  total += 1;\n```\n\nAfter.",
  "rendered": "<pre><code class=\"language-js\">const total = 12;\n  total += 1;\n</code></pre>\n<p>After.</p>\n"
}
````

````json
{
  "html": "<pre><code class=\"language-js\"><span>const total = 12;</span><br><span>  return total;</span></code></pre><p>After.</p>",
  "markdown": "```js\nconst total = 12;\n  return total;\n```\n\nAfter.",
  "rendered": "<pre><code class=\"language-js\">const total = 12;\n  return total;\n</code></pre>\n<p>After.</p>\n"
}
````

````json
{
  "html": "<pre><code class=\"language-js\"><span class=\"line\">const total = 12;</span><span class=\"line\">  return total;</span></code></pre><p>After.</p>",
  "markdown": "```js\nconst total = 12;\n  return total;\n```\n\nAfter.",
  "rendered": "<pre><code class=\"language-js\">const total = 12;\n  return total;\n</code></pre>\n<p>After.</p>\n"
}
````

````json
{
  "html": "<pre><code class=\"language-js\"><div>const total = 12;</div><div>  return total;</div></code></pre><p>After.</p>",
  "markdown": "```js\nconst total = 12;\n  return total;\n```\n\nAfter.",
  "rendered": "<pre><code class=\"language-js\">const total = 12;\n  return total;\n</code></pre>\n<p>After.</p>\n"
}
````

````json
{
  "html": "<div class=\"highlight\"><div class=\"gutter\" aria-hidden=\"true\">1<br>2</div><pre><code class=\"language-js\"><span class=\"line\">const total = <span class=\"number\">12</span>;</span><span class=\"line\">  return total;</span></code></pre></div><p>After.</p>",
  "markdown": "```js\nconst total = 12;\n  return total;\n```\n\nAfter.",
  "rendered": "<pre><code class=\"language-js\">const total = 12;\n  return total;\n</code></pre>\n<p>After.</p>\n"
}
````

````json
{
  "html": "<p>Use <code>a`b``c</code> now.</p>",
  "markdown": "Use ```a`b``c``` now.",
  "rendered": "<p>Use <code>a`b``c</code> now.</p>\n"
}
````

```json
{
  "html": "<p>Use <code>`literal`</code> now.</p>",
  "markdown": "Use `` `literal` `` now.",
  "rendered": "<p>Use <code>`literal`</code> now.</p>\n"
}
```

```json
{
  "html": "<p>Use <code>  value  </code> now.</p>",
  "markdown": "Use `   value   ` now.",
  "rendered": "<p>Use <code>  value  </code> now.</p>\n"
}
```

```json
{
  "html": "<p>Use <code>   </code> now.</p>",
  "markdown": "Use `   ` now.",
  "rendered": "<p>Use <code>   </code> now.</p>\n"
}
```

```json
{
  "html": "<p>Use <code>a  b</code> now.</p>",
  "markdown": "Use `a  b` now.",
  "rendered": "<p>Use <code>a  b</code> now.</p>\n"
}
```

```json
{
  "html": "<p>Use <code>a\nb\r\nc\rd</code> now.</p>",
  "markdown": "Use `a b c d` now.",
  "rendered": "<p>Use <code>a b c d</code> now.</p>\n"
}
```
