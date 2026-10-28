# Interview procedure

Followed by the workflow skills that interview the user. Those run only because the user typed them, so the user is present to answer; never follow this from a subagent.

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Treat the plan as a design tree: each decision, and the decisions that depend on it.

## Before the first round

Learn what the repository has already settled, so you don't ask me what is written down. Read only what stays small:

- `CONTEXT.md`, if it exists. It is capped at 40 lines.
- The titles of the ADRs still in force: `grep -L '^status: superseded' docs/adr/*.md | xargs grep -H -m1 '^# '`. Titles only, never the full files.

Hand everything that grows with the repository to the first round's fact-finding subagent, alongside that round's other facts. Have it read the full ADRs whose titles the plan touches and search `docs/Glossary.md` for the plan's terms, then report back only:

- one line per relevant ADR, giving its number and the rule it sets (`ADR-0003: an optional reserved name may be absent; review statically`);
- any term the plan uses differently from the glossary.

A plan that contradicts an accepted ADR becomes a question in the next round: keep the decision, or supersede it?

Outside a repository, skip this and the writing below; the interview still runs.

## Facts versus decisions

A **fact** is something the code, the docs or a quick search can answer. Finding it is your job, never mine: dispatch a subagent to find it, so the interview's context holds decisions rather than file dumps. Batch a round's facts into one subagent rather than one per question. Don't block on it. A running search is an unsettled prerequisite, so only the questions downstream of it wait; ask the rest of the frontier now.

A **decision** is mine. Put each one to me and wait, however obvious your recommendation.

## Rounds

The **frontier** is every open decision whose prerequisites are already settled: the questions you can ask now without guessing at answers you haven't heard. Ask the whole frontier in one round, then wait for my answers. A question that depends on another question still open in this round belongs to a later round.

Format a round like so:

```
❓ **Q1** - **<question title>**: <question body, possibly several paragraphs, including the choices>

➡️ <your recommended answer, and why>

---

❓ **Q2** - **<question title>**: <question body>

➡️ <your recommended answer, and why>
```

Word each question so "yes" accepts your recommendation.

Each round of answers reshapes the tree: settled decisions unblock the questions that hung off them, and an answer that changes an already-settled branch reopens it. Recompute the frontier and ask the next round. If I ask for one question at a time, ask them singly in frontier order.

## Write it down as it settles

When a term is sharpened or a decision is made, invoke the `domain-modeling` skill and record it as soon as I answer that question, not when the round or the interview ends:

- **Terms** go into `CONTEXT.md` or `docs/Glossary.md`.
- **Decisions** become an ADR only when they pass the skill's three-part bar: hard to reverse, surprising without context, a real trade-off. Most won't. A decision that reverses an accepted ADR always gets a new ADR, and the old one is marked superseded.

Tell me each time you write a file, in one line.

## Ending

The interview ends when the frontier is empty: every branch visited, nothing left silently assumed. Then give me:

1. The decisions made, one line each.
2. The files written: terms added, ADRs created or superseded.
3. Anything left open on purpose.

Ask me to confirm we share the same understanding. Don't build, edit code or start the next workflow until I do.
