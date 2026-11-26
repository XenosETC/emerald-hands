const { test, expect } = require("@playwright/test");

test("KONTRA uses Enter to select the focused mission before deploying", async ({ page }) => {
  await page.goto("/kontra-kek-wars/index.html");

  const stormforge = page.getByRole("button", { name: "02 / STORMFORGE", exact: true });
  await stormforge.press("Enter");

  await expect(stormforge).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#overlay")).toHaveAttribute("data-state", "ready");
  await page.getByRole("button", { name: /deploy operative/i }).press("Enter");
  await expect(page.locator("#overlay")).toBeHidden();
  expect(await page.evaluate(() => {
    const { mission, mode } = window.kekDiagnostics();
    return { mission, mode };
  })).toEqual({ mission: 2, mode: "playing" });
});

test.describe("mobile arcade controls", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test("PepeCoin Run ignores a second finger and allows retry after a failed profile write", async ({ page }) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("https://api.coingecko.com/**", route => route.abort());
    // Choose a deterministic course seed whose opening segment has a hazard.
    await page.addInitScript(() => { Math.random = () => 0; });
    await page.goto("/pepecoin-run.html");
    await page.getByRole("button", { name: "Start Run" }).tap();
    await page.evaluate(() => {
      const nativeSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === "emerald-arcade-v1") throw new Error("Arcade profile write failed");
        return nativeSetItem.call(this, key, value);
      };
      window.addEventListener("pointerdown", event => {
        if (event.pointerType === "touch" && !event.isPrimary && event.target.id === "gameCanvas") {
          window.secondaryTouchJumpBuffer = state.jumpBuffer;
        }
      });
    });

    const canvas = page.locator("#gameCanvas");
    await canvas.scrollIntoViewIfNeeded();
    const bounds = await canvas.boundingBox();
    expect(bounds).not.toBeNull();
    const touch = (fraction, id) => ({
      x: Math.round(bounds.x + bounds.width * fraction),
      y: Math.round(bounds.y + bounds.height * 0.5),
      id,
    });
    const touchInput = await page.context().newCDPSession(page);
    try {
      const first = touch(0.45, 1);
      const second = touch(0.55, 2);
      await touchInput.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [first] });
      await expect.poll(() => page.evaluate(() => player.vy)).toBeLessThan(0);
      await touchInput.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [first, second] });
      expect(await page.evaluate(() => window.secondaryTouchJumpBuffer)).toBe(0);
    } finally {
      await touchInput.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await touchInput.detach();
    }

    const retry = page.getByRole("button", { name: "Run It Back" });
    await expect(retry).toBeVisible();
    await expect(page.locator("#overlayText")).toContainText("Arcade progress could not be saved.");
    await retry.tap();
    await expect(page.getByRole("button", { name: /jump/i })).toBeEnabled();
    expect(await page.evaluate(() => state.mode)).toBe("running");
    expect(errors).toEqual([]);
  });
});
