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

/** Turndown selects its blank rule before custom rules, even for code. */
export function preserveBlankCode(
  content: string,
  node: CodeNode,
): string | undefined {
  if (node.nodeName === "CODE" && !isInsidePre(node)) return inlineCode(node);
  // Keep the code delimiters already emitted by otherwise blank descendants.
  if (content.trim()) return node.isBlock ? `\n\n${content}\n\n` : content;
  return undefined;
}

export function addCodeRules(service: TurndownService): void {
  service.addRule("preservedInlineCode", {
    filter: (node) => node.nodeName === "CODE" && !isInsidePre(node),
    replacement: (_content, node) => inlineCode(node),
  });
}
