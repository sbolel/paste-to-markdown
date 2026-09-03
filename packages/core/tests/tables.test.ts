import { marked, type Tokens } from "marked";
import { describe, expect, it } from "vitest";
import { convertHtmlToMarkdown } from "../src/index.js";

const pipeTable =
  "<table><thead><tr><th>Plain</th><th>Emphasis</th><th>Code</th></tr></thead><tbody><tr><td>alpha | beta</td><td><em>gamma | delta</em></td><td><code>one | two</code></td></tr></tbody></table>";
const complexTable =
  '<table><tr><th rowspan="2">Group</th><th colspan="2">Details</th></tr><tr><td><p>First line</p><p>Second line</p></td><td><ul><li>Choice one</li><li>Choice two</li></ul></td></tr><tr><td>Final group</td><td>Final detail</td><td>Final note</td></tr></table>';

describe("GFM tables", () => {
  it("preserves literal pipes in plain, emphasized and inline-code cells", () => {
    const markdown = convertHtmlToMarkdown(pipeTable);
    const tokens = marked.lexer(markdown);
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe("table");
    const table = tokens[0] as Tokens.Table;
    expect(table.header.map((cell) => cell.text)).toEqual([
      "Plain",
      "Emphasis",
      "Code",
    ]);
    expect(table.rows.map((row) => row.map((cell) => cell.text))).toEqual([
      ["alpha | beta", "_gamma | delta_", "`one | two`"],
    ]);
    expect(marked.parse(markdown)).toBe(
      "<table>\n<thead>\n<tr>\n<th>Plain</th>\n<th>Emphasis</th>\n<th>Code</th>\n</tr>\n</thead>\n<tbody><tr>\n<td>alpha | beta</td>\n<td><em>gamma | delta</em></td>\n<td><code>one | two</code></td>\n</tr>\n</tbody></table>\n",
    );
  });

  it("falls back without losing code backslashes adjacent to pipes", () => {
    const markdown = convertHtmlToMarkdown(
      "<table><tr><th>A</th><th>B</th><th>C</th></tr><tr><td>left \\| right</td><td><em>middle \\| value</em></td><td><code>end \\| value</code></td></tr></table>",
    );
    const tokens = marked.lexer(markdown);
    const table = tokens.find((token) => token.type === "list") as Tokens.List;
    expect(table.items).toHaveLength(2);
    const row = table.items[1].tokens.find(
      (token) => token.type === "list",
    ) as Tokens.List;
    expect(row.items).toHaveLength(3);
    expect(row.items.map((cell) => marked.parser(cell.tokens))).toEqual([
      "<p>Column 1</p>\n<p>left \\| right</p>\n",
      "<p>Column 2</p>\n<p><em>middle \\| value</em></p>\n",
      "<p>Column 3</p>\n<p><code>end \\| value</code></p>\n",
    ]);
  });
});

