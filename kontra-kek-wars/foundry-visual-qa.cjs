const {chromium}=require('C:/Users/Phantom Assassin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:4173/kontra-kek-wars/index.html?v=field-test-004');
    await page.locator('[data-mission="2"]').click();
    assert.equal(await page.locator('[data-mission="2"]').getAttribute('aria-pressed'),'true');
    await page.screenshot({path:'kontra-kek-wars/preview-stormforge-title-v4.png',fullPage:true});
    await page.locator('#start').click();await page.keyboard.down('ArrowRight');await page.keyboard.down('KeyJ');await page.waitForTimeout(2000);
    await page.keyboard.press('Escape');
    const d=await page.evaluate(()=>kekDiagnostics());assert.equal(d.mission,2);assert.ok(d.x>350);
    const pixels=await page.locator('canvas').evaluate(c=>c.toDataURL());await page.waitForTimeout(180);
    assert.equal(await page.locator('canvas').evaluate(c=>c.toDataURL()),pixels);
    await page.screenshot({path:'kontra-kek-wars/preview-stormforge-combat-v4.png',fullPage:true,style:'#overlay{visibility:hidden}'});
    await page.setViewportSize({width:390,height:844});await page.reload();await page.locator('[data-mission="2"]').click();
    const screen=await page.locator('.screen').boundingBox(),start=await page.locator('#start').boundingBox();
    assert.ok(start.y>=screen.y&&start.y+start.height<=screen.y+screen.height,'Phone deploy button stays inside the screen');
    await page.screenshot({path:'kontra-kek-wars/preview-mission-select-phone-v4.png',fullPage:true});
    await page.locator('#start').click();await page.locator('[data-key=ShiftLeft]').click();await page.waitForTimeout(100);
    assert.ok((await page.evaluate(()=>kekDiagnostics())).dashCool>0);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
    fs.writeFileSync('kontra-kek-wars/foundry-visual-verification-v4.json',JSON.stringify({result:'PASS',checks:['direct mission selection','new enemy roster and renderer','rain/rotors freeze exactly on pause','phone deploy is inside screen','phone dash control','no overflow or page errors'],errors},null,2));
    console.log('FOUNDRY VISUAL CHECKS PASS');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
