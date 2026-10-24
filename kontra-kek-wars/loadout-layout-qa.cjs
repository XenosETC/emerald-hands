// DOM-only layout fixture; gameplay and earned rewards are checked by campaign-qa.cjs.
const {chromium}=require('C:/Users/Phantom Assassin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const page=await browser.newPage();
    for(const width of [360,390]){
      await page.setViewportSize({width,height:844});await page.goto('http://127.0.0.1:4173/kontra-kek-wars/index.html?v=field-test-005');
      await page.evaluate(()=>{document.getElementById('overlay').dataset.state='won';document.getElementById('mission-choices').hidden=true;document.getElementById('realm-upgrades').hidden=false;document.getElementById('title').textContent='REALM LIBERATED.';document.getElementById('message').textContent='NEXT: THE SHATTERED GROVE. Carry your kit and refill supplies.';});
      const screen=await page.locator('.screen').boundingBox();
      for(const selector of ['#start','[data-reward=pulse]','[data-reward=coil]']){const b=await page.locator(selector).boundingBox();assert.ok(b.y>=screen.y&&b.y+b.height<=screen.y+screen.height,selector+' inside phone screen');}
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    }
    console.log('LOADOUT LAYOUT FIXTURE PASS / 360px + 390px');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
