---
status: accepted
---

# Accessibility is a separate, advisory reviewer

Accessibility review is its own agent, `accessibility-reviewer`, spawned in parallel with `qa-verifier`, `standards-reviewer` and `clean-code-reviewer` by `delegate-work` and `code-review`. Its findings go to the cleanup ticket and never to `developer` in fix mode, and it never blocks.

## Considered options

- **Fold it into `qa-verifier`.** Rejected: `qa-verifier` blocks only on a concrete failure scenario, and most accessibility findings from a static diff are judgement calls (contrast needs rendering, focus order needs a runtime). Making them blocking would spend the single fix pass on opinions; diluting the blocking bar would weaken every other verdict. It was also near its line limit.
- **Fold it into `standards-reviewer`.** Rejected: that agent checks a repository's own documented conventions; WCAG and platform guidelines are external standards with their own vocabulary.
- **Replace an existing step.** Not possible: nothing in the plugin covered accessibility.

## Consequences

A project that wants a hard accessibility gate puts an automated check in its own `verify` skill, which `qa-verifier` already treats as the gate.
