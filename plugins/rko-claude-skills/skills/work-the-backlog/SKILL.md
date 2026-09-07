---
name: work-the-backlog
description: Work a queue of ready issues unattended — pick the next unblocked issue, drive it to green through the delegate-work loop, commit, and move on, up to a limit you set. Stops the whole run the first time an issue fails to converge. Use when the user wants a backlog worked through without supervision, wants several plan phases built in sequence, or asks to run agents until the queue is empty.
domain: backlog-orchestration
disable-model-invocation: true
---

# Work the backlog

You run the outer loop: choose an issue, hand it to `delegate-work`, and repeat.
You do not implement, verify, or review anything yourself — every issue's work
happens in subagents, which is what keeps this affordable across many issues.

The user gives you a **maximum issue count** (`work-the-backlog 5`). Treat it as
a budget, not a target. If they gave no number, ask for one before starting;
an unbounded run is the one thing this skill must never start by accident.

## 1. Read the queue

Find the tracker the way the rest of this plugin does: if
`docs/agents/issue-tracker.md` exists, follow it; otherwise check the git remote
and whether `gh` is authenticated for GitHub, or `glab` for GitLab. If neither
resolves, ask. Never guess an issue URL scheme.

Fetch open issues **filtered to the label the user nominates** for unattended
work. If they have not named one, ask which label marks an issue safe to work
without supervision. Do not assume every open issue is fair game — some are
notes, some are for a human.

## 2. Pick the next ready issue

An issue is **ready** when every issue named in its `Blocked by` field is
closed. `prd-to-issues` writes that field, so it is structure you already have,
not something to infer from prose.

Among ready issues, take the lowest number — phases are written in order, and
order is the closest thing to a priority signal the queue carries. Skip issues
that are not ready; do not reorder around a blocker to keep busy.

If nothing is ready but open issues remain, **stop and say so** — a queue where
everything is blocked is a dependency problem, and working the wrong issue does
not fix it.

## 3. Drive it

Invoke the `delegate-work` skill for the chosen issue and let it run its own
loop: `developer` builds, `qa-verifier` judges, failures go back, capped.

Keep only its outcome. The per-attempt detail belongs on the issue, where
`delegate-work` already posted it, not in your context — you have more issues to
get through, and carrying five loops' worth of triage is how this becomes as
expensive as doing the work yourself.

## 4. Decide whether to continue

- **Green** → record one line, increment the count, return to step 2.
- **Bailed** → **stop the entire run.** Do not move to the next issue.
- **Budget reached** or **no ready issues left** → stop and report.

**Stopping on a bail is the point, not caution.** Phases are dependency-ordered:
an issue that will not converge is often the foundation the next one builds on,
and continuing produces several dirty trees and a compounding mess instead of
one problem you can still understand. The user comes back to one failure with
the tree intact.

## 5. Report

One line per issue as you go, so a watching user sees progress. At the end:

- **Each issue** — number, outcome, attempts used, and the commit if it landed.
- **Why the run stopped** — budget reached, queue empty, nothing ready, or a
  bail, naming the issue that failed.
- **Review findings** — whatever `code-reviewer` returned per issue, gathered
  together. They are for the user, and none of them re-entered any loop.
- **State of the tree** — clean, or dirty from the bail and worth inspecting.

## What you must not do

**Do not implement, verify, or review.** If `delegate-work` could not get an
issue green, you cannot either — you have none of the context that loop built.

**Do not raise the budget** because the queue is nearly empty, and **do not
continue past a bail** because the next issue looks unrelated. Both are the
user's call, and both are how an unattended run becomes an expensive one.

**Do not close issues by hand or push anything.** `delegate-work` commits with
the issue reference; pushing, merging, and opening PRs stay with the user.
