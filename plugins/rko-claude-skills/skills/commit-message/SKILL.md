---
name: commit-message
description: Split pending changes into logically separate commits and write each commit message in Conventional-Commits style (type, imperative subject, why-focused body). Use when the user asks to commit changes, clean up a commit, or write/fix a commit message.
domain: commit-authoring
disable-model-invocation: false
---

# Commit Message

Two jobs, always in this order: **group** the pending changes into logical commits, then **write** each commit message.

## 1. Group before committing

Never fold unrelated changes into one commit. Run `git status` and `git diff` and cluster hunks/files by **concern**, not by "everything I touched this session":

- A dependency bump is its own commit — never bundled with the feature that needed it.
- Docs-only edits are their own commit, separate from code.
- Formatting/whitespace-only changes are their own commit, separate from behavior changes.
- Each feature or fix is its own commit; don't combine two unrelated fixes.
- If a change is large, prefer several small commits that each leave the repo in a working state over one giant commit.

Stage and commit one group at a time (`git add <specific files/hunks>`, `git commit`) rather than `git add -A` once. Use `git add -p` when a single file mixes two concerns.

## 2. Write the message

Subject line:

```
<type>[optional scope]: <imperative description>
```

- Imperative mood: "add", "fix", "remove" — not "added"/"adds"/"fixing".
- No trailing period. Keep it short; put detail in the body.

Body (optional, blank line after subject): explain **why**, not what — the diff already shows what changed. Use it for the reasoning, the constraint, the tradeoff, or the incident that motivated the change. Skip the body when the subject is already self-explanatory.

Footer (optional): breaking changes (`BREAKING CHANGE: ...`), issue references (`Closes #123`), co-author lines.

### Types

| type | use for |
|---|---|
| `feat` | a new feature |
| `fix` | a bug fix |
| `refactor` | code change that neither fixes a bug nor adds a feature |
| `perf` | a refactor specifically to improve performance |
| `test` | adding or correcting tests |
| `docs` | documentation only (README, comments-as-docs) |
| `style` | formatting only — whitespace, semicolons — no code-meaning change |
| `build` | build system, build tooling, CI pipeline, dependencies, project version |
| `ops` | infra, deployment, backup/recovery, operational config |
| `chore` | everything else unrelated to a fix/feature that doesn't touch src or test files |

Pick the type by what the *commit* does, not what the overall task was — a task can span several commits with different types (e.g. `build: bump lodash` then `fix: handle null from new lodash API`).

### Example

```
fix: prevent race in session refresh

Two tabs refreshing the same token concurrently both won and each
overwrote the other's cookie. Serialize refresh behind the existing
mutex instead of adding a new lock.
```
