---
name: run-tests
description: Run the validator test suite for this plugin repository. Use when the user wants to run tests, check if tests pass, verify a change to a skill or agent file, or asks whether the plugin is still valid.
---

# Run Tests

This repository's implementation of the `run-tests` reserved name. Tests only — no lint, no build — so it is safe to call repeatedly inside a red-green loop.

## Command

```
npm test
```

Requires Node only; the suite has no dependencies, so there is no install step on a clean checkout.

## What it checks

The suite is a validator over the plugin tree. Every rule is one test:

- Every `SKILL.md` has parseable frontmatter with a `name` and `description`
- Every skill's declared `name` matches its directory
- Every command a skill references (`` `/name` ``, or `/name` after run/use/invoke/call) resolves to a skill in this plugin or a Claude Code built-in

## Reading a failure

Each failure names the rule and lists the offending files. The assertion is a diff against an empty list, so the reported entries *are* the violations — fix those files rather than adjusting the test.

Add a rule by adding a `test/*.test.js` file; shared skill discovery and frontmatter parsing live in `lib/skills.js`.

Keep test files directly in `test/` — discovery uses a shell-expanded glob, so a test nested in a subdirectory would be skipped silently.
