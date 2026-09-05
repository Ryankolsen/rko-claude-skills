---
name: do-work
description: "Execute a unit of work end-to-end: plan, implement, validate with typecheck and tests, then commit. Use when user wants to do work, build a feature, fix a bug, or implement a phase from a plan."
---

# Do Work

Execute a complete unit of work: plan it, build it, validate it, commit it.

## Workflow

### 1. Understand the task

Read any referenced plan or PRD. Explore the codebase to understand the relevant files, patterns, and conventions. If the task is ambiguous, ask the user to clarify scope before proceeding.

### 2. Plan the implementation (optional)

If the task has not already been planned, create a plan for it.

### 3. Implement

**For backend code**: strict red/green/refactor, one test at a time in tracer-bullet style — one test → one implementation change → verified green, before the next test is written.

Invoke the `tdd` skill for the rules of that loop, what makes a test worth keeping, and the anti-patterns to avoid. It owns that material; repeating it here would only let the two copies drift.

Between red and green, invoke the project's `run-tests` skill. It is tests-only, so it is safe to call on every cycle.

**For frontend code**: implement directly without TDD.

### 4. Validate

Invoke the project's `verify` skill and fix what it reports. Repeat until it passes cleanly.

If the repository has no `verify` skill, work down the fallback chain in [CONVENTIONS.md](../../CONVENTIONS.md) — documentation, then auto-detection, then ask. Never guess a command: a made-up command that fails produces a false finding, which is worse than admitting you could not tell.

### 5. Commit

Once `verify` passes, commit the work.
