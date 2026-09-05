import test from "node:test";
import assert from "node:assert/strict";

import { loadConventions, RESERVED_NAMES } from "../lib/conventions.js";

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
