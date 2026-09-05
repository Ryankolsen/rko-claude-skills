import test from "node:test";
import assert from "node:assert/strict";

import { loadSkills } from "../lib/skills.js";

/**
 * Skills exempt from the rule, and why. A skill earns a place here only by
 * being *about* a specific tool — not by being inconvenient to rewrite. If
 * this list grows, that is a signal the plugin is drifting toward one stack.
 */
const STACK_SPECIFIC = new Map([
  ["pnpm-not-found", "the skill's entire subject is a pnpm failure mode"],
  ["start-emulator", "repo-specific (bourbon-app-specific/), out of scope per #1"],
  ["build-new-version", "repo-specific (bourbon-app-specific/), out of scope per #1"],
  ["apply-theme-colors", "repo-specific (bourbon-app-specific/), out of scope per #1"],
]);

/** Matches a placeholder form (`pnpm <name>`) too — naming a stack is naming a stack. */
const PACKAGE_MANAGER = /\b(?:pnpm|npm|npx|yarn|bun)\s+[a-z<][\w:<>./-]*/g;

test("no generic skill names a package manager", () => {
  const offenders = [];

  for (const skill of loadSkills()) {
    if (STACK_SPECIFIC.has(skill.name)) continue;

    for (const [match] of skill.body.matchAll(PACKAGE_MANAGER)) {
      offenders.push(`${skill.relativePath}: "${match.trim()}" — delegate to a reserved name instead`);
    }
  }

  assert.deepEqual(
    [...new Set(offenders)].sort(),
    [],
    "generic skills must delegate to run-tests/verify, not name a stack's commands",
  );
});
