# Issue #59: Partial clipboard selections

Parent: #46.

## Conversion policy

Only supplied selection content is converted. Leading orphan table cells receive enough table context to preserve row and column ownership. Clipboard metadata and trailing prose remain in order; raw-text elements are treated opaquely. No missing neighbors or source context are inferred.

## Regression coverage

Fragment tests cover partial inline/list text, adjacent cells, metadata, trailing prose, and table-looking raw text. Authored native browser captures are replayed in both conversion modes. The manual browser fixture supports selection, copy, and paste into the converter.

Validation results belong to the exact layer commit in the parent PR delivery matrix. All fixtures are authored synthetic examples.
