import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { repoRoot } from "../lib/skills.js";

const MANIFEST = "plugins/rko-claude-skills/.claude-plugin/plugin.json";

/**
 * The published baseline. An installed plugin's cache is keyed on the version
 * in plugin.json, not on the commit it was built from — so when the version has
 * not moved, the updater reports "already at the latest version" and skips
 * re-copying the files. A change without a bump therefore reaches no repository
 * but this one, silently, behind a reassuring message. This suite exists to
 * make that failure loud, because it is invisible from inside this repo.
 */
const BASELINE = "origin/main";

/** Returns null instead of throwing, so a missing ref reads as "unknown". */
function git(...args) {
  try {
    return execFileSync("git", args, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

const version = (json) => JSON.parse(json).version;

test("a change to the plugin declares a new version", (t) => {
  // A shallow clone or a fork with no upstream has nothing to compare against.
  // Skipping is honest; failing would break a fresh clone that changed nothing.
  if (!git("rev-parse", "--verify", "--quiet", BASELINE)) {
    t.skip(`no ${BASELINE} to compare against`);
    return;
  }

  // Two-dot, so uncommitted work counts: the point is to catch this at
  // `npm test`, while the bump is still one edit away, not after the push.
  const changed = git("diff", "--name-only", BASELINE, "--", "plugins/")
    ?.split("\n")
    .filter(Boolean)
    .filter((f) => f !== MANIFEST);

  if (!changed?.length) return;

  const published = git("show", `${BASELINE}:${MANIFEST}`);
  assert.ok(published, `${MANIFEST} is missing from ${BASELINE}`);

  const local = readFileSync(join(repoRoot, MANIFEST), "utf8");

  assert.notEqual(
    version(local),
    version(published),
    `${changed.length} file(s) under plugins/ changed since ${BASELINE} — including ` +
      `${changed.slice(0, 3).join(", ")}${changed.length > 3 ? ", …" : ""} — but the ` +
      `version is still ${version(published)}. Bump it in ${MANIFEST}, or the change ` +
      `reaches no repository that installs this plugin.`,
  );
});
