# Contributing

Thanks for taking a look at Paste to Markdown.

## Local Setup

```bash
nvm use
npm ci
npm run dev
```

## Before Opening a Pull Request

Run the baseline checks:

```bash
npm run typecheck
npm run lint
npm run build
npm run audit:prod
```

## Good Issues to File

- pasted HTML that converts poorly
- Markdown preview rendering problems
- accessibility or keyboard-flow issues
- documentation that is unclear or missing a setup step

Please avoid including sensitive clipboard contents in issues. Reduce examples
to the smallest safe reproduction.
