const {chromium}=require('C:/Users/Phantom Assassin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:4173/kontra-kek-wars/index.html?v=field-test-008');await page.locator('[data-mission="3"]').click();await page.locator('#start').click();
    const read=()=>page.evaluate(()=>kekDiagnostics()),pressed=new Set();
    async function key(k,on){if(on&&!pressed.has(k)){await page.keyboard.down(k);pressed.add(k);}else if(!on&&pressed.has(k)){await page.keyboard.up(k);pressed.delete(k);}}
    async function release(){for(const k of [...pressed])await key(k,false);}
    async function capture(name){await release();await page.keyboard.press('Escape');const d=await read(),pixels=await page.locator('canvas').evaluate(c=>c.toDataURL());await page.waitForTimeout(130);assert.deepEqual(await read(),d);assert.equal(await page.locator('canvas').evaluate(c=>c.toDataURL()),pixels);await page.screenshot({path:'kontra-kek-wars/'+name+'.png',fullPage:true,style:'#overlay{visibility:hidden}'});await page.locator('#start').click();pressed.clear();}
    await page.waitForFunction(()=>kekDiagnostics().enemies.some(e=>e.type==='stalker'&&e.state==='windup'));
    await page.waitForFunction(()=>kekDiagnostics().enemies.some(e=>e.type==='stalker'&&e.state==='leap'&&e.y<340));
    await capture('preview-stalker-leap-v8');
    await key('ArrowRight',true);await key('KeyJ',true);await page.waitForFunction(()=>kekDiagnostics().x>480);await release();
    await page.waitForFunction(()=>kekDiagnostics().enemies.some(e=>e.type==='wisp'&&e.state==='windup'&&e.lock));
    await capture('preview-wisp-coil-v8');
    await page.locator('#restart').click();pressed.clear();
    let scenery=false,waveSeen=false,waveDodge=false,phase2=false,opened=false,retries=0;
    const deadline=Date.now()+65000;
    while(Date.now()<deadline){
      const d=await read();if(d.mode==='won')break;
      if(d.mode==='dead'){await release();assert.ok(++retries<=2);await page.locator('#start').click();continue;}
      if(d.x>1900&&!scenery){await capture('preview-jade-grove-v8');scenery=true;}
      phase2 ||= d.bossActive&&d.bossPhase===2;opened ||= d.bossActive&&d.bossExposed&&d.bossOpen>.6;
      const wave=d.hazards.find(h=>h.kind==='rootwave'),near=wave&&wave.timer<=0&&wave.x-wave.w/2-(d.x+26)<80&&wave.x+wave.w/2>d.x;
      if(wave&&wave.timer>0&&!waveSeen){await capture('preview-bloom-windup-v8');waveSeen=true;continue;}
      await key('KeyJ',true);await key('ArrowRight',d.x<3780);await key('ArrowLeft',d.bossActive&&d.x>3860);
      await key('Space',!!near||d.hazards.some(h=>h.kind==='root'&&h.timer>0&&h.timer<.28&&Math.abs(h.x-d.x)<90));
      if(near&&!waveDodge){await page.waitForTimeout(80);await capture('preview-bloom-wave-v8');waveDodge=true;continue;}
      if(d.bossActive&&!near&&d.dashCool===0&&d.threats.some(b=>Math.abs(b.x-d.x)<70&&Math.abs(b.y-d.y-20)<35))await page.keyboard.press('Shift');
      await page.waitForTimeout(35);
    }
    await release();const result=await read();assert.equal(result.mode,'won',JSON.stringify(result));assert.ok(scenery&&waveSeen&&waveDodge&&phase2&&opened);assert.ok(result.hp>0);assert.equal(result.bossName,'RIFT BLOOM');
    await page.screenshot({path:'kontra-kek-wars/preview-jade-victory-v8.png',fullPage:true});
    await page.setViewportSize({width:390,height:844});await page.reload();await page.locator('[data-mission="3"]').click();await page.screenshot({path:'kontra-kek-wars/preview-jade-phone-v8.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.deepEqual(errors,[]);fs.writeFileSync('kontra-kek-wars/jade-verification-v8.json',JSON.stringify({result:'PASS',run:result,retries,checks:['actual stalker wind-up and committed leap','wisp charging and target lock','paused simulation and canvas freeze','new grove art','root wave warning and moving front','jump input over travelling wave','petal recovery opening','phase two','normal-health boss clear','390px deployment layout'],errors},null,2));console.log('JADE RIFT BROWSER PASS',JSON.stringify({score:result.score,armor:result.hp,retries}));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
