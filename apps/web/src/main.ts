import DOMPurify from "dompurify";
import { convertClipboardData } from "@paste-to-markdown/core";

function getRequiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (element === null) {
    throw new Error(`Missing required element: #${id}`);
  }
  if (!(element instanceof HTMLElement)) {
    throw new Error(`Required element is not an HTMLElement: #${id}`);
  }
  return element as T;
}

const sourceEl = getRequiredElement<HTMLDivElement>("source");
const outputEl = getRequiredElement<HTMLTextAreaElement>("output");
const clearBtn = getRequiredElement<HTMLButtonElement>("clear-btn");
const copyBtn = getRequiredElement<HTMLButtonElement>("copy-btn");
const statusEl = getRequiredElement<HTMLDivElement>("status");

function sanitizeAndSetHtml(container: HTMLElement, html: string): void {
  container.innerHTML = DOMPurify.sanitize(html, {
    // The clipboard does not identify a trusted source base. Do not let the
    // source preview resolve relative references against this application.
    ALLOWED_URI_REGEXP: /^(?:https?:\/\/|mailto:|tel:)/i,
    FORBID_ATTR: ["srcset"],
  });
}

let statusTimeout: ReturnType<typeof setTimeout> | undefined;

function showStatus(
  message: string,
  type: "success" | "error" | "info" = "info",
): void {
  clearTimeout(statusTimeout);
  statusEl.textContent = message;
  statusEl.className = `status status-${type}`;
  statusTimeout = setTimeout(() => {
    statusEl.textContent = "";
    statusEl.className = "status";
  }, 2500);
}

function handlePaste(event: ClipboardEvent): void {
  event.preventDefault();

  const clipboardData = event.clipboardData;
  if (!clipboardData) {
    showStatus("No clipboard data available.", "error");
    return;
  }

  const markdown = convertClipboardData(clipboardData);

  if (!markdown) {
    const hasImage = [...clipboardData.items].some((item) =>
      item.type.startsWith("image/"),
    );
    showStatus(
      hasImage
        ? "Image-only input is not supported. Copy text or a linked image instead."
        : "Nothing to convert — paste some rich text.",
      "info",
    );
    return;
  }

  const html = clipboardData.getData("text/html");
  if (html.trim()) {
    sanitizeAndSetHtml(sourceEl, html);
  } else {
    sourceEl.textContent = clipboardData.getData("text/plain");
  }

  outputEl.value = markdown;
  showStatus("Converted!", "success");
}

function handleClear(): void {
  sourceEl.replaceChildren();
  outputEl.value = "";
  showStatus("Cleared.", "info");
}

async function handleCopy(): Promise<void> {
  const text = outputEl.value;
  if (!text) {
    showStatus("Nothing to copy.", "info");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showStatus("Copied to clipboard!", "success");
  } catch {
    outputEl.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      // Some browser security policies throw instead of returning false.
    }
    if (!copied) {
      showStatus(
        "Unable to copy automatically. Select the text and copy it manually.",
        "error",
      );
      return;
    }
    showStatus("Copied!", "success");
  }
}

document.addEventListener("paste", handlePaste);
clearBtn.addEventListener("click", handleClear);
copyBtn.addEventListener("click", handleCopy);

sourceEl.focus();
