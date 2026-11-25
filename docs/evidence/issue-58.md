# Issue #58: Explicit breaks and whitespace

Explicit breaks inside a link emit a minimal br element, retaining repeated breaks without invalidating the Markdown label. Other prose breaks keep Markdown hard-break syntax. Non-breaking spaces remain U+00A0; inline and fenced code retain the earlier code preservation behavior. CSS pre-wrap source newlines and repeated ASCII spaces can collapse before conversion rules run; that readable fallback is explicit. Width-derived wrapping is not inferred.

All fixtures are authored synthetic HTML with example.invalid targets. The cumulative links/layout suite in this layer contains 29 scenarios, each with exact Markdown and rendered output assertions under default and GFM-disabled options. This document describes policy and test coverage; sequential stack validation and browser/native-copy evidence are recorded by the coordinator.
