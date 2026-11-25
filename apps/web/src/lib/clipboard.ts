export interface ClipboardSource {
  html: string;
  text: string;
  hasImage?: boolean;
}

/** Prefer the rich representation; older browsers can still supply plain text. */
export async function readClipboard(
  clipboard: Clipboard | undefined = navigator.clipboard,
): Promise<ClipboardSource> {
  let readError: unknown;
  let hasImage = false;
  if (typeof clipboard?.read === "function") {
    try {
      const items = await clipboard.read();
      let html = "";
      let text = "";
      for (const item of items) {
        hasImage ||= item.types.some((type) => type.startsWith("image/"));
        for (const type of ["text/html", "text/plain"] as const) {
          if (
            !item.types.includes(type) ||
            (type === "text/html" ? html : text)
          )
            continue;
          try {
            const value = await (await item.getType(type)).text();
            if (type === "text/html") html = value;
            else text = value;
          } catch (error) {
            // One unavailable representation must not discard another valid one.
            readError = error;
          }
        }
      }
      if (html.trim() || text.trim()) return { html, text };
    } catch (error) {
      readError = error;
    }
  }
  if (typeof clipboard?.readText === "function") {
    try {
      const text = await clipboard.readText();
      return hasImage && !text.trim()
        ? { html: "", text, hasImage }
        : { html: "", text };
    } catch (error) {
      if (!hasImage) throw error;
      // A successful rich read still identifies image-only input when the
      // browser rejects its optional plain-text fallback.
    }
  }
  if (hasImage) return { html: "", text: "", hasImage };
  throw (
    readError ??
    new Error("Clipboard access is unavailable. Use Ctrl+V or ⌘+V to paste.")
  );
}

export class ClipboardCopyError extends Error {
  constructor() {
    super(
      "Unable to copy automatically. Select the Markdown and press Ctrl+C or ⌘+C.",
    );
    this.name = "ClipboardCopyError";
  }
}

/** Keep the fallback inside the user gesture and restore the previous editor focus. */
export async function copyMarkdown(
  markdown: string,
  clipboard: Clipboard | undefined = navigator.clipboard,
): Promise<void> {
  try {
    if (typeof clipboard?.writeText === "function") {
      await clipboard.writeText(markdown);
      return;
    }
  } catch {
    // Some browser permission policies disable the asynchronous clipboard API.
  }
  const previous = document.activeElement;
  const selection =
    previous instanceof HTMLTextAreaElement ||
    previous instanceof HTMLInputElement
      ? { start: previous.selectionStart, end: previous.selectionEnd }
      : null;
  const textarea = document.createElement("textarea");
  textarea.value = markdown;
  textarea.setAttribute("aria-label", "Markdown copy buffer");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  try {
    textarea.focus();
    textarea.select();
    if (
      typeof document.execCommand !== "function" ||
      !document.execCommand("copy")
    )
      throw new ClipboardCopyError();
  } catch {
    throw new ClipboardCopyError();
  } finally {
    textarea.remove();
    if (previous instanceof HTMLElement) previous.focus();
    if (
      selection &&
      selection.start !== null &&
      selection.end !== null &&
      (previous instanceof HTMLTextAreaElement ||
        previous instanceof HTMLInputElement)
    ) {
      previous.setSelectionRange(selection.start, selection.end);
    }
  }
}
