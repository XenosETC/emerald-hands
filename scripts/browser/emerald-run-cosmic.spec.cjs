const { test, expect } = require('@playwright/test');

for (const width of [390, 1440]) {
  test(`Emerald Run authored Tempest Reach rain, thunder, pause and spike danger at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://api.coingecko.com/**', route => route.fulfill({ json: { prices: Array.from({ length: 96 }, (_, i) => [i, 20]) } }));
    await page.goto('/pepecoin-run.html');
    await page.getByRole('button', { name: 'Start Run', exact: true }).click();
    // Isolate the weather chapter; its hazards retain the real collision path.
    await page.evaluate(() => { hazards.length = 0; statues.length = 0; crowns.length = 0; state.distance = 7951 - player.x; });
    await expect(page.locator('#routeTitle')).toContainText('TEMPEST REACH');
    await expect.poll(() => page.evaluate(() => state.stormBlend)).toBeGreaterThan(.6);
    await expect(page.locator('#routeDetail')).toContainText('blue-aura spikes');
    await page.evaluate(() => window.EmeraldArcade.setPaused(true));
    const snapshot = await page.evaluate(() => [state.stormBlend, state.stormGlow, state.stormDistance]);
    await page.waitForTimeout(160);
    expect(await page.evaluate(() => [state.stormBlend, state.stormGlow, state.stormDistance])).toEqual(snapshot);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => window.EmeraldArcade.setPaused(false));
    await expect.poll(() => page.evaluate(() => state.stormGlow)).toBe(0);
    await page.evaluate(() => hazards.push({ x: state.distance + player.x + 20, width: 50, height: 70, hit: false }));
    await expect(page.getByRole('button', { name: 'Retry Same Road' })).toBeVisible();
    await page.getByRole('button', { name: 'Retry Same Road' }).click();
    await expect(page.locator('#routeTitle')).toContainText('JADE VALLEY');
    expect(await page.evaluate(() => state.stormBlend + state.stormGlow)).toBe(0);
    expect(errors).toEqual([]);
  });

  test(`Emerald Run emerald statue, Rush magnet, stacked powers and replay at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://api.coingecko.com/**', route => route.fulfill({ json: { prices: Array.from({ length: 96 }, (_, i) => [i, 20]) } }));
    await page.goto('/pepecoin-run.html');
    await page.waitForFunction(() => [rushImage, auraImage].every(i => i.complete && i.naturalWidth));
    await page.getByRole('button', { name: 'Start Run', exact: true }).click();
    await page.evaluate(() => {
      state.distance = route.opening.rush - player.x - 220;
      buildCourse(); hazards.length = 0; statues.length = 0; crowns.length = 0;
      player.y = terrainAt(state.distance + player.x) - player.radius; player.vy = 0;
    });
    await expect(page.locator('#cosmicTitle')).toHaveText('EMERALD FROG AHEAD');
    await page.evaluate(() => { state.distance = rushStatues[0].x - player.x - 40; });
    await expect(page.locator('#cosmicTitle')).toHaveText('EMERALD RUSH');
    expect(await page.evaluate(() => protectedRide())).toBe(false);
    await expect(page.locator('#cosmicEvent')).toBeHidden();
    await page.evaluate(() => {
      const x = state.distance + player.x + 220;
      window.rushShard = { x, lift: 120, size: 22, spin: 0, collected: false };
      emeralds.push(window.rushShard);
    });
    await expect.poll(() => page.evaluate(() => window.rushShard.collected)).toBe(true);
    await page.evaluate(() => { collectCrown({ collected: false }, player.x, player.y); collectStatue({ collected: false }, player.x, player.y); });
    await expect(page.locator('#rushBanner')).toBeVisible();
    await expect(page.locator('#rushBanner')).toContainText('EMERALD RUSH');
    await page.getByRole('button', { name: /Soar/ }).click();
    await expect.poll(() => page.evaluate(() => state.rideTrail.length)).toBeGreaterThan(3);
    expect(await page.evaluate(() => state.speed)).toBeLessThanOrEqual(570 * 1.35);
    await page.evaluate(() => window.EmeraldArcade.setPaused(true));
    const clock = await page.evaluate(() => state.rushTime);
    await page.waitForTimeout(160);
    expect(await page.evaluate(() => state.rushTime)).toBe(clock);
    await page.evaluate(() => { window.EmeraldArcade.setPaused(false); state.rushTime = .01; });
    await expect.poll(() => page.evaluate(() => state.rushTime)).toBe(0);
    expect(await page.evaluate(() => royal.active(state) && state.cosmicTime > 0)).toBe(true);
    await page.evaluate(() => crash({}));
    await page.getByRole('button', { name: 'Retry Same Road' }).click();
    expect(await page.evaluate(() => state.rushCaught + state.rushTime + state.skyGates + state.rideGates.length)).toBe(0);
    const routeBox = await page.locator('#routeStatus').boundingBox();
    expect(routeBox.x + routeBox.width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });

  test(`Emerald Run crown pickup, soaring, attraction, landing and overlap at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://api.coingecko.com/**', route => route.fulfill({
      json: { prices: Array.from({ length: 96 }, (_, i) => [i, 20]) },
    }));
    await page.goto('/pepecoin-run.html');
    await page.waitForFunction(() => [crownImage, skyrealmImage].every(i => i.complete && i.naturalWidth));
    await page.getByRole('button', { name: 'Start Run', exact: true }).click();
    // Use the authored pickup and native RAF collisions, isolating this power
    // from jump timing on the preceding sections of the road.
    await page.evaluate(() => {
      statues.length = 0;
      state.distance = crowns[0].x - player.x - 45;
      player.y = terrainAt(state.distance + player.x) - player.radius;
      player.vy = 0;
    });
    await expect(page.locator('#cosmicTitle')).toHaveText('ROYAL SKYRIDE');
    await expect.poll(() => page.evaluate(() => state.rideLift)).toBeGreaterThan(80);
    await expect(page.locator('#cosmicEvent')).toBeHidden();
    await page.getByRole('button', { name: 'Soar', exact: false }).click();
    expect(await page.evaluate(() => state.rideFlap)).toBeGreaterThan(0);
    await page.evaluate(() => window.EmeraldArcade.setPaused(true));
    const frozen = await page.evaluate(() => [state.rideTime, state.rideAge, state.distance]);
    await page.waitForTimeout(180);
    expect(await page.evaluate(() => [state.rideTime, state.rideAge, state.distance])).toEqual(frozen);
    await page.evaluate(() => {
      const x = state.distance + player.x + 140;
      window.royalShard = { x, lift: terrainAt(x) - player.y, size: 22, collected: false };
      emeralds.push(window.royalShard);
      window.EmeraldArcade.setPaused(false);
    });
    await expect.poll(() => page.evaluate(() => window.royalShard.collected)).toBe(true);
    // The two powers retain independent clocks and a single cosmic speed boost.
    await page.evaluate(() => collectStatue({ collected: false }, player.x, player.y));
    await expect(page.locator('#cosmicEvent')).toBeVisible();
    await expect(page.locator('#cosmicTitle')).toHaveText('ROYAL SKYRIDE');
    expect(await page.evaluate(() => state.speed)).toBeLessThanOrEqual(570 * 1.35);
    await page.evaluate(() => { state.cosmicTime = .01; state.rideTime = .02; hazards.length = 0; });
    await expect(page.locator('#cosmicTitle')).toHaveText('ROYAL LANDING');
    await expect.poll(() => page.evaluate(() => royal.active(state))).toBe(false);
    await expect(page.locator('#jumpButton')).toContainText('Jump');
    await page.evaluate(() => hazards.push({ x: state.distance + player.x + 20, width: 50, height: 70, hit: false }));
    await expect(page.getByRole('button', { name: 'Retry Same Road' })).toBeVisible();
    await expect(page.locator('#resultPeak')).toContainText('1 crown caught');
    await page.getByRole('button', { name: 'Retry Same Road' }).click();
    expect(await page.evaluate(() => [state.rideTime, state.rideLanding, state.crownsCaught])).toEqual([0, 0, 0]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

for (const width of [390, 1440]) {
  test(`Emerald Run cosmic pickup, smash, pause, expiry and replay at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://api.coingecko.com/**', route => route.fulfill({
      json: { prices: Array.from({ length: 96 }, (_, i) => [i, 20]) },
    }));
    await page.goto('/pepecoin-run.html');
    await page.waitForFunction(() => [statueImage, nightImage, cosmicImage, beyondImage, roadImage, shardImage, corruptImage].every(i => i.complete && i.naturalWidth));
    await page.getByRole('button', { name: 'Start Run', exact: true }).click();
    await page.evaluate(() => {
      hazards.length = 0;
      state.distance = statues[0].x - player.x - 240;
      player.y = terrainAt(state.distance + player.x) - player.radius;
      player.vy = 0;
    });
    await expect(page.locator('#cosmicTitle')).toHaveText('GOLD FROG AHEAD');
    // Move to the real first collectible's clear approach. Native RAF performs
    // pickup/collision; this isolates the burst from human jump timing.
    await page.evaluate(() => {
      state.distance = statues[0].x - player.x - 45;
      player.y = terrainAt(state.distance + player.x) - player.radius;
      player.vy = 0;
    });
    await expect(page.locator('#cosmicStatus')).toBeVisible();
    await expect.poll(() => page.evaluate(() => state.speed)).toBeGreaterThan(400);
    await page.evaluate(() => hazards.push({ x: state.distance + player.x + 20, width: 50, height: 70, hit: false }));
    await expect.poll(() => page.evaluate(() => state.smashed)).toBeGreaterThan(0);
    expect(await page.evaluate(() => state.mode)).toBe('running');
    await page.evaluate(() => window.EmeraldArcade.setPaused(true));
    const paused = await page.evaluate(() => state.cosmicTime);
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => state.cosmicTime)).toBe(paused);
    await page.evaluate(() => window.EmeraldArcade.setPaused(false));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await page.evaluate(() => reducedMotion.matches)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const status = await page.locator('#cosmicStatus').boundingBox();
    expect(status.x).toBeGreaterThanOrEqual(0);
    expect(status.x + status.width).toBeLessThanOrEqual(width);
    await page.evaluate(() => { state.cosmicTime = .01; hazards.length = 0; });
    await expect.poll(() => page.evaluate(() => state.boost)).toBe(0);
    await expect(page.locator('#cosmicStatus')).toBeHidden();
    await page.evaluate(() => hazards.push({ x: state.distance + player.x + 20, width: 50, height: 70, hit: false }));
    await expect(page.getByRole('button', { name: 'Run It Back' })).toBeVisible();
    await expect(page.locator('#runResults')).toBeVisible();
    await expect(page.locator('#resultStatues')).toHaveText('1');
    expect(Number(await page.locator('#resultSmashes').textContent())).toBeGreaterThan(0);
    await expect(page.locator('#resultPeak')).toContainText('Simulated event peak');
    expect(await page.evaluate(() => hazards.some(h => h.hit && !h.destroyed))).toBe(true);
    await expect.poll(() => page.evaluate(() => state.shake + particles.length)).toBe(0);
    await page.getByRole('button', { name: 'Run It Back' }).click();
    await expect(page.locator('#runResults')).toBeHidden();
    expect(await page.evaluate(() => ({ power: state.cosmicTime, smashed: state.smashed }))).toEqual({ power: 0, smashed: 0 });
    expect(errors).toEqual([]);
  });
}

