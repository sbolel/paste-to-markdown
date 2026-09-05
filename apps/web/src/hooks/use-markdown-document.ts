import { useEffect, useMemo, useRef, useState } from "react";
import {
  convertClipboardData,
  type MarkdownFlavor,
} from "@paste-to-markdown/core";
import { toast } from "sonner";
import { readClipboard, type ClipboardSource } from "../lib/clipboard";
import {
  compactListSpacing,
  detectMarkdownExtensions,
  sanitizedPreview,
} from "../lib/markdown";

export type PreviewMode = "raw" | "preview";
export interface MarkdownPreferences {
  markdownFlavor: MarkdownFlavor;
  removeBlankLines: boolean;
}
interface DocumentState {
  source: ClipboardSource | null;
  generatedOutput: string;
  markdownOutput: string;
  previewMode: PreviewMode;
  preferences: MarkdownPreferences;
  preferencesReady: boolean;
}

const flavors: MarkdownFlavor[] = ["github", "commonmark", "strict", "custom"];
export function isMarkdownFlavor(value: unknown): value is MarkdownFlavor {
  return typeof value === "string" && flavors.includes(value as MarkdownFlavor);
}

function storedValue(key: string): unknown {
  try {
    const stored = window.localStorage.getItem(key);
    return stored === null ? undefined : JSON.parse(stored);
  } catch {
    return undefined;
  }
}

export function readPreferences(): MarkdownPreferences {
  const flavor = storedValue("markdown-flavor");
  const spacing = storedValue("remove-blank-lines");
  return {
    markdownFlavor: isMarkdownFlavor(flavor) ? flavor : "github",
    removeBlankLines: typeof spacing === "boolean" ? spacing : true,
  };
}

function generate(
  source: ClipboardSource | null,
  preferences: MarkdownPreferences,
): string {
  if (!source) return "";
  const markdown = convertClipboardData(
    {
      getData: (type) =>
        type === "text/html"
          ? source.html
          : type === "text/plain"
            ? source.text
            : "",
    },
    { flavor: preferences.markdownFlavor },
  );
  return preferences.removeBlankLines ? compactListSpacing(markdown) : markdown;
}

