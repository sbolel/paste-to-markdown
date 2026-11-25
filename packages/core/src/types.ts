export type MarkdownFlavor = "github" | "commonmark" | "strict" | "custom";

export interface ConversionOptions {
  /** Whether to use GitHub Flavored Markdown features */
  gfm?: boolean;
  /** Markdown dialect preset; when set, takes precedence over `gfm`. */
  flavor?: MarkdownFlavor;
}

/** Minimal interface for clipboard-like data sources; avoids coupling to the DOM DataTransfer type. */
export interface ClipboardDataLike {
  getData(type: string): string;
}
