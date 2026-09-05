import { readdirSync, readFileSync } from "node:fs";
import { join, relative, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
export const pluginSkillsDir = join(repoRoot, "plugins", "rko-claude-skills", "skills");

/**
 * Parse YAML-ish frontmatter. Skills use a flat `key: value` shape, so a full
 * YAML parser would be a dependency we do not need. Values may be quoted, and
 * quoting is how a description containing a colon is expressed.
 */
export function parseFrontmatter(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
  if (!match) return {};

  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = /^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/.exec(line);
    if (!field) continue;

    let [, key, value] = field;
    value = value.trim();
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length > 1) ||
      (value.startsWith("'") && value.endsWith("'") && value.length > 1)
    ) {
      value = value.slice(1, -1);
    }
    fields[key] = value;
  }
  return fields;
}

function findSkillFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...findSkillFiles(path));
    } else if (entry.name === "SKILL.md") {
      found.push(path);
    }
  }
  return found;
}

export function loadSkills() {
  return findSkillFiles(pluginSkillsDir).map((path) => {
    const body = readFileSync(path, "utf8");
    const frontmatter = parseFrontmatter(body);
    return {
      path,
      relativePath: relative(repoRoot, path),
      directory: basename(dirname(path)),
      name: frontmatter.name,
      description: frontmatter.description,
      frontmatter,
      body,
    };
  });
}
