# Choosing the next issue

How the queue is read when `delegate-work` is given `next N` rather than a single
issue. The per-issue loop itself is in [SKILL.md](SKILL.md).

## Read the queue

Locate the tracker as the skill describes, then fetch open issues **filtered to
the label the user nominates** for unattended work. If they have not named one,
ask which label marks an issue safe to work without supervision.

Do not assume every open issue is fair game. Some are notes, some are for a
human, and some are the PRD the phases came from.

## Readiness

An issue is **ready** when every issue named in its `Blocked by` field is
closed. `prd-to-issues` writes that field, so this is structure the queue
already carries, not something to infer from prose.

Among ready issues take the **lowest number**: phases are written in order, and
that order is the closest thing to a priority signal available. Skip issues that
are not ready, and do not reorder around a blocker to keep busy — working the
wrong issue does not clear the right one.

If open issues remain but none is ready, **stop and say so**. Everything blocked
is a dependency problem, and no amount of work on this run will resolve it.

## When to stop

Four conditions, all of which end the run rather than pausing it:

- **The budget is reached** — the count the user gave.
- **No ready issues remain** — either the queue is empty or the rest are blocked.
- **An issue bailed** — stop immediately, leaving the tree dirty.
- **The tracker cannot be reached** — say so rather than proceeding blind.

Never raise the budget because the queue is nearly empty, and never continue
past a bail because the next issue looks unrelated. Both are the user's call.

## Reporting a run

One line per issue as you go, so a watching user sees progress. At the end:

- **Each issue** — number, outcome, attempts used, and the commit if it landed.
- **Why the run stopped** — which of the four conditions fired, naming the issue
  if it was a bail.
- **Review findings** — what `code-reviewer` returned per issue, gathered. They
  are for the user; none of them re-entered any loop.
- **State of the tree** — clean, or dirty from a bail and worth inspecting.