test('Emerald Run event naturally reaches Beyond Canon with an isolated simulated price and controllable synth', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route('https://api.coingecko.com/**', route => route.fulfill({
    json: { prices: Array.from({ length: 96 }, (_, i) => [i, 20]) },
  }));
  await page.goto('/pepecoin-run.html');
  await page.getByRole('button', { name: 'Start Run', exact: true }).click();
  await page.evaluate(() => {
    state.distance = statues[0].x - player.x - 45;
    player.y = terrainAt(state.distance + player.x) - player.radius;
    player.vy = 0;
  });
  await expect(page.locator('#cosmicEvent')).toBeVisible();
  await expect(page.locator('#cosmicEvent')).toContainText('SIMULATED EVENT PRICE');
  await expect(page.locator('#eventName')).toHaveText('COSMIC DISCO');
  await expect.poll(() => page.evaluate(() => state.cosmicBeat)).toBeGreaterThan(0);
  expect(await page.evaluate(() => audioContext.state)).toBe('running');
  await page.locator('#soundToggle').click();
  expect(await page.evaluate(() => audioVoices.size)).toBe(0);
  await page.locator('#soundToggle').click();
  await expect(page.locator('#eventName')).toHaveText('PARABOLIC');
  const middle = await page.evaluate(() => state.eventPrice);
  await expect(page.locator('#eventName')).toHaveText('BEYOND CANON');
  await expect.poll(() => page.evaluate(() => state.beyondBlend)).toBeGreaterThan(.8);
  expect(await page.evaluate(() => beyondImage.complete && beyondImage.naturalWidth > 0)).toBe(true);
  expect(await page.evaluate(() => state.eventPrice)).toBeGreaterThan(middle);
  expect(await page.evaluate(() => marketPrice)).toBe(20);
  expect(await page.evaluate(() => state.mode)).toBe('running');
  await page.evaluate(() => window.EmeraldArcade.setMuted(true));
  expect(await page.evaluate(() => audioVoices.size)).toBe(0);
  await expect.poll(() => page.evaluate(() => state.boost)).toBe(0);
  await expect(page.locator('#cosmicEvent')).toBeHidden();
  expect(await page.evaluate(() => state.eventPeak)).toBe(800);
});

