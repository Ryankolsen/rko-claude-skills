import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";

import { loadSkills, loadRepoSkills, repoRoot } from "../lib/skills.js";
import { STACK_SPECIFIC } from "../lib/conventions.js";

/** Code fences hold templates and examples, which name files that need not exist. */
const withoutCodeFences = (body) => body.replace(/```[\s\S]*?```/g, "");

test("every exemption names a skill that exists", () => {
  const names = new Set(loadSkills().map((s) => s.name));

  const dead = [...STACK_SPECIFIC.keys()]
    .filter((name) => !names.has(name))
    .map((name) => `exemption for "${name}", which is not a skill in this plugin`);

  assert.deepEqual(dead, [], "a dead exemption silently weakens the rule it belongs to");
});

test("every skill the README names exists, and every skill is in the README", () => {
  const readme = readFileSync(join(repoRoot, "README.md"), "utf8");

  // Only the "## Skills" section. Other tables document different things —
  // the reserved names a repository supplies are not skills in this plugin.
  const section = /^## Skills$([\s\S]*?)(?=^## |\Z)/m.exec(readme);
  assert.ok(section, "README must have a ## Skills section");

  const documented = new Set(
    [...section[1].matchAll(/^\|\s*`([a-z][a-z0-9-]*)`\s*\|/gm)].map(([, n]) => n),
  );
  const actual = new Set(loadSkills().map((s) => s.name));

  const stale = [...documented].filter((n) => !actual.has(n)).map((n) => `README documents "${n}", which no longer exists`);
  const missing = [...actual].filter((n) => !documented.has(n)).map((n) => `"${n}" exists but is not in the README`);

  assert.deepEqual([...stale, ...missing].sort(), [], "the README must match the skills that exist");
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
