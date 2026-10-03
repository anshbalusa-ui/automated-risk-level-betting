import { expect, test } from "@playwright/test";

test("no-signup demo crosses sports, weather, abstention and measured simulation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("button", { name: /try (the )?demo/i }).or(page.getByRole("link", { name: /try (the )?demo/i })).first().click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText(/DEMO DATA/i).first()).toBeVisible();
  await expect(page.locator("main").getByText(/simulation/i).first()).toBeVisible();
  await expect(page.locator("main").getByText(/Warriors/i).first()).toBeVisible();
  await expect(page.locator("main").getByText(/San Francisco/i).first()).toBeVisible();
  await expect(page.locator("main").getByText(/uncertainty/i).first()).toBeVisible();
  await page.goto("/forecasts");
  await expect(page.getByText(/Warriors/i).first()).toBeVisible();
  await expect(page.getByText(/San Francisco/i).first()).toBeVisible();
  await page.locator('a[href^="/forecast/"]').filter({ hasText: /Warriors/i }).first().click();
  await expect(page).toHaveURL(/\/forecast\//);
  await expect(page.getByText(/uncertainty/i).first()).toBeVisible();
  await page.goto("/forecasts");
  await page.locator('a[href^="/forecast/"]').filter({ hasText: /San Francisco/i }).first().click();
  await expect(page).toHaveURL(/\/forecast\//);
  await page.goto("/forecasts");
  await page.getByRole("button", { name: /abstained/i }).click();
  await expect(page.getByText(/uncertain/i).first()).toBeVisible();
  for (const route of ["/portfolio", "/history", "/performance"]) {
    await page.goto(route);
    await expect(page.getByText(/DEMO DATA/i).first()).toBeVisible();
  }
  await expect(page.getByText(/Brier/i).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("invalid saved ledger is rejected instead of displaying corrupted credits", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: /try (the )?demo/i }).first().click();
  await expect(page).toHaveURL(/\/dashboard/);
  await page.evaluate(() => {
    const key = "forecast-studio-demo-v1";
    const snapshot = JSON.parse(localStorage.getItem(key)!);
    snapshot.run.positions[0].virtualAllocation = -40;
    localStorage.setItem(key, JSON.stringify(snapshot));
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: /workspace is ready/i })).toBeVisible();
  expect(errors).toEqual([]);
});
