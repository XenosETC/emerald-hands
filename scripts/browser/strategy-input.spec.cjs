const { test, expect } = require("@playwright/test");

test.describe("Paradox keyboard access to touch controls", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("Space activates a focused game button and still jumps from the playfield", async ({ page }) => {
    await page.goto("/pepes-paradox.html");
    await page.getByRole("button", { name: "Begin the Pursuit" }).tap();

    const sound = page.getByRole("button", { name: "Sound: on" });
    await sound.press("Space");
    await expect(page.getByRole("button", { name: "Sound: off" })).toHaveAttribute("aria-pressed", "false");

    const dash = page.getByRole("button", { name: "Dash", exact: true });
    await dash.press("Space");
    const read = () => page.evaluate(() => window.__pepesParadoxDebug.getState());
    await expect.poll(async () => (await read()).dashCooldown).toBeGreaterThan(0);
    expect((await read()).grounded).toBe(true);

    await page.locator("#paradoxCanvas").press("Space");
    await expect.poll(async () => (await read()).grounded).toBe(false);
  });
});

test.describe("Pepe Wars result recovery", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("a failed profile write leaves a lost siege replayable", async ({ page }) => {
    test.slow(); // Let the real enemy economy play out under the accelerated clock.
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(() => {
      Math.random = () => 0.15;
      const nativeSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === "emerald-arcade-v1") throw new Error("Arcade profile write failed");
        return nativeSetItem.call(this, key, value);
      };
    });

    await page.clock.install();
    await page.goto("/pepe-wars.html");
    // The game has already read its world size. Reduce paint cost while the
    // accelerated clock runs the actual AI, base damage, and HUD updates.
    await page.locator("#gameCanvas").evaluate(canvas => { canvas.width = canvas.height = 1; });
    await page.getByRole("button", { name: "Start Siege" }).tap();
    const playerBase = page.locator("#playerHealth");
    for (let i = 0; i < 7 && await playerBase.evaluate(node => node.value > 0); i++) {
      await page.clock.runFor(10_000);
    }

    await expect(playerBase).toHaveJSProperty("value", 0);
    await expect(page.locator("#overlayTitle")).toHaveText("Your relic base fell.");
    await expect(page.locator("#overlayText")).toContainText("Arcade progress could not be saved.");
    const retry = page.getByRole("button", { name: "Run Siege Back" });
    await expect(retry).toBeVisible();
    await retry.tap();
    await expect(page.locator("#gameOverlay")).toBeHidden();
    await expect(playerBase).toHaveJSProperty("value", 1000);
    expect(errors).toEqual([]);
  });
});
