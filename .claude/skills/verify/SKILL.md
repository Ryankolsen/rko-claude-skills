---
name: verify
description: Run the full pre-commit gate for this plugin repository. Use when the user wants to verify a change is ready to commit, asks whether everything passes, or is about to commit or open a PR.
---

# Verify

This repository's implementation of the `verify` reserved name — the full gate, run once before committing. For the fast tests-only call used inside a red-green loop, invoke the project's `run-tests` skill instead.

## Command

```
npm test
```

## What this gate does and does not cover

`verify` is supposed to be typecheck, lint, tests, and build. This repository is a plugin of Markdown skills, so three of those four do not exist here:

| check | status |
|---|---|
| tests | the validator suite over the plugin tree |
| typecheck | none — no typed source |
| lint | none configured |
| build | none — the plugin ships as source |

So here, `verify` and `run-tests` currently run the same command. That is allowed: a repository may implement `verify` as whatever it can actually run. What it must not do is claim a check it does not perform — which is why the table above says "none" rather than quietly passing.

If a linter or a typechecker is added later, add it here. This skill is the one place that has to change.

## Before committing

The gate is the tests, but two things it cannot see are worth a glance when skills or agents changed:

- A path named in skill prose still exists. The validator checks that `/command` references resolve; it does not check file paths in prose.
- A new reserved name was added to both `CONVENTIONS.md` and `lib/conventions.js`. The suite fails if they disagree, which is the point.
