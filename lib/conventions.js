import { readFileSync } from "node:fs";
import { join } from "node:path";

import { repoRoot } from "./skills.js";

export const conventionsPath = join(repoRoot, "plugins", "rko-claude-skills", "CONVENTIONS.md");

/**
 * The reserved vocabulary, kept deliberately small: every name is something a
 * repository can fail to supply or misspell. The contract document is the
 * prose source of truth; this is the machine-checkable copy, and the test that
 * compares them is what stops the two from drifting.
 */
export const RESERVED_NAMES = ["run-tests", "verify"];

/**
 * The order is the contract: try each step, and when none resolves, ask rather
 * than guess. An agent that invents a command and reports the resulting
 * failure is worse than one that admits it cannot tell.
 */
export const FALLBACK_CHAIN = [
  "reserved skill",
  "repository documentation",
  "auto-detection",
  "ask the user",
];

/**
 * Skills exempt from the "no package manager" rule, and why. A skill earns a
 * place here only by being *about* a specific tool — not by being inconvenient
 * to rewrite.
 *
 * Currently empty, which is the goal state. It is kept because the policy needs
 * somewhere to live, and because an exemption added without a stated reason is
 * the failure mode this guards against. Entries are checked against the skills
 * that actually exist, so a deleted skill cannot leave a dead exemption behind.
 */
export const STACK_SPECIFIC = new Map([]);

export function loadConventions() {
  const body = readFileSync(conventionsPath, "utf8");

  const reservedNames = [...body.matchAll(/^### `([a-z][a-z0-9-]*)`\s*$/gm)].map(([, n]) => n);

  const fallbackChain = [...body.matchAll(/^\d+\.\s+\*\*(.+?)\*\*/gm)].map(([, step]) =>
    step.toLowerCase(),
  );

  return { body, reservedNames, fallbackChain };
}
