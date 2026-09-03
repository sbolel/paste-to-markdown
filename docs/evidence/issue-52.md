# Issue #52: preserve complex table associations

Tables are represented as Markdown row and column lists so each supplied cell keeps its own converted content. Coordinates start at row 1 and column 1 within the supplied fragment; no absent values or header rows are invented. Only source TH cells receive the header qualifier.

Column spans retain their supported extent. Positive row spans and rowspan zero are limited to the remaining supplied row group for both coordinate labels and occupied columns. Blank cells remain blank, and following prose stays outside the table representation.

The structural scenarios cover headerless and one-row tables, blank cells, spanning headers, multiline paragraphs, single list/quote/code blocks, row-group boundaries, and malformed overlong row spans. The fallback serializes converted Markdown rather than source HTML attributes or active elements.

This layer establishes coordinate fallback for all tables. The following issue #51 layer adds GFM rendering for eligible simple tables. Assertions use the locked Markdown parser in both conversion modes; the coordinating task runs verification after applying this layer.
