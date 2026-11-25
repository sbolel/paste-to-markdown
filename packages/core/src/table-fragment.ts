/**
 * Supply context for a leading run of balanced, orphan table elements emitted
 * by browser selections. Keep metadata and following prose outside the table
 * so HTML foster parenting cannot reorder the selected text. Other HTML is
 * left to Turndown's parser; this is not a general malformed-HTML repair pass.
 */
export function withTableContext(html: string): string {
  const tags = [
    ...html.matchAll(
      /<!--[\s\S]*?-->|<(script|style|textarea|title|xmp|iframe|noembed|noframes)\b(?:"[^"]*"|'[^']*'|[^'">])*>[\s\S]*?<\/\1\s*>|<![^>]*>|<\/?([a-z][\w:-]*)\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi,
    ),
  ];
  const tagName = (tag: RegExpMatchArray) =>
    (tag[1] || tag[2] || "").toLowerCase();
  // Leave unclosed raw-text elements to the HTML parser. Never interpret their
  // contents as context delimiters or insert a wrapper inside an opaque body.
  if (
    tags.some(
      (tag) =>
        !tag[1] &&
        /^(script|style|textarea|title|xmp|iframe|noembed|noframes|plaintext)$/.test(
          tagName(tag),
        ),
    )
  )
    return html;
  let first = 0;
  let cursor = 0;
  while (first < tags.length) {
    const tag = tags[first];
    if (html.slice(cursor, tag.index).trim()) return html;
    const name = tagName(tag);
    if (
      tag[0].startsWith("<!") ||
      (name && ["meta", "base", "link"].includes(name))
    ) {
      cursor = tag.index + tag[0].length;
      first++;
    } else break;
  }

  const name = tags[first] ? tagName(tags[first]) : "";
  const family =
    name === "td" || name === "th"
      ? ["td", "th"]
      : name === "tr"
        ? ["tr"]
        : name && ["thead", "tbody", "tfoot"].includes(name)
          ? ["thead", "tbody", "tfoot"]
          : [];
  if (!family.length || tags[first][0].startsWith("</")) return html;

  const start = tags[first].index;
  let end = start;
  let depth = 0;
  cursor = start;
  for (const tag of tags.slice(first)) {
    const isMember = family.includes(tagName(tag));
    const closing = tag[0].startsWith("</");
    if (depth === 0) {
      if (html.slice(cursor, tag.index).trim()) break;
      if (tag[0].startsWith("<!--")) {
        cursor = tag.index + tag[0].length;
        continue;
      }
      if (!isMember || closing) break;
    }
    if (isMember) {
      if (/\/\s*>$/.test(tag[0])) return html;
      depth += closing ? -1 : 1;
    }
    cursor = tag.index + tag[0].length;
    if (depth === 0) end = cursor;
  }
  if (depth !== 0 || end === start) return html;

  const [open, close] = family.includes("td")
    ? ["<table><tr>", "</tr></table>"]
    : ["<table>", "</table>"];
  return (
    html.slice(0, start) +
    open +
    html.slice(start, end) +
    close +
    html.slice(end)
  );
}
