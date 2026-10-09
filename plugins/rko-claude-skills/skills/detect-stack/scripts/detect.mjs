#!/usr/bin/env node
// Detect which stack a repository is, and which of this plugin's stack skills
// apply to it.
//
//   node detect.mjs <dir>    print the result as JSON
//
// Detection is deterministic, which is why it lives in a script: a model
// re-deriving "is this Drupal?" each time would drift, and a guess either way
// sends work through the wrong rules. Only evidence a reader could check
// counts; a repository matching nothing reports no stacks.

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const read = (dir, file) => {
  try {
    return readFileSync(join(dir, file), "utf8");
  } catch {
    return null;
  }
};

const composerPackages = (dir) => {
  try {
    const manifest = JSON.parse(read(dir, "composer.json") ?? "");
    return Object.keys({ ...manifest.require, ...manifest["require-dev"] });
  } catch {
    return [];
  }
};

/** The local-environment wrapper Drush and Composer commands go through. */
const envPrefix = (dir) =>
  existsSync(join(dir, ".ddev", "config.yaml")) ? "ddev"
  : existsSync(join(dir, ".lando.yml")) ? "lando"
  : null;

const DRUPAL_PACKAGES = ["drupal/core", "drupal/core-recommended", "drupal/core-composer-scaffold"];
const DRUPAL_ROOTS = [".", "web", "docroot", "html"];

function detectDrupal(dir) {
  const pkg = composerPackages(dir).find((p) => DRUPAL_PACKAGES.includes(p));
  if (pkg) return `composer.json requires ${pkg}`;

  const root = DRUPAL_ROOTS.find((r) => existsSync(join(dir, r, "core", "lib", "Drupal.php")));
  if (root) return `${join(root, "core/lib/Drupal.php")} exists`;

  // A standalone module or theme repository: its info file declares the core it supports.
  const info = readdirSync(dir).find(
    (f) => f.endsWith(".info.yml") && /^core_version_requirement:/m.test(read(dir, f) ?? ""),
  );
  if (info) return `${info} declares core_version_requirement`;

  return null;
}

/**
 * Each entry names the stack, the skill that carries its rules, and how to
 * recognise it. Adding a stack means adding an entry here and a skill whose
 * frontmatter declares that stack; the test suite checks the two agree.
 */
export const STACKS = [
  { stack: "drupal", skill: "drupal-conventions", detect: detectDrupal },
];

export function detect(dir) {
  const stacks = STACKS.flatMap(({ stack, skill, detect }) => {
    const evidence = detect(dir);
    return evidence ? [{ stack, skill, evidence }] : [];
  });
  return { dir, stacks, envPrefix: stacks.length ? envPrefix(dir) : null };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = process.argv[2] ?? process.cwd();
  console.log(JSON.stringify(detect(dir), null, 2));
}
