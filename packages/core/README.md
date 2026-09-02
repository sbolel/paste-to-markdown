# `@paste-to-markdown/core`

Shared HTML-to-Markdown conversion logic used by the web app.

## Runtime compatibility

The package exposes ESM JavaScript and TypeScript declarations. Its TypeScript
build targets ES2020; that compiler target alone does not establish runtime
compatibility for the package and its Turndown dependency.

Standalone Node.js consumer compatibility has no verified version matrix. The
package therefore omits `engines.node`, leaving consumer compatibility unspecified.
This omission does not promise support for every Node.js version, and older Node
releases have not been validated by the workspace's Node 24 CI. Validate the built
package and its dependencies in the intended consumer runtime before relying on it.

## Workspace development

Building, testing, and maintaining this package in the repository uses the root
workspace toolchain: Node.js `>=24.15.0`, with Node 24 selected by `.nvmrc` and CI.
That tooling requirement does not define a minimum Node.js version for consumers
of the built library.
