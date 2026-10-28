---
status: accepted
---

# Platform knowledge lives in stack skills, not per-platform agents

There is one generic `accessibility-reviewer` and one generic `accessibility` skill holding the principles that hold on every platform, with WCAG 2.2 AA as the web baseline in `WEB.md`. What a principle means on a given platform — Godot's `focus_mode` and AccessKit, React Native's `accessibilityRole` and `hitSlop` — lives in a stack skill (`godot-conventions`, `react-native-conventions`, `drupal-conventions`) that `detect-stack` selects from evidence in the repository.

## Considered options

- **An accessibility agent per platform.** Rejected: each agent is another worker turn per run, another skip decision for the orchestrator, and another place the reviewer lineup has to be named. A stack skill reaches every agent that already calls `detect-stack` — `developer`, `qa-verifier`, `standards-reviewer`, `accessibility-reviewer`, and `do-work` — for the cost of one skill and one detector.
- **One accessibility skill with a section per platform.** Rejected: generic skills and agents may not name a stack (the portability test enforces it), and platform rules apply only when the evidence says the platform is present.

## Consequences

- Stack skills exist per *rendering platform*, where the rules genuinely differ — not per language. There is no TypeScript or React-web stack skill: a React web app renders HTML, so the web rules cover it, and general web gaps (client-side routing) go into `WEB.md`.
- `detect-stack` reports versions alongside the stack (Godot engine version, React Native and Expo versions) because rules depend on them; version-dependent rules say "check the version detect-stack reported" instead of asserting.
- A stack skill is the home for any knowledge that holds on every project of that platform, even when it was first found in one repository (the Godot `class_name` cache rule moved out of a project's `run-tests`).
