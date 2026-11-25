# Issue #47: Linked headings and semantic cards

Headings nested inside anchors become inline label content while existing emphasis and strong markup remain intact. Semantic block descendants give a linked card its own Markdown block. Paragraph labels, linked images, empty blocks, literal hash text, adjacent cards, and surrounding prose have exact raw and rendered regression cases. This layer does not infer CSS layout.

All fixtures are authored synthetic HTML with example.invalid targets. The cumulative links/layout suite in this layer contains 8 scenarios, each with exact Markdown and rendered output assertions under default and GFM-disabled options. This document describes policy and test coverage; sequential stack validation and browser/native-copy evidence are recorded by the coordinator.
