---
name: accessibility
description: The checklist for judging whether a UI change is accessible, on any platform — names for controls, colour not the only signal, target and text size, reduced motion, input alternatives and focus, reading order — with WCAG 2.2 AA as the web baseline. Use when reviewing or building UI, or when an agent needs the rules behind an accessibility finding. Judges the change, not the repository, and fixes nothing.
domain: accessibility-review
disable-model-invocation: false
---

# Accessibility

What to look for in a UI change. A caller applies these and decides what to do; this skill supplies the bar, not the decision. It never blocks and never fixes.

**Review the change, not the repository.** A problem in untouched code is not this change's finding. Say it exists if you trip over it, and label it pre-existing.

Establish what changed first: `git status`, `git diff HEAD` for uncommitted work, `git diff <base>...HEAD` when a base was named. Read added lines closely (`git diff -U0`).

## Find the UI surface

Not by file extension alone. Markup, JSX/TSX, templates and CSS are UI on the web; in a game engine UI lives in scene files and ordinary scripts. Decide per hunk: does it render, or control, something a person perceives or operates? If nothing in the diff does, say **"no UI in this diff"** and stop. That is a stated skip, not a pass.

## Platform rules

Invoke the `detect-stack` skill and apply any stack skill it names; those supply the platform mapping for their templates, engine or toolkit. When none applies, use the principles below, plus [WEB.md](WEB.md) if the UI is web. Web findings are judged against WCAG 2.2 AA and cite the success-criterion number.

## Principles — every platform

For each, look at what the diff adds or changes:

- **Every interactive control has a name** assistive tech can announce. Icon-only buttons, image buttons, custom widgets and unlabelled inputs are the usual misses.
- **Colour is never the only signal.** A state, error, required field or chart series distinguished only by hue needs a second cue: text, icon, shape, pattern.
- **Text is readable** at the target resolution and scale, and respects the user's text-size setting where the platform has one. Look for fixed sizes, clipped or truncated text, tiny fonts.
- **Targets are large enough.** WCAG 2.5.8 sets 24x24 CSS px minimum on web; about 44pt is the common mobile guidance. Check sizes and spacing the diff sets.
- **Motion and flashing can be reduced or avoided.** Added animation, parallax, autoplay or screen shake needs an off switch or the platform's reduced-motion preference; nothing flashes more than three times a second.
- **More than one input reaches every action.** Keyboard, gamepad or switch, not only pointer or gesture. A drag needs a non-drag alternative.
- **Focus is visible, never trapped, and moves sensibly** when a screen, dialog or menu opens or closes: into it on open, back to the trigger on close.
- **Reading and navigation order matches visual order.** Look for reordering done in style or layout only.
- **Errors and state changes are announced**, not only shown: a toast, a validation message, a loading state.
- **Time limits can be extended** or turned off.

## False positives

Over-reporting trains the caller to ignore you.

- Do not demand ARIA on an element that is already semantic. Redundant ARIA is worse than none.
- A decorative image needs an empty alt, not a description.
- A design-token change is a contrast finding only when you can resolve both colours.
- A principle the diff does not touch is not a finding.

## Not verifiable from the diff

Never a finding, never a pass. List these when they matter: rendered contrast with unresolvable colours, runtime focus order, what a screen reader actually announces, how an animation feels, behaviour at large text scale.

## Tooling

If the repository supplies one, invoke the project's `run-a11y-checks` skill: accessibility checks too slow or environment-dependent for `run-tests`, such as a real-browser audit. Accessibility tests already in the normal suite run through `run-tests` or `verify`, not here.

If `run-a11y-checks` is absent, review statically and say no tooling ran. Do not ask the user, and never guess, install or invent a command. Report what tooling ran and its result.

## Reporting

Worst first. Each finding gives:

- `path:line` and the quoted hunk
- the criterion: WCAG success-criterion number on web, the principle name elsewhere
- a one-line fix direction
- confidence: high or medium

Findings that exist only in untouched code go under a separate **pre-existing** heading. End with what was not verifiable or not covered, and what tooling ran.
