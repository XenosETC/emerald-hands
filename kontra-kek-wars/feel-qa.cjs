const {chromium}=require('C:/Users/Phantom Assassin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');

(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:4173/kontra-kek-wars/index.html?v=field-test-003');
    await page.locator('#start').click();
    const read=()=>page.evaluate(()=>kekDiagnostics());
    await page.keyboard.down('ArrowRight');await page.keyboard.down('KeyJ');
    await page.waitForTimeout(430);
    assert.ok((await read()).pose.stride>0);
    await page.waitForFunction(()=>kekDiagnostics().pose.recoil>.4);
    await page.keyboard.press('Escape');
    await page.screenshot({path:'kontra-kek-wars/preview-recoil-v3.png',fullPage:true,style:'#overlay{visibility:hidden}'});
    const frozen=await read(),pixels=await page.locator('canvas').evaluate(c=>c.toDataURL());
    await page.waitForTimeout(250);assert.deepEqual(await read(),frozen);
    assert.equal(await page.locator('canvas').evaluate(c=>c.toDataURL()),pixels,'Paused animation pixels stay identical');
    await page.locator('#start').click();
    await page.keyboard.down('ArrowUp');await page.waitForTimeout(40);
    assert.equal((await read()).pose.aim,-Math.PI/2);
    await page.keyboard.up('ArrowUp');
    await page.keyboard.down('Space');
    await page.waitForTimeout(160);
    assert.equal((await read()).pose.grounded,false);
    await page.keyboard.press('Escape');
    await page.screenshot({path:'kontra-kek-wars/preview-jump-v3.png',fullPage:true,style:'#overlay{visibility:hidden}'});
    await page.locator('#start').click();
    await page.waitForFunction(()=>kekDiagnostics().pose.land>.2);
    const landing=await read();assert.ok(landing.pose.land>.2);
    await page.locator('#sound').click();assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'true');
    await page.keyboard.down('ArrowRight');await page.keyboard.down('KeyJ');
    await page.waitForFunction(()=>kekDiagnostics().kills>0);
    await page.keyboard.press('Escape');
    await page.screenshot({path:'kontra-kek-wars/preview-combat-v3.png',fullPage:true,style:'#overlay{visibility:hidden}'});
    assert.deepEqual(errors,[]);
    fs.writeFileSync('kontra-kek-wars/feel-verification-v3.json',JSON.stringify({result:'PASS',checks:['stride animation follows movement','shot recoil','upward aiming pose','jump pose','landing squash','pause freezes both simulation and rendered pixels','kill feedback','sound toggle without browser errors'],landing,errors},null,2));
    console.log('COMBAT FEEL + ANIMATION CHECKS PASS');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
