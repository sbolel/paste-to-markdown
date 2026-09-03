import { describe, expect, it } from "vitest";
import { convertClipboardData, convertHtmlToMarkdown } from "../src/index.js";
import type { ClipboardDataLike } from "../src/index.js";

describe("convertHtmlToMarkdown", () => {
  it("converts a simple paragraph", () => {
    const html = "<p>Hello, world!</p>";
    const result = convertHtmlToMarkdown(html);
    expect(result).toBe("Hello, world!");
  });

  it("converts headings", () => {
    expect(convertHtmlToMarkdown("<h1>Title</h1>")).toBe("# Title");
    expect(convertHtmlToMarkdown("<h2>Subtitle</h2>")).toBe("## Subtitle");
    expect(convertHtmlToMarkdown("<h3>Section</h3>")).toBe("### Section");
  });

  it.each([
    [
      "github",
      "# Title",
      "_italic_",
      "**bold**",
      "-   Item",
      "```\nconst x = 1;\n```",
    ],
    [
      "commonmark",
      "# Title",
      "*italic*",
      "**bold**",
      "-   Item",
      "```\nconst x = 1;\n```",
    ],
    [
      "strict",
      "# Title",
      "*italic*",
      "**bold**",
      "*   Item",
      "    const x = 1;",
    ],
    [
      "custom",
      "Title\n=====",
      "_italic_",
      "__bold__",
      "+   Item",
      "```\nconst x = 1;\n```",
    ],
  ] as const)(
    "applies the %s Markdown preset",
    (flavor, heading, emphasis, strong, listItem, codeBlock) => {
      expect(convertHtmlToMarkdown("<h1>Title</h1>", { flavor })).toBe(heading);
      expect(convertHtmlToMarkdown("<em>italic</em>", { flavor })).toBe(
        emphasis,
      );
      expect(convertHtmlToMarkdown("<strong>bold</strong>", { flavor })).toBe(
        strong,
      );
      expect(convertHtmlToMarkdown("<ul><li>Item</li></ul>", { flavor })).toBe(
        listItem,
      );
      expect(
        convertHtmlToMarkdown("<pre><code>const x = 1;</code></pre>", {
          flavor,
        }),
      ).toBe(codeBlock);
    },
  );

  it("converts bold and italic", () => {
    expect(convertHtmlToMarkdown("<strong>bold</strong>")).toBe("**bold**");
    expect(convertHtmlToMarkdown("<em>italic</em>")).toBe("_italic_");
  });

  it("converts links", () => {
    const result = convertHtmlToMarkdown(
      '<a href="https://example.com">Example</a>',
    );
    expect(result).toBe("[Example](https://example.com)");
  });

  it("flattens block content inside an inline link label", () => {
    const html =
      '<a href="https://example.invalid/items/alpha"><p>Item Alpha</p><span>Short description</span></a>';

    expect(convertHtmlToMarkdown(html)).toBe(
      "[Item Alpha Short description](https://example.invalid/items/alpha)",
    );
  });

  it("keeps adjacent block-backed links as separate Markdown blocks", () => {
    const html = [
      '<div><a href="https://example.invalid/items/alpha"><p>Item Alpha</p><span>Short description</span></a></div>',
      '<div><a href="https://example.invalid/items/beta"><p>Item Beta</p><span>Another description</span></a></div>',
    ].join("");

    expect(convertHtmlToMarkdown(html)).toBe(
      "[Item Alpha Short description](https://example.invalid/items/alpha)\n\n" +
        "[Item Beta Another description](https://example.invalid/items/beta)",
    );
  });

  it("preserves inline Markdown while flattening a link label", () => {
    const html =
      '<a href="https://example.invalid/items/gamma"><p><strong>Item Gamma</strong></p><span>A <em>short</em> description</span></a>';

    expect(convertHtmlToMarkdown(html)).toBe(
      "[**Item Gamma** A _short_ description](https://example.invalid/items/gamma)",
    );
  });

  it("preserves inline-link destination and title escaping", () => {
    const html =
      '<a href="https://example.invalid/a_(b)" title="A &quot;quoted&quot; title">Example</a>';

    expect(convertHtmlToMarkdown(html)).toBe(
      '[Example](https://example.invalid/a_\\(b\\) "A \\"quoted\\" title")',
    );
  });

  it.each([
    ["before parentheses", String.raw`a\(b\)`, String.raw`a\\\(b\\\)`],
    [
      "repeated before parentheses",
      String.raw`a\\(b\\)`,
      String.raw`a\\\\\(b\\\\\)`,
    ],
    ["repeated within a path", String.raw`a\\b`, String.raw`a\\\\b`],
    ["trailing", "a\\", String.raw`a\\`],
    ["repeated trailing", String.raw`a\\`, String.raw`a\\\\`],
  ])(
    "escapes literal backslashes in inline-link destinations: %s",
    (_name, path, expectedPath) => {
      const html = `<a href="https://example.invalid/${path}">Example</a>`;

      expect(convertHtmlToMarkdown(html)).toBe(
        `[Example](https://example.invalid/${expectedPath})`,
      );
    },
  );

  it.each([
    [
      "before quotes",
      String.raw`A \&quot;quoted\&quot; title`,
      String.raw`A \\\"quoted\\\" title`,
    ],
    [
      "repeated before quotes",
      String.raw`A \\&quot;quoted\\&quot; title`,
      String.raw`A \\\\\"quoted\\\\\" title`,
    ],
    ["repeated within a title", String.raw`A\\B`, String.raw`A\\\\B`],
    ["trailing", "Title\\", String.raw`Title\\`],
    ["repeated trailing", String.raw`Title\\`, String.raw`Title\\\\`],
  ])(
    "escapes literal backslashes in inline-link titles: %s",
    (_name, title, expectedTitle) => {
      const html = `<a href="https://example.invalid/" title="${title}">Example</a>`;

      expect(convertHtmlToMarkdown(html)).toBe(
        `[Example](https://example.invalid/ "${expectedTitle}")`,
      );
    },
  );

  it("converts unordered lists", () => {
    const html = "<ul><li>Item 1</li><li>Item 2</li></ul>";
    const result = convertHtmlToMarkdown(html);
    expect(result).toBe("-   Item 1\n-   Item 2");
  });

  it("converts ordered lists", () => {
    const html = "<ol><li>First</li><li>Second</li></ol>";
    const result = convertHtmlToMarkdown(html);
    expect(result).toBe("1.  First\n2.  Second");
  });

  it("converts code blocks", () => {
    const html = "<pre><code>const x = 1;</code></pre>";
    const result = convertHtmlToMarkdown(html);
    expect(result).toContain("const x = 1;");
  });

  it("converts inline code", () => {
    const result = convertHtmlToMarkdown("<code>console.log()</code>");
    expect(result).toBe("`console.log()`");
  });

  it("converts blockquotes", () => {
    const result = convertHtmlToMarkdown(
      "<blockquote><p>Quote text</p></blockquote>",
    );
    expect(result).toBe("> Quote text");
  });

  it("converts horizontal rules", () => {
    const result = convertHtmlToMarkdown("<hr>");
    expect(result).toBe("---");
  });

  it("returns empty string for empty input", () => {
    expect(convertHtmlToMarkdown("")).toBe("");
    expect(convertHtmlToMarkdown("   ")).toBe("");
  });

  it("converts strikethrough (GFM)", () => {
    const result = convertHtmlToMarkdown("<del>deleted</del>");
    expect(result).toBe("~~deleted~~");
  });

  it("converts checked and unchecked task-list markers (GFM)", () => {
    const result = convertHtmlToMarkdown(
      '<ul><li><input type="checkbox" checked> Done</li><li><input type="checkbox"> Next</li></ul>',
    );
    expect(result).toMatch(/\[x\]\s+Done/);
    expect(result).toMatch(/\[ \]\s+Next/);
  });

  it("uses explicit flavors instead of the legacy gfm toggle", () => {
    expect(
      convertHtmlToMarkdown("<del>deleted</del>", {
        flavor: "commonmark",
        gfm: true,
      }),
    ).toBe("deleted");
    expect(
      convertHtmlToMarkdown(
        "<table><thead><tr><th>Item</th></tr></thead><tbody><tr><td>Alpha</td></tr></tbody></table>",
        { flavor: "github", gfm: false },
      ),
    ).toBe("| Item |\n| --- |\n| Alpha |");
  });

  it("adds tables and highlighted code blocks for the explicit GitHub flavor", () => {
    expect(
      convertHtmlToMarkdown(
        "<table><thead><tr><th>Item</th><th>State</th></tr></thead><tbody><tr><td>Alpha</td><td>Done</td></tr></tbody></table>",
        { flavor: "github" },
      ),
    ).toBe("| Item | State |\n| --- | --- |\n| Alpha | Done |");
    expect(
      convertHtmlToMarkdown(
        '<div class="highlight"><pre><code class="language-ts">const x = 1;</code></pre></div>',
        { flavor: "github" },
      ),
    ).toBe("```ts\nconst x = 1;\n```");
  });

  it("keeps default conversion byte-for-byte compatible with current output", () => {
    const html =
      '<a href="https://example.invalid/a_(b)"><p><strong>Item</strong></p><span>A <em>short</em> description</span></a><ul><li><input type="checkbox" checked> Done</li></ul>';

    expect(convertHtmlToMarkdown(html)).toBe(
      "[**Item** A _short_ description](https://example.invalid/a_\\(b\\))\n\n-   [x]  Done",
    );
  });

  it("can disable the workspace GFM helpers", () => {
    expect(convertHtmlToMarkdown("<del>deleted</del>", { gfm: false })).toBe(
      "deleted",
    );
  });

  it("converts nested lists", () => {
    const html =
      "<ul><li>Item 1<ul><li>Nested</li></ul></li><li>Item 2</li></ul>";
    const result = convertHtmlToMarkdown(html);
    expect(result).toContain("Item 1");
    expect(result).toContain("Nested");
    expect(result).toContain("Item 2");
  });
});

