import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function startSportsDemo(page: Page, sport = "Basketball", risk = "Medium") {
  await page.goto("/");
  await scrollLandingStory(page, 1);
  const tryDemo = page.getByRole("button", { name: /try demo/i }).first();
  await expect(tryDemo).toBeEnabled();
  await tryDemo.click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByRole("button", { name: new RegExp(sport) }).click();
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByRole("button", { name: new RegExp(risk) }).click();
  await page.getByRole("button", { name: /find picks/i }).click();
  await expect(page).toHaveURL(/\/forecasts/);
}

async function scrollLandingStory(page: Page, progress: number) {
  await page.evaluate((fraction) => {
    const section = document.querySelector<HTMLElement>("#agent-story");
    if (!section) throw new Error("Landing story not found");
    window.scrollTo({
      top: section.getBoundingClientRect().top + window.scrollY + (section.offsetHeight - window.innerHeight) * fraction,
      behavior: "instant",
    });
  }, progress);
}


test("one-game story reveals probability paths as it scrolls", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const story = page.locator("#agent-story");
  const risk = story.locator('[data-stage="risk"]');
  const about = story.locator('[data-stage="about"]');

  await expect(story).toBeVisible();
  await expect(page.getByRole("link", { name: /open workspace/i })).toHaveCount(0);
  await expect(story.locator(".sports-film")).toHaveCount(4);
  await scrollLandingStory(page, 0.45);
  await expect(story.getByText("YES / MODEL").locator("..").locator("strong")).toHaveText("39%");
  await expect(risk).toBeVisible();
  await expect(about).toBeHidden();
  await expect(story.getByLabel("Probability bands")).toBeVisible();

  await scrollLandingStory(page, 0.72);
  await expect.poll(async () => Number(await story.locator("[data-graph-panel]").getAttribute("data-story-progress"))).toBeGreaterThan(0.5);
  await expect(about).toBeVisible();
  await expect(risk).toBeHidden();
  await expect(story.getByLabel("Agent workflow")).toBeVisible();


  await scrollLandingStory(page, 1);
  await expect(story.getByText("YES / MODEL").locator("..").locator("strong")).toHaveText("54%");
  await expect(story.getByText("NO / MODEL").locator("..").locator("strong")).toHaveText("46%");
  await expect(story.getByRole("button", { name: /try demo/i })).toBeEnabled();
});

test("demo carries a forecast allocation into portfolio, history, and measured performance", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await startSportsDemo(page);
  await expect(page.getByRole("heading", { name: "Forecasts", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Performance", exact: true })).toHaveCount(0);
  const forecast = page.getByRole("link", { name: /Warriors edge a demo NBA matchup.*Yes/i }).first();
  await expect(forecast).toBeVisible();
  const forecastHref = await forecast.getAttribute("href");
  await forecast.click();
  await expect(page.getByText("54.0%", { exact: true })).toBeVisible();
  await expect(page.getByText("Reference", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /add to simulation/i }).click();
  await expect(page).toHaveURL(/\/forecasts/);
  await page.goto("/portfolio");
  const position = page.getByRole("row").filter({ hasText: "Warriors edge a demo NBA matchup" }).last();
  await expect(position).toContainText("Warriors");
  await expect(position.getByRole("cell", { name: /credits$/i })).toBeVisible();
  const allocation = (await position.getByRole("cell", { name: /credits$/i }).textContent())!.trim();
  await page.reload();
  await expect(page.getByRole("row").filter({ hasText: "Warriors edge a demo NBA matchup" }).last()).toContainText(allocation);
  await page.goto("/history");
  const decision = page.getByRole("row").filter({ has: page.locator(`a[href="${forecastHref}"]`) });
  await expect(decision.getByRole("cell").nth(4)).toHaveText(allocation);
  await expect(page.getByRole("row").filter({ hasText: "abstain" }).first().getByRole("cell").nth(4)).toHaveText("No position");
  await page.getByRole("link", { name: /performance/i }).first().click();
  await expect(page).toHaveURL(/\/performance/);
  await expect(page.getByText(/Brier score/i).first()).toBeVisible();
  await expect(page.getByText(/Observed frequency/i).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("invalid saved ledger is rejected instead of displaying corrupted credits", async ({ page }) => {
  await startSportsDemo(page);
  await page.getByRole("link", { name: /Warriors edge a demo NBA matchup.*Yes/i }).first().click();
  await page.getByRole("button", { name: /add to simulation/i }).click();
  await page.evaluate(() => {
    const key = "forecast-studio-demo-v3";
    const snapshot = JSON.parse(localStorage.getItem(key)!);
    snapshot.run.positions[0].virtualAllocation = -40;
    localStorage.setItem(key, JSON.stringify(snapshot));
  });
  await page.goto("/portfolio");
  await expect(page.getByRole("heading", { name: "Start with your selections" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("forecast-studio-demo-v3")!).run)).toBeNull();
});

test("high-risk review shows eligible hockey outcomes without automatic allocations", async ({ page }) => {
  await startSportsDemo(page, "Hockey", "High");
  const forecasts = page.getByRole("link", { name: /hockey|nhl|summit/i });
  await expect(forecasts.first()).toBeVisible();
  await expect(forecasts.first()).toContainText(/hockey|nhl|summit/i);
  await page.goto("/portfolio");
  await expect(page.getByText(/No positions yet/i)).toBeVisible();
  await page.goto("/history");
  await page.getByLabel("Decision").selectOption("abstain");
  const abstainedRow = page.getByRole("row").filter({ hasText: "abstain" }).first();
  await expect(abstainedRow.getByRole("cell").nth(4)).toHaveText("No position");
  await abstainedRow.getByRole("link").click();
  await expect(page.getByText("Abstained", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /add to demo/i })).toHaveCount(0);
  await page.getByRole("link", { name: /view decision history/i }).click();
  await expect(page).toHaveURL(/\/history/);
});
