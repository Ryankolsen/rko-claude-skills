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
- The **test setup**: framework (Jest/Vitest), existing test patterns, available factories and mock utilities, and where test files live

Understanding the test setup is required — you will write concrete, runnable red tests for each slice, not generic placeholders.

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
- Every AFK slice MUST include tests written red-first before any implementation begins
</vertical-slice-rules>

Always create a final QA issue with a detailed manual QA plan for all items that require human verification. This QA issue should be the last item in the dependency graph, blocked by all other slices. It is `hitl` by definition — it exists precisely because a human must look.

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each slice, show:

- **Title**: short descriptive name
- **Type**: AFK or HITL, and for a HITL slice, the one thing a human is needed for
- **Blocked by**: which other slices (if any) must complete first
- **User stories covered**: which user stories from the PRD this addresses

Ask the user one question at a time. Wait for their answer before asking the next question. Suggested questions (in order):

1. Does the granularity feel right? (too coarse / too fine)
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

A concise description of this vertical slice. Describe the end-to-end behavior, not layer-by-layer implementation. Reference specific sections of the parent PRD rather than duplicating content.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
- [ ] All tests pass (the project's `verify` skill)

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
