import { marked } from "marked";
import { describe, expect, it } from "vitest";
import { convertHtmlToMarkdown } from "../src/index.js";

describe.each([true, false])("list structure (gfm=%s)", (gfm) => {
  it("keeps continuation blocks and multiple list depths in their owning item", () => {
    const html =
      '<ol start="9"><li><p>Outer first</p><ul><li>Child one<ol start="3"><li>Deep one</li><li>Deep two</li></ol></li><li>Child two</li></ul><p>First continuation</p><blockquote><p>First quote</p></blockquote><pre><code>alpha\nbeta\n</code></pre></li><li>Outer second</li></ol>';
    const markdown = convertHtmlToMarkdown(html, { gfm });
    expect(marked.parse(markdown, { gfm, async: false })).toBe(
      '<ol start="9">\n' +
        '<li><p>Outer first</p>\n<ul>\n<li>Child one<ol start="3">\n' +
        "<li>Deep one</li>\n<li>Deep two</li>\n</ol>\n</li>\n" +
        "<li>Child two</li>\n</ul>\n<p>First continuation</p>\n" +
        "<blockquote>\n<p>First quote</p>\n</blockquote>\n" +
        "<pre><code>alpha\nbeta\n</code></pre>\n</li>\n" +
        "<li><p>Outer second</p>\n</li>\n</ol>\n",
    );
  });

  it.each(["direct", "label", "span"])(
    "preserves checked and unchecked %s inputs with their labels",
    (wrapper) => {
      const item = (checked: boolean, label: string) => {
        const input = `<input type="checkbox"${checked ? " checked" : ""}>${label}`;
        return `<li>${wrapper === "direct" ? input : `<${wrapper}>${input}</${wrapper}>`}</li>`;
      };
      const markdown = convertHtmlToMarkdown(
        `<ul>${item(true, "Done")}${item(false, "Next")}</ul>`,
        { gfm },
      );
      expect(marked.parse(markdown, { gfm, async: false })).toBe(
        gfm
          ? '<ul>\n<li><input checked="" disabled="" type="checkbox"> Done</li>\n<li><input disabled="" type="checkbox"> Next</li>\n</ul>\n'
          : "<ul>\n<li>(checked) Done</li>\n<li>(unchecked) Next</li>\n</ul>\n",
      );
    },
  );

  it("keeps nested task states on their nearest owning item exactly once", () => {
    const html =
      '<ul><li>Plain parent<ul><li><label><input type="checkbox" checked>Nested done</label></li></ul></li><li><span><input type="checkbox">Parent next</span><ol start="4"><li><span><input type="checkbox" checked>Nested ordered done</span></li></ol></li></ul>';
    const markdown = convertHtmlToMarkdown(html, { gfm });
    expect(marked.parse(markdown, { gfm, async: false })).toBe(
      gfm
        ? '<ul>\n<li>Plain parent<ul>\n<li><input checked="" disabled="" type="checkbox"> Nested done</li>\n</ul>\n</li>\n<li><input disabled="" type="checkbox"> Parent next<ol start="4">\n<li><input checked="" disabled="" type="checkbox"> Nested ordered done</li>\n</ol>\n</li>\n</ul>\n'
        : '<ul>\n<li>Plain parent<ul>\n<li>(checked) Nested done</li>\n</ul>\n</li>\n<li>(unchecked) Parent next<ol start="4">\n<li>(checked) Nested ordered done</li>\n</ol>\n</li>\n</ul>\n',
    );
  });

  it("associates a trailing checkbox with its explicit label in the same item", () => {
    const html =
      '<ul><li><label for="task-one">Assigned item</label><span><input id="task-one" type="checkbox" checked></span></li></ul>';
    const markdown = convertHtmlToMarkdown(html, { gfm });
    expect(marked.parse(markdown, { gfm, async: false })).toBe(
      gfm
        ? '<ul>\n<li><input checked="" disabled="" type="checkbox"> Assigned item</li>\n</ul>\n'
        : "<ul>\n<li>(checked) Assigned item</li>\n</ul>\n",
    );
  });

  it("preserves every state when one item contains multiple checkboxes", () => {
    const html =
      '<ul><li><label><input type="checkbox" checked>First</label> and <label><input type="checkbox">Second</label></li></ul>';
    const markdown = convertHtmlToMarkdown(html, { gfm });
    expect(marked.parse(markdown, { gfm, async: false })).toBe(
      gfm
        ? '<ul>\n<li><input checked="" disabled="" type="checkbox"> First and (unchecked) Second</li>\n</ul>\n'
        : "<ul>\n<li>(checked) First and (unchecked) Second</li>\n</ul>\n",
    );
  });
});
