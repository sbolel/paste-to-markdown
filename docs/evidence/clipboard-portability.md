# Clipboard and portable references: children 59–61

> Historical evidence: this report retains pre-stack lane and combined-working-tree observations. Any test counts, pass statements or runtime details below apply to those recorded runs, not to an individual PR or cumulative stack prefix. Fresh results belong in [the stack delivery report](../formatting-delivery.md#combined-verification-and-delivery-results).


Baseline: `b142f18561163edd9f9ad9ed37aa0a02e115947a`, Node 24.20.0,
pnpm 10.33.0, Turndown 7.2.2. Direct API runs test both `gfm: true` and
`gfm: false`, with Marked as the independent renderer. The historical baseline run recorded 34 tests and
`pnpm check` passing. The core has no source/base URL parameter.

## Baseline evidence

`clipboard-portability.test.ts` initially reproduced 12 failing portability
assertions and 6 already-passing clipboard assertions. Representative exact output:

| Input HTML                                                                                         | Raw baseline Markdown                                                     | Consequence                                                 |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `<a href="../guide">Read the guide</a>`                                                            | `[Read the guide](../guide)`                                              | A consumer can silently resolve against the wrong location. |
| `<a href="https://example.invalid/details"><img src="/media/sample.png" alt="Sample diagram"></a>` | `[![Sample diagram](/media/sample.png)](https://example.invalid/details)` | The image reference lacks an identified source.             |
| `<img src="blob:https://example.invalid/synthetic" alt="Sample diagram">`                          | `![Sample diagram](blob:https://example.invalid/synthetic)`               | Temporary image has no useful portable fallback.            |
| `<td>A</td><td>Cell B</td>`                                                                        | `ACell B`                                                                 | A real selection across two cells concatenates values.      |

A portable image with destination `https://example.invalid/a(b).png`, alt
`A [diagram]`, and title `A "draft"` renders with the wrong truncated destination
`https://example.invalid/a(b` and exposes the rest as prose. A regression checks
its complete rendered image element.

## Browser baseline

Executed native keyboard copy/paste from the authored fixture page, plus prepared
plain-text and synthetic PNG clipboard payloads. In-app Chromium user agent
reports version 152.0.0.0; host macOS is 26.7 (25G227). The compatibility user agent
reports an older macOS version and is not the host OS evidence.

Exact observed payloads and raw results are in `browser-baseline.json`.

- Partial bold word exposes HTML `beta`, plain `beta`; result `beta`. The browser
  did not provide a bold wrapper, so conversion does not invent one.
- Partial list text exposes `cond item`; single cell text exposes `Cell B`.
  These already pass and include no neighbor content.
- Selection across cells exposes HTML `<td>A</td><td>Cell B</td>` and plain
  `A\tCell B`. Result `ACell B` fails the boundary criterion.
- Semantic card grids, visual fragments and explicit line breaks preserve DOM
  content order. CSS pre-wrap authored whitespace collapses under the documented
  fallback; width-dependent wrapping must not create hard breaks.
- Plain-only payload preserves its exact characters, HTML-looking text and final
  newline. It is not parsed as HTML.
- Image-only payload exposes `Files`, no HTML/plain text. Existing output remains
  intact, but the old generic empty-content feedback does not identify images.

The app only exposes native paste, Clear and Copy. Clipboard-read/Paste buttons,
mode selectors, list-cleanup controls and permission-denied reads are not available
and are N/A. Core GFM settings are tested through the API only.

## Local decisions and correction

- Add only missing table context around standalone cell/row fragments, preserving
  supplied cells; coordinate fallback is shared with the table implementation.
- Prefer nonblank accessible HTML; preserve plain text byte-for-byte otherwise.
  Source display uses the same nonblank test. Image-only feedback is explicit and
  keeps existing source/output intact.
- Absolute HTTP(S) references are portable; links also retain mailto/tel. Other
  references preserve labels/alt text plus an `unresolved` or `temporary` marker.
  An absolute linked-image destination remains usable even if the image is not.
- No source origin is guessed from the app, `<base>` tags, protocol-relative paths,
  or native platform clipboard metadata. Resolve relative URLs before calling
  the API if a trusted source base is known. Image upload, data/file URL import,
  asset persistence and RTF import are outside the supported contract.

## Historical integrated browser outcome

`browser-integrated.json` records successful native partial selections, HTML/plain
preference, blank-HTML fallback, image-only preservation with explicit feedback,
revoked blob-image fallback, and identical narrow/wide whitespace output. The
combined native rich copy retains two separate linked cards, checked/unchecked
wrapped tasks, a three-column GFM table including code pipes, highlighted code
lines/indentation without the decorative gutter, and inline code boundary spaces.
Generated blob identifiers in the saved record are replaced with a synthetic
`example.invalid` identifier; types and Markdown remain exact.

The source preview also removed relative href/src and srcset references before
insertion, preventing resolution against the app origin while preserving labels,
alt text and usable absolute links. Its prior behavior was reproduced explicitly.

Independent review added metadata-prefixed cell fragments and cells followed by
prose. Only the leading balanced run of orphan table elements receives context;
trailing prose remains outside the wrapper, preserving source order. These review
cases have exact regression assertions. Raw-text/RCDATA bodies are treated as
opaque; unmatched raw-text fragments are left to the HTML parser without adding
context. The independent reviewer rechecked the script/textarea counterexamples.
General malformed-HTML repair is not
promised.

The browser harness is `apps/web/fixtures/clipboard.html`, served by `pnpm dev` at
the displayed development origin under the application base path. It is not a
production build entry. Select a fixture, use native Copy, then paste into the
embedded app. The evidence panel displays the exposed MIME types, HTML/plain
payload and resulting Markdown. Use the width and temporary-image controls for
the corresponding cases. Only authored synthetic data belongs in the harness.

Fresh stack-prefix and final integration results belong in the stack delivery
report; the observations above remain historical.
