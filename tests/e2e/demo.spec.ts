import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function startSportsDemo(page: Page, sport = "Basketball", risk = "Medium") {
  await page.goto("/");
  await page.getByRole("link", { name: /try demo/i }).first().click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByRole("button", { name: new RegExp(sport) }).click();
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByRole("button", { name: new RegExp(risk) }).click();
  await page.getByRole("button", { name: /find picks/i }).click();
  await expect(page).toHaveURL(/\/forecasts/);
}

test("demo carries a forecast allocation into portfolio, history, and measured performance", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await startSportsDemo(page);
  await expect(page.getByRole("heading", { name: "Predictions for your setup" })).toBeVisible();
  await expect(page.locator(".forecast-row").first()).toContainText("Warriors");
  const forecastHref = await page.locator(".forecast-row").first().getAttribute("href");
  await page.locator(".forecast-row").first().click();
  await expect(page.getByText(/54\.0%/).first()).toBeVisible();
  await expect(page.getByText(/reference/i).first()).toBeVisible();
  await page.getByRole("button", { name: /add to demo/i }).click();
  await expect(page).toHaveURL(/\/forecasts/);
  await page.goto("/portfolio");
  const position = page.locator(".ledger-table tbody tr").first();
  await expect(position).toContainText("Warriors");
  await expect(position.locator('[data-label="Demo amount"]')).toContainText("credits");
  const allocation = (await position.locator('[data-label="Demo amount"]').textContent())!.trim();
  await page.reload();
  await expect(page.locator(".ledger-table tbody tr").first()).toContainText(allocation);
  await page.goto("/history");
  const decision = page.locator(".history-table tbody tr").filter({ has: page.locator(`a.table-event[href="${forecastHref}"]`) });
  await expect(decision.locator('[data-label="Allocation"]')).toHaveText(allocation);
  await expect(page.locator(".history-table tbody tr").filter({ has: page.locator(".decision-no") }).first().locator('[data-label="Allocation"]')).toHaveText("No position");
  await page.getByRole("link", { name: /performance/i }).first().click();
  await expect(page).toHaveURL(/\/performance/);
  await expect(page.getByText(/Brier score/i).first()).toBeVisible();
  await expect(page.getByText(/Observed frequency/i).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("invalid saved ledger is rejected instead of displaying corrupted credits", async ({ page }) => {
  await startSportsDemo(page);
  await page.locator(".forecast-row").first().click();
  await page.getByRole("button", { name: /add to demo/i }).click();
  await page.evaluate(() => {
    const key = "forecast-studio-demo-v3";
    const snapshot = JSON.parse(localStorage.getItem(key)!);
    snapshot.run.positions[0].virtualAllocation = -40;
    localStorage.setItem(key, JSON.stringify(snapshot));
  });
  await page.goto("/portfolio");
  await expect(page.getByRole("heading", { name: "Start with your setup" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("forecast-studio-demo-v3")!).run)).toBeNull();
});

test("high-risk review shows eligible hockey outcomes without automatic allocations", async ({ page }) => {
  await startSportsDemo(page, "Hockey", "High");
  const forecasts = page.locator(".forecast-row");
  await expect(forecasts.first()).toBeVisible();
  await expect(forecasts.first()).toContainText(/hockey|nhl|summit/i);
  await page.goto("/portfolio");
  await expect(page.getByText(/You have not added any picks yet/i)).toBeVisible();
  await page.goto("/history");
  await page.getByLabel("Decision").selectOption("abstain");
  await expect(page.locator(".history-table tbody tr").first().locator('[data-label="Allocation"]')).toHaveText("No position");
  await page.locator(".history-table tbody tr").first().locator("a.table-event").click();
  await expect(page.getByText("Abstained", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /add to demo/i })).toHaveCount(0);
  await page.getByRole("link", { name: /view decision history/i }).click();
  await expect(page).toHaveURL(/\/history/);
});
