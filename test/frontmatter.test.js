import test from "node:test";
import assert from "node:assert/strict";

import { loadSkills } from "./lib/skills.js";

test("every skill has parseable frontmatter with a name and description", () => {
  const skills = loadSkills();

  assert.ok(skills.length > 0, "expected to find at least one skill");

  const broken = skills.filter((s) => !s.name || !s.description);

  assert.deepEqual(
    broken.map((s) => s.relativePath),
    [],
    "skills missing a name or description in frontmatter",
  );
});
