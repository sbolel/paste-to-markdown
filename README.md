# Paste to Markdown

Paste to Markdown is a browser-based HTML-to-Markdown converter built by [Sinan Bolel](https://sinanbolel.com/) ([`sbolel`](https://github.com/sbolel)). It converts rich clipboard HTML into clean, validated Markdown locally in the browser and is organized as a pnpm workspace with a reusable core package.

**Live demo:** [sbolel.github.io/paste-to-markdown](https://sbolel.github.io/paste-to-markdown/)
**About the project:** [sbolel.github.io/paste-to-markdown/about](https://sbolel.github.io/paste-to-markdown/about/)

| Ready to convert | Markdown output |
| --- | --- |
| ![Paste to Markdown ready state](docs/assets/paste-to-markdown-ready.png) | ![Paste to Markdown output](docs/assets/paste-to-markdown-output.png) |

## What It Does

- Pastes rich HTML from documents, email, webpages, and editors.
- Converts content to Markdown locally in the browser.
- Displays the converted Markdown as raw text.
- Lets you copy the result to your clipboard.
- Lets you clear the current paste and output.

## Privacy

Paste to Markdown runs conversion in your browser. Pasted content is not sent to an app server, and the canonical workspace app does not persist pasted content or display preferences.

## Workspace Structure

```
paste-to-markdown/
├── apps/
│   └── web/              # Website application (Vite + TypeScript)
└── packages/
    └── core/             # Shared conversion logic (@paste-to-markdown/core)
```

## Getting Started

The checked-in `.nvmrc` selects Node 24; workspace tooling requires Node 24.15 or newer. With `nvm`, run `nvm use`, then install and start the workspace:

```bash
nvm use
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the website application |
| `pnpm build` | Build the core package and web app, then validate the Pages artifact |
| `pnpm test` | Run core package tests |
| `pnpm lint` | Lint TypeScript files |
| `pnpm typecheck` | Type-check all packages |
| `pnpm format` | Format source and documentation files |
| `pnpm check` | Run lint, type checks, tests, and build |
| `pnpm audit:prod` | Audit production dependencies |

## Packages

### `@paste-to-markdown/core`

The shared runtime-agnostic conversion package provides `convertHtmlToMarkdown(html, options?)` and `convertClipboardData(clipboardData, options?)`.

See the [core package's runtime compatibility policy](packages/core/README.md#runtime-compatibility) for the distinction between standalone consumers and workspace tooling.

### `apps/web`

The Vite and TypeScript website is the canonical production app and GitHub Pages build. It consumes `@paste-to-markdown/core` for conversion while handling browser UI interactions, paste events, raw Markdown display, clearing, and copy behavior.

This private package uses the workspace's Node.js `>=24.15.0` requirement for development and build tooling. The deployed application runs in the browser.

The richer root-era React implementation in `src/` and its root `vite.config.ts` are intentionally retained while migration ownership and feature parity are resolved. They are not part of the workspace production build, so their preview, download, restore, and preference features are not currently available in `apps/web`.

## Architecture Notes

- **`packages/core`** is runtime-agnostic: no DOM or browser UI concerns.
- **`apps/web`** handles all UI interactions.
- HTML-to-Markdown conversion uses [Turndown](https://github.com/mixmark-io/turndown). The workspace core's supported GFM helpers are strikethrough and checked or unchecked task-list markers.

## Release

- Pull request titles must follow Conventional Commits so squash merges produce release-ready commits.
- `fix:` creates a patch release; `feat:` creates a minor release; `feat!:` or `BREAKING CHANGE:` creates a major release.
- Releases and GitHub tags are created automatically after merges to `main`; npm publishing is disabled.
- `pnpm release:check` loads the configured plugins and previews commit analysis and release-note rendering without credentials. It does not publish or verify release permissions.
- The CI/CD workflow validates the pnpm workspace and production dependency audit before release and Pages deployment. Its manual trigger follows the same gates.

## Project Docs

- [License: MIT License](LICENSE.md)
- [Contributing](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security](SECURITY.md)
