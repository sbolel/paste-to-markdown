# Issue #57: Semantic prose and list markers

Headings, strong text, and lists follow semantic HTML. Font styling alone stays plain. Paragraph and block-container rules escape numeric list markers assembled across inline nodes. Direct prose runs beside real lists or preformatted code are wrapped before conversion so marker escaping cannot rewrite those structured blocks. The structure interaction suite retains the three earlier task/list tests and adds the three prose/list/code cases.

All fixtures are authored synthetic HTML with example.invalid targets. The cumulative links/layout suite in this layer contains 22 scenarios, each with exact Markdown and rendered output assertions under default and GFM-disabled options. This document describes policy and test coverage; sequential stack validation and browser/native-copy evidence are recorded by the coordinator.
