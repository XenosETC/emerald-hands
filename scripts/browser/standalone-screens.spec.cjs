const { test, expect } = require('@playwright/test');
const games = [
  ['pepe-chess','.board'],['pepe-checkers','#board'],['pepe-poker','.table'],
  ['kontra-kek-wars','#game'],['pepe-soul-world','#game'],['pepe-temple-run','#game'],
  ['pepe-one-more-launch','#flight'],['pepe-feudalism','#game'],
];
async function fits(page, selector) {
  expect(await page.evaluate(() => ({x:document.documentElement.scrollWidth<=innerWidth,y:document.documentElement.scrollHeight<=innerHeight,scroll:scrollY}))).toEqual({x:true,y:true,scroll:0});
  await expect(page.locator(selector)).toBeInViewport({ratio:1});
  const escaped = await page.locator('button').evaluateAll(nodes => nodes.filter(node=>node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden').filter(node=>{
    const box=node.getBoundingClientRect();return box.x < -1 || box.y < -1 || box.right > innerWidth+1 || box.bottom > innerHeight+1;
  }).map(node=>node.id||node.textContent.trim().slice(0,30)));
  expect(escaped).toEqual([]);
}
for(const viewport of [{width:390,height:844},{width:844,height:390},{width:1440,height:900}]) {
  for(const [directory,surface] of games) {
    test(`${directory} fits and responds at ${viewport.width}×${viewport.height}`,async({page})=>{
      await page.setViewportSize(viewport);
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      if(directory==='pepe-temple-run') await page.addInitScript(()=>{
        const original=HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext=function(type,...args){return ['webgl','webgl2','experimental-webgl'].includes(type)?null:original.call(this,type,...args);};
      });
      await page.goto(`/${directory}/index.html`);
      await page.waitForTimeout(100);
      await fits(page,surface);
      if(directory==='pepe-chess') {
        await page.locator('[data-square="e2"]').click();await page.locator('[data-square="e4"]').click();
        await expect(page.locator('#match-status')).toHaveText('Black to move.');
        await page.locator('#match-options').click();await expect(page.locator('#match-options-dialog')).toBeVisible();
        await page.locator('#close-match-options').click();await expect(page.locator('#match-options')).toBeFocused();
      } else if(directory==='pepe-checkers') {
        await page.locator('#match-options').click();await page.locator('#mode').selectOption('local');await page.locator('#close-match-options').click();
        await page.locator('#board').getByRole('button',{name:/^c3.*can move/i}).click();
        await page.locator('#board').getByRole('button',{name:/^d4.*destination/i}).click();
        await expect(page.locator('#board').getByRole('button',{name:/^d4.*Emerald piece/i})).toBeVisible();
      } else if(directory==='pepe-poker') {
        await page.getByLabel('Screen name').fill('Screen tester');await page.locator('#practice').click();
        await expect(page.locator('#deal')).toBeVisible();await page.locator('#deal').click();
        await expect(page.locator('.your-seat .card[role=img]')).toHaveCount(2);
        await expect(page.locator('#fold')).toBeVisible();await fits(page,surface);await page.locator('#fold').click();
        await expect(page.locator('#review-last')).toBeVisible();await page.locator('#review-last').click();
        await expect(page.locator('#table-info-dialog')).toBeVisible();await page.locator('#close-table-info').click();
      } else if(directory==='kontra-kek-wars') {
        await page.locator('#start').click();await expect.poll(()=>page.evaluate(()=>kekDiagnostics().mode)).toBe('playing');
        const start=await page.evaluate(()=>kekDiagnostics().x);await page.keyboard.down('ArrowRight');await page.waitForTimeout(200);await page.keyboard.up('ArrowRight');
        expect(await page.evaluate(()=>kekDiagnostics().x)).toBeGreaterThan(start);
        await page.locator('#field-guide').click();await expect(page.locator('#field-guide-dialog')).toBeVisible();
        await page.keyboard.press('p');expect(await page.evaluate(()=>kekDiagnostics().mode)).toBe('paused');
        await page.locator('#close-guide').click();await expect(page.locator('#field-guide')).toBeFocused();
      } else if(directory==='pepe-soul-world') {
        await expect(page.locator('#begin')).toBeEnabled({timeout:20000});await page.locator('#begin').click();
        await page.locator('#pause').click();await expect(page.locator('#pause-screen')).toBeVisible();await page.locator('#resume').click();
        await page.locator('.journal-launch').getByRole('button',{name:'Inventory',exact:true}).click();await expect(page.locator('#journal')).toBeVisible();
        await page.keyboard.press('Escape');await expect(page.locator('#journal')).toBeHidden();
      } else if(directory==='pepe-temple-run') {
        await page.locator('#start').click();await expect.poll(()=>page.evaluate(()=>templeRunDiagnostics().distance)).toBeGreaterThan(0);
        await page.getByRole('button',{name:'Move left',exact:true}).click();await expect.poll(()=>page.evaluate(()=>templeRunDiagnostics().lane)).toBe(0);
        await page.locator('#pause').click();await expect(page.locator('#start')).toContainText('Continue running');
      } else if(directory==='pepe-one-more-launch') {
        await page.locator('#hangarToggle').click();await expect(page.locator('#hangar')).toBeVisible();await page.locator('#closeHangar').click();
        await page.locator('#launch').click();await expect(page.locator('#stage')).toHaveAttribute('data-phase','flight');
        await page.locator('#pause').click();await expect(page.locator('#pauseOverlay')).toBeVisible();await page.locator('#resume').click();
      } else if(directory==='pepe-feudalism') {
        await page.locator('#inventory-toggle').click();await expect(page.locator('#scroll-panel')).toBeVisible();
        await expect(page.locator('#close-scroll')).toBeInViewport({ratio:1});await page.locator('#close-scroll').click();
        await expect(page.locator('#scroll-panel')).toBeHidden();await page.locator('#map-toggle').click();await expect(page.locator('#map-tools')).toBeVisible();await page.locator('#zoom-in').click();await page.locator('#follow').click();
      }
      await fits(page,surface);expect(errors).toEqual([]);
    });
  }
}
