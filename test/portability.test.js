import test from "node:test";
import assert from "node:assert/strict";

import { loadSkills } from "../lib/skills.js";
import { loadAgents } from "../lib/agents.js";
import { STACK_SPECIFIC } from "../lib/conventions.js";

/** Matches a placeholder form (`pnpm <name>`) too — naming a stack is naming a stack. */
const PACKAGE_MANAGER = /\b(?:pnpm|npm|npx|yarn|bun)\s+[a-z<][\w:<>./-]*/g;

test("no generic skill or agent names a stack skill", () => {
  // A generic capability reaches a stack skill only through detect-stack,
  // which decides from evidence in the repository. Naming one directly would
  // make "works on any codebase" a promise instead of a property: the route
  // would fire in every repository, Drupal or not.
  const skills = loadSkills();
  const stackSkills = skills.filter((s) => s.frontmatter.stack).map((s) => s.name);
  const generic = [...skills.filter((s) => !s.frontmatter.stack), ...loadAgents()];

  const offenders = [];
  for (const unit of generic) {
    for (const name of stackSkills) {
      if (unit.body.includes(`\`${name}\``)) {
        offenders.push(`${unit.relativePath} names the stack skill \`${name}\` — route it through detect-stack`);
      }
    }
  }

  assert.deepEqual(offenders.sort(), [], "generic skills and agents must not name stack skills");
});

test("every stack skill's domain carries its stack as a prefix", () => {
  const unprefixed = loadSkills()
    .filter((s) => s.frontmatter.stack && !String(s.frontmatter.domain).startsWith(`${s.frontmatter.stack}-`))
    .map((s) => `${s.relativePath} is a ${s.frontmatter.stack} skill with domain "${s.frontmatter.domain}"`);

  assert.deepEqual(unprefixed.sort(), [], "a stack-prefixed domain cannot collide with a generic skill's");
});

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
