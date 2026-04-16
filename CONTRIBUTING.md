# Contributing to Paste to Markdown

Thanks for your interest in improving Paste to Markdown. This project is a
local-first browser app for converting pasted rich HTML and related clipboard
content into clean Markdown.

Focused contributions are especially welcome around:

- conversion quality and Markdown output correctness
- accessibility and keyboard interactions
- documentation improvements
- UI polish and usability
- test coverage
- browser-specific edge cases

## Local Setup

The supported Node.js version is defined by `.nvmrc` and the `engines` field in
`package.json`.

```bash
nvm use
corepack enable
pnpm install
pnpm dev
```

Use `pnpm install` for normal local setup. Keep the workspace lockfile in sync
when dependency changes are intentional.

## Development Workflow

- Branch from the latest `main`.
- Keep pull requests scoped to one change or closely related set of changes.
- For conversion bugs, prefer small reproducible examples over large documents.
- Do not commit pasted private or sensitive content as fixtures, screenshots, or
  examples.
- Use sanitized and minimal HTML samples for bug reports and tests.
- Preserve the project's browser-local privacy expectations when proposing
  changes.

## Commit Messages and PR Titles

Conventional Commits are preferred for this project, but they are not currently
enforced by commit tooling.

Examples:

- `fix(conversion): preserve nested list indentation`
- `feat(ui): add markdown flavor selector`
- `docs(readme): clarify browser-local privacy behavior`

## Validation

Before opening a pull request for code changes, run:

```bash
pnpm check
pnpm audit:prod
```

For docs-only changes, run:

```bash
pnpm lint
```

## Accessibility

- Maintain keyboard navigation for interactive controls.
- Preserve visible focus states.
- Use semantic HTML where possible.
- Check screen-reader-friendly labels for controls and actions.

## Privacy and Security

- Pasted content should stay local to the browser.
- Do not add telemetry, remote logging, analytics, upload flows, or server-side
  processing without explicit maintainer review.
- Treat sample pasted content as potentially sensitive.

## Pull Requests

Please include:

- a short summary of the change
- screenshots or short recordings for UI changes
- the validation commands you ran
- the browsers tested when relevant
- links to related issues when applicable

## Code of Conduct

By participating in this project, you agree to follow the
[Code of Conduct](CODE_OF_CONDUCT.md).
