const { test, expect } = require('@playwright/test');

test('the arcade reset dialog focuses the safe choice and cancelling preserves data', async ({ page }) => {
  await page.goto('/etc-pets.html');
  await page.evaluate(() => {
    localStorage.setItem('emerald-arcade-v1', JSON.stringify({ wallet: { arcadeShards: 75 } }));
  });
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  await menu.click();
  const settings = page.getByRole('dialog', { name: 'Arcade controls and settings' });
  const reset = settings.getByRole('button', { name: 'Reset local data' });
  const cancel = settings.getByRole('button', { name: 'Keep my data' });
  await reset.press('Enter');
  await expect(cancel).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(cancel).toBeHidden();
  await expect(reset).toBeFocused();
  expect(await page.evaluate(() => window.EmeraldArcade.arcadeShardBalance())).toBe(75);
  await reset.press('Enter');
  await page.keyboard.press('Escape');
  await expect(settings).toBeVisible();
  await expect(cancel).toBeHidden();
  await expect(reset).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
});
