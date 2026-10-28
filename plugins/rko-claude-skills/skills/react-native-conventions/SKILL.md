---
name: react-native-conventions
description: React Native working rules — where UI lives, accessibility props and how to review them, touch targets and font scaling, modals and focus, testing with React Native Testing Library, and keeping components testable. Use when building, planning, or reviewing work on a React Native or Expo app, or when detect-stack names it.
domain: react-native-conventions
stack: react-native
disable-model-invocation: false
---

# React Native Conventions

Rules that hold on any React Native or Expo app. How this project runs its tests
and checks belongs to the project's `run-tests` and `verify` skills, not here.
`detect-stack` reports versions from `package.json` (for example "package.json
depends on react-native 0.81.5, Expo ~54.0.37"). A rule that depends on the
version says "check the version `detect-stack` reported" — never assume it.

## Procedures

Read the matching file before touching what it covers — not after, and only
the one the task needs.

| Task | Read |
|------|------|
| Building or reviewing UI for accessibility | [accessibility.md](accessibility.md) |
| Writing, running, or trusting component tests | [testing.md](testing.md) |

## Where UI lives

An agent cannot tell UI by file extension: `.tsx` and `.jsx` hold hooks and
services too. In a React Native app it is:

- Components that render RN primitives — `View`, `Text`, `Pressable`,
  `Touchable*`, `TextInput`, `Image`, `Modal`, `ScrollView`, `FlatList`
- Screens under a file-based router (for example `app/` in expo-router)
- Styling: `StyleSheet`, a utility-class layer (`className`), theme and colour tokens
- Navigation options that users perceive: `headerTitle`, `tabBarAccessibilityLabel`

Not UI: hooks, `lib/`, services, the data layer, migrations — except the hunks
that produce a user-visible string or a colour.

There is no DOM. The HTML and ARIA-semantics rules in the generic skill's
`WEB.md` do not apply; that file is for react-native-web output only.

## Testable code

Keep components presentational. Put logic in hooks and plain modules that a test
can call without rendering anything. A component that fetches, branches on
business rules, and lays out views at once can only be tested through a render.

## Decision checklist

1. Logic in a hook or plain module a test can call without rendering?
2. Every new interactive control named, with its state exposed and a target large enough?
3. Modal or overlay isolates the screen reader and handles the Android back button?
4. Tests query by role or label, so an unnamed control fails them?
5. Accessible to the bar the project sets, judged per [accessibility.md](accessibility.md)?
