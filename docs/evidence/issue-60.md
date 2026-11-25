# Issue #60: Clipboard input paths

Parent: #46.

## Conversion policy

Meaningful HTML takes precedence. Whitespace-only HTML falls back to unchanged plain text. Image-only paste shows an unsupported-input message and retains existing source/output. The source preview follows the same HTML/plain-text decision as conversion.

## Regression coverage

Tests cover literal plain text and HTML precedence in both modes. Browser acceptance exercises ordinary paste, blank HTML, image-only input, Copy, and Clear.

Validation results belong to the exact layer commit in the parent PR delivery matrix. All fixtures are authored synthetic examples.
