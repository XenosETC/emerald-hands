const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 320, height: 568 }, hasTouch: true, isMobile: true });

test('temporary favorites survive another tab opening a game and save when writes return', async ({ page, context }) => {
  const secondTab = await context.newPage();
  await secondTab.goto('/');
  await secondTab.evaluate(() => {
    localStorage.setItem('emerald-library-v1', JSON.stringify({ favorites: ['pepeWars'] }));
  });

  await page.addInitScript(() => {
    window.blockFavoriteWrites = true;
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'emerald-library-v1' && window.blockFavoriteWrites) {
        throw new DOMException('Fixture quota', 'QuotaExceededError');
      }
      return write.call(this, key, value);
    };
  });
  await page.goto('/?genre=strategy&touch=1');

  const saveButton = game => page.locator('.game-card')
    .filter({ has: page.getByRole('heading', { name: game, exact: true }) })
    .locator('.favorite-game');
  const chess = saveButton('Pepe Chess');
  const wars = saveButton('Pepe Wars');
  const checkers = saveButton('Pepe Checkers');
  const notice = page.locator('#libraryNotice');

  await expect(wars).toHaveAttribute('aria-pressed', 'true');
  await wars.tap();
  await chess.tap();
  await expect(notice).toContainText('Changes work in this tab');

  await secondTab.goto('/pepes-paradox.html');
  await expect(page.getByRole('region', { name: /continue playing games/i })
    .getByRole('link', { name: /Paradox/ })).toBeVisible();
  await expect(chess).toHaveAttribute('aria-pressed', 'true');
  await expect(wars).toHaveAttribute('aria-pressed', 'false');

  await page.evaluate(() => { window.blockFavoriteWrites = false; });
  await checkers.tap();
  await expect(notice).toHaveText('Saved on this device.');
  await page.reload();
  await expect(chess).toHaveAttribute('aria-pressed', 'true');
  await expect(checkers).toHaveAttribute('aria-pressed', 'true');
  await expect(wars).toHaveAttribute('aria-pressed', 'false');

  await wars.tap();
  await expect(notice).toContainText('Changes work in this tab');
  await secondTab.evaluate(() => localStorage.removeItem('emerald-library-v1'));
  await expect(wars).toHaveAttribute('aria-pressed', 'false');
  await expect(chess).toHaveAttribute('aria-pressed', 'false');
  await expect(notice).toHaveText('Your favorites stay on this device.');
});
