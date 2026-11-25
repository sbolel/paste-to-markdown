# Issue 49: nested-list ownership

Baseline: `b142f18561163edd9f9ad9ed37aa0a02e115947a`. This layer adds regression coverage for existing Turndown behavior; it does not change conversion rules.

The authored fixture covers an ordered list starting at 9, a nested unordered list, a deeper ordered list starting at 3, and paragraph, quotation and fenced-code continuation blocks before a separate outer sibling. Exact rendered HTML checks the complete hierarchy in default GFM and with GFM disabled.

The locked `marked` devDependency supplies the Markdown parser for structural assertions throughout the stack. It is not a production dependency.

Validation gate for the assembled prefix: `pnpm check`. Earlier integrated evidence is not a substitute for that prefix gate.
