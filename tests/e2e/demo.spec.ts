import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function startSportsDemo(page: Page, sport = "Basketball", risk = "Medium") {
  await page.goto("/");
  await page.getByRole("button", { name: /try demo/i }).first().click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByRole("button", { name: new RegExp(sport) }).click();
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByRole("button", { name: new RegExp(risk) }).click();
  await page.getByRole("button", { name: /find picks/i }).click();
  await expect(page).toHaveURL(/\/forecasts/);
}

test("one-game story reveals probability and virtual-credit entries as it scrolls", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const story = page.locator("#signal-story");
  const credits = page.getByRole("complementary", { name: "Illustrative virtual-credit entries" });
  const scrollStory = async (fraction: number) => page.evaluate((progress) => {
    const section = document.querySelector<HTMLElement>("#signal-story")!;
    window.scrollTo({ top: section.getBoundingClientRect().top + window.scrollY + (section.offsetHeight - window.innerHeight) * progress, behavior: "instant" });
  }, fraction);

  await expect(story).toBeVisible();
  await scrollStory(0);
  await expect(story.getByText("YES · MODEL").locator("..").locator("strong")).toHaveText("38%");
  await expect(credits.locator('[aria-hidden="false"]')).toHaveCount(0);
  await expect(story.getByText("01 / RISK LEVELS")).toBeVisible();
  await expect(story.getByText("02 / WHAT THE AGENT DOES")).toBeHidden();
  await expect(story.getByLabel("Probability bands")).toBeVisible();

  await scrollStory(0.55);
  const midpoint = story.getByText("YES · MODEL").locator("..").locator("strong");
  await expect.poll(async () => Number((await midpoint.textContent())?.replace("%", ""))).toBeGreaterThan(38);
  const halfwayYes = Number((await midpoint.textContent())?.replace("%", ""));
  expect(halfwayYes).toBeLessThan(54);
  await expect(story.getByText("NO · MODEL").locator("..").locator("strong")).toHaveText(`${100 - halfwayYes}%`);
  await expect(credits.locator('[aria-hidden="false"]')).toHaveCount(2);
  await expect(story.getByText("02 / WHAT THE AGENT DOES")).toBeVisible();
  await expect(story.getByText("01 / RISK LEVELS")).toBeHidden();
  await expect(story.getByLabel("Agent workflow")).toBeVisible();

  await scrollStory(0.25);
  await expect(story.getByText("01 / RISK LEVELS")).toBeVisible();
  await expect(story.getByText("02 / WHAT THE AGENT DOES")).toBeHidden();

  await scrollStory(1);
  await expect(story.getByText("YES · MODEL").locator("..").locator("strong")).toHaveText("54%");
  await expect(story.getByText("NO · MODEL").locator("..").locator("strong")).toHaveText("46%");
  await expect(credits.locator('[aria-hidden="false"]')).toHaveCount(4);
  await expect(story.getByText("02 / WHAT THE AGENT DOES")).toBeVisible();
  await expect(credits).toContainText("+$");
});

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
