# rko-claude-skills Glossary

The core terms are in [CONTEXT.md](../CONTEXT.md); each term lives in one file only.

## Skills and names

**Auto-invocable skill**:
A skill the model may choose for itself from its description. The rules for it are in the plugin's `CONVENTIONS.md`.
_Avoid_: automatic skill

**Domain**:
The one job a skill claims, declared so that overlap between skills is checkable. Not a domain in the domain-modeling sense.

**Fallback chain**:
The ordered steps a caller works down when a reserved skill is absent, ending in reporting rather than a guessed command. The steps are in the plugin's `CONVENTIONS.md`.
_Avoid_: default command, best guess

**Optional reserved name**:
A reserved name a repository may leave absent; the caller then skips the fallback chain and says no tooling ran.
_Avoid_: optional skill

**Workflow skill**:
A skill that runs only when invoked by name, never chosen by the model.
_Avoid_: manual skill

## Reviewing a change

**Fixed point**:
The commit, branch or tag a reviewer diffs against; with none, the review covers the uncommitted working tree.
_Avoid_: base commit

**Not verifiable from the diff**:
A criterion that was reviewed but cannot be established without running the code; a third state beside met and unmet, and not blocking.
_Avoid_: unknown

**Pre-existing**:
A problem the change did not introduce. It is reported under its own heading and not repaired unless the caller assigns it.
_Avoid_: legacy

**Stated skip**:
A reviewer's explicit statement that there was nothing to review, such as `no UI in this diff`. It is never a pass.

**Triage**:
Sorting findings into blocking, advisory and pre-existing, with where each one is and what caused it.
_Avoid_: prioritising

**Verdict**:
`qa-verifier`'s one-word judgement on a change: `green`, `red`, or `blocked` when the repository supplies no gate.
_Avoid_: approval

## Running work

**Caller**:
Whoever spawned an agent or invoked a skill: an orchestrator, another skill, or the user. An orchestrator is the kind of caller that holds the plan and hands work to `developer`.

**Cleanup ticket**:
The one issue that collects a run's advisory findings.
_Avoid_: follow-up issue, tech-debt ticket

**Fix mode**:
A `developer` run that repairs triaged blocking findings instead of building a new unit of work.
_Avoid_: repair mode

**Fix pass**:
The single repair round after a red verdict, followed by one more check. What still fails becomes a new ticket, except pre-existing findings and those marked not for the tracker.
_Avoid_: fix loop

**HITL / AFK**:
Whether a slice needs a person in the loop (HITL) or can be built unattended (AFK). It decides what an unattended run may pick up.
_Avoid_: manual / automatic

**Unit of work**:
The one phase or slice of a plan that a single `developer` builds.
