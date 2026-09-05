import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative, basename } from "node:path";

import { repoRoot, parseFrontmatter } from "./skills.js";

export const agentsDir = join(repoRoot, "plugins", "rko-claude-skills", "agents");

/** Tools an agent may list. A typo here silently grants or withholds a capability. */
export const KNOWN_TOOLS = new Set([
  "Agent", "AskUserQuestion", "Bash", "Edit", "Glob", "Grep", "ListAgents",
  "Monitor", "NotebookEdit", "Read", "ReportFindings", "SendMessage", "Skill",
  "SlashCommand", "TodoWrite", "WebFetch", "WebSearch", "Workflow", "Write",
]);

/** Tools that can create or change a file. Bash is included: it can write too. */
export const WRITE_TOOLS = new Set(["Bash", "Edit", "NotebookEdit", "Write"]);

/** `tools` is written as a CSV list or a JSON array, and entries may be parameterised: Agent(foo:bar). */
export function parseTools(raw) {
  if (!raw) return [];
  const inner = raw.trim().startsWith("[") ? raw.trim().slice(1, -1) : raw;
  return inner
    .split(/,(?![^(]*\))/)
    .map((t) => t.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

/** Agent(claude-security:explore) grants the Agent tool; the parameter is scope, not a tool name. */
export const baseTool = (tool) => tool.replace(/\(.*\)$/, "").trim();

export function loadAgents() {
  if (!existsSync(agentsDir)) return [];

  return readdirSync(agentsDir)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const path = join(agentsDir, file);
      const body = readFileSync(path, "utf8");
      const frontmatter = parseFrontmatter(body);
      return {
        path,
        relativePath: relative(repoRoot, path),
        file: basename(file, ".md"),
        name: frontmatter.name,
        description: frontmatter.description,
        tools: parseTools(frontmatter.tools),
        frontmatter,
        body,
      };
    });
}
