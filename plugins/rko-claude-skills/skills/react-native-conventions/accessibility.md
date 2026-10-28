# React Native Accessibility Mapping

How the generic `accessibility` principles show up in a React Native app. The
principle names are the generic ones; cite a finding by that name. For what is
and is not UI, see "Where UI lives" in [SKILL.md](SKILL.md).

## Two prop styles

React Native 0.71 and later accepts web-aligned `role` and `aria-*` props
(`aria-label`, `aria-checked`, `aria-disabled`, `aria-expanded`, `aria-hidden`,
`aria-live`, `aria-modal`) as aliases of `accessibilityRole`,
`accessibilityLabel`, `accessibilityState` and the rest. Check the version
`detect-stack` reported. Either style is fine on 0.71+; do not flag one for
using the other, and do not demand both on one element. Mixing both styles on a
single element is a nit, not a finding. Below 0.71 only the `accessibility*`
props exist.

## Named controls

- Every `Touchable*`, `Pressable`, and `Text` with `onPress` needs a role
  (`button` or `link`), always: without one the screen reader does not say
  "button", even when it reads the text.
- It needs a label too, unless its only child is a `Text` whose content is the
  name — the label is then derived, so do not flag a missing label there.
  Icon-only buttons are the usual miss.
- `accessibilityHint` only when the result of the action is not obvious from
  the name.
- Images: informative ones get a label; decorative ones get `accessible={false}`,
  `importantForAccessibility="no"` or `aria-hidden`.
- Grouping: `accessible` on a container merges its children into one element.
  Good for a card; bad when it swallows buttons inside it.

## State and Announced state

- Toggles, tabs, checkboxes and accordions expose selected, checked, disabled,
  expanded and busy through `accessibilityState` or the `aria-*` equivalents.
- A toast, error or loading change that only renders is a finding. Use
  `accessibilityLiveRegion` (Android) or `aria-live`, or call
  `AccessibilityInfo.announceForAccessibility`.
- A progress bar exposes `accessibilityRole="progressbar"` and
  `accessibilityValue`, unless adjacent text already announces the value.

## Target size

About 44x44pt on iOS and 48x48dp on Android. `hitSlop` enlarges a small visual
target, and counts: a small icon with adequate `hitSlop` is not a finding.

- A link inside a sentence is exempt from the minimum.
- A standalone `Text` link is not, and `Text` takes no `hitSlop`: the fix is to
  wrap it in a padded `Pressable`, not to pad the `Text`.

## Readable text

- `allowFontScaling={false}` disables the user's text-size setting. A finding
  unless justified (a fixed-size badge); even then prefer `maxFontSizeMultiplier`
  to capping entirely.
- A fixed `height` on a `Text` container clips at large scale. Not verifiable
  statically — say so.

## Focus management

- Core `Modal` isolates the screen reader on iOS by default. A custom overlay
  (an absolutely-positioned `View`) does not: it needs `accessibilityViewIsModal`
  (iOS), `importantForAccessibility="no-hide-descendants"` on the background
  (Android), or `aria-modal`.
- Android back closes a `Modal` only through `onRequestClose`.
- On open, move focus with `AccessibilityInfo.setAccessibilityFocus(findNodeHandle(ref))`
  when the first element is not the right target. On close, restore it to the
  control that opened it.

## Reduced motion

Added animation, auto-playing carousels, parallax and confetti check
`AccessibilityInfo.isReduceMotionEnabled()` and its `reduceMotionChanged` event,
or the animation library's own hook (for example Reanimated's
`useReducedMotion` or `ReduceMotion` config). Nothing flashes more than three
times a second.

## Input alternatives

Custom gestures — swipe-to-delete, pan, long-press menus — need
`accessibilityActions` with `onAccessibilityAction`, or a visible button doing
the same thing. A long-press-only action is a finding.

## Colour not the sole signal, and contrast

Colours usually live in theme or token files. Resolve both colours before
claiming a contrast failure, in every theme the app ships.

- 4.5:1 for text; 3:1 for large text and for components. Large is about 24dp,
  or 19dp bold. Judge the size of the `Text` actually rendering the colour,
  which may be another component than the one the diff changed.
- Status shown by colour alone needs an icon or text.
- A link needs a cue beyond colour, such as an underline, unless it is visibly
  a button.
- Cite the principle name, not a WCAG number: this is not the web.

## Reading order

- Screen readers follow the view tree, not position. An absolutely-positioned
  element rendered later in the tree is read later, wherever it appears.
- A screen title or section heading carries `accessibilityRole="header"`, which
  is how screen-reader users jump between sections. Missing it on a heading the
  diff adds or changes is a medium finding.

## False positives

- A missing *label* on a `Touchable*` whose single `Text` child names it. A missing role is still a finding.
- Demanding both `role` and `accessibilityRole`.
- A small target with adequate `hitSlop`.
- A core `Modal` on iOS, which already isolates.
- A decorative emoji in a `Text`, unless it is the only content of a control.

## Not verifiable from the diff

What VoiceOver or TalkBack actually announces, focus order at runtime, layout at
the largest font scale, and contrast over images.
