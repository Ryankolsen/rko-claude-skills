---
name: delegate-work
description: Drive an issue to green by delegating to subagents — the developer agent builds, qa-verifier judges, and failures go back for a fixed number of attempts before bailing to the user. Use when the user wants an issue or a plan phase implemented by subagents rather than in the main thread, asks to orchestrate agents, or wants work built and QA'd in a loop. Keeps the main thread holding the plan instead of the implementation.
domain: work-orchestration
disable-model-invocation: true
---

# Delegate work

You are the orchestrator. You hold the issue, the attempt count, and the commit
decision; you write no code and run no gate yourself. The moment you start
implementing you have stopped orchestrating. For work you intend to do in your
own context, use the `do-work` skill instead.

## Preconditions

- **An issue or plan slice** — a number, URL, or path. Given only a topic, ask
  which issue; do not invent scope.
- **The `developer` and `qa-verifier` agents.** Without them, say so and stop.
- **A clean tree**, or the user's word that existing changes are the baseline.
  You cannot attribute a failure you inherited.

**Locating the issue tracker.** If `docs/agents/issue-tracker.md` exists, follow
it. Otherwise check the git remote and whether `gh` is authenticated for GitHub,
or `glab` for GitLab. If neither resolves, ask where the issue lives and whether
to comment at all. Never guess an issue URL scheme.

## The loop

**At most 5 attempts.** Count them out loud in your reporting. The cap exists
because a loop that cannot converge burns tokens indefinitely, and only you can
see the count — a subagent cannot.

1. **Spawn `developer`.** On attempt 1 give it build mode: the issue text, how
   done is judged, the repo path and branch, and what is out of scope. On later
   attempts give it fix mode: the previous triage, which findings are its own,
   and the original issue so it repairs toward the design already chosen.
2. **Spawn `qa-verifier`** on the tree the developer left dirty. It runs the
   gate and owns the verdict. Never accept the developer's own account of
   whether the work is correct.
3. **Green** → go to *On green*. **Red** → comment on the issue, increment, and
   return to step 1 with the triage.
4. **At 5 red attempts** → bail, per *Bailing* below.

**Bail before 5 when another attempt cannot help.** The cap is a ceiling, not a
target, and two signals mean the loop has stopped converging:

- **`developer` reports `blocked`.** It is asking for a decision, not another
  turn. Spawning `qa-verifier` to confirm nothing was built, then spawning
  `developer` to be blocked identically, spends two contexts to learn nothing.
- **No progress between attempts** — the same test failing with the same error
  twice running. That is oscillation, and attempt 5 will look like attempt 3.

Bail on either and say which fired. An early bail with a clear reason beats
three more attempts and a bigger diff to read.

Spawn one agent at a time: they share a working tree, and two writers in one
tree corrupt each other. Parallel slices need separate worktrees — not this loop.

## Commenting on the issue

Comment after **every failed attempt**, so the issue carries the history rather
than your terminal. Use the shape below — the triage as `qa-verifier` returned
it, never a diff, never raw test output:

```
Attempt 2 of 5 — returned to developer

verify failed: 3 tests in auth.test.ts
- expired-token case returns 500, expects 401 (src/auth/verify.ts:44)

Re-spawning developer in fix mode.
```

`qa-verifier` does not post this; you do. It is read-only by construction, and
it cannot know the attempt number.

## On green

1. **Spawn `code-reviewer` once** on the final diff. Its findings go to the
   user and do **not** re-enter the loop — a style finding must never consume a
   correctness attempt.
2. **Commit**, referencing the issue so the tracker closes it. Invoke the
   `commit-message` skill for the grouping and the message.
3. **Stop.** Do not push, do not open a PR, do not close the issue by hand.
   Report what was committed and what `code-reviewer` said.

## Bailing

At 5 failed attempts, stop and hand back to the user:

- **Leave the tree dirty.** The work is worth inspecting; discarding it is the
  user's call, not yours.
- **Report**: attempts made, the final triage, files changed across the whole
  run, and your read on why it did not converge — a flapping test, a
  misunderstood requirement, a fix that keeps breaking something else.
- **Comment on the issue** saying it was returned to the user after 5 attempts.

A bail is a normal outcome, not a failure to hide. Say plainly that the work is
unfinished.

## What you must not do

**Do not implement.** Not even the one-line fix that would obviously clear the
last failure. If the developer could not get there, the answer is the user — you
have none of the context the loop just built.

**Do not raise the cap** because it feels close. Five is the budget; if it needs
six, that is a decision for the user with the evidence in front of them.

**Do not accept an unverified verdict.** Only `qa-verifier` decides green, and
only after actually running the gate.
