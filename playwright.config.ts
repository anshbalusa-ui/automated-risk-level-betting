import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  use: { baseURL: "http://127.0.0.1:3099", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium" } },
  ],
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3099",
    url: "http://127.0.0.1:3099",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
