import type TurndownService from "turndown";

function owningListItem(node: Element): Element | null {
  let parent = node.parentElement;
  while (parent && parent.nodeName !== "LI") {
    if (parent.nodeName === "TD" || parent.nodeName === "TH") return null;
    parent = parent.parentElement;
  }
  return parent;
}

function startsWithNestedBlock(
  node: Element,
  primaryInput: Element,
): boolean | undefined {
  for (const child of Array.from(node.childNodes)) {
    if (child === primaryInput) continue;
    if (child.nodeType === 3 && child.nodeValue?.trim()) return false;
    if (child.nodeType !== 1) continue;
    if (/^(OL|UL|PRE|BLOCKQUOTE|TABLE|HR|H[1-6])$/.test(child.nodeName)) {
      return true;
    }
    if (/^(INPUT|IMG)$/.test(child.nodeName)) return false;
    const nested = startsWithNestedBlock(child as Element, primaryInput);
    if (nested !== undefined) return nested;
  }
  return undefined;
}

function isCheckbox(node: Element): boolean {
  return (
    node.nodeName === "INPUT" &&
    node.getAttribute("type")?.toLowerCase() === "checkbox"
  );
}

/** Keep task state with its nearest LI without changing Turndown's indentation. */
export function addTaskListRules(service: TurndownService, gfm: boolean): void {
  const listItemReplacement = service.rules.array.find(
    (rule) => rule.filter === "li",
  )?.replacement;
  if (!listItemReplacement) return;

  const primaryCheckboxes = new WeakMap<Element, Element | null>();
  const primaryCheckbox = (item: Element): Element | null => {
    if (!primaryCheckboxes.has(item)) {
      primaryCheckboxes.set(
        item,
        Array.from(item.getElementsByTagName("input")).find(
          (input) => isCheckbox(input) && owningListItem(input) === item,
        ) ?? null,
      );
    }
    return primaryCheckboxes.get(item) ?? null;
  };
  const readableState = (input: Element) =>
    input.hasAttribute("checked") ? "(checked) " : "(unchecked) ";

  service.addRule("ownedTaskCheckbox", {
    filter: isCheckbox,
    replacement: (_content, input) => {
      const owner = owningListItem(input);
      // The first state is emitted once, at the start of its own list item.
      if (owner && primaryCheckbox(owner) === input) return "";
      return readableState(input);
    },
  });
  service.addRule("ownedTaskListItem", {
    filter: "li",
    replacement: (content, item, options) => {
      const input = primaryCheckbox(item);
      if (input) {
        const nestedBlock = startsWithNestedBlock(item, input);
        // A bare GFM checkbox followed only by a block has no task label.
        // Keep its readable state instead of inventing label text.
        const state =
          gfm && !nestedBlock
            ? input.hasAttribute("checked")
              ? "[x] "
              : "[ ] "
            : readableState(input);
        const boundary = nestedBlock ? "\n\n" : "";
        content = state + boundary + content.trimStart();
      }
      return listItemReplacement(content, item, options);
    },
  });
}
