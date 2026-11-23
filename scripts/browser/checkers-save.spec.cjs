const { test, expect } = require("@playwright/test");

const path = "/pepe-checkers/index.html";
const square = (tab, coordinate, description) => tab.locator("#board")
  .getByRole("button", { name: new RegExp(`^${coordinate}.*${description}`, "i") });

async function move(tab, from, to) {
  await square(tab, from, "can move").click();
  await square(tab, to, "destination").click();
}

test("Checkers keeps the current saved match when a stale tab plays or changes mode", async ({ page, context }) => {
  await page.goto(path);
  await page.locator("#mode").selectOption("local");
  const stale = await context.newPage();
  await stale.goto(path);
  await expect(stale.locator("#mode")).toHaveValue("local");

  await move(page, "c3", "d4");
  await expect(page.locator("#save-status")).toHaveText("Saved on this device.");
  await expect(stale.locator("#save-status")).toContainText("Another tab changed the saved match");
  await move(stale, "e3", "f4");
  await expect(square(stale, "f4", "Emerald piece")).toBeVisible();
  await expect(stale.locator("#save-status")).toContainText("Share this tab’s move log");
  await stale.getByRole("button", { name: "Share move log" }).click();
  await expect(stale.locator("#transcript-text")).toHaveValue(/E3.*F4/);
  await stale.keyboard.press("Escape");

  await page.reload();
  await expect(square(page, "d4", "Emerald piece")).toBeVisible();
  await stale.locator("#mode").selectOption("bot");
  await page.reload();
  await expect(page.locator("#mode")).toHaveValue("local");
  await expect(square(page, "d4", "Emerald piece")).toBeVisible();

  await stale.reload();
  await expect(stale.locator("#mode")).toHaveValue("local");
  await move(stale, "b6", "c5");
  await expect(stale.locator("#save-status")).toHaveText("Saved on this device.");
  await page.reload();
  await expect(square(page, "c5", "Crimson piece")).toBeVisible();
  await expect(page.locator("#board")).toHaveAttribute("data-forced-capture", "true");
});
