# Purple Restoration Commit and PR Plan

> **For agentic workers:** Use `superpowers:executing-plans` to carry out this plan sequentially after the user requests execution. Commit assembly shares the Git index and lockfile; do not stage or commit in parallel.

**Goal:** Package the completed restoration into four reviewable commits and open one GitHub PR using `.github/pull_request_template.md`.

**Architecture:** Commit shared conversion support first, then the complete canonical React application, then the production browser gate, and finally documentation. Preserve the tested implementation while dividing shared configuration and dependency changes by responsibility.

**Tech Stack:** React 19, Tailwind 4, Vite 8, TypeScript 6, Turndown, marked, DOMPurify, Vitest, Playwright, Node 24, and pnpm 10.33.0.

**Spec:** The approved “Restore the purple application and its interactions” plan in this task. This document packages its completed implementation; it does not propose additional application changes.

## Global constraints

- Work on `sbolel/restore-purple-ui`, based on `b142f18561163edd9f9ad9ed37aa0a02e115947a`. GitHub `main` was rechecked at that SHA when this plan was written; recheck before execution.
- Use one PR to `sbolel/paste-to-markdown:main`. No open PR for this branch existed when checked.
- Preserve the reference root application, conversion fixes from the merged stack, DOMPurify version, production CSP, `/paste-to-markdown/` base, Pages artifact location, and release pipeline.
- Preserve the current locked dependency resolutions. Keep each manifest change and its complete lockfile graph together.
- Keep build output, browser downloads, temporary test reports, raw clipboard material, and machine-specific paths out of commits. Fixtures remain synthetic.
- Use Conventional Commits. The repository allows squash merging only, so these four commits organize PR review; the eventual squash commit uses the PR title.
- This is a plan. A subsequent execution request must authorize commits, pushing, and PR creation under `AGENTS.md`. Merging and deployment are outside this plan.

## Commit sequence

| Order | Commit message                                               | Result                                                                                                     |
| ----- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| 1     | `fix(core): restore Markdown presets and GitHub tables`      | Shared conversion supports all four presets without changing omitted-option behavior.                      |
| 2     | `fix(web): restore purple application and interactions`      | The production web package renders the complete purple application and preserves document state correctly. |
| 3     | `test(web): gate releases on production browser checks`      | Chromium, WebKit, and mobile checks exercise the actual built application before release.                  |
| 4     | `docs(web): document restored app and verification workflow` | Contributors have accurate application ownership, setup, and validation instructions.                      |

### 1. Shared conversion

**Files:**

- `packages/core/package.json`
- `packages/core/src/convert.ts`
- `packages/core/src/index.ts`
- `packages/core/src/types.ts`
- `packages/core/src/turndown-plugin-gfm.d.ts`
- `packages/core/tests/convert.test.ts`
- `apps/web/tsconfig.json`: only the include of `../../packages/core/src/**/*.d.ts`.
- `pnpm-lock.yaml`: only the core importer's `turndown-plugin-gfm` dependency and that package's resolution and snapshot entries.

**Boundary:** The ambient declaration include is needed now because the existing web package resolves core source through an alias. Leave React/JSX configuration and all web dependencies for commit 2.

- [ ] Stage the listed files and partial-file changes.
- [ ] Validate the isolated staged snapshot with a frozen install and the then-current `pnpm check`; expect 42 core tests and a working existing web build.
- [ ] Inspect the staged diff, including dependency entries, and create commit 1 using the message above.

### 2. Canonical purple application

**Files:**

- All current `apps/web/src/**` additions, including the React entry, App, components, hooks, clipboard/editor/preview helpers, styles, About entry, and Vite declarations.
- Removal of `apps/web/src/main.ts` and `apps/web/src/style.css`.
- `apps/web/index.html` and `apps/web/about/index.html`.
- `apps/web/vite.config.ts` and the remaining `apps/web/tsconfig.json` changes.
- `public/font-licenses/**`.
- `apps/web/vitest.config.ts` and `apps/web/tests/unit/**`.
- `scripts/check-pages-artifact.mjs`.
- Root `package.json`: only the `test` script change to include web unit tests.
- `apps/web/package.json`: all current changes except `test:e2e` and the `@playwright/test` dependency.
- `pnpm-lock.yaml`: the remaining React/UI/font/Tailwind/Vitest/jsdom dependency graph, excluding Playwright. Include associated shared peer-resolution updates, such as `jiti` and the core Vitest snapshot.

