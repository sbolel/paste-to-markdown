# List and table baseline evidence

> Historical evidence: this report retains pre-stack lane and combined-working-tree observations. Any test counts, pass statements or runtime details below apply to those recorded runs, not to an individual PR or cumulative stack prefix. Fresh results belong in [the stack delivery report](../formatting-delivery.md#combined-verification-and-delivery-results).


Baseline: `b142f18561163edd9f9ad9ed37aa0a02e115947a`. All HTML below is authored synthetic fixture content. Rendering uses the locked `marked` parser, with GFM matching the conversion option. This is core parser evidence; browser clipboard checks are separate.

## Findings and correction

| Issue | Baseline observation                                                                                                                                 | Correction or established behavior                                                                                                                                                                        | Structural regression evidence                                                                                                                                                                  |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #49   | Passed in both modes: ordered start 9 crossed into 10; a nested ordered list started at 3; all continuation blocks remained in the first outer item. | Retain Turndown's ordinary list replacement and indentation.                                                                                                                                              | Exact rendered HTML asserts the whole tree, with two outer items, two deeper levels, paragraph, quote, and fenced code.                                                                         |
| #50   | Only direct child inputs retained GFM state. LABEL/SPAN wrappers lost state. Every checkbox lost state with GFM disabled.                            | Decorate the existing list replacement, emit one primary state for the nearest owning LI, and preserve secondary checkbox states as readable text. GFM-disabled states use `(checked)` and `(unchecked)`. | Exact rendered HTML covers checked/unchecked direct, LABEL, and SPAN inputs, explicit label association, nested task ownership, and multiple checkboxes per item in both modes.                 |
| #51   | Headers and body cells became separate paragraphs; no table or cell associations survived.                                                           | Render rectangular tables with a real TH header row as GFM tables, escaping literal pipes after cell conversion.                                                                                          | Assert a single table parse token, three headers, three body cells, exact cell values, and exact rendered emphasis/code elements.                                                               |
| #52   | Row/column spans, block-cell ownership, and headerless row associations disappeared.                                                                 | Use coordinate-labelled Markdown when tables contain spans, block cells, irregular rows, no real header row, or GFM is disabled.                                                                          | Exact rendered HTML and parsed list ownership assert spanning headers, multiple paragraphs, nested lists, single block cells, headerless rows, blank cells, and row-group-scoped `rowspan="0"`. |

Coordinates describe the supplied fragment, starting at row 1 and column 1. The fallback labels TH cells as headers only when the source supplies TH elements; it never promotes a data row to a header or invents absent values. Positive row spans are limited to the supplied row-group extent for both labels and carried occupancy. A zero row span extends through its supplied row group. Cell content is converted through the same Turndown rules and indented beneath its own coordinate label. No source HTML, source attributes, or active elements are serialized by the fallback.

One parser limitation is handled explicitly: a code span containing a literal backslash immediately before a pipe also uses the coordinate fallback. GFM's table delimiter escaping and code-span backslash preservation cannot safely be combined in that case. Ordinary literal pipes in code, emphasis, and plain text retain three rendered GFM cells.

Historical lane validation: `pnpm test` passed all 69 core tests (35 new structural tests plus 34 existing tests). The core TypeScript build and targeted ESLint check passed. These are parser/core checks; the coordinating task owns actual browser clipboard selection and browser preview checks.

Changed implementation files: `packages/core/src/list-rules.ts`, `packages/core/src/table-rules.ts`, and the registrations in `packages/core/src/convert.ts`. Regression files: `packages/core/tests/list-structure.test.ts` and `packages/core/tests/tables.test.ts`.

## #49: ordered nesting and continuation blocks

Input HTML:

```html
<ol start="9">
  <li>
    <p>Outer first</p>
    <ul>
      <li>
        Child one
        <ol start="3">
          <li>Deep one</li>
          <li>Deep two</li>
        </ol>
      </li>
      <li>Child two</li>
    </ul>
    <p>First continuation</p>
    <blockquote><p>First quote</p></blockquote>
    <pre><code>alpha
beta
</code></pre>
  </li>
  <li>Outer second</li>
</ol>
```

### Default GFM

Raw Markdown (spaces retained):

````markdown
9.  Outer first
    - Child one 3. Deep one 4. Deep two
    - Child two

    First continuation

    > First quote

    ```
    alpha
    beta
    ```

10. Outer second
````

Rendered HTML:

```html
<ol start="9">
  <li>
    <p>Outer first</p>
    <ul>
      <li>
        Child one
        <ol start="3">
          <li>Deep one</li>
          <li>Deep two</li>
        </ol>
      </li>
      <li>Child two</li>
    </ul>
    <p>First continuation</p>
    <blockquote>
      <p>First quote</p>
    </blockquote>
    <pre><code>alpha
beta
</code></pre>
  </li>
  <li><p>Outer second</p></li>
</ol>
```

### GFM disabled

Raw Markdown (spaces retained):

````markdown
9.  Outer first
    - Child one 3. Deep one 4. Deep two
    - Child two

    First continuation

    > First quote

    ```
    alpha
    beta
    ```

10. Outer second
````

Rendered HTML:

```html
<ol start="9">
  <li>
    <p>Outer first</p>
    <ul>
      <li>
        Child one
        <ol start="3">
          <li>Deep one</li>
          <li>Deep two</li>
        </ol>
      </li>
      <li>Child two</li>
    </ul>
    <p>First continuation</p>
    <blockquote>
      <p>First quote</p>
    </blockquote>
    <pre><code>alpha
beta
</code></pre>
  </li>
  <li><p>Outer second</p></li>
</ol>
```

## #50: direct and wrapped tasks

Input HTML:

```html
<ul>
  <li><input type="checkbox" checked />Direct done</li>
  <li>
    <label><input type="checkbox" />Label next</label>
  </li>
  <li>
    <span><input type="checkbox" checked /><span>Span done</span></span>
    <ul>
      <li>
        <label><input type="checkbox" />Nested next</label>
      </li>
    </ul>
  </li>
</ul>
```

### Default GFM

Raw Markdown (spaces retained):

```markdown
- [x] Direct done
- Label next
- Span done
  - Nested next
```

Rendered HTML:

```html
<ul>
  <li><input checked="" disabled="" type="checkbox" /> Direct done</li>
  <li>Label next</li>
  <li>
    Span done
    <ul>
      <li>Nested next</li>
    </ul>
  </li>
</ul>
```

### GFM disabled

Raw Markdown (spaces retained):

```markdown
- Direct done
- Label next
- Span done
  - Nested next
```

Rendered HTML:

```html
<ul>
  <li>Direct done</li>
  <li>Label next</li>
  <li>
    Span done
    <ul>
      <li>Nested next</li>
    </ul>
  </li>
</ul>
```

## #51: three columns with literal pipes

Input HTML:

```html
<table>
  <thead>
    <tr>
      <th>Plain</th>
      <th>Emphasis</th>
      <th>Code</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>alpha | beta</td>
      <td><em>gamma | delta</em></td>
      <td><code>one | two</code></td>
    </tr>
  </tbody>
</table>
```

### Default GFM

Raw Markdown (spaces retained):

```markdown
Plain

Emphasis

Code

alpha | beta

_gamma | delta_

`one | two`
```

Rendered HTML:

```html
<p>Plain</p>
<p>Emphasis</p>
<p>Code</p>
<p>alpha | beta</p>
<p><em>gamma | delta</em></p>
<p><code>one | two</code></p>
```

### GFM disabled

Raw Markdown (spaces retained):

```markdown
Plain

Emphasis

Code

alpha | beta

_gamma | delta_

`one | two`
```

Rendered HTML:

```html
<p>Plain</p>
<p>Emphasis</p>
<p>Code</p>
<p>alpha | beta</p>
<p><em>gamma | delta</em></p>
<p><code>one | two</code></p>
```

## #52: spans and multiline blocks

Input HTML:

```html
<table>
  <tr>
    <th rowspan="2">Group</th>
    <th colspan="2">Details</th>
  </tr>
  <tr>
    <td>
      <p>First line</p>
      <p>Second line</p>
    </td>
    <td>
      <ul>
        <li>Choice one</li>
        <li>Choice two</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td>Final group</td>
    <td>Final detail</td>
    <td>Final note</td>
  </tr>
</table>
```

### Default GFM

Raw Markdown (spaces retained):

```markdown
Group

Details

First line

Second line

- Choice one
- Choice two

Final group

Final detail

Final note
```

Rendered HTML:

```html
<p>Group</p>
<p>Details</p>
<p>First line</p>
<p>Second line</p>
<ul>
  <li>Choice one</li>
  <li>Choice two</li>
</ul>
<p>Final group</p>
<p>Final detail</p>
<p>Final note</p>
```

### GFM disabled

Raw Markdown (spaces retained):

```markdown
Group

Details

First line

Second line

- Choice one
- Choice two

Final group

Final detail

Final note
```

Rendered HTML:

```html
<p>Group</p>
<p>Details</p>
<p>First line</p>
<p>Second line</p>
<ul>
  <li>Choice one</li>
  <li>Choice two</li>
</ul>
<p>Final group</p>
<p>Final detail</p>
<p>Final note</p>
```

## #52: headerless

Input HTML:

```html
<table>
  <tr>
    <td>Alpha</td>
    <td>One</td>
  </tr>
  <tr>
    <td>Beta</td>
    <td>Two</td>
  </tr>
</table>
```

### Default GFM

Raw Markdown (spaces retained):

```markdown
Alpha

One

Beta

Two
```

Rendered HTML:

```html
<p>Alpha</p>
<p>One</p>
<p>Beta</p>
<p>Two</p>
```

### GFM disabled

Raw Markdown (spaces retained):

```markdown
Alpha

One

Beta

Two
```

Rendered HTML:

```html
<p>Alpha</p>
<p>One</p>
<p>Beta</p>
<p>Two</p>
```

## Corrected representative output

The following output was collected after the fixes using the exact input fixtures above. The ordinary list output is unchanged. Both conversion modes use the same coordinate representation for the complex and headerless fixtures.

### #50: direct and wrapped tasks

#### Default GFM

Raw Markdown (spaces retained):

```markdown
- [x] Direct done
- [ ] Label next
- [x] Span done
  - [ ] Nested next
```

#### GFM disabled

Raw Markdown (spaces retained):

```markdown
- (checked) Direct done
- (unchecked) Label next
- (checked) Span done
  - (unchecked) Nested next
```

### #51: three columns with literal pipes

#### Default GFM

Raw Markdown (spaces retained):

```markdown
| Plain         | Emphasis         | Code         |
| ------------- | ---------------- | ------------ |
| alpha \| beta | _gamma \| delta_ | `one \| two` |
```

### #52: spans and multiline blocks

#### Default GFM

Raw Markdown (spaces retained):

```markdown
Table (cell coordinates refer to the supplied fragment):

- Row 1
  - Column 1 (header; rows 1-2)

    Group

  - Columns 2-3 (header)

    Details

- Row 2
  - Column 2

    First line

    Second line

  - Column 3
    - Choice one
    - Choice two

- Row 3
  - Column 1

    Final group

  - Column 2

    Final detail

  - Column 3

    Final note
```

### #52: headerless

#### Default GFM

Raw Markdown (spaces retained):

```markdown
Table (cell coordinates refer to the supplied fragment):

- Row 1
  - Column 1

    Alpha

  - Column 2

    One

- Row 2
  - Column 1

    Beta

  - Column 2

    Two
```
