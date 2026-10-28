---
status: accepted
---

# `run-a11y-checks` is an optional reserved name, separate from `run-tests`

A repository's slow or environment-dependent accessibility checks — a real-browser axe audit, an on-device run — are supplied under the reserved name `run-a11y-checks`. It is the first *optional* reserved name: when it is absent, the caller skips the fallback chain, reviews statically, and says no tooling ran. It never asks, because its caller is usually a subagent with no user to ask.

## Considered options

- **Add accessibility commands to the generated `run-tests`.** Rejected: `run-tests` is called on every red-green cycle and must stay fast, and a browser audit needs a build and a running server. Fast accessibility tests that already live in the suite (jsdom axe tests, contrast-token tests) stay in `run-tests`; only the slow tier moves.
- **Let the reviewer run whatever audit script it finds.** Rejected: a generic agent may not name a repository's commands, and guessing an invocation is prohibited by the fallback-chain contract.

## Consequences

`setup-project-skills` generates `run-a11y-checks` only from a script or Makefile target the repository already defines and names for accessibility. An installed audit package with no script is reported, not wired up — composing the command from a package name would be a guess. With nothing found on a repository that has UI, setup asks once and writes nothing on a no.
