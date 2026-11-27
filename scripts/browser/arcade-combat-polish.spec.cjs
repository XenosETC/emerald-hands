const {test,expect}=require('@playwright/test');

test('touch-only arcade browsing includes the Rumble tournament',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/');
  await page.getByRole('checkbox',{name:'Touch controls'}).check();
  await page.getByRole('searchbox',{name:'Search games'}).fill('Relic Rumble');
  const card=page.locator('.game-card:visible');await expect(card).toHaveCount(1);
  await expect(card.getByRole('link',{name:'Open Pepe Relic Rumble',exact:true})).toBeVisible();
  await expect(card).toContainText('Touch Tournament + Keyboard PvP');
});

test.describe('Relic Rumble tournament touch',()=>{
  test.use({hasTouch:true,isMobile:true});
  test('full energy makes the touch Burst available and spends it through normal combat',async({page})=>{
    await page.setViewportSize({width:390,height:844});
    await page.clock.install();
    // Existing energy QA preset isolates the charged control from charge time.
    await page.goto('/pepe-relic-rumble.html?energyqa=100');
    await page.locator('[data-mode="tournament"]').click();await page.locator('#launchButton').click();
    const burst=page.locator('#rumbleTouchControls').getByRole('button',{name:'Relic Burst!',exact:true});
    await expect(page.locator('#rumbleTouchControls').getByRole('button',{name:'Shield · close for Burst',exact:true})).toBeVisible();
    await page.locator('#rumbleCanvas').focus();await page.keyboard.down('d');
    for(let i=0;i<20&&!await burst.isVisible();i++) await page.clock.runFor(50);
    await expect(burst).toBeVisible();
    await page.keyboard.up('d');
    await burst.tap();
    await page.clock.runFor(50);
    await expect.poll(()=>page.evaluate(()=>__relicRumbleDebug.getState().fighters[0].action)).toBe('special');
    expect(await page.locator('#p1Energy').evaluate(node=>node.value)).toBeLessThan(100);
  });
  for(const size of [{width:320,height:568},{width:390,height:844},{width:844,height:390}]) {
    test(`movement, simultaneous attack, cancel and pause at ${size.width}×${size.height}`,async({page})=>{
      await page.setViewportSize(size);const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto('/pepe-relic-rumble.html');
      await page.locator('[data-mode="tournament"]').click();
      await page.locator('#launchButton').click();
      const pad=page.locator('#rumbleTouchControls');await expect(pad).toBeVisible();
      expect((await page.locator('.rumble-hud').boundingBox()).height).toBeLessThan(100);
      const right=pad.getByRole('button',{name:'Move right'}),punch=pad.getByRole('button',{name:'Punch',exact:true}),charge=pad.getByRole('button',{name:/Charge/});
      for(const button of [right,punch,charge]) {
        const box=await button.boundingBox();expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.y+box.height).toBeLessThanOrEqual(size.height);expect(box.x+box.width).toBeLessThanOrEqual(size.width);
      }
      const session=await page.context().newCDPSession(page);
      const point=async(button,id)=>{const b=await button.boundingBox();return {x:b.x+b.width/2,y:b.y+b.height/2,id};};
      const readX=()=>page.evaluate(()=>__relicRumbleDebug.getState().fighters[0].x);
      try {
        const startX=await readX(),move=await point(right,1),hit=await point(punch,2);
        await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[move]});
        await expect.poll(readX).toBeGreaterThan(startX+8);
        await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[move,hit]});
        await expect(right).toHaveAttribute('aria-pressed','true');await expect(punch).toHaveAttribute('aria-pressed','true');
        await expect.poll(()=>page.evaluate(()=>__relicRumbleDebug.getState().fighters[0].action)).toBe('punch');
        await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        await expect(right).toHaveAttribute('aria-pressed','false');await expect(punch).toHaveAttribute('aria-pressed','false');
        await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[await point(charge,3)]});
        await expect(charge).toHaveAttribute('aria-pressed','true');
        await session.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
        await expect(charge).toHaveAttribute('aria-pressed','false');
        await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[await point(right,4)]});
        await page.evaluate(()=>EmeraldArcade.setPaused(true));
        await expect(right).toHaveAttribute('aria-pressed','false');
        const time=await page.locator('#timerLabel').textContent();await page.waitForTimeout(160);
        expect(await page.locator('#timerLabel').textContent()).toBe(time);
        await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        await page.evaluate(()=>EmeraldArcade.setPaused(false));
        const left=pad.getByRole('button',{name:'Move left'}),before=await readX();
        await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[await point(left,5)]});
        await expect.poll(readX).toBeLessThan(before-8);
        await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      } finally {await session.detach();}
      expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      expect(errors).toEqual([]);
    });
  }
});

for(const width of [390,1440]) {
  test(`Galactic Heroes warns on the actual firing lane and freezes during pause at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:900});await page.clock.install();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('/emerald-galactic-heroes.html');await page.locator('#overlayStartButton').click();
    await page.evaluate(()=>{enemies.length=0;heroShots.length=0;enemyShots.length=0;state.wave=3;state.bossSpawned=false;state.spawnTimer=99;spawnEnemy();Object.assign(enemies[0],{x:360,y:180,shotTimer:.31});});
    await page.clock.runFor(80);
    await expect(page.locator('#bossAttackLabel')).toContainText('leave the violet lane');
    expect(await page.evaluate(()=>shotWarning(enemies[0]))).toBeGreaterThan(0);
    await page.evaluate(()=>EmeraldArcade.setPaused(true));
    const timer=await page.evaluate(()=>enemies[0].shotTimer);await page.clock.runFor(500);
    expect(await page.evaluate(()=>enemies[0].shotTimer)).toBe(timer);
    await page.evaluate(()=>EmeraldArcade.setPaused(false));await page.clock.runFor(280);
    expect(await page.evaluate(()=>enemyShots.some(s=>s.x===360))).toBe(true);
    await expect(page.locator('#bossAttackLabel')).toHaveText('Boss Cruiser');
    await page.emulateMedia({reducedMotion:'reduce'});await page.clock.runFor(450);
    expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });

  test(`Shard Rush final sprint countdown, pause, result and retry at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:900});const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('/shard-rush.html');await page.locator('#overlayStartButton').click();
    // Isolate the real final-sprint clock transitions from the preceding 50 seconds.
    await page.evaluate(()=>{state.elapsed=49.95;state.timeLeft=10.05;state.spawnTimer=999;drops.length=0;});
    await expect(page.locator('#sprintPhase')).toHaveText('FINAL SPRINT');
    await expect(page.locator('#sprintAnnouncement')).toContainText('10 seconds left');
    await page.evaluate(()=>EmeraldArcade.setPaused(true));
    const time=await page.locator('#sprintClock').evaluate(node=>node.value);await page.waitForTimeout(160);
    expect(await page.locator('#sprintClock').evaluate(node=>node.value)).toBe(time);
    await page.evaluate(()=>{EmeraldArcade.setPaused(false);state.elapsed=54.99;state.timeLeft=5.01;});
    await expect(page.locator('#sprintAnnouncement')).toContainText('5 seconds left');
    await page.evaluate(()=>{state.elapsed=59.99;state.timeLeft=.01;});
    await expect(page.locator('#rushOverlay')).toBeVisible();
    expect(await page.locator('#sprintClock').evaluate(node=>node.value)).toBe(0);
    await page.locator('#overlayStartButton').click();
    await expect(page.locator('#sprintPhase')).toHaveText('seconds');
    expect(await page.locator('#sprintClock').evaluate(node=>node.value)).toBeGreaterThan(59);
    expect(errors).toEqual([]);
  });
}
