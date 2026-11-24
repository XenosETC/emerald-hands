const { test, expect } = require("@playwright/test");

for (const viewport of [
  { width: 320, height: 568 }, { width: 390, height: 844 },
  { width: 844, height: 390 }, { width: 1440, height: 900 },
]) {
  test("Unstable Launch fits and plays at " + viewport.width + "×" + viewport.height, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => { Math.random = () => 0.1; });
    await page.clock.install();
    await page.goto("/etc-unstable-launch.html");
    const checkScreen = async () => {
      expect(await page.evaluate(() => ({
        width: document.documentElement.scrollWidth <= innerWidth,
        height: document.documentElement.scrollHeight <= innerHeight,
      }))).toEqual({ width: true, height: true });
      for (const selector of ["#launchButton", ".flight-hud", "#resultPanel"]) {
        const box = await page.locator(selector).boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
      }
    };
    await checkScreen();
    await expect(page.locator(".arcade-pet-companion")).toHaveCount(0);
    await page.getByRole("button", { name: /ignite reactor/i }).click();
    await page.clock.runFor(400);
    const infoButton = page.getByRole("button", { name: "Flight info", exact: true });
    const info = page.getByRole("dialog", { name: "Flight info", exact: true });
    await infoButton.click();
    const frozenPrice = await page.locator("#priceLabel").textContent();
    await page.clock.runFor(400);
    await expect(page.locator("#priceLabel")).toHaveText(frozenPrice);
    await info.getByRole("button", { name: "Done", exact: true }).click();
    await page.getByRole("button", { name: /lock price/i }).click();
    await expect(page.locator("#resultEyebrow")).toContainText("Price Locked");
    await checkScreen();
    await page.getByRole("button", { name: /launch again/i }).click();
    await page.clock.runFor(4000);
    await expect(page.locator("#resultEyebrow")).toContainText("Reactor Lost");
    await checkScreen();
    await page.getByRole("button", { name: "Flight info", exact: true }).click();
    await expect(info).toBeVisible();
    await expect(info.locator("#bestPrice")).toBeVisible();
    await info.getByRole("button", { name: "Done", exact: true }).click();
    await expect(info).toBeHidden();
    await expect(page.getByRole("button", { name: "Flight info", exact: true })).toBeFocused();
  });
}
