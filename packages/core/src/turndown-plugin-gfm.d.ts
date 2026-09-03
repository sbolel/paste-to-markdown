declare module "turndown-plugin-gfm" {
  import TurndownService from "turndown";

  export const tables: TurndownService.Plugin;
  export const highlightedCodeBlock: TurndownService.Plugin;
}
