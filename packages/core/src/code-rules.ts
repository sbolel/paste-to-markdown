import type TurndownService from "turndown";

/** DOM properties shared by the browser parser and Turndown's Node parser. */
interface CodeNode {
  nodeName: string;
  nodeType: number;
  nodeValue: string | null;
  textContent: string | null;
  childNodes: ArrayLike<CodeNode>;
  parentNode: CodeNode | null;
  isBlock?: boolean;
  getAttribute?(name: string): string | null;
}

function isInsidePre(node: CodeNode): boolean {
  for (let parent = node.parentNode; parent; parent = parent.parentNode) {
    if (parent.nodeName === "PRE") return true;
  }
  return false;
}

function inlineCodeText(node: CodeNode): string {
  if (node.nodeType === 3) return node.nodeValue ?? "";
  if (node.nodeType !== 1) return "";
  // textContent omits BR entirely; retain the separator before normalization.
  if (node.nodeName === "BR") return "\n";
  return Array.from(node.childNodes).map(inlineCodeText).join("");
}

function inlineCode(node: CodeNode): string {
  const value = inlineCodeText(node).replace(/\r\n|\r|\n/g, " ");
  if (!value) return "";

  const runs = value.match(/`+/g) ?? [];
  const delimiter = "`".repeat(
    runs.reduce((length, run) => Math.max(length, run.length + 1), 1),
  );
  // CommonMark strips one padding space at each end unless the value is all
  // spaces. Padding also separates edge backticks from the delimiter.
  const padding = /^`|`$|^ .*[^ ].* $/.test(value) ? " " : "";
  return `${delimiter}${padding}${value}${padding}${delimiter}`;
}

function hasClass(node: CodeNode, name: string): boolean {
  return (node.getAttribute?.("class") ?? "").split(/\s+/).includes(name);
}

function hasAdjacentPre(node: CodeNode): boolean {
  const siblings = Array.from(node.parentNode?.childNodes ?? []);
  const index = siblings.indexOf(node);
  for (const direction of [-1, 1]) {
    for (
      let i = index + direction;
      i >= 0 && i < siblings.length;
      i += direction
    ) {
      const sibling = siblings[i];
      if (sibling.nodeType === 3 && !sibling.nodeValue?.trim()) continue;
      if (sibling.nodeType === 8) continue;
      if (sibling.nodeName === "PRE") return true;
      break;
    }
  }
  return false;
}

function isDecorativeGutter(node: CodeNode): boolean {
  return (
    node.getAttribute?.("aria-hidden") === "true" &&
    hasClass(node, "gutter") &&
    (isInsidePre(node) || hasAdjacentPre(node))
  );
}

function isLineWrapper(node: CodeNode): boolean {
  return (
    node.nodeName === "DIV" ||
    node.nodeName === "P" ||
    hasClass(node, "line") ||
    hasClass(node, "code-line")
  );
}

function hasStructuredLines(node: CodeNode): boolean {
  return Array.from(node.childNodes).some(
    (child) =>
      child.nodeName === "BR" ||
      isLineWrapper(child) ||
      isDecorativeGutter(child) ||
      hasStructuredLines(child),
  );
}

function hasCodeSiblings(node: CodeNode): boolean {
  const children = Array.from(node.childNodes);
  return (
    children.length > 1 && children.some((child) => child.nodeName === "CODE")
  );
}

interface CodeSegment {
  text: string;
  startsLine: boolean;
  endsLine: boolean;
}

function blockCodeSegment(node: CodeNode): CodeSegment {
  const plain = (text: string): CodeSegment => ({
    text,
    startsLine: false,
    endsLine: false,
  });
  if (node.nodeType === 3) return plain(node.nodeValue ?? "");
  if (node.nodeType !== 1 || isDecorativeGutter(node)) return plain("");
  if (node.nodeName === "BR") return plain("\n");

  let result = "";
  let first: CodeSegment | undefined;
  let previous: CodeSegment | undefined;
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === 8 || isDecorativeGutter(child)) continue;
    const segment = blockCodeSegment(child);
    first ??= segment;
    // Carry wrapper boundaries through CODE containers without materializing
    // an extra LF before an authored newline in the next sibling.
    if (
      previous &&
      (previous.endsLine || segment.startsLine) &&
      (previous.endsLine || !previous.text.endsWith("\n")) &&
      !segment.text.startsWith("\n")
    ) {
      result += "\n";
    }
    result += segment.text;
    previous = segment;
  }
  return {
    text: result,
    startsLine: isLineWrapper(node) || Boolean(first?.startsLine),
    endsLine:
      Boolean(previous?.endsLine) ||
      (isLineWrapper(node) && !result.endsWith("\n")),
  };
}

function blockCodeText(node: CodeNode): string {
  const segment = blockCodeSegment(node);
  return segment.text + (segment.endsLine ? "\n" : "");
}

function structuredCodeBlock(node: CodeNode): string {
  const code = Array.from(node.childNodes).find(
    (child) => child.nodeName === "CODE",
  );
  const classes = `${code?.getAttribute?.("class") ?? ""} ${node.getAttribute?.("class") ?? ""}`;
  const language = classes.match(/(?:^|\s)language-([\w+-]+)/)?.[1] ?? "";
  // CODE identifies the language, but every PRE descendant contains source.
  const value = blockCodeText(node);
  const runs = value.match(/`+/g) ?? [];
  const fence = "`".repeat(
    runs.reduce((length, run) => Math.max(length, run.length + 1), 3),
  );
  return `\n\n${fence}${language}\n${value.replace(/\n$/, "")}\n${fence}\n\n`;
}

/** Turndown selects its blank rule before custom rules, even for code. */
export function preserveBlankCode(
  content: string,
  node: CodeNode,
): string | undefined {
  if (node.nodeName === "PRE") return structuredCodeBlock(node);
  if (node.nodeName === "CODE" && !isInsidePre(node)) return inlineCode(node);
  // Keep the code delimiters already emitted by otherwise blank descendants.
  if (content.trim()) return node.isBlock ? `\n\n${content}\n\n` : content;
  return undefined;
}

export function addCodeRules(service: TurndownService): void {
  service.addRule("structuredCodeBlock", {
    // Leave ordinary fenced blocks with Turndown's existing fence handling.
    filter: (node) =>
      node.nodeName === "PRE" &&
      (hasStructuredLines(node) || hasCodeSiblings(node)),
    replacement: (_content, node) => structuredCodeBlock(node),
  });
  service.addRule("decorativeCodeGutter", {
    filter: isDecorativeGutter,
    replacement: () => "",
  });
  service.addRule("preservedInlineCode", {
    filter: (node) => node.nodeName === "CODE" && !isInsidePre(node),
    replacement: (_content, node) => inlineCode(node),
  });
}
