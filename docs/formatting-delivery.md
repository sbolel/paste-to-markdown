# Formatting reliability stack: issue 46

## Scope and baseline

The source baseline is `b142f18561163edd9f9ad9ed37aa0a02e115947a`.
The reviewed combined working-tree implementation was divided into fifteen child
PR layers and one parent documentation layer. Production conversion belongs to
`packages/core`; the native paste interface belongs to `apps/web`.

Each child owns its complete implementation, regression tests and behavior policy.
The parent PR for #46 records the combined result and delivery state; it does not
supply omitted child fixes. The previously merged stack is the source baseline,
not this delivery. PR numbers, current heads and publication state belong in the
fresh verification record below.

## Layer order and ownership

The order below is the cumulative implementation order. Prefixes 01–10 passed
`pnpm check` during assembly. The user then requested that checks not be rerun;
prefixes 11–16 were not rerun. Each row's evidence file records that child's
scenarios and policy. Historical development results remain distinct from exact
prefix validation.

| Layer | Child / parent issue | Owner | Complete layer responsibility | Issue evidence |
| --- | --- | --- | --- | --- |
| 01 | #49 | Structure | Regression-only ordered starts, nested hierarchy, continuation paragraph/quote/code ownership and siblings. Introduces the locked marked test dependency; ordinary list conversion stays unchanged. | [Issue 49](evidence/issue-49.md) |
| 02 | #53 | Code | Regression-only standalone backtick/tilde fence containment and separate surrounding prose; existing Turndown fence handling stays unchanged. | [Issue 53](evidence/issue-53.md) |
| 03 | #55 | Code | Inline-code delimiters, boundary/repeated/all-space values, blank wrappers and explicit inline BR normalization. | [Issue 55](evidence/issue-55.md) |
| 04 | #54 | Code | Highlighted PRE line boundaries, indentation, language, blank lines, all CODE siblings and narrowly identified decorative gutters. | [Issue 54](evidence/issue-54.md) |
| 05 | #52 | Structure | Coordinate fallback for complex/headerless/empty tables, cell-owned blocks, effective spans and row-group boundaries. | [Issue 52](evidence/issue-52.md) |
| 06 | #51 | Structure | Simple GFM tables and literal pipes in plain/emphasized/code cells; unsafe code-backslash combinations retain the coordinate fallback. | [Issue 51](evidence/issue-51.md) |
| 07 | #50 | Structure | Direct/wrapped checkbox state, explicit labels, nearest-item ownership and duplicate prevention; block-only tasks use readable state, and table-cell state remains local. | [Issue 50](evidence/issue-50.md) |
| 08 | #47 | Links | Complex linked-card labels, linked headings, images, empty blocks and boundaries between adjacent cards. | [Issue 47](evidence/issue-47.md) |
| 09 | #48 | Links | Semantic/explicit block-display card boundaries and associations in DOM order. | [Issue 48](evidence/issue-48.md) |
| 10 | #57 | Links | Semantic formatting controls, conservative visual-formatting policy and escaped composed numeric prose beside real lists/code. | [Issue 57](evidence/issue-57.md) |
| 11 | #58 | Links | Explicit and repeated line breaks inside links; prose BR/NBSP controls, width independence and the CSS-only whitespace fallback. | [Issue 58](evidence/issue-58.md) |
| 12 | #56 | Links | Link/image punctuation, destination encoding, quoted titles and independent adjacent references. | [Issue 56](evidence/issue-56.md) |
| 13 | #59 | Clipboard | Actual partial word/list/cell selections; orphan-table context with metadata, trailing prose and opaque raw-text boundaries preserved. | [Issue 59](evidence/issue-59.md) |
| 14 | #60 | Clipboard | HTML/plain preference, literal plain text, matching source display and image-only feedback that preserves existing work. | [Issue 60](evidence/issue-60.md) |
| 15 | #61 | Clipboard | Relative/temporary-reference policy, useful fallback labels/alt text, independent linked-image targets, preview URI restrictions and user-facing conversion summaries. | [Issue 61](evidence/issue-61.md) |
| 16 | Parent #46 | Coordinator | Stack mapping, historical evidence index, combined verification and delivery status only. All child fixes are already present in layers 01–15. | This report |

Shared helpers arrive with their first owning issue and are extended by the next
owner: inline code before structured PRE extraction, complex table fallback
before simple GFM table rendering, semantic linked-card rules before CSS/prose
rules, and escaping before reference classification. Mixed regression files are
cumulative; later cases are not imported into an earlier prefix.

The review corrections follow the same ownership: effective table spans belong
to #52; nested-only tasks and table-cell checkboxes to #50; sibling and blank PRE
content to #54; inline BR to #55; composed prose beside lists/code to #57; and
metadata/trailing-prose/raw-text fragment boundaries to #59.

## Combined verification and delivery results

