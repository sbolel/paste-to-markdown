# Paste to Markdown

Paste to Markdown is a browser-based HTML to Markdown converter built by [Sinan Bolel](https://sinanbolel.com/) ([`sbolel`](https://github.com/sbolel)). It converts rich clipboard HTML into clean, validated Markdown locally in the browser.

**Live demo:** [sbolel.github.io/paste-to-markdown](https://sbolel.github.io/paste-to-markdown/)
**About the project:** [sbolel.github.io/paste-to-markdown/about](https://sbolel.github.io/paste-to-markdown/about/)

## Project Ownership

Paste to Markdown is part of Sinan Bolel's public body of work across:

- [sinanbolel.com](https://sinanbolel.com/)
- [GitHub profile: sbolel](https://github.com/sbolel)
- [LinkedIn: sinanbolel](https://www.linkedin.com/in/sinanbolel)

| Ready to convert | Markdown output |
| --- | --- |
| ![Paste to Markdown ready state](docs/assets/paste-to-markdown-ready.png) | ![Paste to Markdown Markdown output](docs/assets/paste-to-markdown-output.png) |

## What It Does

- Pastes rich HTML from documents, email, webpages, and editors.
- Converts content to Markdown locally in the browser.
- Supports raw Markdown and preview views.
- Lets you copy or download the result.
- Keeps recently cleared content restorable for the current page session.

## Privacy

Paste to Markdown runs conversion in your browser. Pasted content is not sent to
an app server by this tool, and cleared content is only kept in memory for the
current page session so it can be restored. Display preferences such as Markdown
flavor may be stored in browser local storage.

## Quick Start

Use the live demo, or run it locally:

Supported Node.js versions are `^20.19.0 || >=22.12.0`. The `.nvmrc` file pins
the validated local development version. If you use `nvm`, run:

```bash
nvm use
```

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Run the baseline checks:

```bash
npm run typecheck
npm run lint
npm run build
npm run audit:prod
```

## Release

- Pull request titles must follow Conventional Commits so squash merges produce release-ready commits.
- `fix:` creates a patch release.
- `feat:` creates a minor release.
- `feat!:` or `BREAKING CHANGE:` creates a major release.
- Releases and GitHub tags are created automatically after merges to `main`.
- npm publishing is disabled; releases are GitHub-only.

## Project Notes

This app is built with React, TypeScript, and Vite. Markdown conversion uses
Turndown and GitHub Flavored Markdown helpers. Markdown preview HTML is
sanitized before rendering.

## Feedback Wanted

Feedback is welcome on conversion quality, pasted-content edge cases, and README
clarity. Please open an issue with a small reproduction if something converts
poorly or behaves unexpectedly.

## Project Docs

- [License: MIT License](LICENSE.md)
- [Contributing](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security](SECURITY.md)
