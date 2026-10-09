---
name: do-work
description: "Execute a unit of work end-to-end: plan, implement, validate with typecheck and tests, then commit. Use when user wants to do work, build a feature, fix a bug, or implement a phase from a plan."
domain: work-execution
disable-model-invocation: true
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

## Delegating a unit of work to a subagent

An orchestrator that wants to keep its own context for the plan can hand a single unit of work to the `developer` agent instead of running this workflow in the main thread. That agent does steps 1 and 3 in its own context and reports back; four things are deliberately different there, and nowhere else:

- It has no user to ask, so an underspecified unit of work is refused (step 1) rather than clarified, and it never plans (step 2) — the unit of work must arrive already planned.
- It does not run step 4 or claim a verdict. The orchestrator spawns `qa-verifier` for that, so the code that was written is not the thing that certifies it.
- It commits only when the orchestrator tells it to. `delegate-work` always does, before any verification, because worktree branches need a commit to merge and the gate runs once over the merged range.
- It also runs in fix mode: given triaged findings — or the conflicted files of an in-progress merge — it repairs those and nothing else.
