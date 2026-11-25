# Issue 55: inline-code values

Baseline: `b142f18561163edd9f9ad9ed37aa0a02e115947a`. Embedded and edge backticks already had safe delimiters, while repeated/boundary spaces and all-space values could collapse or disappear.

This layer preserves code before Turndown's prose whitespace collapse, derives code spans from authored text, chooses a delimiter longer than embedded backtick runs and supplies CommonMark padding where necessary. The blank-node callback retains nonempty all-space code even inside otherwise blank wrappers. Explicit inline BR becomes a separator before inline newline normalization.

Exact rendered assertions cover embedded and edge delimiters, leading/trailing/repeated/all-space values, entities, nested highlighting, plain prose beside code and inline BR in both GFM configurations. Inline CR/LF sequences normalize to spaces under the Markdown code-span contract. Empty inline code is outside these nonempty-value scenarios. Ordinary fenced-code regression coverage from issue 53 remains included.

Validation gate for the assembled prefix: `pnpm check`. Structured PRE extraction and decorative gutters belong to issue 54.
