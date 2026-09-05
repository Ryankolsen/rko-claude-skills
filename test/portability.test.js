import test from "node:test";
import assert from "node:assert/strict";

import { loadSkills } from "../lib/skills.js";
import { STACK_SPECIFIC } from "../lib/conventions.js";

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
