import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { repoRoot, parseFrontmatter } from "../lib/skills.js";

const PROBE = join(
  repoRoot,
  "plugins/rko-claude-skills/skills/setup-project-skills/scripts/probe.mjs",
);

/** Build a throwaway repository shaped like a real one. */
function fixture(files) {
  const dir = mkdtempSync(join(tmpdir(), "probe-"));
  for (const [path, contents] of Object.entries(files)) {
    const full = join(dir, path);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, contents);
  }
  return dir;
}

// The Godot detector looks at the machine for an engine binary, so the tests
// state which machine they are pretending to be on rather than inheriting one.
const probe = (dir, ...args) =>
  JSON.parse(
    execFileSync(process.execPath, [PROBE, dir, ...args], {
      encoding: "utf8",
      env: { ...process.env, PATH: "", GODOT: process.execPath },
    }),
  );

const PNPM = {
  "package.json": JSON.stringify({
    scripts: { test: "jest", typecheck: "tsc --noEmit", lint: "eslint ." },
  }),
  "pnpm-lock.yaml": "lockfileVersion: 9.0\n",
};

const GODOT = {
  "project.godot": "config_version=5\n",
  "test/unit/test_wizard.gd": "extends GutTest\n",
};

test("a pnpm project resolves to its own commands", () => {
  const plan = probe(fixture(PNPM));

  assert.equal(plan.status, "detected");
  assert.equal(plan.stack, "node");
  assert.match(plan.skills["run-tests"].command, /^pnpm run test$/);
  assert.match(plan.skills.verify.command, /pnpm run typecheck/);
  assert.match(plan.skills.verify.command, /pnpm run test/);
});

test("evidence never claims a lockfile that is not there", () => {
  // The skill tells the user the evidence is the part worth checking, so
  // evidence that overstates what was found undermines that whole step.
  const plan = probe(fixture({ "package.json": JSON.stringify({ scripts: { test: "jest" } }) }));

  assert.equal(plan.status, "detected");
  assert.doesNotMatch(plan.evidence, /lock\.(json|yaml)|\.lockb/, "must not cite a lockfile that is not there");
  assert.match(plan.evidence, /default/i, "must say the package manager was a default, not a finding");
});

test("a Godot project resolves without a package manager", () => {
  const plan = probe(fixture(GODOT));

  assert.equal(plan.status, "detected");
  assert.equal(plan.stack, "godot");
  assert.match(plan.skills["run-tests"].command, /gut_cmdln\.gd/);
  assert.doesNotMatch(JSON.stringify(plan), /npm|pnpm|yarn/);
});

test("the Godot command names the directory the tests are actually in", () => {
  // GUT does not recurse by default. A detector that recurses to find the tests
  // and then points the runner one level too shallow generates a command that
  // runs nothing and exits clean — the worst possible outcome.
  const plan = probe(fixture(GODOT));

  assert.match(plan.skills["run-tests"].command, /-gdir=res:\/\/test\/unit\b/);
  assert.doesNotMatch(plan.skills["run-tests"].command, /-gdir=res:\/\/test\s/);
});

test("a stated GUT config wins over inferred directories", () => {
  // GUT only auto-loads `.gutconfig.json`, so a project spelling it any other
  // way needs it passed explicitly — but it is still the project's own answer.
  const plan = probe(fixture({ ...GODOT, "gut_config.json": '{"dirs":["res://test/unit"]}' }));

  assert.match(plan.skills["run-tests"].command, /-gconfig=res:\/\/gut_config\.json/);
  assert.doesNotMatch(plan.skills["run-tests"].command, /-gdir/);
  assert.match(plan.evidence, /gut_config\.json/);
});

test("a Godot project with no engine binary asks rather than emitting `godot`", () => {
  const dir = fixture(GODOT);
  const plan = JSON.parse(
    execFileSync(process.execPath, [PROBE, dir, "--write"], {
      encoding: "utf8",
      env: { ...process.env, PATH: "", GODOT: "" },
    }),
  );

  assert.equal(plan.status, "incomplete", "a command that cannot run is not a detection");
  assert.ok(plan.missing?.length > 0, "must say what it needs from the user");
  assert.deepEqual(plan.written, [], "must not write a command that would fail with command-not-found");
});

test("an undetectable project asks rather than guesses", () => {
  const dir = fixture({ "README.md": "# a repo with no runner\n" });
  const plan = probe(dir);

  assert.equal(plan.status, "undetermined");
  assert.ok(plan.message.length > 0, "must say what it could not determine");
  assert.equal(existsSync(join(dir, ".claude/skills")), false, "must not write on a guess");
});

test("an existing reserved skill is never overwritten", () => {
  const original = "---\nname: run-tests\ndescription: Hand-written. Do not touch.\n---\n\ngodot --headless\n";
  const dir = fixture({ ...GODOT, ".claude/skills/run-tests/SKILL.md": original });

  const plan = probe(dir, "--write");

  assert.deepEqual(plan.skipped, ["run-tests"]);
  assert.ok(
    plan.skills["run-tests"].mustVerify?.length > 0,
    "a skip is not a pass: the skipped skill has never been run, so say it must be checked",
  );
  assert.equal(readFileSync(join(dir, ".claude/skills/run-tests/SKILL.md"), "utf8"), original);
  assert.ok(existsSync(join(dir, ".claude/skills/verify/SKILL.md")), "the missing one is still written");
});

test("generated skills satisfy the rules this repo enforces on skills", () => {
  const dir = fixture(PNPM);
  const plan = probe(dir, "--write");

  assert.deepEqual(plan.written.sort(), ["run-tests", "verify"]);

  for (const name of plan.written) {
    const path = join(dir, ".claude/skills", name, "SKILL.md");
    const fm = parseFrontmatter(readFileSync(path, "utf8"));

    assert.equal(fm.name, name, `${name}: name must match its directory`);
    assert.ok(fm.description?.length > 0, `${name}: needs a description`);
    assert.ok(fm.domain?.length > 0, `${name}: needs a domain`);
    assert.ok(
      ["true", "false"].includes(fm["disable-model-invocation"]),
      `${name}: needs an explicit classification`,
    );
  }
});