describe("convertClipboardData", () => {
  function makeClipboardData(data: Record<string, string>): ClipboardDataLike {
    return {
      getData: (type: string) => data[type] ?? "",
    };
  }

  it("converts HTML from clipboard", () => {
    const cd = makeClipboardData({ "text/html": "<p>Hello</p>" });
    const result = convertClipboardData(cd);
    expect(result).toBe("Hello");
  });

  it("normalizes block content in links from clipboard HTML", () => {
    const cd = makeClipboardData({
      "text/html":
        '<a href="https://example.invalid/items/alpha"><p>Item Alpha</p><span>Short description</span></a>',
      "text/plain": "Item AlphaShort description",
    });

    expect(convertClipboardData(cd)).toBe(
      "[Item Alpha Short description](https://example.invalid/items/alpha)",
    );
  });

  it("falls back to plain text when no HTML", () => {
    const cd = makeClipboardData({ "text/plain": "plain text" });
    const result = convertClipboardData(cd);
    expect(result).toBe("plain text");
  });

  it("preserves plain-text clipboard bytes without HTML", () => {
    const text = "  plain\r\ntext \n";
    const cd = makeClipboardData({ "text/plain": text });

    expect(convertClipboardData(cd)).toBe(text);
  });

  it("prefers HTML over plain text", () => {
    const cd = makeClipboardData({
      "text/html": "<strong>bold</strong>",
      "text/plain": "bold",
    });
    const result = convertClipboardData(cd);
    expect(result).toBe("**bold**");
  });

  it("returns empty string when no data", () => {
    const cd = makeClipboardData({});
    const result = convertClipboardData(cd);
    expect(result).toBe("");
  });
});
