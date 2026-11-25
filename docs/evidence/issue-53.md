# Issue 53: safe ordinary code fences

Baseline: `b142f18561163edd9f9ad9ed37aa0a02e115947a`. This regression-only layer keeps Turndown's existing fenced-code conversion unchanged.

An authored Markdown-language code block contains standalone three- and five-backtick lines and a standalone tilde fence. Exact rendered HTML requires all source lines inside one code block with separate prose before and after it, in default GFM and with GFM disabled. There is no indented-code option in the public converter or browser UI.

Validation gate for the assembled prefix: `pnpm check`. This layer introduces no highlighted-code or inline-whitespace fixes.
