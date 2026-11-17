const { test, expect } = require('@playwright/test');

test('mobile library finds and saves a touch game, then restores the favorite', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('checkbox', { name: 'Touch controls' }).check();
  await page.getByRole('searchbox', { name: 'Search games' }).fill('pepes paradox');
  const card = page.locator('.game-card:visible');
  await expect(card).toHaveCount(1);
  await expect(card.getByRole('heading', { name: /Pepe.s Paradox/ })).toBeVisible();
  await card.getByRole('button', { name: /Save .*Paradox to favorites/ }).click();
  await page.reload();
  await expect(card.getByRole('button', { name: /Remove .*Paradox from favorites/ }))
    .toHaveAttribute('aria-pressed', 'true');
});

test('sanctuary settings return focus and work when preference storage rejects writes', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => {
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'emerald-arcade-settings-v1') throw new DOMException('Fixture quota', 'QuotaExceededError');
      return write.call(this, key, value);
    };
  });
  await page.goto('/etc-pets.html');
  const menu = page.locator('.pets-topbar').getByRole('button', { name: 'Menu', exact: true });
  await menu.click();
  const settings = page.getByRole('dialog', { name: 'Arcade controls and settings' });
  await settings.getByRole('button', { name: 'Turn sound off' }).click();
  await expect(settings.getByRole('button', { name: 'Turn sound on' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(settings).toBeHidden();
  await expect(menu).toBeFocused();
});
