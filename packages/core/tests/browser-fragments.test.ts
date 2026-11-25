import { marked } from "marked";
import { describe, expect, it } from "vitest";
import captures from "../../../docs/evidence/browser-baseline.json";
import { convertClipboardData } from "../src/index.js";

// These fixtures were copied from the authored browser harness. The stored
// payloads, rather than an assumed browser serialization, exercise the API.
describe.each([true, false])("observed browser fragments (gfm=%s)", (gfm) => {
  it.each([
    "beta",
    "partial item",
    "cell B",
    "cards",
    "styled",
    "whitespace",
    "plain text",
  ])("preserves the accepted %s result", (name) => {
    const capture = captures.find((item) => item.case === name)!;
    const output = convertClipboardData(
      {
        getData: (type) =>
          type === "text/html" ? capture.html : capture.plain,
      },
      { gfm },
    );
    expect(output).toBe(capture.markdown);
  });

  it("keeps both selected cell values in their own column", () => {
    const capture = captures.find((item) => item.case === "across cells")!;
    const output = convertClipboardData(
      {
        getData: (type) =>
          type === "text/html" ? capture.html : capture.plain,
      },
      { gfm },
    );
    expect(marked.parse(output, { gfm })).toBe(
      "<p>Table (cell coordinates refer to the supplied fragment):</p>\n<ul>\n<li><p>Row 1</p>\n<ul>\n<li><p>Column 1</p>\n<p>A</p>\n</li>\n<li><p>Column 2</p>\n<p>Cell B</p>\n</li>\n</ul>\n</li>\n</ul>\n",
    );
  });
});
