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

test("a Godot project is recognised from project.godot, with its engine version", () => {
  const result = detect(fixture({
    "project.godot": 'config_version=5\n\n[application]\n\nconfig/name="game"\nconfig/features=PackedStringArray("4.7", "Mobile")\n',
  }));

  assert.deepEqual(result.stacks.map((s) => s.skill), ["godot-conventions"]);
  assert.equal(result.stacks[0].evidence, "project.godot (engine 4.7)");
});

test("a Godot project that declares no engine version says so rather than assuming one", () => {
  const [godot] = detect(fixture({ "project.godot": "config_version=5\n" })).stacks;
  assert.equal(godot.evidence, "project.godot (engine version not declared)");
});

test("a React Native app is recognised from its dependency, with versions", () => {
  const [rn] = detect(fixture({
    "package.json": JSON.stringify({ dependencies: { expo: "~54.0.37", react: "19.1.0", "react-native": "0.81.5" } }),
  })).stacks;
  assert.equal(rn.skill, "react-native-conventions");
  assert.equal(rn.evidence, "package.json depends on react-native 0.81.5, Expo ~54.0.37");
});

test("a React web app, even one using react-native-web, is not React Native", () => {
  assert.deepEqual(stacksOf({ "package.json": JSON.stringify({ dependencies: { react: "^19", "react-dom": "^19" } }) }), []);
  assert.deepEqual(stacksOf({ "package.json": JSON.stringify({ dependencies: { react: "^19", "react-native-web": "^0.21" } }) }), []);
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
