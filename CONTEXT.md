# rko-claude-skills

A Claude Code plugin of generic skills and agents that work on any repository, because each repository supplies its own commands under reserved names.

## Parts

- Skills hold the procedures and rules; agents invoke them rather than restate them.
- Agents each run one job in their own context and report back to whoever called them.
- Generic skills and agents invoke reserved names; the adopting repository supplies them.
- `detect-stack` chooses the stack skills that apply; nothing generic names one.
- The adopting repository keeps only its reserved names and the procedures that exist only there.

## Core terms

**Reserved name**:
A skill name that generic skills invoke and each repository supplies itself, such as `run-tests` and `verify`.
_Avoid_: required skill

**Generic**:
Describes a skill or agent that names no stack and no repository's command, so it works on any repository.
_Avoid_: universal

**Stack skill**:
A skill holding one platform's rules, chosen from evidence in the repository rather than named by anything generic.
_Avoid_: platform agent, language skill, framework skill

**Gate**:
The repository's full pre-commit check, supplied through its `verify` skill.

**Blocking finding**:
A finding with a concrete failure behind it, such as a bug, an unmet criterion, a leaked secret or an unintended side effect; it turns the verdict red.

**Advisory finding**:
A finding too uncertain or too much a matter of judgement to block; it goes to the cleanup ticket. An advisory reviewer is one that can only produce these.
_Avoid_: warning, suggestion

Every other term: [docs/Glossary.md](docs/Glossary.md).
