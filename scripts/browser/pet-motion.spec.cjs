const { test, expect } = require("@playwright/test");

test.use({ reducedMotion: "no-preference" });

for (const width of [390, 1280]) {
  test(`companion respects reduced motion during excitement at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto("/pepe-wars.html");
    const companion = page.locator(".arcade-pet-companion");
    const sprite = companion.locator(".arcade-pet-sprite");
    await expect(companion).toBeVisible();
    expect(await companion.evaluate(node => getComputedStyle(node).borderTopWidth)).toBe("0px");
    expect(await companion.evaluate(node => getComputedStyle(node).backgroundImage)).toBe("none");
    const saved = await page.evaluate(() => localStorage.getItem("emerald-arcade-pets-v1"));
    await expect(companion).toHaveClass(/is-walking/, { timeout: 7000 });
    const origin = await companion.boundingBox();
    await page.waitForTimeout(450);
    const walking = await companion.boundingBox();
    expect(Math.abs(walking.x - origin.x)).toBeGreaterThan(3);
    const facing = await sprite.evaluate(node => node.style.getPropertyValue("--pet-facing"));
    expect(facing).toBe(walking.x < origin.x ? "-1" : "1");
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await expect(companion).not.toHaveClass(/is-walking/);
    const paused = await companion.boundingBox();
    await page.waitForTimeout(450);
    expect(Math.abs((await companion.boundingBox()).x - paused.x)).toBeLessThan(1);
    expect(await page.evaluate(() => localStorage.getItem("emerald-arcade-pets-v1"))).toBe(saved);
    await page.getByRole("button", { name: "Resume game", exact: true }).click();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.getByRole("button", { name: "Pet switcher", exact: true }).click();
    await expect(companion).toHaveClass(/is-excited/);
    expect(await sprite.evaluate(node => getComputedStyle(node).animationName)).toBe("none");
    await page.locator('.arcade-pet-option[data-pet="pepe"]').click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Pet switcher", exact: true })).toHaveAttribute("aria-expanded", "false");
  });
}
