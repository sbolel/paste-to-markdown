# Issue #48: Explicit CSS layout boundaries

Only explicit inline block display values on spans and anchors add boundaries. Semantic grids, styled cards, empty styled blocks, inline display overrides, and DOM order have regression cases. CSS order, generated content, computed styles, and grid geometry are not reconstructed.

All fixtures are authored synthetic HTML with example.invalid targets. The cumulative links/layout suite in this layer contains 15 scenarios, each with exact Markdown and rendered output assertions under default and GFM-disabled options. This document describes policy and test coverage; sequential stack validation and browser/native-copy evidence are recorded by the coordinator.
