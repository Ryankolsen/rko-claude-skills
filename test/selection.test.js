import test from "node:test";
import assert from "node:assert/strict";

import { loadSkills } from "../lib/skills.js";

/**
 * An agent picks a skill from its description alone. Two skills claiming the
 * same job make that pick a coin toss, so the auto-invocable pool must hold at
 * most one skill per domain. Workflow skills are exempt: they are chosen by
 * name, so they cannot be mis-selected.
 */
const isWorkflow = (skill) => skill.frontmatter["disable-model-invocation"] === "true";

test("every skill declares a domain", () => {
  const undeclared = loadSkills()
    .filter((s) => !s.frontmatter.domain)
    .map((s) => `${s.relativePath} declares no domain`);

  assert.deepEqual(undeclared.sort(), [], "a domain names the job a skill claims");
});

test("every skill is explicitly classified as auto-invocable or workflow", () => {
  const unclassified = loadSkills()
    .filter((s) => !["true", "false"].includes(s.frontmatter["disable-model-invocation"]))
    .map((s) => `${s.relativePath} does not declare disable-model-invocation`);

  assert.deepEqual(
    unclassified.sort(),
    [],
    "which pool a skill sits in must be a decision on record, not an omission",
  );
});

test("no domain is claimed twice in the auto-invocable pool", () => {
  const byDomain = new Map();

  for (const skill of loadSkills()) {
    if (isWorkflow(skill)) continue;
    const domain = skill.frontmatter.domain;
    if (!domain) continue;
    byDomain.set(domain, [...(byDomain.get(domain) ?? []), skill.name]);
  }

  const collisions = [...byDomain]
    .filter(([, names]) => names.length > 1)
    .map(([domain, names]) => `${names.sort().join(" and ")} both claim domain "${domain}"`);

  assert.deepEqual(collisions.sort(), [], "an agent cannot choose between two skills claiming one job");
});
