#!/usr/bin/env node
// Detect how a repository runs its tests and checks, and generate the reserved
// `run-tests` and `verify` skills for it.
//
//   node probe.mjs <dir>            print the plan as JSON, write nothing
//   node probe.mjs <dir> --write    write the skills that are missing
//
// Detection is deterministic, which is why it lives in a script: a model
// re-deriving these rules each time would drift. Anything it cannot determine
// is reported as undetermined — never guessed.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const read = (dir, file) => {
  try {
    return readFileSync(join(dir, file), "utf8");
  } catch {
    return null;
  }
};

const hasFileMatching = (dir, sub, re) => {
  try {
    return readdirSync(join(dir, sub), { recursive: true }).some((f) => re.test(String(f)));
  } catch {
    return false;
  }
};

/** The lockfile names the package manager; the manifest names the scripts. */
function detectNode(dir) {
  const manifest = read(dir, "package.json");
  if (!manifest) return null;

  const { scripts = {} } = JSON.parse(manifest);
  if (!scripts.test) return null;

  const LOCKFILES = { "pnpm-lock.yaml": "pnpm", "yarn.lock": "yarn", "bun.lockb": "bun", "package-lock.json": "npm" };
  const lockfile = Object.keys(LOCKFILES).find((f) => existsSync(join(dir, f)));
  const pm = lockfile ? LOCKFILES[lockfile] : "npm";

  const run = (s) => `${pm} run ${s}`;
  const gate = ["typecheck", "lint", "test", "build"].filter((s) => scripts[s]).map(run);

  return {
    stack: "node",
    // Say what was actually found. A default presented as a finding is the kind
    // of evidence that makes the user's review step worthless.
    evidence: lockfile
      ? `package.json scripts and ${lockfile}`
      : "package.json scripts; no lockfile found, so npm is a default rather than a detection",
    runTests: run("test"),
    verify: gate.join(" && "),
  };
}

function detectGodot(dir) {
  if (!read(dir, "project.godot")) return null;

  const gut = ["test", "tests"].find((d) => hasFileMatching(dir, d, /\.gd$/));
  if (!gut) return null;

  // GUT is driven through the engine binary; there is no package manager.
  const command = `godot --headless -s addons/gut/gut_cmdln.gd -gdir=res://${gut} -gexit`;
  return {
    stack: "godot",
    evidence: `project.godot and .gd files under ${gut}/`,
    runTests: command,
    verify: command,
    note: "Godot has no typecheck or lint step, so verify runs the tests. Add more here if that changes.",
  };
}

const simple = (file, stack, runTests, verify = runTests) => (dir) =>
  read(dir, file) ? { stack, evidence: file, runTests, verify } : null;

const DETECTORS = [
  detectNode,
  detectGodot,
  simple("Cargo.toml", "rust", "cargo test", "cargo clippy -- -D warnings && cargo test"),
  simple("go.mod", "go", "go test ./...", "go vet ./... && go test ./..."),
  simple("pyproject.toml", "python", "pytest"),
  (dir) => (/^test:/m.test(read(dir, "Makefile") ?? "") ? { stack: "make", evidence: "Makefile test target", runTests: "make test", verify: "make test" } : null),
];

const DESCRIPTIONS = {
  "run-tests": {
    domain: "test-execution",
    description:
      "Run this project's test suite and nothing else. Use when the user wants to run tests, check whether tests pass, verify a fix, or when a red-green loop needs a fast tests-only signal.",
  },
  verify: {
    domain: "verification",
    description:
      "Run this project's full pre-commit gate. Use when the user wants to verify a change is ready to commit, asks whether everything passes, or is about to commit or open a pull request.",
  },
};

function skillFile(name, command, detected) {
  const { domain, description } = DESCRIPTIONS[name];
  const purpose =
    name === "run-tests"
      ? "Tests only — no lint, no typecheck, no build — so it is safe to call on every red-green cycle."
      : "The full gate, run once before committing. For the fast tests-only call, invoke the project's `run-tests` skill.";

  return `---
name: ${name}
description: ${description}
domain: ${domain}
disable-model-invocation: false
---

# ${name === "run-tests" ? "Run Tests" : "Verify"}

This repository's implementation of the \`${name}\` reserved skill name. ${purpose}

## Command

\`\`\`
${command}
\`\`\`

Detected from ${detected.evidence}. If that is wrong, edit this file — it is the
one place this project states how it runs its checks.
${detected.note ? `\n${detected.note}\n` : ""}`;
}

const [dir, ...flags] = process.argv.slice(2);
const write = flags.includes("--write");

if (!dir) {
  console.error("usage: probe.mjs <dir> [--write]");
  process.exit(2);
}

const detected = DETECTORS.reduce((found, d) => found ?? d(dir), null);

if (!detected) {
  console.log(
    JSON.stringify(
      {
        status: "undetermined",
        message:
          "Could not determine how this project runs its tests. Looked for: a package.json with a test script, a Godot project with .gd tests, Cargo.toml, go.mod, pyproject.toml, and a Makefile test target. Ask the user how tests are run, then write .claude/skills/run-tests/SKILL.md by hand. Do not guess a command.",
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const commands = { "run-tests": detected.runTests, verify: detected.verify };
const plan = { status: "detected", stack: detected.stack, evidence: detected.evidence, skills: {}, written: [], skipped: [] };

for (const [name, command] of Object.entries(commands)) {
  const path = join(dir, ".claude", "skills", name, "SKILL.md");
  const exists = existsSync(path);
  plan.skills[name] = { command, exists, path: join(".claude/skills", name, "SKILL.md") };

  if (!write) continue;
  if (exists) {
    plan.skipped.push(name);
    continue;
  }
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, skillFile(name, command, detected));
  plan.written.push(name);
}

console.log(JSON.stringify(plan, null, 2));
