const {chromium}=require('C:/Users/Phantom Assassin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:4173/kontra-kek-wars/index.html?v=field-test-007');await page.locator('[data-mission="2"]').click();await page.locator('#start').click();
    await page.waitForFunction(()=>kekDiagnostics().enemies.some(e=>e.type==='crawler'&&e.state==='charge'&&e.animStride>0));
    await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>kekDiagnostics().x>650);await page.keyboard.up('ArrowRight');
    await page.waitForFunction(()=>kekDiagnostics().enemies.some(e=>e.type==='rocketeer'&&e.state==='windup'));
    await page.keyboard.press('Escape');const frozen=await page.evaluate(()=>kekDiagnostics());await page.waitForTimeout(150);assert.deepEqual(await page.evaluate(()=>kekDiagnostics()),frozen);
    await page.screenshot({path:'kontra-kek-wars/preview-enemy-windup-v7.png',fullPage:true,style:'#overlay{visibility:hidden}'});await page.locator('#start').click();
    const before=await page.evaluate(()=>kekDiagnostics().enemies.find(e=>e.type==='drone').y);await page.waitForTimeout(180);const after=await page.evaluate(()=>kekDiagnostics().enemies.find(e=>e.type==='drone').y);assert.notEqual(before,after);
    await page.keyboard.down('KeyJ');await page.waitForFunction(()=>kekDiagnostics().enemies.some(e=>e.state==='stagger'));
    await page.keyboard.up('KeyJ');await page.keyboard.press('Escape');await page.screenshot({path:'kontra-kek-wars/preview-enemy-hit-v7.png',fullPage:true,style:'#overlay{visibility:hidden}'});
    assert.deepEqual(errors,[]);fs.writeFileSync('kontra-kek-wars/enemy-animation-verification-v7.json',JSON.stringify({result:'PASS',checks:['crawler charge uses movement-driven leg cycle','rocketeer wind-up','drone hover changes during simulation','confirmed shot staggers target','paused enemy states freeze','no page errors'],errors},null,2));console.log('ENEMY ANIMATION BROWSER PASS');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
