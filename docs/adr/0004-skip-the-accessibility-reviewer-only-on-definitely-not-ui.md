---
status: accepted
---

# Skip the accessibility reviewer only when a diff is definitely not UI

`delegate-work` and `code-review` skip spawning `accessibility-reviewer` only when every changed file is documentation, a migration, CI or build config, a lockfile, or a test. Any other file means it is spawned, and the agent itself replies `no UI in this diff` when there is nothing to review — a stated skip, never a pass.

## Considered options

- **Spawn only when a UI file extension changed** (`.tsx`, `.css`, `.twig`…). Rejected: UI is not identifiable by extension. A Godot project's UI lives in ordinary `.gd` scripts and `.tscn` scenes, and a React Native `.tsx` file may be a hook. An allowlist would silently skip real UI changes.
- **Always spawn.** Rejected on cost: worker turns dominate a run's cost, and most backend-only runs would pay for a reviewer that has nothing to do.
