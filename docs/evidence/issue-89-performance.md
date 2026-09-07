# Issue #89 performance measurement

Five alternating baseline/candidate cold-load pairs were collected for each Chromium profile. Each load used a fresh browser context, disabled service workers, no-store responses, identity encoding, local loopback, no CPU or network throttling, and a five-second no-interaction observation. Requests outside the local artifact origin were blocked. CLS uses the [web-vitals session-window calculation](https://github.com/GoogleChrome/web-vitals/blob/main/src/lib/LayoutShiftManager.ts).

| Profile | Baseline LCP ms | Candidate LCP ms | Baseline CLS |         Candidate CLS | Baseline encoded JS bytes | Candidate encoded JS bytes | Assessment                      |
| ------- | --------------: | ---------------: | -----------: | --------------------: | ------------------------: | -------------------------: | ------------------------------- |
| desktop |             188 |               72 |            0 | 0.0006858062195327308 |                    671794 |                     672552 | within-investigation-thresholds |
| mobile  |              68 |               40 |            0 |                     0 |                    671794 |                     672552 | within-investigation-thresholds |

Baseline artifact: 19941f909aecb80b3608637a01dd8832f72bcdfc. Candidate: 19941f9 with 27 working-tree change(s). Chromium 151.0.7922.34; DPR 1. The pre-change one-load capture in `issue-89-baseline-initial.json` is retained as context and is excluded from this five-pair comparison. Raw paired runs, LCP elements, resource encodings, ranges, and conditions are in the JSON evidence.

All measured medians were within the agreed investigation thresholds.
