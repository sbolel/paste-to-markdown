# Issue #61: Nonportable links and images

Parent: #46.

## Conversion policy

Absolute HTTP(S) references remain usable; mailto and tel links remain links. Relative, protocol-relative, unsupported, and file references retain useful text with unresolved markers. Blob references retain temporary markers. A valid enclosing link survives an unresolved image. The source preview restricts reference schemes and removes srcset.

## Regression coverage

Tests cover unresolved bases, protocol-relative references, linked images, temporary references, and unsupported schemes in both modes. The browser fixture supports creating and revoking a synthetic blob image.

Validation results belong to the exact layer commit in the parent PR delivery matrix. All fixtures are authored synthetic examples.
