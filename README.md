# Paste to Markdown

Convert rich clipboard HTML into clean, validated Markdown in the browser.

**Live demo:** [sbolel.github.io/paste-to-markdown](https://sbolel.github.io/paste-to-markdown/)

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

## Project Notes

This app is built with React, TypeScript, and Vite. Markdown conversion uses
Turndown and GitHub Flavored Markdown helpers. Markdown preview HTML is
sanitized before rendering.

## Feedback Wanted

Feedback is welcome on conversion quality, pasted-content edge cases, and README
clarity. Please open an issue with a small reproduction if something converts
poorly or behaves unexpectedly.

## License

This project is licensed under the [MIT License](LICENSE).