describe.each([true, false])("table fallback (gfm=%s)", (gfm) => {
  it.each(["9", "65535", "9999999999999999999999999999999999"])(
    "bounds rowspan %s to a one-row supplied fragment",
    (rowSpan) => {
      const markdown = convertHtmlToMarkdown(
        `<table><tr><td rowspan="${rowSpan}">Alpha</td></tr></table>`,
        { gfm },
      );
      expect(marked.parse(markdown, { gfm, async: false })).toBe(
        "<p>Table (cell coordinates refer to the supplied fragment):</p>\n<ul>\n<li><p>Row 1</p>\n<ul>\n<li><p>Column 1</p>\n<p>Alpha</p>\n</li>\n</ul>\n</li>\n</ul>\n",
      );
    },
  );

  it.each([
    ["tbody", "tbody"],
    ["thead", "tbody"],
    ["tbody", "tfoot"],
  ])(
    "bounds overlong spans within %s before the following %s group",
    (firstGroup, nextGroup) => {
      const markdown = convertHtmlToMarkdown(
        `<table><${firstGroup}><tr><td rowspan="9">Shared</td><td>First</td></tr><tr><td rowspan="99">Second</td></tr></${firstGroup}><${nextGroup}><tr><td>Third</td></tr></${nextGroup}></table>`,
        { gfm },
      );
      expect(marked.parse(markdown, { gfm, async: false })).toBe(
        "<p>Table (cell coordinates refer to the supplied fragment):</p>\n<ul>\n" +
          "<li><p>Row 1</p>\n<ul>\n<li><p>Column 1 (rows 1-2)</p>\n<p>Shared</p>\n</li>\n" +
          "<li><p>Column 2</p>\n<p>First</p>\n</li>\n</ul>\n</li>\n" +
          "<li><p>Row 2</p>\n<ul>\n<li><p>Column 2</p>\n<p>Second</p>\n</li>\n</ul>\n</li>\n" +
          "<li><p>Row 3</p>\n<ul>\n<li><p>Column 1</p>\n<p>Third</p>\n</li>\n</ul>\n</li>\n</ul>\n",
      );
    },
  );

  it("keeps a one-row fragment and an empty cell without adding headers or values", () => {
    const markdown = convertHtmlToMarkdown(
      "<table><tr><td>A</td><td></td><td>Cell B</td></tr></table>",
      { gfm },
    );
    expect(marked.parse(markdown, { gfm, async: false })).toBe(
      "<p>Table (cell coordinates refer to the supplied fragment):</p>\n<ul>\n<li><p>Row 1</p>\n<ul>\n<li><p>Column 1</p>\n<p>A</p>\n</li>\n<li><p>Column 2</p>\n</li>\n<li><p>Column 3</p>\n<p>Cell B</p>\n</li>\n</ul>\n</li>\n</ul>\n",
    );
  });

  it.each([
    ["paragraph", "<p>Paragraph</p>", "<p>Paragraph</p>\n"],
    [
      "list",
      "<ul><li>Only item</li></ul>",
      "<ul>\n<li>Only item</li>\n</ul>\n",
    ],
    [
      "quote",
      "<blockquote><p>Quoted</p></blockquote>",
      "<blockquote>\n<p>Quoted</p>\n</blockquote>\n",
    ],
    [
      "code",
      "<pre><code>sample\n</code></pre>",
      "<pre><code>sample\n</code></pre>\n",
    ],
  ])("owns even a single %s block inside its cell", (_name, body, rendered) => {
    const markdown = convertHtmlToMarkdown(
      `<table><tr><th>Heading</th></tr><tr><td>${body}</td></tr></table><p>After table</p>`,
      { gfm },
    );
    const tokens = marked.lexer(markdown, { gfm });
    const list = tokens.find((token) => token.type === "list") as Tokens.List;
    expect(list.items).toHaveLength(2);
    const row = list.items[1].tokens.find(
      (token) => token.type === "list",
    ) as Tokens.List;
    expect(row.items).toHaveLength(1);
    expect(marked.parser(row.items[0].tokens, { gfm })).toBe(
      `<p>Column 1</p>\n${rendered}`,
    );
    expect(tokens.at(-1)?.type).toBe("paragraph");
    expect(marked.parser([tokens.at(-1)!], { gfm })).toBe(
      "<p>After table</p>\n",
    );
  });

  it("interprets rowspan zero within its row group and resets columns for the next group", () => {
    const markdown = convertHtmlToMarkdown(
      '<table><tbody><tr><td rowspan="0">Shared</td><td>First</td></tr><tr><td>Second</td></tr></tbody><tbody><tr><td>Third</td></tr></tbody></table>',
      { gfm },
    );
    const tokens = marked.lexer(markdown, { gfm });
    const list = tokens.find((token) => token.type === "list") as Tokens.List;
    expect(list.items).toHaveLength(3);
    const rows = list.items.map(
      (item) =>
        item.tokens.find((token) => token.type === "list") as Tokens.List,
    );
    expect(
      rows.map((row) => row.items.map((cell) => cell.text.trimEnd())),
    ).toEqual([
      ["Column 1 (rows 1-2)\n\nShared", "Column 2\n\nFirst"],
      ["Column 2\n\nSecond"],
      ["Column 1\n\nThird"],
    ]);
  });

  it("retains spanning headers and owns paragraph/list blocks by cell coordinates", () => {
    const markdown = convertHtmlToMarkdown(complexTable, { gfm });
    expect(marked.parse(markdown, { gfm, async: false })).toBe(
      "<p>Table (cell coordinates refer to the supplied fragment):</p>\n" +
        "<ul>\n<li><p>Row 1</p>\n<ul>\n" +
        "<li><p>Column 1 (header; rows 1-2)</p>\n<p>Group</p>\n</li>\n" +
        "<li><p>Columns 2-3 (header)</p>\n<p>Details</p>\n</li>\n</ul>\n</li>\n" +
        "<li><p>Row 2</p>\n<ul>\n<li><p>Column 2</p>\n<p>First line</p>\n<p>Second line</p>\n</li>\n" +
        "<li><p>Column 3</p>\n<ul>\n<li>Choice one</li>\n<li>Choice two</li>\n</ul>\n</li>\n</ul>\n</li>\n" +
        "<li><p>Row 3</p>\n<ul>\n<li><p>Column 1</p>\n<p>Final group</p>\n</li>\n" +
        "<li><p>Column 2</p>\n<p>Final detail</p>\n</li>\n" +
        "<li><p>Column 3</p>\n<p>Final note</p>\n</li>\n</ul>\n</li>\n</ul>\n",
    );
  });

  it("keeps headerless table values by row and column without inventing headers", () => {
    const markdown = convertHtmlToMarkdown(
      "<table><tr><td>Alpha</td><td>One</td></tr><tr><td>Beta</td><td>Two</td></tr></table>",
      { gfm },
    );
    expect(marked.parse(markdown, { gfm, async: false })).toBe(
      "<p>Table (cell coordinates refer to the supplied fragment):</p>\n<ul>\n" +
        "<li><p>Row 1</p>\n<ul>\n<li><p>Column 1</p>\n<p>Alpha</p>\n</li>\n<li><p>Column 2</p>\n<p>One</p>\n</li>\n</ul>\n</li>\n" +
        "<li><p>Row 2</p>\n<ul>\n<li><p>Column 1</p>\n<p>Beta</p>\n</li>\n<li><p>Column 2</p>\n<p>Two</p>\n</li>\n</ul>\n</li>\n</ul>\n",
    );
  });

  it("does not pass table HTML, active attributes or elements through", () => {
    const markdown = convertHtmlToMarkdown(
      '<table onclick="alert(1)"><tr><td style="color:red" onmouseover="alert(2)"><p>Safe</p><script>alert(3)</script><iframe src="https://example.invalid/embed"></iframe><img src="https://example.invalid/picture.png" onerror="alert(4)" alt="Picture"></td></tr></table>',
      { gfm },
    );
    const rendered = marked.parse(markdown, { gfm, async: false });
    expect(rendered).not.toMatch(
      /<(?:table|script|iframe)\b|\bon\w+=|\bstyle=/i,
    );
    expect(rendered).toContain(
      '<img src="https://example.invalid/picture.png" alt="Picture">',
    );
  });
});

it("uses coordinate fallback with GFM disabled even for a simple table", () => {
  const markdown = convertHtmlToMarkdown(pipeTable, { gfm: false });
  const tokens = marked.lexer(markdown, { gfm: false });
  expect(
    tokens.filter((token) => token.type !== "space").map((token) => token.type),
  ).toEqual(["paragraph", "list"]);
  const list = tokens.find((token) => token.type === "list") as Tokens.List;
  expect(list.items).toHaveLength(2);
  const secondRow = list.items[1].tokens.find(
    (token) => token.type === "list",
  ) as Tokens.List;
  expect(secondRow.items).toHaveLength(3);
  expect(secondRow.items.map((cell) => cell.text.trimEnd())).toEqual([
    "Column 1\n\nalpha | beta",
    "Column 2\n\n_gamma | delta_",
    "Column 3\n\n`one | two`",
  ]);
});
