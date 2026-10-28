---
name: godot-conventions
description: Godot 4 working rules — where UI lives and how to review it for accessibility, Control focus and modal input, GUT tests run headless and the class_name cache, and keeping node scripts testable. Use when building, planning, or reviewing work on a Godot project, or when detect-stack names it.
domain: godot-conventions
stack: godot
disable-model-invocation: false
---

# Godot Conventions

Rules that hold on any Godot 4 project. How this project runs its tests and
checks belongs to the project's `run-tests` and `verify` skills, not here.
`detect-stack` reports the engine version from `project.godot` (for example
"project.godot (engine 4.7)"). A rule that depends on the version says "check
the version `detect-stack` reported" — never assume it.

## Procedures

Read the matching file before touching what it covers — not after, and only
the one the task needs.

| Task | Read |
|------|------|
| Building or reviewing UI for accessibility | [accessibility.md](accessibility.md) |
| Writing, running, or trusting GUT tests | [testing.md](testing.md) |

## Where UI lives

An agent cannot tell UI by file extension. In a Godot project it is:

- Control-derived nodes in `.tscn` scenes (Button, Label, Container, TextureRect, …)
- Scripts that extend Control, Button, Label and the like, or that build Control
  nodes at runtime — often under a `ui/` or `hud/` directory
- Theme resources (`.tres`) and `theme_override_*` properties
- CanvasLayer overlays

Not UI: physics, AI, networking, and game-state scripts, even when they hold a
reference to a HUD node. A gameplay script that also builds widgets is UI for
the hunks that build them, and only those.

## Testable code

Keep node scripts thin. Put logic in `RefCounted` or `Resource` classes, or in
static functions, that a test can instantiate without a scene tree. A script
that needs `get_node()` to do its work cannot be unit-tested headless without
building a scene around it.

## Decision checklist

1. Logic in a class a test can instantiate without a scene tree?
2. New or renamed `class_name` — import run, and the test count checked?
3. Every new interactive control reachable and operable without a pointer?
4. Accessible to the bar the project sets, judged per [accessibility.md](accessibility.md)?
