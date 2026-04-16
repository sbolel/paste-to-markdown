# Open Source Readiness Report

Date: 2026-04-15

## Executive Summary

The repository is in good technical shape for a public launch after this hardening pass. It now has a pinned local runtime, a CI gate, contributor and security documentation, issue and pull request templates, tighter package metadata, a basic static-site CSP/referrer policy, and a fixed favicon asset path.

Current validation status:

- `pnpm check`: passed on Node `22.21.1`
- `pnpm audit --prod`: no known vulnerabilities found

The main remaining publication blocker is legal rather than technical: the repository still has no open-source license.

## What Changed In This Pass

- Standardized the contributor toolchain with `.nvmrc` and corrected the documented engine floor in `package.json`, `apps/web/package.json`, and `README.md`.
- Added a pull-request CI workflow in `.github/workflows/ci.yml` and aligned the Pages deploy workflow with the pinned runtime in `.github/workflows/deploy-pages.yml`.
- Added `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, issue templates, a pull request template, and Dependabot configuration.
- Tightened package metadata in `package.json` and `packages/core/package.json` so the repo and reusable package are easier to understand and maintain publicly.
- Added a favicon under `apps/web/public/favicon.svg` and improved the web entrypoint metadata in `apps/web/index.html`.
- Improved runtime safety slightly in `apps/web/src/main.ts` by failing fast on missing DOM hooks and removing a nonessential `innerHTML` clear path.

## Gap Analysis

| Priority | Status              | Gap                                                                                     | Evidence                                                                                                                                     | Recommendation                                                                                                                            |
| -------- | ------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | Open                | No open-source license is declared.                                                     | There is still no `LICENSE` file at the repo root, and `README.md` explicitly calls this out in lines 102-104.                               | Choose and add a license before making the repository public. Until then, others can view the code but do not have reuse rights.          |
| P1       | Closed in this pass | Runtime requirements were inconsistent with the actual toolchain.                       | The repo now pins Node in `.nvmrc` and documents `>=20.19.0` in `package.json` lines 14-17, matching the Vite-era requirement surface.       | Keep `.nvmrc`, CI, and `engines` aligned whenever the toolchain changes.                                                                  |
| P1       | Closed in this pass | There was no CI quality gate for external contributors.                                 | `.github/workflows/ci.yml` now runs install plus `pnpm check` on pushes and pull requests.                                                   | Keep CI as a required branch protection check.                                                                                            |
| P1       | Closed in this pass | Public collaboration docs were missing.                                                 | `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `.github/pull_request_template.md`, and `.github/ISSUE_TEMPLATE/*` now exist.        | Keep these files current as workflows evolve.                                                                                             |
| P1       | Open                | No browser-level regression tests exist for the web app.                                | Root `package.json` lines 18-26 only run the core-package Vitest suite, and `apps/web/package.json` lines 10-14 still expose no test script. | Add at least one Playwright smoke test for paste, clear, and copy behavior before traffic or community contribution volume grows.         |
| P1       | Open                | No dedicated security-analysis workflow is visible in `.github/workflows/`.             | Current automation covers CI validation and GitHub Pages deployment only.                                                                    | Add CodeQL and enable GitHub secret scanning once the repo is public.                                                                     |
| P2       | Closed in this pass | The deployed site referenced an asset path that was not reliably represented in source. | `apps/web/index.html` line 16 references `/favicon.svg`, and `apps/web/public/favicon.svg` now provides that asset.                          | Keep deploy-critical assets under `apps/web/public/` so the built site stays self-contained.                                              |
| P2       | Closed in this pass | Package metadata was too thin for public consumption.                                   | `packages/core/package.json` now includes repository, bugs, homepage, keywords, and engine metadata.                                         | Add a license field after the repo license is chosen, especially if the core package will be published to npm.                            |
| P2       | Open                | There is no release/versioning workflow for outside consumers.                          | The repo has CI and Pages deployment workflows, but no changelog or release automation.                                                      | If the package will be reused externally, add a lightweight release flow such as Changesets or GitHub Releases with changelog generation. |

## Security And Quality Notes

- `apps/web/index.html` lines 6-14 now add a description, referrer policy, and a restrictive meta-delivered CSP. This is useful defense in depth for GitHub Pages, but note that meta CSP does not replace full header-based protections.
- `apps/web/src/main.ts` lines 4-20 and 64-66 reduce avoidable DOM fragility while preserving the current behavior.
- `SECURITY.md` lines 7-18 provide a non-public reporting path, which is important before exposing the repo to outside researchers.
- `CONTRIBUTING.md` lines 9-21 make the expected validation path explicit, which will reduce review churn for drive-by contributions.

## Nice To Haves

- Add Playwright smoke coverage for the browser UI and run it in CI on pull requests.
- Add CodeQL and enable GitHub secret scanning plus Dependabot security updates after the repo is public.
- Pick a license and then add a matching `license` field to `packages/core/package.json`.
- Add a small release policy: versioning rules, changelog expectations, and whether `@paste-to-markdown/core` is intended to be published.
- Add a screenshot or short GIF to `README.md` so new visitors understand the product in a few seconds.
- Consider an architecture note for the conversion rules if you expect external contributors to extend the Markdown output behavior.

## Recommended Publish Sequence

1. Choose and add the license.
2. Enable branch protection on `main` and require the `CI` workflow.
3. Turn on GitHub security features for the public repository.
4. Add at least one browser smoke test.
5. Publish the repository.
