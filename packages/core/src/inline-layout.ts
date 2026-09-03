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

export function addInlineLayoutRules(td: TurndownService): void {
  td.addRule("explicitBlockSpan", {
    filter: (node) => node.nodeName === "SPAN" && hasExplicitBlockDisplay(node),
    replacement: (content) => `\n\n${content}\n\n`,
  });

  td.addRule("headingInLink", {
    filter: (node) => /^H[1-6]$/.test(node.nodeName) && isInsideLink(node),
    // A Markdown label cannot contain a heading; keep its inline formatting.
    replacement: (content) => `\n\n${content}\n\n`,
  });
}
