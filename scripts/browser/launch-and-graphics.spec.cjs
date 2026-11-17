const { test, expect } = require("@playwright/test");

const launchPath = "/pepe-one-more-launch/index.html";
const templePath = "/pepe-temple-run/index.html";
const shipSaveKey = "pepe-one-more-launch-v1";

test.describe("One More Launch on a short landscape screen", () => {
  test.use({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });

  test("the launch and flight controls fit and respond to touch", async ({ page }) => {
    await page.goto(launchPath);
    const launch = page.getByRole("button", { name: /strap in & launch/i });
    await expect(launch).toBeEnabled();
    await expect(launch).toBeInViewport({ ratio: 1 });

    await launch.tap();
    await expect(page.locator("#stage")).toHaveAttribute("data-phase", "flight", { timeout: 12_000 });
    for (const name of [/steer left/i, /hold to send it/i, /steer right/i]) {
      const control = page.getByRole("button", { name });
      await expect(control).toBeEnabled();
      await expect(control).toBeInViewport({ ratio: 1 });
    }

    await page.getByRole("button", { name: "Pause game" }).tap();
    const pause = page.getByRole("dialog", { name: "HOLD THAT THOUGHT." });
    const resume = pause.getByRole("button", { name: /resume flight/i });
    await expect(pause).toBeVisible();
    await expect(resume).toBeFocused();
    await resume.tap();
    await expect(pause).toBeHidden();
    await expect(page.locator("#stage")).toHaveAttribute("data-phase", "flight");
  });
});

test("Space buys the focused hangar upgrade and keeps the ship grounded", async ({ page }) => {
  await page.addInitScript(key => {
    if (localStorage.getItem(key) === null) {
      localStorage.setItem(key, JSON.stringify({ cash: 120 }));
    }
  }, shipSaveKey);
  await page.goto(launchPath);
  await expect(page.getByRole("button", { name: /strap in & launch/i })).toBeEnabled();

  const hangar = page.getByRole("button", { name: /hangar/i });
  await hangar.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Close hangar" })).toBeFocused();
  const cooling = page.getByRole("button", { name: /industrial desk fan/i });
  await cooling.focus();
  await page.keyboard.press("Space");

  await expect(cooling).toContainText("LEVEL 1 → 2");
  await expect(cooling).toBeFocused();
  await expect(page.locator("#stage")).toHaveAttribute("data-phase", "pad");
  const save = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), shipSaveKey);
  expect(save).toMatchObject({ cooling: 1, cash: 80, flights: 0 });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("complementary", { name: "Ship upgrade hangar" })).toBeHidden();
  await expect(hangar).toBeFocused();
});

test.describe("Temple Run graphics fallback", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("a device unable to create WebGL can still start and control a 2D run", async ({ page }) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(() => {
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...options) {
        if (["webgl", "webgl2", "experimental-webgl"].includes(type)) return null;
        return originalGetContext.call(this, type, ...options);
      };
    });
    await page.goto(templePath);

    const graphics = page.getByRole("combobox", { name: "Graphics quality" });
    await expect(graphics).toBeDisabled();
    await expect(graphics).toContainText("2D view");
    await expect(page.locator(".character-layer")).toHaveCount(0);
    await page.getByRole("button", { name: /enter the temple/i }).tap();
    const distance = () => page.evaluate(() => window.templeRunDiagnostics().distance);
    await expect.poll(distance).toBeGreaterThan(0);

    await page.getByRole("button", { name: "Move left" }).tap();
    const lane = () => page.evaluate(() => window.templeRunDiagnostics().lane);
    await expect.poll(lane).toBe(0);

    await page.getByRole("button", { name: "Pause game" }).tap();
    await expect(page.getByRole("heading", { name: "Temple on hold." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Move left" })).toBeDisabled();
    const pausedDistance = await distance();
    await page.getByRole("button", { name: /continue running/i }).tap();
    await expect.poll(distance).toBeGreaterThan(pausedDistance);
    expect(errors).toEqual([]);
  });
});
