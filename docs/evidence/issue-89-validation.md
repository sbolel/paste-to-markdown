# Issue #89 validation

Starting revision: `19941f909aecb80b3608637a01dd8832f72bcdfc`, freshly fetched from `main` after PR #71 merged. Implementation is isolated on `sbolel/prerender-homepage`. Validation used Node 24.20.0, pnpm 10.33.0, and a frozen-lockfile installation on 2026-09-04.

The maintained web application now renders its empty homepage at build time and hydrates the same shared React tree. Preference restoration and paste-listener attachment precede conversion readiness. Public content starts visible, browser-only preview and cursor work remain deferred, and the production artifact retains About, SEO metadata, CSP, public assets, and local fonts. Core conversion and the historical root application were not changed.

| Command                                | Fresh result                                                                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `rtk proxy pnpm check`                 | Passed: lint, types, 308 core tests, 119 web unit tests, production build/artifact validation, and 194 production browser tests; six capability-based skips. |
| `rtk proxy pnpm release:check`         | Passed.                                                                                                                                                      |
| `rtk proxy pnpm audit:prod`            | Passed; no known production dependency vulnerabilities.                                                                                                      |
| Scoped Prettier and `git diff --check` | Passed.                                                                                                                                                      |

The production browser matrix covers Chromium and WebKit at 1550×964 desktop and 390×844 mobile sizes. The six skips are the mobile-layout-only case on both desktops and two fine-pointer particle cases on each touch profile. All 16 prerender cases pass, including disabled, blocked, and delayed scripts, loaded fonts and ancestor opacity, ordinary About navigation, retained public DOM nodes, restored preferences, and the first rich paste. Browser diagnostics reject hydration warnings, runtime errors, CSP violations, and unexpected request failures; deliberate script blocks have exact resource/error exemptions.

The unit tests include rendering without browser globals, deterministic HTML injection, full Application hydration with normal and development StrictMode trees, sanitizer exclusion during prerendering, and preference read/commit/write ordering across valid, corrupt, wrong-type, and denied storage. Existing conversion, editing, shortcuts, undo/redo, preview, clipboard, download, restoration, dialog, accessibility, and motion cases pass.

Desktop/mobile ready, preview, editor, and download-dialog screenshots were inspected. A transient notification overlap in the existing mobile Restore test was resolved by dismissing notices before using the persistent Restore button; that path also passed eight repeated checks across the four profiles. The separate SSR directory is removed after each build, and server-rendering modules are guarded against browser bundling. Read-only implementation review found no unresolved production-code issues.

Performance samples and their exact conditions are retained in [the comparison](issue-89-performance.md), [raw paired measurements](issue-89-performance.json), and [the pre-change baseline capture](issue-89-baseline-initial.json). All 20 cold loads stayed within the investigation thresholds. Desktop median LCP improved from 188 to 72 ms; mobile improved from 68 to 40 ms. Desktop CLS changed from 0 to 0.000686; mobile remained 0. Initial encoded JavaScript changed from 671,794 to 672,552 bytes, while JavaScript transfer size changed separately from 672,394 to 673,152 bytes. The local five-second, unthrottled, identity-encoded comparison measures initial loading, not deployed field performance. Vite's pre-existing warning about a browser chunk exceeding 500 kB remains.

No commits, pushes, pull requests, merges, or deployments were performed.
