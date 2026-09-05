import test from "node:test";
import assert from "node:assert/strict";

import { loadAgents, KNOWN_TOOLS, WRITE_TOOLS, baseTool } from "../lib/agents.js";
import { loadSkills } from "../lib/skills.js";
import { RESERVED_NAMES } from "../lib/conventions.js";

/**
 * Procedure belongs in skills, which both the main thread and a subagent can
 * invoke. An agent file that grows past this is usually restating a procedure
 * instead of delegating to one.
 */
const MAX_AGENT_LINES = 100;

const agents = loadAgents();

test("agent files parse and declare a name, description, and tool allowlist", () => {
  assert.ok(agents.length > 0, "expected at least one agent");

  const incomplete = agents
    .filter((a) => !a.name || !a.description || a.tools.length === 0)
    .map((a) => `${a.relativePath} is missing a name, description, or tools`);

  assert.deepEqual(incomplete.sort(), [], "an implicit tool list is an ungoverned one");
});

test("every agent's name matches its filename", () => {
  const mismatched = agents
    .filter((a) => a.name !== a.file)
    .map((a) => `${a.relativePath} declares "${a.name}"`);

  assert.deepEqual(mismatched.sort(), []);
});

test("every tool an agent lists is a real tool", () => {
  const unknown = [];
  for (const agent of agents) {
    for (const tool of agent.tools) {
      if (!KNOWN_TOOLS.has(baseTool(tool))) {
        unknown.push(`${agent.name} lists "${tool}", which is not a known tool`);
      }
    }
  }

  assert.deepEqual(unknown.sort(), [], "a typo in a tool name silently changes what an agent can do");
});

test("every skill an agent delegates to exists", () => {
  const resolvable = new Set([...loadSkills().map((s) => s.name), ...RESERVED_NAMES]);

  const dangling = [];
  for (const agent of agents) {
    const refs = agent.body.matchAll(
      /\b(?:invoke|run|use|call)s?\s+the\s+(?:project's\s+)?`([a-z][a-z0-9-]*)`\s+skill/gi,
    );
    for (const [, target] of refs) {
      if (!resolvable.has(target)) {
        dangling.push(`${agent.name} delegates to \`${target}\`, which does not exist`);
      }
    }
  }

  assert.deepEqual([...new Set(dangling)].sort(), []);
});

test("an agent that may write states what it must not write", () => {
  // Tool allowlists are not path-scoped, so an agent holding Write can touch
  // anything. Where the boundary matters it has to be stated in the agent's own
  // instructions, and this asserts the statement is actually there.
  const unstated = agents
    .filter((a) => a.tools.some((t) => WRITE_TOOLS.has(baseTool(t))))
    .filter((a) => !/##\s*What you must not write/i.test(a.body))
    .map((a) => `${a.name} can write but has no "What you must not write" section`);

  assert.deepEqual(unstated.sort(), [], "an unscoped write capability must be bounded in prose");
});

test("agent files stay thin", () => {
  const bloated = agents
    .map((a) => [a, a.body.split("\n").length])
    .filter(([, lines]) => lines > MAX_AGENT_LINES)
    .map(([a, lines]) => `${a.name} is ${lines} lines (max ${MAX_AGENT_LINES}) — move procedure into a skill`);

  assert.deepEqual(bloated.sort(), []);
});
