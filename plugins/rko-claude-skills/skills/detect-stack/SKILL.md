---
name: detect-stack
description: Deterministically detect a repository's stack from checkable evidence and name the stack skills that apply. Use before planning, building, or reviewing, so stack rules are applied every time on a matching repository and never on any other.
domain: stack-detection
disable-model-invocation: false
---

# Detect Stack

Run the detector against the repository root:

```
node <skill-dir>/scripts/detect.mjs <repo-dir>
```

It prints JSON: each matching stack with the skill that carries its rules and
the evidence it matched on, plus the local-environment prefix (`ddev`,
`lando`, or `null`) when a stack matched.

- **A stack matched** — invoke each named skill now, before touching any file,
  and follow it for the rest of the work. Prefix the stack's commands with
  `envPrefix` when it is not `null`.
- **`stacks` is empty** — no stack skills apply; carry on with the generic
  skills alone. That is a result, not a failure: do not look for a stack by
  other means, and do not ask the user.

Trust the result over your own impression of the code. The point of the
script is that the answer is the same every time.
