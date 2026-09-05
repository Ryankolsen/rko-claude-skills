import test from "node:test";
import assert from "node:assert/strict";

import { loadSkills } from "../lib/skills.js";
import { RESERVED_NAMES } from "../lib/conventions.js";

/**
 * The canonical delegation phrasing from CONVENTIONS.md:
 *   "Invoke the project's `run-tests` skill."
 * Anchoring on it keeps delegations both readable and checkable.
 */
const DELEGATION = /\b(?:invoke|run|use|call)s?\s+the\s+(?:project's\s+|repository's\s+)?`([a-z][a-z0-9-]*)`\s+skill/gi;

test("every skill a delegation names is reserved or real", () => {
  const skills = loadSkills();
  const resolvable = new Set([...skills.map((s) => s.name), ...RESERVED_NAMES]);

  const unresolvable = [];
  for (const skill of skills) {
    for (const [, target] of skill.body.matchAll(DELEGATION)) {
      if (!resolvable.has(target)) {
        unresolvable.push(
          `${skill.relativePath} delegates to \`${target}\`, which is neither a reserved name nor a skill`,
        );
      }
    }
  }

  assert.deepEqual([...new Set(unresolvable)].sort(), [], "a delegation must resolve");
});
