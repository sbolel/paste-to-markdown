import type TurndownService from "turndown";

/** Only explicit inline display values are available; no computed CSS is read. */
export function hasExplicitBlockDisplay(node: HTMLElement): boolean {
  return /^(block|flow-root|flex|grid|table|list-item)$/.test(
    node.style?.getPropertyValue("display").trim().toLowerCase() ?? "",
  );
}

export function hasBlockLinkContent(node: HTMLElement): boolean {
  return Array.from(node.getElementsByTagName("*")).some(
    (child) =>
      Boolean((child as HTMLElement & { isBlock?: boolean }).isBlock) ||
      hasExplicitBlockDisplay(child as HTMLElement),
  );
}

function isInsideLink(node: HTMLElement): boolean {
  for (let parent = node.parentElement; parent; parent = parent.parentElement) {
    if (parent.nodeName === "A" && parent.getAttribute("href")) return true;
  }
  return false;
}

function escapeComposedListMarker(content: string, node: HTMLElement): string {
  // A container can also contain Markdown generated from real lists or code.
  if (node.querySelector("ol, ul, pre")) return content;
  // Turndown escapes text nodes individually; spans can assemble a new marker.
  return content.replace(/^(\d+)\.(?=[ \t])/gm, "$1\\.");
}

function wrapProseBesideStructuredBlocks(node: HTMLElement): void {
  const structured = "ol, ul, pre";
  if (!node.querySelector(structured)) return;
  for (let parent = node.parentElement; parent; parent = parent.parentElement) {
    if (parent.nodeName === "PRE") return;
  }
  // Give direct prose runs their own paragraph rule before conversion. That
  // rule can escape a split marker without touching neighboring lists or code.
  let paragraph: HTMLElement | undefined;
  for (const child of Array.from(node.childNodes)) {
    const element = child.nodeType === 1 ? (child as HTMLElement) : null;
    const isBlock =
      element &&
      (/^(ADDRESS|ARTICLE|ASIDE|BLOCKQUOTE|DIV|DL|FIGURE|FOOTER|FORM|H[1-6]|HEADER|HR|MAIN|NAV|OL|P|PRE|SECTION|TABLE|UL)$/.test(
        element.nodeName,
      ) ||
        hasExplicitBlockDisplay(element) ||
        element.querySelector(structured));
    if (isBlock) {
      paragraph = undefined;
    } else {
      if (!paragraph) {
        paragraph = node.ownerDocument.createElement("p");
        node.insertBefore(paragraph, child);
      }
      paragraph.appendChild(child);
    }
  }
}

export function addInlineLayoutRules(td: TurndownService): void {
  td.addRule("proseBlock", {
    filter: (node) => {
      if (node.nodeName === "DIV") wrapProseBesideStructuredBlocks(node);
      return node.nodeName === "P" || node.nodeName === "DIV";
    },
    replacement: (content, node) =>
      `\n\n${escapeComposedListMarker(content, node)}\n\n`,
  });

  td.addRule("explicitBlockSpan", {
    filter: (node) => {
      if (node.nodeName !== "SPAN" || !hasExplicitBlockDisplay(node))
        return false;
      wrapProseBesideStructuredBlocks(node);
      return true;
    },
    replacement: (content, node) =>
      `\n\n${escapeComposedListMarker(content, node)}\n\n`,
  });

  td.addRule("headingInLink", {
    filter: (node) => /^H[1-6]$/.test(node.nodeName) && isInsideLink(node),
    // A Markdown label cannot contain a heading; keep its inline formatting.
    replacement: (content) => `\n\n${content}\n\n`,
  });

  td.addRule("lineBreakInLink", {
    filter: (node) => node.nodeName === "BR" && isInsideLink(node),
    // Repeated Markdown hard breaks create blank lines and invalidate a label.
    replacement: () => "<br>",
  });
}
