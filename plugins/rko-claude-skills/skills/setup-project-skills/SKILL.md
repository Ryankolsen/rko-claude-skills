---
name: setup-project-skills
description: Set up a repository with the reserved skill names that generic skills and agents depend on, by detecting how the project runs its tests and checks. Use when adopting this plugin in a new repository, when a skill reports it cannot find run-tests or verify, or when the user asks to bootstrap or configure project skills.
domain: project-bootstrap
disable-model-invocation: true
---

# Set Up Project Skills

Generic skills and agents never name a stack's commands. They invoke a skill by
reserved name, and the repository supplies it. This bootstraps a repository's
side of that contract — see
[CONVENTIONS.md](../../CONVENTIONS.md) for the contract itself.

Result: `.claude/skills/run-tests/` and `.claude/skills/verify/`, as plain
editable files that are useful with or without any agent installed.

## 1. Probe, and write nothing yet

```
node <skill-dir>/scripts/probe.mjs <repo-dir>
```

Detection is deterministic, so it lives in [scripts/probe.mjs](scripts/probe.mjs)
rather than being re-derived by hand each time. It reports the stack it found,
the evidence it found it from, the command it proposes for each reserved name,
and whether either skill already exists.

## 2. Show the user before writing

Present the proposed command for each skill and the evidence behind it. A probe
reads a manifest; it cannot know that this project's `test` script is broken, or
that the real suite lives behind a task runner. **The evidence is the part worth
checking** — if it looks thin, say so.

Get approval before step 3.

## 3. Write

```
node <skill-dir>/scripts/probe.mjs <repo-dir> --write
```

Existing skills are skipped, never overwritten — a hand-tuned `run-tests` is
almost certainly better than a generated one. The report names what was written
and what was skipped.

Read back what was written and confirm the command actually runs. A generated
skill that names a command nobody has run is a guess with extra steps.

## When detection fails

The probe reports `undetermined` and writes nothing. That is the correct
outcome, not a failure to route around.

Ask the user how this project runs its tests, then write the skill by hand using
the same shape the probe generates. **Never guess a command.** A command that
was invented and then fails produces a false finding, which is worse than
admitting the runner could not be determined.

## Adding a stack

A detector is a function returning `{ stack, evidence, runTests, verify }`, or
`null` when it does not apply. Add one to the list in the script and a fixture to
the test suite — the fixtures are what keep "works on any stack" honest.