| Layer | Issue | Commit | Local checks |
|---:|---:|---|---|
| 1 | #49 | `0b8733052134` | 36 tests; full check passed |
| 2 | #53 | `2d59d3f52e16` | 38 tests; full check passed |
| 3 | #55 | `c8ee1fdc46c2` | 66 tests; full check passed |
| 4 | #54 | `9ad3e1930a5f` | 108 tests; full check passed |
| 5 | #52 | `d4e35d0a990b` | 139 tests; full check passed |
| 6 | #51 | `cf084aa29153` | 141 tests; full check passed |
| 7 | #50 | `9f4646277f3b` | 159 tests; full check passed |
| 8 | #47 | `80dcd3d84563` | 175 tests; full check passed |
| 9 | #48 | `5d16cf7d6901` | 189 tests; full check passed |
| 10 | #57 | `b3b491f7b47b` | 209 tests; full check passed |
| 11 | #58 | `7f51d7d97f75` | Not rerun at user request |
| 12 | #56 | `798fc473c2ec` | Not rerun at user request |
| 13 | #59 | `ef424e7f0f7b` | Not rerun at user request |
| 14 | #60 | `b16cf976862b` | Not rerun at user request |
| 15 | #61 | `e3cc40bc4e9b` | Not rerun at user request |
| 16 | #46 | Parent documentation commit | Not rerun at user request |

The parent PR contains the live PR-number, base-branch, and full commit mapping after publication.

The table records the actual child commits and the user-requested check
override. The parent PR supplies publication URLs and its own commit SHA.
Prefixes 01–10 passed with 36, 38, 66, 108, 139, 141, 159, 175,
189 and 209 tests respectively. Checks for prefixes 11–16 were not rerun at the
user's request. The historical 277-test combined development run, browser
captures and audit observations are development evidence, not a new final-layer
pass. No new browser or audit run is required for this publication.

The historical combined native-copy check covered linked-card boundaries,
wrapped task states, three-column pipe preservation, highlighted code and inline
boundary spaces together. Historical targeted rechecks included
metadata-prefixed cells followed by prose, nested-only task ownership, sibling
CODE containers and inline BR. Publication, merge, release and issue closure are
recorded as separate observed states; test results do not establish those states.
Record actual results and artifact links rather than marking unrun checks passed.

## Historical evidence and controlled fixtures

The following reports retain observations made before the implementation was
split into PR layers. Their counts, runtime statements and local-validation
results apply to those historical lane/combined runs. They are not fresh results
for a published PR or any cumulative prefix.

- [Links/layout report](evidence/links-layout.md): authored input, exact baseline
  and resulting Markdown/rendered output for #47, #48 and #56–58.
- [Code report](evidence/code.md): authored input and raw/rendered outcomes for
  #53–55, including existing fence/delimiter behavior and normalization limits.
- [Structure report](evidence/structure.md): ordered-list ownership, tasks, GFM
  pipe cells and coordinate table fallback for #49–52.
- [Clipboard/reference report](evidence/clipboard-portability.md): native input
  observations, selected-content boundaries, portability policy and review cases.
- [Original browser baseline](evidence/browser-baseline.json): actual payloads
  copied from authored fixtures against the source baseline. These records also
  supply the observed-fragment regression suite.
- [Historical combined browser capture](evidence/browser-integrated.json): the
  pre-stack combined working tree, with an explicit historical phase marker on
  every record. HTML/plain/Markdown/rendered fields retain their recorded values.

The dev-only harness is `apps/web/fixtures/clipboard.html`, served with
`pnpm dev` at the displayed application base path. Select a controlled fixture,
use native Copy, then paste into the embedded app. Its evidence panel displays
MIME types, HTML/plain payloads and resulting Markdown. Width and temporary-image
controls exercise their corresponding cases. Only authored synthetic content
belongs in the harness; reference URLs use `example.invalid`. Previously captured
blob identifiers were normalized to a synthetic identifier as documented in the
historical report.

## Supported behavior and limits

- Semantic HTML is converted in DOM order. Explicit block-style wrappers retain
  boundaries, but computed CSS, CSS ordering, generated content, grid geometry
  and visual heading/list inference are not reconstructed.
- Explicit BR and semantic PRE/code provide line boundaries. NBSP remains NBSP.
  CSS-only pre-wrap uses ordinary prose normalization; container width does not
  create hard breaks. CommonMark normalizes inline-code line endings to spaces.
  Final-empty-code-line assertions use lexer values where the Markdown renderer
  normalizes a trailing LF.
- GFM tables require real headers and a safe rectangular inline representation.
  Other supplied cells use explicit row/column Markdown lists. Coordinates refer
  to the selected fragment; headers, missing values and neighboring cells are
  not invented. General malformed-HTML repair is not promised.
- Checkbox state stays with the owning item or cell. GFM-disabled conversion and
  an item containing only a checkbox followed by nested blocks use readable state
  without inventing an inline task label.
- Absolute HTTP(S) links/images are retained; links also support mailto/tel.
  Relative, protocol-relative, data/file and other unsupported references receive
  useful unresolved markers, and blob references receive temporary markers. The
  API has no trusted-base parameter and does not infer an origin from the app or
  an embedded base tag. Asset import and persistence are outside this contract.
- The app exposes native paste, Copy Markdown and Clear. It has no mode selector,
  clipboard-read/Paste button, list-cleanup setting or rendered preview. API tests
  cover both GFM configurations; unavailable UI controls are N/A. Image-only
  paste preserves existing work with explicit feedback. Native platform clipboard
  headers and RTF are outside the browser text/html contract.
- Historical browser observations cover in-app Chromium on macOS. They do not
  establish compatibility with other browser engines or native clipboard formats.

## Evidence integrity

Each result records the tested revision when available and input path, API option,
runtime or browser, controlled fixture, exposed MIME types when applicable, raw
Markdown, rendered semantics, and any normalization. Preserve source-order and
ownership assertions when comparing prefixes. Keep personal clipboard content,
credentials, provider-specific source material and machine filesystem paths out
of fixtures, evidence, PR bodies and committed documentation.
