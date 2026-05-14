# Security Policy

Paste to Markdown is maintained by Sinan Bolel. Security reports are welcome.
Because this is a personal open source project, response times are best-effort
and should not be treated as an organizational SLA.

## Supported Versions

| Version | Supported |
| --- | --- |
| `main` / latest release | Yes |
| Older commits or releases | Best effort only |

## Reporting a Vulnerability

Please do not open public issues, discussions, or pull requests for suspected
security vulnerabilities.

Prefer GitHub private vulnerability reporting if it is enabled for this
repository. If it is not enabled, open a minimal public issue requesting a
private contact path without disclosing exploit details.

Please include:

- affected URL, branch, commit, or release
- reproduction steps
- browser and operating system
- a proof of concept when it is safe to share
- the likely impact
- whether the issue involves pasted content handling, sanitization, XSS,
  dependencies, build behavior, or deployment behavior

## Scope

Security issues are most likely to involve:

- Markdown preview sanitization
- pasted HTML handling
- dependency vulnerabilities
- GitHub Pages deployment
- client-side storage or `localStorage` behavior
- accidental network transmission of pasted content

The following are generally out of scope:

- spam or abusive content reports
- social engineering attempts
- denial-of-service attacks against GitHub Pages
- generic scanner output without a reproducible security impact
- vulnerabilities in third-party services not controlled by this repository

## Disclosure

Please allow reasonable time for investigation, mitigation, and release before
public disclosure. Reporters may be credited when appropriate and when they want
to be acknowledged. Security fixes may be shared through GitHub Releases or
GitHub security advisories if those channels are configured for the repository.

## Privacy Note

Paste to Markdown is intended to process pasted content locally in the browser.
Any change that sends pasted content to a server, analytics provider, API, or
external service must be explicitly documented and reviewed.
