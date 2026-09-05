# Conventions

How a generic skill or agent in this plugin talks to a specific repository.

## The problem this solves

A skill that wants to run tests has no way to ask a repository how. Left to itself it does one of three things, all bad: it **guesses** (`npm test` in a Godot project), it **hardcodes** one stack (correct in one repo, meaningless in the next), or it gets **forked** per repo (and every later improvement has to be hand-applied to each copy).

The fix is to make the repository answer the question. A generic capability never names a command. It invokes a **skill by reserved name**, and the repository supplies that skill.

A skill is the right container because verification is a *procedure*, not a value. Running tests in a Godot project means invoking the engine binary headless against a test directory; a config file holding `test: "pnpm test"` cannot express that, and would end up pointing at a skill anyway.

## Reserved skill names

A repository supplies these under `.claude/skills/`. Generic skills and agents may invoke them by name and assume nothing else about the stack.

### `run-tests`

Runs the test suite and nothing else. No lint, no typecheck, no build.

Kept separate from `verify` because a red-green loop calls it once per cycle, and a loop that also lints and builds on every cycle is a loop people stop running.

### `verify`

The full pre-commit gate: typecheck, lint, tests, build — whatever this repository can actually run. One call that establishes a change is ready to commit.

A repository that has only tests may implement `verify` as running the tests. What it must not do is claim a check it does not perform.

## Fallback chain

When a generic capability needs to run something and the reserved skill is absent, it works down this list. The order is the contract, and the last step is not optional.

1. **Reserved skill** — invoke it and trust it. This is the only step that needs no inference.
2. **Repository documentation** — README, CONTRIBUTING, CLAUDE.md, a `docs/` entry. A documented command is a stated intention, not a guess.
3. **Auto-detection** — infer from what the repository plainly is: scripts in a manifest, a test directory a runner owns, a task file. Only when the evidence is unambiguous.
4. **Ask the user** — stop and say what could not be determined.

**Guessing is prohibited.** An agent that invents a plausible command, runs it, and reports the resulting error has manufactured a false failure — worse than useless, because it looks like a real finding. If steps 1–3 do not resolve, step 4 is the answer.

## Writing a delegation

Write it so it is unambiguous to a reader and checkable by the validator:

> Invoke the project's `run-tests` skill.

The validator checks that every name delegated to this way is either a reserved name or a skill that exists, which is what catches a `run-test` typo before it reaches a repo that has no such skill.

## Adding a reserved name

Don't, unless a generic capability actually needs it. Every name is one more thing a repository can fail to supply or misspell, and an unsupplied name costs more than an inlined command — it fails at a distance, inside an agent, with a confusing message.

`run-app`, `deploy`, and others may earn their way in. The bar is a generic capability that cannot be written without them.

Adding one means updating this document and `RESERVED_NAMES` in `lib/conventions.js` together; the validator fails if they disagree.
