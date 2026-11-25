# Issue #50: preserve wrapped checkbox state and ownership

The task helper decorates the existing list-item replacement so list indentation and ordered starts remain under Turndown's existing behavior. Each item emits its first owned checkbox state once; LABEL and SPAN wrappers and explicit label association do not discard state. Nested list items and table cells form ownership boundaries.

GFM emits a task marker for a labelled item. GFM-disabled conversion and additional checkboxes within one item use readable checked or unchecked state text. A checkbox followed only by a nested block uses readable state plus a block boundary rather than inventing a task label.

Exact rendered assertions cover checked/unchecked direct and wrapped inputs, explicit labels, nested ownership, multiple checkboxes, existing ordered-list start and continuation structure, and the first three interaction regressions: an unlabelled parent before a nested list, an unchecked state before a quote, and a table-cell checkbox inside an outer list item.

The later prose-composition interaction cases belong to issue #57 and are not introduced here. The coordinating task runs verification after applying this layer.
