# Issue 54: highlighted and structured code

Baseline: `b142f18561163edd9f9ad9ed37aa0a02e115947a`. Highlight spans around literal newlines already retained text. BR and line wrappers flattened, code siblings could be omitted, and decorative gutters could enter the result.

This layer extends the inline helper with structural PRE extraction. It preserves every PRE descendant's authored text, explicit line boundaries, indentation, blank lines and available language class; neighboring CODE containers do not lose source. Ordinary single-container fences continue to use Turndown. Structured fences select safe delimiters.

Gutter exclusion requires both the exact gutter class token and aria-hidden=true, plus location inside or adjacent to PRE. Numeric literals, other hidden code text and unrelated gutter-like content remain. Line reconstruction recognizes BR, DIV/P and line/code-line wrappers, without inferring external CSS layout.

Exact rendered Markdown and code/paragraph-token assertions cover highlighted wrappers, empty lines, final empty lines, authored LF boundaries, sibling CODE containers, adjacent raw text, language metadata and gutter scope in both GFM configurations. The full code suites now include every issue-53/54/55 scenario from the immutable integration snapshot. marked's default renderer normalizes a final code LF, so final-empty-line cases inspect lexer text as well.

Validation gate for the assembled prefix: `pnpm check`. These prepared files do not assert that the prefix gate has already run.