**Boundary:** Keep the application entry switch, its imported components/helpers, local fonts, both pages' feature metadata, and the artifact checker together. The old checker rejects the restored feature claims. Separating these pieces would leave an incomplete application or broken build.

- [ ] Stage the runtime migration and web unit coverage together.
- [ ] Validate the isolated staged snapshot with a frozen install and its `pnpm check`; expect 42 core tests, 57 web unit tests, and successful production artifact validation.
- [ ] Inspect the staged diff and create commit 2 using the message above.

### 3. Production browser gate

**Files:**

- `apps/web/playwright.config.ts`.
- `apps/web/tests/e2e/fixtures.ts`, `clipboard.spec.ts`, `document.spec.ts`, `editor.spec.ts`, and `preferences.spec.ts`.
- `.github/workflows/cicd.yml` and `.gitignore`.
- Root `package.json`: `check` and `test:e2e` script changes.
- `apps/web/package.json`: `test:e2e` and `@playwright/test`.
- `pnpm-lock.yaml`: the web Playwright importer and package/snapshot entries for `@playwright/test`, `playwright`, `playwright-core`, and its optional `fsevents@2.3.2` dependency.

- [ ] Stage the browser suite, installation step, scripts, and dependency graph together.
- [ ] Revalidate every external `uses:` in the modified CI workflow against the official upstream latest stable release and its full 40-character commit SHA, preserving the release-tag comments. Revalidate again before publishing if upstream state changes.
- [ ] Install Chromium and WebKit with `rtk proxy pnpm --filter @paste-to-markdown/web exec playwright install chromium webkit`; use `--with-deps` on Linux as CI does.
- [ ] Validate the isolated staged snapshot with its full `pnpm check`; expect 99 unit/conversion tests and 82 passing browser cases. The two desktop instances of the dedicated mobile-only test are intentionally skipped.
- [ ] Inspect the staged diff and create commit 3 using the message above.

### 4. Contributor documentation

**Files:**

- `README.md`.
- `docs/superpowers/plans/2026-09-02-purple-restoration-commit-pr-plan.md` (this handoff).

- [ ] Confirm the README identifies `apps/web` as the sole maintained app and describes the actual scripts, local fonts, preferences-only persistence, and browser setup.
- [ ] Stage only these documentation files, check Markdown formatting and the staged diff, and create commit 4 using the message above.

## Assemble and validate the commits

- [ ] Before staging, record the branch/base and inventory all changed and untracked files. Preserve a temporary copy of the complete tested patch, untracked source files, manifests, and lockfile outside the repository.
- [ ] Use explicit file lists and selected hunks for the three shared files: root `package.json`, web `package.json`, and `pnpm-lock.yaml`. Do not stage the full lockfile in commit 1 or use a blanket `git add .`.
- [ ] For each bucket, run `rtk git diff --cached --check` and inspect `rtk git diff --cached`. Export the staged index into a fresh temporary directory with `git checkout-index`, install with `pnpm install --frozen-lockfile`, and validate that snapshot. Checking the complete dirty source worktree would not prove an intermediate commit works.
- [ ] Do not hand-edit dependency integrity hashes or refresh unrelated versions. If a lockfile slice is incomplete, repair its dependency graph from the already-tested final lockfile and repeat the frozen install for that snapshot.
- [ ] After all four commits, compare the committed application/configuration tree with the preserved tested tree. Only the new planning document should be additional; application behavior must not change during commit assembly.
- [ ] Run the final checks from the committed branch:

