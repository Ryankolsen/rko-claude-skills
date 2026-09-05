import test from "node:test";
import assert from "node:assert/strict";

import { loadSkills } from "./lib/skills.js";

test("every skill's declared name matches its directory", () => {
  const mismatched = loadSkills()
    .filter((s) => s.name !== s.directory)
    .map((s) => `${s.relativePath}: declares "${s.name}", lives in "${s.directory}"`);

  assert.deepEqual(mismatched, [], "skill name must match its directory name");
});
