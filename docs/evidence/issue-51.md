# Issue #51: preserve pipes in GFM table cells

With GFM enabled, rectangular tables with a supplied TH header row, TD body rows, no effective spans, and inline-only cells become Markdown pipe tables. Literal pipes are escaped after each cell is converted, including pipes inside emphasis and inline code.

Tables without a real header, with block content, spans, or irregular rows keep the coordinate fallback from issue #52. GFM-disabled conversion also keeps that fallback. A literal backslash immediately before a pipe inside code uses fallback because table delimiter escaping and code-span backslash preservation differ.

The assertions preserve the complete earlier table suite and add a parsed three-column header/body table with exact plain, emphasized, and inline-code values plus rendered markup. A separate code-backslash scenario verifies cell ownership and values under fallback.

The coordinating task runs verification after applying this layer.
