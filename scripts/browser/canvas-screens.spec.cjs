const { test, expect } = require('@playwright/test');

const games = [
  { path: 'shard-rush.html', canvas: '#rushCanvas', start: '#overlayStartButton', primary: ['#classicMode', '#dailyMode'] },
  { path: 'emerald-galactic-heroes.html', canvas: '#galaxyCanvas', start: '#overlayStartButton', primary: ['#finishFlight'] },
  { path: 'pepecoin-run.html', canvas: '#gameCanvas', start: '#startButton', primary: ['#jumpButton'] },
  { path: 'pepe-space-unchained.html', canvas: '#gameCanvas', start: '#startButton', primary: ['#burstButton', '#repairButton', '#finishButton', '#wingmanButton'] },
  { path: 'pepes-paradox.html', canvas: '#paradoxCanvas', start: '#startButton', primary: ['.paradox-controls'] },
  { path: 'pepe-relic-rumble.html', canvas: '#rumbleCanvas', primary: ['#startButton'] },
];

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
  for (const game of games) {
    test(`${game.path} plays inside ${viewport.width}×${viewport.height}`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize(viewport);
      await page.route('https://api.coingecko.com/**', route => route.abort());
      await page.goto(`/${game.path}`);
      const assertFits = async () => {
        expect(await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, x: scrollX, y: scrollY })))
          .toEqual({ width: viewport.width, height: viewport.height, x: 0, y: 0 });
        for (const selector of [game.canvas, '.canvas-screen-info', ...game.primary]) {
          await expect.poll(async () => {
            const rectangle = await page.locator(selector).boundingBox();
            return rectangle && rectangle.x >= -1 && rectangle.y >= -1 && rectangle.x + rectangle.width <= viewport.width + 1 && rectangle.y + rectangle.height <= viewport.height + 1;
          }, { message: `${selector} fits the viewport` }).toBe(true);
          const box = await page.locator(selector).boundingBox();
          expect(box, selector).not.toBeNull();
          expect(box.x, selector).toBeGreaterThanOrEqual(-1);
          expect(box.y, selector).toBeGreaterThanOrEqual(-1);
          expect(box.x + box.width, selector).toBeLessThanOrEqual(viewport.width + 1);
          expect(box.y + box.height, selector).toBeLessThanOrEqual(viewport.height + 1);
        }
      };
      await assertFits();
      const canvas = page.locator(game.canvas);
      const ratio = await canvas.evaluate(node => { const box = node.getBoundingClientRect(); return box.width / box.height; });
      expect(ratio).toBeCloseTo(16 / 9, 2);
      const info = page.getByRole('button', { name: 'Game info', exact: true });
      await info.click();
      await expect(page.locator('#canvasGameInfo')).toBeVisible();
      if (['shard-rush.html', 'pepes-paradox.html'].includes(game.path)) {
        await expect(page.locator('#canvasGameInfo .arcade-pet-assist')).toBeVisible();
      }
      expect(await page.evaluate(() => EmeraldArcade.isPaused())).toBe(true);
      await page.getByRole('button', { name: 'Done', exact: true }).click();
      await expect(info).toBeFocused();
      await expect.poll(() => page.evaluate(() => EmeraldArcade.isPaused())).toBe(false);
      if (game.start) {
        await page.locator(game.start).click();
        await expect(page.locator(game.start)).toBeHidden();
      } else {
        await page.locator('[data-mode="pvp"]').click();
        await page.locator('#launchButton').click();
        await expect(page.locator('#rumbleOverlay')).toBeHidden();
      }
      await assertFits();
      await canvas.focus();
      await page.keyboard.press('ArrowRight');
      if (game.path === 'pepe-relic-rumble.html') {
        const previousX = await page.evaluate(() => __relicRumbleDebug.getState().fighters[0].x);
        await page.keyboard.down('d');
        await expect.poll(() => page.evaluate(() => __relicRumbleDebug.getState().fighters[0].x)).toBeGreaterThan(previousX);
        await page.keyboard.up('d');
      }
      if (['shard-rush.html', 'emerald-galactic-heroes.html', 'pepe-space-unchained.html'].includes(game.path)) {
        const bounds = await canvas.boundingBox();
        const fraction = game.path === 'pepe-space-unchained.html' ? .4 : .75;
        await page.mouse.move(bounds.x + bounds.width * fraction, bounds.y + bounds.height * .6);
        await page.mouse.down();
        if (game.path === 'pepe-space-unchained.html') {
          await expect.poll(() => page.evaluate(() => player.x)).toBeCloseTo(1280 * fraction, -1);
        } else {
          expect(await page.evaluate(() => pointer.x)).toBeCloseTo(1280 * fraction, -1);
          await expect.poll(() => page.evaluate(() => state.collectorX ?? state.hero.x)).toBeGreaterThan(640);
        }
        await page.mouse.up();
      }
      if (game.path === 'shard-rush.html') {
        await info.click();
        await expect(page.locator('#canvasGameInfo')).toBeVisible();
        const pausedAt = await page.evaluate(() => state.elapsed);
        await page.waitForTimeout(120);
        expect(await page.evaluate(() => state.elapsed)).toBe(pausedAt);
        await page.getByRole('button', { name: 'Done', exact: true }).click();
        await expect.poll(() => page.evaluate(() => state.elapsed)).toBeGreaterThan(pausedAt);
      }
      if (game.path === 'pepecoin-run.html') await page.locator('#jumpButton').click();
      if (game.path === 'pepes-paradox.html') await page.locator('[data-paradox-control="jump"]').click();
      if (game.path === 'emerald-galactic-heroes.html') {
        await page.locator('#finishFlight').click();
        await expect(page.locator('#galaxyOverlay')).toBeVisible();
      }
      if (game.path === 'pepe-space-unchained.html') {
        await page.locator('#finishButton').click();
        await expect(page.locator('#gameOverlay')).toBeVisible();
      }
      expect(errors).toEqual([]);
    });
  }
}
