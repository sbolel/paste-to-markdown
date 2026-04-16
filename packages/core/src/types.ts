export interface ConversionOptions {
  /** Whether to use GitHub Flavored Markdown features */
  gfm?: boolean;
}

/** Minimal interface for clipboard-like data sources; avoids coupling to the DOM DataTransfer type. */
export interface ClipboardDataLike {
  getData(type: string): string;
}