test.describe('Emerald Run portrait camera', () => {
  test.use({ hasTouch: true, isMobile: true });
  for (const width of [320, 390]) {
    test(`larger playfield survives rotation and touch jumps at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.route('https://api.coingecko.com/**', route => route.abort());
      await page.goto('/pepecoin-run.html');
      await expect.poll(() => page.evaluate(() => canvas.width)).toBe(720);
      const field = await page.locator('#gameCanvas').boundingBox();
      expect(field.height).toBeGreaterThan(width * .9);
      expect(field.width / field.height).toBeCloseTo(1, 2);
      expect(await page.evaluate(() => player.radius * 2 * canvas.getBoundingClientRect().width / canvas.width)).toBeGreaterThan(35);
      await page.getByRole('button', { name: 'Start Run', exact: true }).tap();
      await page.evaluate(() => EmeraldArcade.setPaused(true));
    const snapshot = await page.evaluate(() => JSON.stringify({ player, distance: state.distance, hazards, emeralds, statues, crowns }));
      await page.setViewportSize({ width: 844, height: 390 });
      await expect.poll(() => page.evaluate(() => canvas.width)).toBe(1280);
      await page.setViewportSize({ width, height: 844 });
      await expect.poll(() => page.evaluate(() => canvas.width)).toBe(720);
      expect(await page.evaluate(() => JSON.stringify({ player, distance: state.distance, hazards, emeralds, statues, crowns }))).toBe(snapshot);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
      await page.evaluate(() => EmeraldArcade.setPaused(false));
      await page.getByRole('button', { name: /jump/i }).tap();
      await expect.poll(() => page.evaluate(() => player.vy)).toBeLessThan(0);
    });
  }
});

for (const [width, height] of [[320, 568], [390, 844], [844, 390]]) {
  test(`Emerald Run report and replay stay accessible at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.route('https://api.coingecko.com/**', route => route.abort());
    await page.goto('/pepecoin-run.html');
    await page.getByRole('button', { name: 'Start Run', exact: true }).click();
    await page.evaluate(() => { state.smashed = 16; state.statuesCaught = 3; state.eventPeak = 800; state.score = 47000; crash({}); });
    const replay = page.getByRole('button', { name: 'Run It Back', exact: true });
    await expect(replay).toBeVisible();
    const sameRoad = page.getByRole('button', { name: 'Retry Same Road', exact: true });
    await expect(sameRoad).toBeVisible();
    await expect(page.locator('#resultSmashes')).toHaveText('16');
    await expect(page.locator('#resultRoute')).toContainText('Jade Valley');
    await expect(page.locator('#overlayText')).toContainText('Arcade Shards');
    await expect(page.locator('.arcade-toast-stack')).toBeHidden();
    await expect.poll(() => replay.evaluate(button => {
      const box = button.getBoundingClientRect();
      return document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2) === button;
    })).toBe(true);
    expect(await sameRoad.evaluate(button => {
      const box = button.getBoundingClientRect();
      return document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2) === button;
    })).toBe(true);
    expect(await page.locator('#overlayTitle').evaluate(title => {
      const box = title.getBoundingClientRect();
      return box.y >= 0 && box.bottom <= innerHeight;
    })).toBe(true);
    await replay.click();
    await expect(page.locator('#runResults')).toBeHidden();
    expect(await page.evaluate(() => state.statuesCaught + state.smashed)).toBe(0);
    expect(await page.locator('#routeProgress').evaluate(node => node.value)).toBeLessThan(.05);
  });
}