export function useMarkdownDocument() {
  const [documentState, setDocumentState] = useState<DocumentState>(() => ({
    source: null,
    generatedOutput: "",
    markdownOutput: "",
    previewMode: "raw",
    preferences: { markdownFlavor: "github", removeBlankLines: true },
    preferencesReady: false,
  }));
  const [lastCleared, setLastCleared] = useState<DocumentState | null>(null);
  const lastClearedRef = useRef<DocumentState | null>(null);
  const clipboardRequest = useRef(0);
  const [pendingPreferences, setPendingPreferences] =
    useState<MarkdownPreferences | null>(null);
  const {
    source,
    generatedOutput,
    markdownOutput,
    previewMode,
    preferences,
    preferencesReady,
  } = documentState;
  const { markdownFlavor, removeBlankLines } = preferences;
  const hasEdits = markdownOutput !== generatedOutput;

  useEffect(() => {
    const restored = readPreferences();
    setDocumentState((current) => ({
      ...current,
      preferences: restored,
      preferencesReady: true,
    }));
  }, []);

  useEffect(() => {
    if (!preferencesReady) return;
    // Only preferences are persistent. Source material and edits stay in memory.
    try {
      window.localStorage.setItem(
        "markdown-flavor",
        JSON.stringify(markdownFlavor),
      );
      window.localStorage.setItem(
        "remove-blank-lines",
        JSON.stringify(removeBlankLines),
      );
    } catch {
      // Storage may be blocked or full; in-memory preferences remain usable.
    }
  }, [markdownFlavor, removeBlankLines, preferencesReady]);

  const detectedExtensions = useMemo(
    () => detectMarkdownExtensions(markdownOutput),
    [markdownOutput],
  );
  const hasDocument = source !== null;
  const sanitizedPreviewHtml = useMemo(
    () =>
      preferencesReady && hasDocument && previewMode === "preview"
        ? sanitizedPreview(markdownOutput)
        : "",
    [hasDocument, markdownOutput, previewMode, preferencesReady],
  );

  function setMarkdownOutput(value: string) {
    clipboardRequest.current += 1;
    setDocumentState((current) => ({ ...current, markdownOutput: value }));
  }

  function setPreviewMode(value: PreviewMode) {
    if (value !== "raw" && value !== "preview") return;
    setDocumentState((current) => ({ ...current, previewMode: value }));
  }

  function importClipboard(clipboardSource: ClipboardSource): boolean {
    if (!preferencesReady) return false;
    clipboardRequest.current += 1;
    if (!clipboardSource.html.trim() && !clipboardSource.text.trim()) {
      if (clipboardSource.hasImage) {
        toast.info(
          "Image-only input is not supported. Copy text or a linked image instead.",
        );
        return false;
      }
      toast.error("No content found in clipboard");
      return false;
    }
    try {
      const nextSource = { ...clipboardSource };
      const nextOutput = generate(nextSource, preferences);
      if (!nextOutput.trim()) {
        toast.info(
          clipboardSource.hasImage
            ? "Image-only input is not supported. Copy text or a linked image instead."
            : "Nothing to convert — paste some rich text.",
        );
        return false;
      }
      setDocumentState((current) => ({
        ...current,
        source: nextSource,
        generatedOutput: nextOutput,
        markdownOutput: nextOutput,
      }));
      setPendingPreferences(null);
      toast.success("Content pasted successfully");
      return true;
    } catch {
      toast.error(
        "Unable to convert this content. Your existing Markdown has been kept.",
      );
      return false;
    }
  }

  async function pasteClipboard(): Promise<boolean> {
    if (!preferencesReady) return false;
    const request = ++clipboardRequest.current;
    try {
      const incoming = await readClipboard();
      if (request !== clipboardRequest.current) return false;
      return importClipboard(incoming);
    } catch {
      if (request !== clipboardRequest.current) return false;
      toast.error(
        "Unable to read clipboard. Please use Ctrl+V or ⌘+V to paste.",
      );
      return false;
    }
  }

  function applyPreferences(next: MarkdownPreferences): boolean {
    if (!preferencesReady) return false;
    clipboardRequest.current += 1;
    try {
      const nextOutput = generate(source, next);
      setDocumentState((current) => ({
        ...current,
        preferences: next,
        generatedOutput: nextOutput,
        markdownOutput: nextOutput,
      }));
      setPendingPreferences(null);
      return true;
    } catch {
      toast.error(
        "Unable to regenerate Markdown. Your existing text and settings have been kept.",
      );
      return false;
    }
  }

  function requestPreferences(next: MarkdownPreferences) {
    clipboardRequest.current += 1;
    if (
      next.markdownFlavor === markdownFlavor &&
      next.removeBlankLines === removeBlankLines
    ) {
      setPendingPreferences(null);
      return;
    }
    if (hasEdits) setPendingPreferences(next);
    else applyPreferences(next);
  }

  function handleFlavorChange(value: MarkdownFlavor) {
    if (!isMarkdownFlavor(value)) return;
    requestPreferences({ ...preferences, markdownFlavor: value });
  }

  function handleRemoveBlankLinesChange(value: boolean) {
    if (typeof value !== "boolean") return;
    requestPreferences({ ...preferences, removeBlankLines: value });
  }

  function confirmPreferences(): boolean {
    return pendingPreferences ? applyPreferences(pendingPreferences) : false;
  }

  function clear() {
    clipboardRequest.current += 1;
    if (!source && !markdownOutput) return;
    setLastCleared(documentState);
    lastClearedRef.current = documentState;
    setDocumentState((current) => ({
      ...current,
      source: null,
      generatedOutput: "",
      markdownOutput: "",
    }));
    setPendingPreferences(null);
    toast.success("Content cleared", {
      action: { label: "Undo", onClick: restore },
    });
  }

  function restoreSnapshot(snapshot: DocumentState) {
    clipboardRequest.current += 1;
    setDocumentState(snapshot);
    setLastCleared(null);
    lastClearedRef.current = null;
    setPendingPreferences(null);
    toast.success("Content restored");
  }

  function restore() {
    if (lastClearedRef.current) restoreSnapshot(lastClearedRef.current);
  }

  return {
    source,
    htmlInput: source?.html || source?.text || "",
    generatedOutput,
    markdownOutput,
    setMarkdownOutput,
    previewMode,
    setPreviewMode,
    markdownFlavor,
    removeBlankLines,
    preferencesReady,
    detectedExtensions,
    sanitizedPreviewHtml,
    hasEdits,
    canRestore: lastCleared !== null,
    pendingPreferences,
    importClipboard,
    pasteClipboard,
    handleFlavorChange,
    handleRemoveBlankLinesChange,
    confirmPreferences,
    cancelPreferences: () => setPendingPreferences(null),
    clear,
    restore,
  };
}
