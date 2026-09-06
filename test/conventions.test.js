import test from "node:test";
import assert from "node:assert/strict";

import { loadConventions, RESERVED_NAMES } from "../lib/conventions.js";
import { loadSkills, loadRepoSkills } from "../lib/skills.js";

test("the contract document declares exactly the reserved vocabulary", () => {
  const { reservedNames } = loadConventions();

  assert.deepEqual(
    reservedNames.sort(),
    [...RESERVED_NAMES].sort(),
    "CONVENTIONS.md must declare the reserved names, and only those",
  );
});

test("the contract document states the fallback chain in order", () => {
  const { fallbackChain } = loadConventions();

  assert.deepEqual(
    fallbackChain,
    ["reserved skill", "repository documentation", "auto-detection", "ask the user"],
    "the fallback chain must be stated, in order, so every agent can cite it",
  );
});

test("a skill implementing a reserved name stays model-invocable", () => {
  // disable-model-invocation does not merely withhold a skill from
  // auto-selection: it removes it from the Skill tool, leaving it reachable
  // only when the user types its name. A reserved name exists so a generic
  // skill or agent can invoke it, and a subagent has no user to ask — so true
  // severs the delegation the name was created for. verify is the tempting
  // case, being the expensive gate, and the one that breaks qa-verifier.
  const severed = [...loadSkills(), ...loadRepoSkills()]
    .filter((s) => RESERVED_NAMES.includes(s.name))
    .filter((s) => String(s.frontmatter["disable-model-invocation"]) === "true")
    .map((s) => `${s.relativePath} implements the reserved name "${s.name}" but sets disable-model-invocation: true`);

  assert.deepEqual(severed.sort(), [], "a reserved name no agent can invoke is not a contract, it is a dead end");
});
