import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";

import { loadSkills, loadRepoSkills, repoRoot } from "../lib/skills.js";
import { loadAgents } from "../lib/agents.js";

/** Code fences hold templates and examples, which name files that need not exist. */
const withoutCodeFences = (body) => body.replace(/```[\s\S]*?```/g, "");

/**
 * The first-column entries of every table in one "## " section of the README,
 * as name → whether the row is marked *auto*. Scoped by section because other
 * tables document different things — the reserved names a repository supplies
 * are not skills in this plugin.
 */
function readmeRows(heading) {
  const readme = readFileSync(join(repoRoot, "README.md"), "utf8");
  const section = new RegExp(`^## ${heading}$([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "m").exec(readme);
  assert.ok(section, `README must have a ## ${heading} section`);

  return new Map(
    [...section[1].matchAll(/^\|\s*`([a-z][a-z0-9-]*)`(\s*\*auto\*)?\s*\|/gm)].map(([, n, auto]) => [n, Boolean(auto)]),
  );
}

function assertSameNames(documented, actual, kind) {
  const stale = [...documented].filter((n) => !actual.has(n)).map((n) => `README documents ${kind} "${n}", which no longer exists`);
  const missing = [...actual].filter((n) => !documented.has(n)).map((n) => `${kind} "${n}" exists but is not in the README`);
  assert.deepEqual([...stale, ...missing].sort(), [], `the README must match the ${kind}s that exist`);
}

test("every skill the README names exists, and every skill is in the README", () => {
  assertSameNames(new Set(readmeRows("Skills").keys()), new Set(loadSkills().map((s) => s.name)), "skill");
});

test("every agent the README names exists, and every agent is in the README", () => {
  assertSameNames(new Set(readmeRows("Agents").keys()), new Set(loadAgents().map((a) => a.name)), "agent");
});

test("the README marks exactly the auto-invocable skills as *auto*", () => {
  const rows = readmeRows("Skills");
  const wrong = loadSkills()
    .filter((s) => rows.has(s.name))
    .filter((s) => rows.get(s.name) !== (s.frontmatter["disable-model-invocation"] === "false"))
    .map((s) => `${s.name} is ${rows.get(s.name) ? "" : "not "}marked *auto*, but disable-model-invocation is ${s.frontmatter["disable-model-invocation"]}`);

  assert.deepEqual(wrong, [], "the *auto* marker must match how each skill is classified");
});

test("every markdown link in a skill resolves", () => {
  const broken = [];

  for (const skill of [...loadSkills(), ...loadRepoSkills()]) {
    for (const [, link] of withoutCodeFences(skill.body).matchAll(/\]\((?!https?:|#)([^)]+)\)/g)) {
      if (!existsSync(join(dirname(skill.path), link))) {
        broken.push(`${skill.relativePath} links to ${link}, which does not exist`);
      }
    }
  }

  assert.deepEqual(broken.sort(), [], "a link is a promise the file is there");
});

test("paths named in this repo's own skills resolve", () => {
  // Scoped to .claude/skills deliberately. The plugin's generic skills name
  // paths in the *consuming* repo (CONTEXT.md, CONTRIBUTING.md), which cannot
  // and should not resolve here. This repo's own skills describe this repo.
  const broken = [];

  for (const skill of loadRepoSkills()) {
    const paths = withoutCodeFences(skill.body).matchAll(/`((?:[\w.-]+\/)+[\w.-]+\.\w{2,4})`/g);
    for (const [, path] of paths) {
      if (!existsSync(join(repoRoot, path))) {
        broken.push(`${skill.relativePath} names ${path}, which does not exist`);
      }
    }
  }

  assert.deepEqual(broken.sort(), [], "a path named in this repo's own docs must be real");
});
