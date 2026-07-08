# Agent Instructions

This repository requires Conventional Commits syntax for both commit messages and pull request titles.

These rules apply to:
- GitHub Copilot agents
- ChatGPT Codex agents

## Required format

Use:

`<type>(<optional-scope>): <description>`

Examples:
- `feat(ui): add markdown flavor selector`
- `fix(conversion): preserve nested list indentation`
- `docs(readme): clarify local-first privacy behavior`

## Allowed commit types

- `feat`
- `fix`
- `docs`
- `chore`
- `refactor`
- `test`
- `ci`
- `build`
- `perf`
- `revert`

## Pull request title rule

PR titles must follow the same Conventional Commits format as commit messages.
