import type TurndownService from "turndown";

interface Cell {
  node: Element;
  content: string;
  column: number;
  columnSpan: number;
  rowSpan: number;
}

function tableRows(table: Element): Element[] {
  return Array.from(table.children).flatMap((child) => {
    if (child.nodeName === "TR") return [child];
    if (["THEAD", "TBODY", "TFOOT"].includes(child.nodeName)) {
      return Array.from(child.children).filter((row) => row.nodeName === "TR");
    }
    return [];
  });
}

function span(node: Element, attribute: string, maximum: number): number {
  const value = node.getAttribute(attribute) ?? "";
  if (!/^\d+$/.test(value)) return 1;
  return Math.min(maximum, Math.max(1, Number(value)));
}

function indent(content: string, width: number): string {
  return content.replace(/^/gm, " ".repeat(width));
}

function canRenderInline(cell: Element): boolean {
  return Array.from(cell.getElementsByTagName("*")).every((node) => {
    // A single list item or paragraph may have no newline after conversion,
    // yet its block relationship would still be lost in a pipe-table cell.
    if (
      (node as Element & { isBlock?: boolean }).isBlock ||
      node.nodeName === "BR"
    ) {
      return false;
    }
    // GFM pipe splitting and code-span escaping disagree for a backslash
    // immediately before a pipe. The coordinate fallback preserves both.
    return node.nodeName !== "CODE" || !/\\\|/.test(node.textContent ?? "");
  });
}

/** Convert simple tables to GFM; retain complex cell ownership as Markdown lists. */
export function addTableRules(service: TurndownService, gfm: boolean): void {
  const converted = new WeakMap<Element, string>();
  service.addRule("tableCellContent", {
    filter: ["th", "td", "caption"],
    replacement: (content, node) => {
      converted.set(node, content.trim());
      return content;
    },
  });
  service.addRule("structuredTable", {
    filter: "table",
    replacement: (_content, table, options) => {
      const bullet = options.bulletListMarker ?? "-";
      const rows = tableRows(table);
      const groupSize = new Map<Node | null, number>();
      for (const row of rows) {
        groupSize.set(row.parentNode, (groupSize.get(row.parentNode) ?? 0) + 1);
      }
      let occupied: { start: number; end: number; throughRow: number }[] = [];
      const cells: Cell[][] = rows.map((row, rowIndex) => {
        let column = 1;
        const remainingGroupRows = groupSize.get(row.parentNode) ?? 1;
        groupSize.set(row.parentNode, remainingGroupRows - 1);
        occupied = occupied.filter((range) => range.throughRow >= rowIndex);
        return Array.from(row.children)
          .filter((node) => ["TH", "TD"].includes(node.nodeName))
          .map((node) => {
            // HTML limits colspan to 1000 and rowspan to 65534. Track ranges,
            // not a potentially enormous rectangular array of missing values.
            const columnSpan = span(node, "colspan", 1000);
            const rowSpan =
              node.getAttribute("rowspan") === "0"
                ? remainingGroupRows
                : Math.min(span(node, "rowspan", 65534), remainingGroupRows);
            let overlap = occupied.find(
              (range) =>
                range.throughRow >= rowIndex &&
                range.start < column + columnSpan &&
                range.end >= column,
            );
            while (overlap) {
              column = overlap.end + 1;
              overlap = occupied.find(
                (range) =>
                  range.throughRow >= rowIndex &&
                  range.start < column + columnSpan &&
                  range.end >= column,
              );
            }
            const cell = {
              node,
              content: converted.get(node) ?? "",
              column,
              columnSpan,
              rowSpan,
            };
            if (rowSpan > 1) {
              occupied.push({
                start: column,
                end: column + columnSpan - 1,
                throughRow: rowIndex + rowSpan - 1,
              });
            }
            column += columnSpan;
            return cell;
          });
      });
      const caption = Array.from(table.children).find(
        (node) => node.nodeName === "CAPTION",
      );
      const captionMarkdown = caption ? converted.get(caption) : "";
      const header = cells[0] ?? [];
      const isSimple =
        gfm &&
        header.length > 0 &&
        header.every((cell) => cell.node.nodeName === "TH") &&
        cells.every(
          (row, index) =>
            row.length === header.length &&
            row.every(
              (cell) =>
                cell.columnSpan === 1 &&
                cell.rowSpan === 1 &&
                !cell.content.includes("\n") &&
                canRenderInline(cell.node) &&
                (index === 0 || cell.node.nodeName === "TD"),
            ),
        );
      if (isSimple) {
        // GFM splits at pipes even inside code spans, and then removes one
        // escape. Add that escape after each cell's Markdown conversion.
        const renderRow = (row: Cell[]) =>
          `| ${row.map((cell) => cell.content.replace(/\|/g, "\\|")).join(" | ")} |`;
        const lines = [
          renderRow(header),
          `| ${header.map(() => "---").join(" | ")} |`,
          ...cells.slice(1).map(renderRow),
        ];
        return `\n\n${captionMarkdown ? `${captionMarkdown}\n\n` : ""}${lines.join("\n")}\n\n`;
      }
      const lines = cells.map((row, rowIndex) => {
        const entries = row.map((cell) => {
          const columnLabel =
            cell.columnSpan > 1
              ? `Columns ${cell.column}-${cell.column + cell.columnSpan - 1}`
              : `Column ${cell.column}`;
          const qualifiers = [
            ...(cell.node.nodeName === "TH" ? ["header"] : []),
            ...(cell.rowSpan > 1
              ? [`rows ${rowIndex + 1}-${rowIndex + cell.rowSpan}`]
              : []),
          ];
          const label = `${columnLabel}${qualifiers.length ? ` (${qualifiers.join("; ")})` : ""}`;
          return `  ${bullet} ${label}${cell.content ? `\n\n${indent(cell.content, 4)}` : ""}`;
        });
        return `${bullet} Row ${rowIndex + 1}${entries.length ? `\n\n${entries.join("\n\n")}` : ""}`;
      });
      return `\n\nTable (cell coordinates refer to the supplied fragment):\n\n${captionMarkdown ? `${captionMarkdown}\n\n` : ""}${lines.join("\n\n")}\n\n`;
    },
  });
}