```bash
rtk proxy pnpm install --frozen-lockfile
rtk proxy pnpm check
rtk proxy env RELEASE_BASE_SHA="$(rtk git rev-parse origin/main)" RELEASE_HEAD_SHA="$(rtk git rev-parse HEAD)" pnpm release:check
rtk proxy pnpm audit:prod
rtk git diff --check
rtk git status --short
rtk git log --oneline origin/main..HEAD
```

The existing prepared tree already passed 42 core tests, 57 web unit tests, 82 production browser cases, release configuration validation, and the production audit. Six states were compared at desktop and mobile sizes, with normal/reduced motion and touch behavior checked. Those results establish the source baseline; final committed-head validation remains a separate execution step. Repeat visual checks only if commit assembly or integration changes application files.

## Create the GitHub PR

**Title:** `fix(web): restore purple application and interactions`

**Base:** `main`

**Head:** `sbolel/restore-purple-ui`

**Mode:** One PR, ready for review after final checks; no automatic merge.

- [ ] Recheck `origin/main` and open PRs for the branch. If the base advanced, integrate it while preserving the four commit boundaries, then rerun affected checks and the final production gate. Reuse a matching PR if one was created in the meantime.
- [ ] Prepare the description below in a temporary UTF-8 file, retaining the template's `Summary`, `Validation`, and `Risks` headings. Check validation boxes only after they pass on the final committed head. Do not include local preview/screenshot paths in the GitHub body.
- [ ] Once execution is authorized and checks pass, push normally and create the PR with a body file:

```bash
rtk git push -u origin sbolel/restore-purple-ui
rtk gh pr create --repo sbolel/paste-to-markdown --base main --head sbolel/restore-purple-ui --title 'fix(web): restore purple application and interactions' --body-file /private/tmp/purple-restoration-pr-body.md
```

- [ ] Read back the resulting PR's title, body, base, head SHA, commit list, and check status. Report the PR URL and a four-row commit/SHA mapping. A queued CI run is not a passing run.
- [ ] Leave merging and deployment for a separate request. Merging to `main` triggers the existing release and Pages workflow.

## PR description prepared from the repository template

```markdown
## Summary

- Restore the purple application from `da578439` in the canonical `apps/web` package. The workspace migration had switched production to the simpler white interface; the restored app includes the original layouts, local licensed fonts, motion, responsive About page, and accessible controls.
- Restore editable Markdown and sanitized Preview, HTML-first paste, copy/download, clear/restore, formatting shortcuts, preferences, and help. Preference changes confirm before replacing manual edits, and reduced-motion and touch preferences are respected.
- Extend shared core conversion with four presets and GitHub table/code support while retaining the merged link-normalization rules, plain-text fallback, CSP, deployment base path, and release pipeline. Add production Chromium/WebKit and mobile regression coverage to `pnpm check`.

## Validation

- [ ] `pnpm check` — final committed head; expected 42 core tests, 57 web unit tests, and 82 production browser cases, with two desktop instances of the mobile-only test skipped.
- [ ] docs updated if needed — README documents the canonical app, browser setup, and validation commands.
- [ ] `pnpm release:check` — validate the complete PR commit range.
- [ ] `pnpm audit:prod`.
- Reference comparison completed for ready, raw, preview, download, shortcuts, and About at desktop/mobile sizes. Normal motion, reduced motion, touch behavior, and local font loading were checked. This was a source-reference comparison using a documented font/dependency harness, not a pixel-identical reproduction of the historical deployment.

## Risks

- Restoring React, UI components, and the editor increases the production JavaScript bundle; Vite reports a non-blocking chunk-size warning (approximately 666 kB minified / 207 kB gzip for the main chunk in the validated build).
- Clipboard availability depends on browser permissions; rich/plain fallbacks and manual-copy guidance are covered by the browser suite. Documents stay in memory; only formatting preferences persist.
- Merging to `main` triggers the existing release and Pages deployment pipeline. Publication of this PR does not deploy the app.
```