for (const width of [390, 1440]) {
  test(`Emerald Run same-road retry repeats layout and preserves fresh data for New Road at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://api.coingecko.com/**', route => route.fulfill({
      json: { prices: Array.from({ length: 96 }, (_, i) => [i, 20]) },
    }));
    await page.goto('/pepecoin-run.html');
    await page.waitForFunction(() => terrainIsLive);
    await page.getByRole('button', { name: 'Start Run', exact: true }).click();
    const snapshot = () => page.evaluate(() => JSON.stringify({
      seed: currentRoad.seed, tape: terrainSource,
      hazards: hazards.map(({ x, width, height }) => ({ x, width, height })),
      emeralds: emeralds.map(({ x, lift, size }) => ({ x, lift, size })),
      statues: statues.map(s => s.x),
      crowns: crowns.map(c => c.x),
    }));
    const first = await snapshot();
    const seed = await page.evaluate(() => currentRoad.seed);
    await page.evaluate(() => { burst(245, 400, '#fff', 100); applyMarketSeries([40, 45, 40], true, 'later tape'); crash({}); });
    await page.getByRole('button', { name: 'Retry Same Road', exact: true }).click();
    expect(await snapshot()).toBe(first);
    expect(await page.evaluate(() => currentRoad.attempt)).toBe(2);
    await expect(page.locator('#runGoal')).toContainText('Attempt 2');
    await page.evaluate(() => crash({}));
    await page.getByRole('button', { name: 'Run It Back', exact: true }).click();
    expect(await page.evaluate(() => currentRoad.seed)).not.toBe(seed);
    expect(await page.evaluate(() => terrainSource)).toEqual([40, 45, 40]);
    expect(await page.evaluate(() => currentRoad.attempt)).toBe(1);
    expect(errors).toEqual([]);
  });

  test(`Emerald Run practice comparison and farthest-point cue work at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route('https://api.coingecko.com/**', route => route.abort());
    await page.goto('/pepecoin-run.html');
    await page.getByRole('button', { name: 'Start Run', exact: true }).click();
    await page.evaluate(() => { state.score = 100; state.distance = 1000; crash({}); });
    await page.getByRole('button', { name: 'Retry Same Road', exact: true }).click();
    await page.evaluate(() => {
      hazards.length = 0; state.distance = 700; state.noticeTime = 0;
      player.y = terrainAt(state.distance + player.x) - player.radius;
    });
    await expect(page.locator('#runGoal')).toContainText('FARTHEST POINT');
    await page.evaluate(() => { state.score = 180; state.distance = 1400; player.grounded = false; player.vy = -30; crash({}); });
    await expect(page.locator('#resultCompare')).toBeVisible();
    await expect(page.locator('#resultCompare')).toContainText('+80 points');
    await expect(page.locator('#resultCompare')).toContainText('+40m');
    await expect(page.locator('#crashTip')).toContainText('earlier');
    await page.getByRole('button', { name: 'Run It Back', exact: true }).click();
    expect(await page.evaluate(() => currentRoad.lastResult)).toBeNull();
  });
}
