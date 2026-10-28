# Testing a Godot Project with GUT

GUT tests run headless through the engine binary. The exact command belongs to
the project's `run-tests` skill; this file covers what makes a green result
untrustworthy.

## The class_name cache

`res://.godot/global_script_class_cache.cfg` is refreshed only by a project
scan. A headless GUT run does not scan. So a newly added or renamed
`class_name` resolves as "Identifier not declared", and the file that uses it
silently contributes 0 tests.

- After adding, renaming, or removing a `class_name`, run an import first:
  `<godot> --headless --import`, or `<godot> --editor --quit`.
- Then run the tests.

## Trusting the result

- Check the test count against what you expect — never just the exit code. A
  suite that lost a file reports fewer tests and still exits 0.
- "Nothing was run." in the output means no test was found or loaded. It is not
  a pass.
- A script parse error can leave the exit status 0. Read the output for
  `SCRIPT ERROR` and `Parse Error` lines.
- A new test file you cannot find in the output did not run. Look for it by name.

## Writing tests

- Test classes extend GUT's test base; files are named and prefixed the way the
  project's GUT config selects them (`test_*.gd` by default).
- Instantiate `RefCounted` / `Resource` logic directly; see "Testable code" in
  [SKILL.md](SKILL.md). Free any `Node` a test creates (`autofree()` or
  `add_child_autofree()`) so orphans do not accumulate.
