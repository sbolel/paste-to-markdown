# Issue #56: Link and image escaping

Destination whitespace and angle/quote delimiter hazards are percent-encoded before existing backslash and parenthesis escaping. Text labels remain escaped through Turndown; image alt text and titles now use the same scoped escaping as links. Regression cases cover destination spaces, backslashes, parentheses, quoted titles, surrounding prose, and an escaped image. URL portability classification belongs to the later layer and is not introduced here.

All fixtures are authored synthetic HTML with example.invalid targets. The cumulative links/layout suite in this layer contains 32 scenarios, each with exact Markdown and rendered output assertions under default and GFM-disabled options. This document describes policy and test coverage; sequential stack validation and browser/native-copy evidence are recorded by the coordinator.
