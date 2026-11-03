import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

const files = [
  "src/app/layout.tsx",
  "src/components/ForecastApp.tsx",
  "src/components/landing/LandingExperience.tsx",
  "src/components/workspace/WorkspaceSidebar.tsx",
  "src/components/workspace/WorkspaceShell.tsx",
];

test("MANTIC is the public brand, with no remaining MATIC or Rogue labels", () => {
  for (const path of files) {
    const content = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
    assert.doesNotMatch(content, /r[øo]gue/i, `Old branding in ${path}`);
    assert.doesNotMatch(content, /\bmatic\b/i, `Old spelling in ${path}`);
  }
  const landing = readFileSync(new URL("../src/components/landing/LandingExperience.tsx", import.meta.url), "utf8");
  const layout = readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8");
  assert.match(landing, /MANTIC/);
  assert.match(layout, /MANTIC/);
  assert.match(landing, /manticHeader/);
  assert.match(landing, /MANTIC home/);
});
