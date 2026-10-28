# Testing a React Native App

Component tests use React Native Testing Library on Jest. The exact command
belongs to the project's `run-tests` skill; this file covers what makes a green
result worth trusting.

## Writing tests

- Query by role and label: `getByRole`, `getByLabelText`. They fail when a
  control is unnamed, so a test doubles as an accessibility check. Reach for
  `getByTestId` only when nothing a user perceives identifies the element.
- Assert with `toBeOnTheScreen()` and the other Testing Library matchers.
- On Expo, the `jest-expo` preset supplies the native-module mocks. Check the
  Expo version `detect-stack` reported when a mock seems missing.
- Logic in hooks and plain modules is tested directly, without rendering; see
  "Testable code" in [SKILL.md](SKILL.md).

## Trusting the result

- A snapshot test proves the output did not change, nothing about accessibility.
  Do not cite one as an accessibility check.
- Check the test count against what you expect, never just the exit code. A
  suite that lost a file still exits 0.
- A new test file you cannot find in the output did not run. Look for it by name.

## Device-level checks

Accessibility Inspector, TalkBack, Maestro and Detox are slow and depend on
the environment. They belong in the project's optional `run-a11y-checks` skill,
never in `run-tests`. When that skill is absent, review statically and say no
tooling ran.
