const { test, expect } = require('@playwright/test');

async function enter(page, worldX, airborne = false) {
  // Isolate an authored region; actions, timers and collisions still use native RAF.
  await page.evaluate(({x,airborne}) => {
    state.distance = x - player.x; buildCourse();
    hazards.length = 0; statues.length = 0; crowns.length = 0; rushStatues.length = 0;
    player.y = terrainAt(x) - player.radius; player.vy = 0; player.grounded = true;
    if (airborne) { player.y -= 100; player.grounded = false; }
  }, {x:worldX,airborne});
}
async function start(page, width) {
  await page.setViewportSize({ width, height: 900 });
  await page.route('https://api.coingecko.com/**', route => route.fulfill({ json: { prices: Array.from({ length: 96 }, (_, i) => [i,20]) } }));
  await page.goto('/pepecoin-run.html');
  await page.waitForFunction(() => [starrailImage, lunarImage, cathedralImage, cometBoardImage, bellImage].every(i => i.complete && i.naturalWidth));
  await page.getByRole('button', { name: 'Start Run', exact: true }).click();
}

for (const width of [390,1440]) {
  test(`Act Two cathedral bells unlock Slingshot through native jumps at ${width}px`, async ({page}) => {
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await start(page,width);
    const positions=await page.evaluate(()=>route.actTwo.bells);
    for (const [index,x] of positions.entries()) {
      await enter(page,x-160);
      await page.keyboard.press('Space');
      await expect.poll(()=>page.evaluate(()=>state.bellsRung)).toBe(index+1);
    }
    await expect(page.locator('#cosmicTitle')).toHaveText('ECLIPSE SLINGSHOT');
    expect(await page.locator('#cosmicMeter').evaluate(node=>node.max)).toBe(3.6);
    await page.getByRole('button',{name:/Surge/}).click();
    expect(await page.evaluate(()=>state.railVault)).toBeGreaterThan(0);
    expect(await page.evaluate(()=>state.slingshots)).toBe(1);
    await page.evaluate(()=>window.EmeraldArcade.setPaused(true));
    const frozen=await page.evaluate(()=>[state.railTime,state.bells.map(b=>b.ringTime)]);
    await page.waitForTimeout(160);
    expect(await page.evaluate(()=>[state.railTime,state.bells.map(b=>b.ringTime)])).toEqual(frozen);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.evaluate(()=>{window.EmeraldArcade.setPaused(false);state.railTime=.01;});
    await expect(page.locator('#cosmicTitle')).toHaveText('ECLIPSE LANDING');
    await expect.poll(()=>page.evaluate(()=>actTwo.active(state))).toBe(false);
    await page.evaluate(()=>hazards.push({x:state.distance+player.x+5,width:50,height:70,hit:false}));
    await expect(page.getByRole('button',{name:'Retry Same Road'})).toBeVisible();
    await expect(page.locator('#resultPeak')).toContainText('bells 3/3');
    await expect(page.locator('#resultPeak')).toContainText('Slingshot awakened');
    await page.getByRole('button',{name:'Retry Same Road'}).click();
    expect(await page.evaluate(()=>state.bellsRung+state.slingshots+state.bells.filter(b=>b.collected||b.missed).length)).toBe(0);
    expect(errors).toEqual([]);
  });

  test(`Act Two Comet Express vault, power overlap, pause, landing and replay at ${width}px`, async ({ page }) => {
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await start(page, width); await enter(page, 17801, true);
    await expect(page.locator('#cosmicTitle')).toHaveText('COMET EXPRESS');
    await expect.poll(() => page.evaluate(() => state.railLift)).toBeGreaterThan(40);
    await page.getByRole('button', { name: /Vault/ }).click();
    expect(await page.evaluate(() => state.railVault)).toBeGreaterThan(0);
    await page.evaluate(() => {
      collectStatue({collected:false}, player.x, player.y);
      hazards.push({x:state.distance+player.x+5,width:50,height:300,hit:false});
    });
    await expect.poll(() => page.evaluate(() => state.smashed)).toBeGreaterThan(0);
    expect(await page.evaluate(() => state.speed)).toBeLessThanOrEqual(570 * 1.35);
    await page.evaluate(() => window.EmeraldArcade.setPaused(true));
    const frozen = await page.evaluate(() => [state.railTime,state.railLift,state.starrailBlend]);
    await page.waitForTimeout(160);
    expect(await page.evaluate(() => [state.railTime,state.railLift,state.starrailBlend])).toEqual(frozen);
    await page.evaluate(() => { window.EmeraldArcade.setPaused(false); state.railTime=.01; state.cosmicTime=0; state.boost=0; hazards.length=0; });
    await expect(page.locator('#cosmicTitle')).toHaveText('COMET LANDING');
    await expect.poll(() => page.evaluate(() => actTwo.active(state))).toBe(false);
    await page.evaluate(() => hazards.push({x:state.distance+player.x+5,width:50,height:70,hit:false}));
    await expect(page.getByRole('button', {name:'Retry Same Road'})).toBeVisible();
    await expect(page.locator('#resultRoute')).toContainText('Obsidian Starrail');
    await page.getByRole('button', {name:'Retry Same Road'}).click();
    expect(await page.evaluate(() => state.railRuns+state.railTime+state.railLanding+state.eclipseTime)).toBe(0);
    expect(errors).toEqual([]);
  });

  test(`Act Two lunar jump physics persist across the cathedral boundary at ${width}px`, async ({ page }) => {
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await start(page,width); await enter(page,22401);
    await expect(page.locator('#routeTitle')).toContainText('LUNAR LOTUS SEA');
    await expect.poll(() => page.evaluate(() => state.lunarBlend)).toBeGreaterThan(.8);
    await page.getByRole('button', {name:/Jump/}).click();
    await expect.poll(() => page.evaluate(() => state.moonJump)).toBe(true);
    await page.evaluate(() => { state.distance=route.actTwo.eclipse-player.x+1; });
    expect(await page.evaluate(() => state.moonJump)).toBe(true);
    await expect(page.locator('#routeTitle')).toContainText('ECLIPSE CATHEDRAL');
    await expect.poll(() => page.evaluate(() => state.moonJump)).toBe(false);
    await page.emulateMedia({reducedMotion:'reduce'});
    expect(await page.evaluate(() => reducedMotion.matches)).toBe(true);
    expect(await page.evaluate(() => state.mode)).toBe('running');
    expect(await page.evaluate(() => document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });

  test(`Act Two Emerald Eclipse magnet and completion report at ${width}px`, async ({ page }) => {
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await start(page,width); await enter(page,28401);
    await expect(page.locator('#cosmicTitle')).toHaveText('EMERALD ECLIPSE');
    expect(await page.evaluate(() => protectedRide())).toBe(false);
    await expect(page.locator('#cosmicEvent')).toBeHidden();
    await page.evaluate(() => {
      const x=state.distance+player.x+320;
      window.eclipseShard={x,lift:105,size:22,spin:0,collected:false}; emeralds.push(window.eclipseShard);
    });
    await expect.poll(() => page.evaluate(() => window.eclipseShard.collected)).toBe(true);
    await page.evaluate(() => window.EmeraldArcade.setPaused(true));
    const timer=await page.evaluate(() => state.eclipseTime);
    await page.waitForTimeout(160);
    expect(await page.evaluate(() => state.eclipseTime)).toBe(timer);
    await page.evaluate(() => window.EmeraldArcade.setPaused(false));
    await enter(page,33601);
    expect(await page.evaluate(()=>state.slingshots)).toBe(0);
    await expect(page.locator('#routeDetail')).toContainText('Act Two complete');
    expect(await page.evaluate(()=>route.actTwoProgress(state.distance+player.x))).toBe(1);
    expect(await page.locator('#routeProgress').evaluate(node=>node.value)).toBeLessThan(.01);
    await page.evaluate(() => hazards.push({x:state.distance+player.x+5,width:50,height:70,hit:false}));
    await expect(page.getByRole('button', {name:'Retry Same Road'})).toBeVisible();
    await expect(page.locator('#resultRoute')).toContainText('Act Two complete');
    await page.getByRole('button', {name:'Retry Same Road'}).click();
    expect(await page.evaluate(() => state.eclipseTime+state.railRuns+state.cathedralBlend)).toBe(0);
    expect(errors).toEqual([]);
  });
}
