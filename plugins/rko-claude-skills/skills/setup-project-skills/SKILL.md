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

**A skip is not a pass.** "Almost certainly better" is not "known to work": the
skipped file may name a runner that has since moved, or a directory that no
longer holds tests. The probe never ran it, so it carries a `mustVerify` note.
Read the skipped file and put its command through step 4 alongside the ones you
generated.

## 4. Prove the command reports a real result

"It ran and exited 0" is the wrong bar. A runner pointed at a directory holding
no tests it recognises does exactly that: it runs, finds nothing, and exits
clean. Green then means *nothing was checked*, and every agent downstream
believes it.

This applies to every reserved skill the repository will end up with — the ones
just written and the ones that were skipped.

Run each command and confirm two things:

- **It executed a non-zero number of tests**, and the count is plausible for the
  size of the suite. A summary saying `0 tests` — or no summary at all — is a
  failure to verify, never a pass.
- **A failure would come back red.** If the runner's exit status does not
  reflect failing tests, the skill has to say how to read the result, because
  the caller checks the exit status.

If either is wrong for a generated skill, the detection was wrong — fix the
command in the file. If it is wrong for a skipped one, say so plainly and ask
before editing: it is someone's hand-written file, and being stale is a
different problem from being wrong.

## When the binary is missing

Status `incomplete` means the stack was identified but the command cannot run as
written — most often an engine binary that is not on `PATH`. The probe writes
nothing.

Ask the user for the missing piece, then write the skill with it substituted in.
The detection is sound; only the path is unknown.

## When detection fails

The probe reports `undetermined` and writes nothing. That is the correct
outcome, not a failure to route around.

Ask the user how this project runs its tests, then write the skill by hand using
the same shape the probe generates. **Never guess a command.** A command that
was invented and then fails produces a false finding, which is worse than
admitting the runner could not be determined.

## Adding a stack

A detector is a function returning `{ stack, evidence, runTests, verify }`, or
`null` when it does not apply. It may also return `missing` — a sentence naming
what the user has to supply — which reports `incomplete` and suppresses writing.

Add one to the list in the script and a fixture to the test suite — the fixtures
are what keep "works on any stack" honest.

**Detect and propose at the same depth.** The Godot detector once recursed to
find `.gd` files and then proposed the directory it started from; GUT does not
recurse by default, so the command it generated ran zero tests and exited 0. If
finding the evidence needed a recursive walk, the command has to name what the
walk found, not where it began. Prefer a config file the project already states
over any directory the detector inferred.
