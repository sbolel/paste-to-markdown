# Paste to Markdown

Convert rich clipboard HTML into clean, validated Markdown in the browser.

**Live demo:** [paste-to-markdown--sbolel.github.app](https://paste-to-markdown--sbolel.github.app)

| Ready to convert | Markdown output |
| --- | --- |
| ![Paste to Markdown ready state](docs/assets/paste-to-markdown-ready.png) | ![Paste to Markdown Markdown output](docs/assets/paste-to-markdown-output.png) |

## What It Does

- Pastes rich HTML from documents, email, webpages, and editors.
- Converts content to Markdown locally in the browser.
- Supports raw Markdown and preview views.
- Lets you copy or download the result.
- Keeps recent cleared content restorable.

## Development

Use Node.js `^20.19.0 || >=22.12.0`. If you use `nvm`, run:

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

## Project Notes

This app is built with React, TypeScript, Vite, and Spark. Markdown conversion uses Turndown and GitHub Flavored Markdown helpers.

## License

This project is licensed under the [MIT License](LICENSE).
