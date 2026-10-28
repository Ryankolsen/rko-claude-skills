# rko-claude-skills

A Claude Code plugin of skills and agents for software development: planning,
building, debugging, reviewing, and committing.

It is **stack-agnostic**. No skill names a build or test command; anything that
needs to run one invokes a skill your repository supplies. Stack-specific rules
(currently Drupal) load only when `detect-stack` finds evidence of that stack.
The contract is in [CONVENTIONS.md](plugins/rko-claude-skills/CONVENTIONS.md).

## Install

```
/plugin marketplace add Ryankolsen/rko-claude-skills
/plugin install rko-claude-skills@rko-claude-skills
```

## Usage

1. **Bootstrap each repository once** with `/rko-claude-skills:setup-project-skills`.
   It detects how the project runs its checks and writes two skills under
   `.claude/skills/`:

   | Reserved name | Purpose |
   |-------|-------------|
   | `run-tests` | Tests only. Fast enough to run on every red-green cycle |
   | `verify` | The full pre-commit gate: typecheck, lint, tests, build |

   Without them, skills fall back to the repository's docs, then to
   auto-detection, then to asking you. They never guess a command.

2. **Start workflows by name.** A typical feature goes
   `write-a-prd` → `prd-to-plan` or `prd-to-issues` → `do-work` (in this
   thread) or `delegate-work` (subagents in parallel worktrees, then a QA
   review). Type them as `/rko-claude-skills:<name>`.

3. **Let the rest happen on their own.** Skills marked *auto* below load when
   the situation fits, such as a bug report, a merge conflict, or a commit to
   write. Agents are spawned by skills like `delegate-work`, or by asking for
   one ("run the qa-verifier").

## Agents

Each agent file holds only an identity, a tool allowlist, and the skills it
delegates to. The procedure lives in those skills.

| Agent | Description |
|-------|-------------|
| `agent-architect` | Design a new agent: inventory existing skills, research prior art, return a build spec |
| `skill-author` | Draft a SKILL.md from an approved spec, self-checked against the write-a-skill rubric |
| `codebase-explorer` | Map a codebase (entry points, modules, seams) and name the next skill to reach for |
| `developer` | Build one specified phase of a plan in an isolated context, or fix the findings in a QA report |
| `qa-verifier` | Run the verification gate and review the change for bugs and unmet criteria. Returns green, red, or blocked |
| `standards-reviewer` | Check a diff against the repo's conventions and the existing code it should have reused |
| `clean-code-reviewer` | Check a diff's new code for duplication, extractable logic, and Fowler code smells |
| `accessibility-reviewer` | Check the UI a diff adds or alters for accessibility on any platform, with WCAG 2.2 AA as the web baseline |

The reviewers report without fixing anything, and only `qa-verifier` can
block.

## Skills

*auto*: Claude may invoke it from context. All others run only when invoked by name.

### Planning

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
| `delegate-work` | Work one issue or a queue through the agents: parallel developers, one QA review, one fix pass, and tickets for leftovers |
| `tdd` *auto* | Test-driven development: what a good test is, seams, and the red-green loop |
| `prototype` | Build a throwaway prototype to answer a design question |
| `debug` *auto* | Feedback-loop diagnosis: reproduce, minimise, hypothesise, instrument, fix |

### Design

| Skill | Description |
|-------|-------------|
| `codebase-design` *auto* | Shared vocabulary for deep modules, interfaces, and seams |
| `improve-codebase-architecture` | Find opportunities to deepen shallow modules |
| `domain-modeling` *auto* | Build and sharpen a project's domain model, CONTEXT.md, and ADRs |

### Review and git

| Skill | Description |
|-------|-------------|
| `code-review` | Review a diff on two axes, repo standards and fidelity to the spec, plus accessibility when it touches UI |
| `commit-safety` *auto* | The checklist for whether a diff is safe to land: criteria, secrets, side effects |
| `accessibility` *auto* | The checklist for whether a UI change is accessible on any platform, WCAG 2.2 AA on the web |
| `commit-message` *auto* | Group pending changes into logical commits and write each message |
| `resolving-merge-conflicts` *auto* | Resolve an in-progress merge or rebase conflict |
| `git-guardrails-claude-code` | Hooks that block dangerous git commands before they execute |

### Stack

| Skill | Description |
|-------|-------------|
| `detect-stack` *auto* | Detect the repository's stack from evidence and name the stack skills that apply |
| `drupal-conventions` *auto* | Drupal fields and Views via config YAML, Twig and preprocess, Composer patches, cache metadata |
| `godot-conventions` *auto* | Godot 4 UI and its accessibility, Control focus and modal input, headless GUT tests and the class_name cache |
| `react-native-conventions` *auto* | React Native and Expo UI and its accessibility props, touch targets and font scaling, modals, Testing Library |

### Meta

| Skill | Description |
|-------|-------------|
| `setup-project-skills` | Generate a repo's `run-tests` and `verify` skills, and offer a pre-commit hook for the same gate |
| `write-a-skill` | Create a new skill with proper structure and progressive disclosure |
| `trim-a-skill` | Shrink a bloated SKILL.md without losing facts |
| `teach` | Teach a new skill or concept within this workspace |
| `handoff` | Compact the conversation into a handoff document for another agent |

## Development

```
npm test
```

A dependency-free validator (Node 18+) over the plugin tree. It enforces the
rules in CONVENTIONS.md, checks agents, links, and delegations, tests the
`detect-stack` and `setup-project-skills` scripts against fixtures, and
keeps this README in sync with the skills and agents that exist. Any change
under `plugins/` must bump the version in
`plugins/rko-claude-skills/.claude-plugin/plugin.json`, or installed copies
never update.

## License

MIT
