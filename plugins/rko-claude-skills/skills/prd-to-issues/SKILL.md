---
name: prd-to-issues
description: Break a PRD into independently-grabbable GitHub issues using vertical tracer-bullet slices. Use when user wants to turn a PRD into a set of GitHub issues.
domain: prd-to-issues
disable-model-invocation: true
---

# PRD to Issues

Break a PRD into independently-grabbable GitHub issues using vertical slices (tracer bullets).

## Process

### 1. Locate the PRD

Ask the user for the PRD GitHub issue number (or URL).

If the PRD is not already in your context window, fetch it with `gh issue view <number>` (with comments).

### 2. Explore the codebase

Explore the codebase to understand:
- The current state of the code relevant to this PRD
- **Where the source lives**: which files and directories each slice will touch, and the existing file whose pattern a new one should follow
- The **test setup**: framework (Jest/Vitest), existing test patterns, available factories and mock utilities, and where test files live

Understanding the test setup is required — you will write concrete, runnable red tests for each slice, not generic placeholders.

Capture the source locations too. An issue is read by a fresh agent with no memory of this exploration, so a path you resolve once here is a path that no one has to rediscover on every build attempt.

### 3. Draft vertical slices

Break the PRD into **tracer bullet** issues. Each issue is a thin vertical slice that cuts through ALL integration layers end-to-end, NOT a horizontal slice of one layer.

Every slice is either **AFK** or **HITL**, and it carries that as a GitHub label:

- **`afk`** — implementable and mergeable with no human in the loop. This is the label `delegate-work` reads to decide what an unattended run may pick up, so applying it is a statement that a subagent may build and commit this slice while nobody is watching.
- **`hitl`** — needs a human: an architectural decision, a design review, a credential, a manual verification. Never picked up by an unattended run.

Prefer AFK over HITL where possible. When a slice is only HITL because of one decision, consider splitting the decision out as its own small `hitl` slice so the build work behind it can be `afk`.

Neither label is optional. An unlabelled slice is ambiguous exactly where it matters most — an unattended agent cannot tell "safe to build alone" from "nobody has decided this yet" — so a slice with no type label must not be created.

<vertical-slice-rules>
- Each slice delivers a narrow but COMPLETE path through every layer (schema, API, UI, tests)
- A completed slice is demoable or verifiable on its own
- Prefer many thin slices over few thick ones
- A slice that creates or extends more than about three source files, or introduces more than one new concept, is too thick — split it
- Every AFK slice MUST include tests written red-first before any implementation begins
</vertical-slice-rules>

The size ceiling is not style. A thick slice is built by an agent in one long session whose context grows with every turn and is re-sent on the next, so cost climbs faster than the work does — and when the slice fails, the whole of it is retried. Two thin slices that pass on the first attempt are cheaper than one thick slice that passes on the third.

Always create a final QA issue with a detailed manual QA plan for all items that require human verification. This QA issue should be the last item in the dependency graph, blocked by all other slices. It is `hitl` by definition — it exists precisely because a human must look.

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each slice, show:

- **Title**: short descriptive name
- **Type**: AFK or HITL, and for a HITL slice, the one thing a human is needed for
- **Files**: the source files the slice creates or extends — the user's clearest signal that a slice is too thick
- **Blocked by**: which other slices (if any) must complete first
- **User stories covered**: which user stories from the PRD this addresses

Ask the user one question at a time. Wait for their answer before asking the next question. Suggested questions (in order):

1. Does the granularity feel right? (too coarse / too fine) — a slice touching more than about three source files is usually too thick
2. Are the dependency relationships correct?
3. Should any slices be merged or split further?
4. Are the correct slices marked AFK and HITL? A slice wrongly marked `afk` will be built unattended, so err toward `hitl` when unsure.

Iterate until the user approves the breakdown.

### 5. Create the GitHub issues

For each approved slice, create a GitHub issue using `gh issue create --label afk` or `--label hitl` to match its type. Use the issue body template below, which repeats the type in the body so it survives a label being lost or renamed.

Check both labels exist first with `gh label list`. Create whichever is missing and say that you did:

```
gh label create afk  --description "Safe to implement unattended by an agent"
gh label create hitl --description "Needs a human — decision, review, or manual verification"
```

Create issues in dependency order (blockers first) so you can reference real issue numbers in the "Blocked by" field.

<issue-template>
## Parent PRD

#<prd-issue-number>

## Type

`AFK` — implementable unattended.

Or, for a HITL slice: `HITL` — and one line naming exactly what the human is needed for (the decision to make, the thing to review, the credential to supply).

## What to build

A concise description of this vertical slice, stated as end-to-end behavior.

**Restate every detail this slice must honour rather than citing the PRD for it.** Cite the parent for background; inline anything that constrains the work — a timing, a threshold, a sequence, a piece of copy, a deliberate difference from how the rest of the system behaves. A pointer costs a fresh reader the fetch of an entire PRD, repeated on every build attempt and every verification, and a constraint left behind in the parent is a constraint that gets built wrong.

## Files in play

Where this slice lands, so whoever builds it does not have to rediscover the codebase:

- The source files to create or extend, by path.
- The existing file whose pattern a new one should follow, where there is one.
- Anything that must be read to do the work — a base class, an autoload, a config.

Name what the exploration in step 2 established, and say plainly which parts you are unsure of. A path that turns out to be wrong is corrected in one step; a path that is missing is searched for across many.

## Acceptance criteria

Each criterion is one statement that can be checked against the finished diff without re-reading the PRD: a specific observable behaviour, not a restatement of the slice. Every detail the PRD was precise about gets its own line, carrying the actual number, string, or ordering. A criterion nobody can check is the one a build drops without anyone noticing.

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
- [ ] All tests pass (the project's `verify` skill)

## Out of scope

What this slice deliberately does not do — including the things a reasonable reader would assume it covers. Name the neighbouring work that belongs to another slice, and any file or subsystem this slice should leave alone.

This is not padding. `delegate-work` passes it to the agent that builds the slice, and `qa-verifier` judges blast radius against it; with no stated bound, an unattended build cannot tell a drive-by refactor from the job. Write "Nothing beyond the above" only when that is true.

## Blocked by

- Blocked by #<issue-number> (if any)

Or "None - can start immediately" if no blockers.

## User stories addressed

Reference by number from the parent PRD:

- User story 3
- User story 7

## Tests

**Red-green-refactor is required.** Write every test below before writing any implementation code. Each test should fail (red) when first run, then be made to pass (green) by the implementation, then cleaned up (refactor).

Tests are ordered from thinnest slice to widest — implement and pass each one before moving to the next:

1. **Core wiring** — one assertion that the most essential outcome is produced (e.g., record inserted with correct fields, hook returns expected shape). Write this test, run it red, implement just enough to make it green.
2. **Content details** — verify specific field values, payload shape, UI text, etc. Red → green before moving on.
3. **Edge cases / error paths** — one test per failure dimension (invalid input, not-found, permission denied, null data, empty state). Red → green for each.

For each test, specify:
- The test file to create or extend (follow existing patterns in the codebase)
- Which existing factories or mock utilities to use (e.g., `bourbonFactory()`, `createMockSupabaseClient()`)
- The concrete assertion — not "verify it works" but the exact behavior to assert

If this slice has no testable logic (e.g., a schema migration with no associated functions), write "N/A — migration only" and explain why.

</issue-template>

Do NOT close or modify the parent PRD issue.
