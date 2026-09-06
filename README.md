# rko-claude-skills

A curated library of Claude Code skills for software development workflows.

Every skill here is **stack-agnostic**. Nothing names a package manager or a
build command; skills that need to run something delegate to a reserved skill
name the consuming repository supplies. See
[CONVENTIONS.md](plugins/rko-claude-skills/CONVENTIONS.md).

## Installation

```
/marketplace add github:Ryankolsen/rko-claude-skills
/plugin install rko-claude-skills@rko-claude-skills
```

## What your repository supplies

| Reserved name | Purpose |
|-------|-------------|
| `run-tests` | Tests only — fast enough to call on every red-green cycle |
| `verify` | The full pre-commit gate: typecheck, lint, tests, build |

A skill that cannot find one works down a fixed fallback chain — repository
documentation, then auto-detection, then asking — and never guesses a command.

## Agents

| Agent | Description |
|-------|-------------|
| `agent-architect` | Design a new agent: inventory existing skills, research prior art, return a build spec |
| `skill-author` | Draft a SKILL.md from an approved spec, self-checked against the write-a-skill rubric |
| `qa-verifier` | Run the project's verification gate and report a triaged verdict, without fixing anything |
| `code-reviewer` | Review a diff against the repo's documented standards and the Fowler smell baseline, reporting findings without fixing them |
| `codebase-explorer` | Explore a codebase and return a structured map: entry points, modules, seams, and the next skill to reach for |

Agent files are deliberately thin — identity, a tool allowlist, and what they
delegate to. Procedure lives in skills, so the same procedure runs whether it is
invoked in a subagent or the main thread.

## Skills

Each skill declares a `domain` — the job it claims — and whether it is
**auto-invocable** (Claude may reach for it from context) or a **workflow**
skill (you invoke it by name). Only one skill may claim a domain in the
auto-invocable pool, because an agent picks from descriptions alone and two
skills claiming one job make that pick a coin toss.

### Planning and specification

| Skill | Description |
|-------|-------------|
| `write-a-prd` | Interview, explore the codebase, and produce a PRD as a GitHub issue |
| `to-spec` | Turn the current conversation into a spec, with no interview |
| `prd-to-plan` | Break a PRD into phased tracer-bullet slices as a GitHub issue |
| `prd-to-issues` | Break a PRD into independently-grabbable GitHub issues |
| `grill-me` | Interview relentlessly about a plan until reaching shared understanding |
| `research` | Investigate a question against primary sources and write up the findings |

### Building

| Skill | Description |
|-------|-------------|
| `do-work` | Execute a unit of work end-to-end: plan, implement, validate, commit |
| `tdd` | Test-driven development: what a good test is, seams, and the red-green loop |
| `prototype` | Build a throwaway prototype to answer a design question |

### Diagnosis

| Skill | Description |
|-------|-------------|
| `debug` | Feedback-loop diagnosis: reproduce, minimise, hypothesise, instrument, fix |

### Design and architecture

| Skill | Description |
|-------|-------------|
| `codebase-design` | Shared vocabulary for designing deep modules, interfaces, and seams |
| `improve-codebase-architecture` | Find opportunities to deepen shallow modules |
| `domain-modeling` | Build and sharpen a project's domain model, CONTEXT.md, and ADRs |

### Review and version control

| Skill | Description |
|-------|-------------|
| `code-review` | Review a diff on two axes: repo standards, and fidelity to the spec |
| `commit-message` | Group pending changes into logical commits and write each message |
| `resolving-merge-conflicts` | Resolve an in-progress merge or rebase conflict |
| `git-guardrails-claude-code` | Hooks that block dangerous git commands before they execute |

### Meta

| Skill | Description |
|-------|-------------|
| `write-a-skill` | Create new skills with proper structure and progressive disclosure |
| `setup-project-skills` | Detect how a repo runs its checks and generate its `run-tests` and `verify` skills |
| `teach` | Teach a new skill or concept within this workspace |
| `handoff` | Compact the conversation into a handoff document for another agent |

## Development

```
npm test
```

The suite is a validator over the plugin tree — it checks frontmatter, that
referenced commands and links resolve, that no generic skill names a package
manager, and that this README matches the skills that actually exist. Node 18+,
no dependencies.

## License

MIT
