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
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const read = (dir, file) => {
  try {
    return readFileSync(join(dir, file), "utf8");
  } catch {
    return null;
  }
};

/**
 * The directories under `sub` that actually hold a matching file.
 *
 * Recursing to *decide* a stack and then proposing the directory you started
 * from is how a detector ends up generating a command that runs nothing: the
 * files are two levels down, the runner only looks one level in, and it exits
 * cleanly having done no work. So return where the files really are, and let
 * the caller name those directories.
 */
const dirsContaining = (dir, sub, re) => {
  try {
    return [
      ...new Set(
        readdirSync(join(dir, sub), { recursive: true })
          .map(String)
          .filter((f) => re.test(f))
          .map((f) => join(sub, dirname(f))),
      ),
    ].sort();
  } catch {
    return [];
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

/**
 * `godot` is usually not on PATH on macOS, where the engine ships as an .app
 * bundle. Emitting the bare name there produces "command not found", which is a
 * guess dressed as a detection.
 */
function findGodotBinary() {
  const candidates = [
    process.env.GODOT,
    ...(process.env.PATH ?? "")
      .split(":")
      .filter(Boolean)
      .flatMap((p) => ["godot", "godot4"].map((b) => join(p, b))),
    "/Applications/Godot.app/Contents/MacOS/Godot",
    join(homedir(), "Applications/Godot.app/Contents/MacOS/Godot"),
  ];
  return candidates.find((p) => p && existsSync(p)) ?? null;
}

function detectGodot(dir) {
  if (!read(dir, "project.godot")) return null;

  // GUT auto-loads only the dotfile spelling. A project that spells it
  // `gut_config.json` still has a stated config; it just has to be passed
  // explicitly, and passing it beats inferring directories the project has
  // already named.
  const config = [".gutconfig.json", "gut_config.json"].find((f) => read(dir, f));
  const dirs = ["test", "tests"].flatMap((d) => dirsContaining(dir, d, /test_.*\.gd$/));

  if (!config && dirs.length === 0) return null;

  const scope = config ? `-gconfig=res://${config}` : `-gdir=${dirs.map((d) => `res://${d}`).join(",")}`;
  const evidence = config
    ? `project.godot and ${config}`
    : `project.godot and test_*.gd files under ${dirs.join(", ")}/`;

  const binary = findGodotBinary();
  const command = `${binary ?? "godot"} --headless --path . -s addons/gut/gut_cmdln.gd ${scope} -gexit`;

  return {
    stack: "godot",
    evidence: binary
      ? `${evidence}; engine binary at ${binary}`
      : evidence,
    runTests: command,
    verify: command,
    // GUT is driven through the engine binary; there is no package manager.
    note: "Godot has no typecheck or lint step, so verify runs the tests. Add more here if that changes.",
    missing: binary
      ? null
      : "The Godot engine binary could not be found on PATH, in $GODOT, or in the usual macOS .app locations. Ask the user for its full path and substitute it for `godot` in the command below before writing.",
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

// A stack can be identified and still be unrunnable — a detected engine whose
// binary is nowhere to be found. Writing the command anyway would bake in the
// same guess the fallback chain forbids, so report it and let the user supply
// the missing piece.
const plan = {
  status: detected.missing ? "incomplete" : "detected",
  stack: detected.stack,
  evidence: detected.evidence,
  skills: {},
  written: [],
  skipped: [],
};
if (detected.missing) plan.missing = detected.missing;

for (const [name, command] of Object.entries(commands)) {
  const path = join(dir, ".claude", "skills", name, "SKILL.md");
  const exists = existsSync(path);
  plan.skills[name] = { command, exists, path: join(".claude/skills", name, "SKILL.md") };
  // Skipping an existing skill is right — a hand-tuned one beats a generated
  // one — but skipping it silently means nobody ever checks whether it still
  // runs anything. Which fence in the file holds the real command is not
  // something a regex can settle, so name the file and demand it be read.
  if (exists) {
    plan.skills[name].mustVerify =
      "Already present, so it will not be overwritten — and it has never been checked. Read this file, run the command it states, and confirm a non-zero test count before trusting it.";
  }

  if (!write || detected.missing) continue;
  if (exists) {
    plan.skipped.push(name);
    continue;
  }
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, skillFile(name, command, detected));
  plan.written.push(name);
}

console.log(JSON.stringify(plan, null, 2));
