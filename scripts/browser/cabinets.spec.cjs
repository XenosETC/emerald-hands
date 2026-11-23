const { test, expect } = require("@playwright/test");
const { games } = require("../../arcade-library.js");

async function expectCenterAccessible(locator) {
  await locator.scrollIntoViewIfNeeded();
  expect(await locator.evaluate(element => {
    const box = element.getBoundingClientRect();
    const target = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    return target === element || element.contains(target);
  })).toBe(true);
}

for (const width of [320, 1440]) {
  test("all 21 cabinet games retain usable controls at " + width + "px", async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const cards = page.locator(".game-card");
    await expect(cards).toHaveCount(21);
    for (const game of games) {
      const card = cards.filter({ has: page.locator('.game-body > a[href="' + game.path + '"]') });
      await expect(card).toHaveCount(1);
      await expect(card.getByRole("heading", { name: game.title, exact: true })).toBeVisible();
      const art = card.locator(".cabinet-art");
      await art.scrollIntoViewIfNeeded();
      expect(await art.evaluate(async image => {
        await image.decode();
        return image.naturalWidth > 0 && image.naturalHeight > image.naturalWidth;
      })).toBe(true);
      const cabinetEntry = card.getByRole("link", { name: "Open " + game.title, exact: true });
      await expect(cabinetEntry).toHaveAttribute("href", game.path);
      await expectCenterAccessible(cabinetEntry);
      const play = card.locator(".game-body > a");
      await expect(play).toHaveAttribute("href", game.path);
      await expectCenterAccessible(play);
      const favorite = card.locator(".favorite-game");
      await expectCenterAccessible(favorite);
      await expect(favorite).toHaveAttribute("aria-pressed", "false");
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("cabinet search and favorites retain the selected game", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("searchbox", { name: "Search games" }).fill("pepe chess");
  const chess = page.locator(".game-card:visible");
  await expect(chess).toHaveCount(1);
  await expect(chess.getByRole("heading", { name: "Pepe Chess", exact: true })).toBeVisible();
  await chess.locator(".favorite-game").click();
  await page.getByRole("searchbox", { name: "Search games" }).fill("");
  await page.getByRole("checkbox", { name: /^Favorites/ }).check();
  await expect(chess).toHaveCount(1);
  await expect(chess.getByRole("heading", { name: "Pepe Chess", exact: true })).toBeVisible();
  await page.reload();
  await expect(chess.locator(".favorite-game")).toHaveAttribute("aria-pressed", "true");
  await chess.locator(".favorite-game").click();
  await expect(chess).toHaveCount(0);
  await expect(page.locator("#emptyLibrary")).toBeVisible();
});

test("the chess cabinet artwork opens its playable board", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?q=pepe%20chess");
  await page.getByRole("link", { name: "Open Pepe Chess", exact: true }).click();
  await expect(page).toHaveURL(/\/pepe-chess\/index\.html$/);
  await expect(page.getByRole("heading", { name: "Pepe Chess", exact: true })).toBeVisible();
});

test("long cabinet titles scroll within the marquee and respect reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/?q=kontra");
  const heading = page.getByRole("heading", { name: "KONTRA: The Kek Wars", exact: true });
  await heading.scrollIntoViewIfNeeded();
  await expect(heading).toHaveClass(/is-scrolling/);
  await expect(heading).toHaveClass(/is-visible/);
  const track = heading.locator(".marquee-track");
  await expect(track.locator("span").first()).toHaveText("KONTRA: The Kek Wars");
  await expect.poll(() => track.evaluate(element => getComputedStyle(element).transform), {
    timeout: 6000,
  }).not.toBe("matrix(1, 0, 0, 1, 0, 0)");
  expect(await heading.locator(".marquee-window").evaluate(element => getComputedStyle(element).overflowX)).toBe("hidden");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(track).toHaveCSS("animation-name", "none");
  await expect(track.locator("span").nth(1)).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
