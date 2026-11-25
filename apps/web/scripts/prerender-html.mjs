import { JSDOM } from "jsdom";

/** Insert only inside the root; leave the built head and asset URLs byte-identical. */
export function injectHomepage(template, markup) {
  if (typeof markup !== "string" || !markup.trim()) {
    throw new Error("The homepage renderer returned empty markup");
  }
  const dom = new JSDOM(template, { includeNodeLocations: true });
  try {
    const roots = dom.window.document.querySelectorAll('[id="root"]');
    if (roots.length !== 1) {
      throw new Error("Expected exactly one application root");
    }
    const root = roots[0];
    if (root.tagName !== "DIV" || root.innerHTML.trim()) {
      throw new Error("Expected an empty application div");
    }
    const location = dom.nodeLocation(root);
    if (!location?.startTag || !location?.endTag) {
      throw new Error(
        "Application root must have explicit opening and closing tags",
      );
    }
    return (
      template.slice(0, location.startTag.endOffset) +
      markup +
      template.slice(location.endTag.startOffset)
    );
  } finally {
    dom.window.close();
  }
}
