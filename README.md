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
- Supports raw Markdown and preview views.
- Lets you copy or download the result.
- Keeps recently cleared content restorable for the current page session.

## Privacy

Paste to Markdown runs conversion in your browser. Pasted content is not sent to an app server, and cleared content is only kept in memory for the current page session. Display preferences such as Markdown flavor may be stored in browser local storage.

## Workspace Structure

```
paste-to-markdown/
├── apps/
│   └── web/              # Website application (Vite + TypeScript)
└── packages/
    └── core/             # Shared conversion logic (@paste-to-markdown/core)
```

## Quick Start

The checked-in `.nvmrc` selects Node 24; workspace tooling requires Node 24.15 or newer. With `nvm`, run `nvm use`, then install and start the workspace:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the website application |
| `pnpm build` | Build the core package and web app |
| `pnpm test` | Run core package tests |
| `pnpm lint` | Lint TypeScript files |
| `pnpm typecheck` | Type-check all packages |
| `pnpm check` | Run type checks, lint, tests, and build |

## Packages

### `@paste-to-markdown/core`

The shared runtime-agnostic conversion package provides `convertHtmlToMarkdown(html, options?)` and `convertClipboardData(clipboardData, options?)`.

### `apps/web`

The Vite and TypeScript website consumes `@paste-to-markdown/core` for conversion while handling browser UI interactions, paste events, display, and copy behavior.

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
