import test from "node:test";
import assert from "node:assert/strict";

import { loadSkills } from "./lib/skills.js";

/**
 * Claude Code commands that are not skills in this plugin. Referencing one is
 * legitimate, so they are not dangling.
 */
const BUILT_IN_COMMANDS = new Set([
  "add-dir", "agents", "bug", "clear", "compact", "config", "cost", "doctor",
  "export", "help", "hooks", "ide", "init", "login", "logout", "marketplace",
  "mcp", "memory", "model", "permissions", "plugin", "pr-comments",
  "release-notes", "rename", "resume", "review", "security-review",
  "skill-doctor", "status", "statusline", "terminal-setup", "vim",
]);

/**
 * A reference is a backticked `/name`, or a bare /name introduced by a verb
 * that means "invoke this". Anything looser matches file paths, regexes and
 * prose; anything tighter misses how these skills actually cite each other.
 */
function findReferences(body) {
  const found = new Set();
  for (const [, name] of body.matchAll(/`\/([a-z][a-z0-9-]*)`/g)) found.add(name);
  for (const [, , name] of body.matchAll(
    /\b(run|use|invoke|call)\s+\/([a-z][a-z0-9-]{2,})\b/gi,
  )) {
    found.add(name);
  }
  return [...found];
}

test("every command a skill references actually exists", () => {
  const skills = loadSkills();
  const known = new Set(skills.map((s) => s.name));

  const dangling = [];
  for (const skill of skills) {
    for (const reference of findReferences(skill.body)) {
      if (!known.has(reference) && !BUILT_IN_COMMANDS.has(reference)) {
        dangling.push(`${skill.relativePath} references /${reference}, which does not exist`);
      }
    }
  }

  assert.deepEqual(dangling.sort(), [], "skills must not reference commands that do not exist");
});
