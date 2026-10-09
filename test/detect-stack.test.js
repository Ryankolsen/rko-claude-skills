import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { loadSkills } from "../lib/skills.js";
import { detect, STACKS } from "../plugins/rko-claude-skills/skills/detect-stack/scripts/detect.mjs";

/** Build a throwaway repository shaped like a real one. */
function fixture(files) {
  const dir = mkdtempSync(join(tmpdir(), "detect-"));
  for (const [path, contents] of Object.entries(files)) {
    const full = join(dir, path);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, contents);
  }
  return dir;
}

const stacksOf = (files) => detect(fixture(files)).stacks.map((s) => s.stack);

test("a Drupal site is recognised from composer.json", () => {
  const result = detect(fixture({
    "composer.json": JSON.stringify({ require: { "drupal/core-recommended": "^11" } }),
    ".ddev/config.yaml": "type: drupal11\n",
  }));

  assert.deepEqual(result.stacks.map((s) => s.skill), ["drupal-conventions"]);
  assert.equal(result.envPrefix, "ddev");
});

test("a Drupal site is recognised from core on disk, under any common docroot", () => {
  for (const root of ["", "web/", "docroot/"]) {
    assert.deepEqual(stacksOf({ [`${root}core/lib/Drupal.php`]: "<?php\n" }), ["drupal"], `root "${root}"`);
  }
});

test("a standalone Drupal module is recognised from its info file", () => {
  assert.deepEqual(stacksOf({ "my_module.info.yml": "name: My module\ncore_version_requirement: ^10 || ^11\n" }), ["drupal"]);
});

test("Lando is reported as the prefix, and no wrapper as null", () => {
  const drupal = { "composer.json": JSON.stringify({ require: { "drupal/core": "^10" } }) };
  assert.equal(detect(fixture({ ...drupal, ".lando.yml": "recipe: drupal10\n" })).envPrefix, "lando");
  assert.equal(detect(fixture(drupal)).envPrefix, null);
});

test("a PHP project that is not Drupal matches no stack", () => {
  // composer.json alone is not evidence of Drupal — Laravel and Symfony have one too.
  assert.deepEqual(stacksOf({ "composer.json": JSON.stringify({ require: { "laravel/framework": "^11" } }) }), []);
  assert.deepEqual(stacksOf({ "composer.json": "{ not json" }), []);
  assert.deepEqual(stacksOf({ "package.json": "{}" }), []);
});

test("every stack the detector names has a skill declaring that stack", () => {
  const skills = new Map(loadSkills().map((s) => [s.name, s]));

  const broken = STACKS.filter(({ stack, skill }) => skills.get(skill)?.frontmatter.stack !== stack)
    .map(({ stack, skill }) => `detector maps ${stack} to "${skill}", which is not a skill declaring stack: ${stack}`);
  const unreachable = [...skills.values()]
    .filter((s) => s.frontmatter.stack && !STACKS.some((d) => d.skill === s.name))
    .map((s) => `${s.relativePath} declares stack: ${s.frontmatter.stack} but no detector routes to it`);

  assert.deepEqual([...broken, ...unreachable].sort(), [], "detector and stack skills must agree");
});
