---
status: accepted
---

# The plugin owns every generic skill; repositories keep only what is theirs

Every skill that is not specific to one repository lives in this plugin. A repository's `.claude/skills/` holds only the reserved names it must supply (`run-tests`, `verify`, optionally `run-a11y-checks`) and procedures that exist only there — deploy scripts, its database workflow, its theme system. Per-repository copies of generic skills (`write-a-prd`, `do-work`, `interview-me`…) and user-level skills that name one project are removed or moved into that project.

## Consequences

- An improvement to a generic skill reaches every repository on the next plugin update instead of being hand-applied to forks.
- Before deleting a local copy, diff it: a fork may hold a refinement worth moving into the plugin first.
- Workflow skills (`disable-model-invocation: true`) are typed with the plugin prefix once the local copy is gone, e.g. `/rko-claude-skills:write-a-prd`.
- Demo and archived repositories are out of scope and keep whatever they have.
