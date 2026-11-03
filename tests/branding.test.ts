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

test("MATIC is the public brand, not the old Rogue identity", () => {
  for (const path of files) {
    const content = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
    assert.doesNotMatch(content, /r[øo]gue/i, `Old branding in ${path}`);
    assert.doesNotMatch(content, /mantic/i, `Old spelling in ${path}`);
  }
  const landing = readFileSync(new URL("../src/components/landing/LandingExperience.tsx", import.meta.url), "utf8");
  const layout = readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8");
  assert.match(landing, /MATIC/);
  assert.match(layout, /Matic/);
});
