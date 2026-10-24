const {chromium}=require('C:/Users/Phantom Assassin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    const read=()=>page.evaluate(()=>kekDiagnostics());
    async function release(){for(const k of ['ArrowRight','ArrowLeft','KeyJ','Space'])await page.keyboard.up(k);}
    async function deploy(){await release();await page.goto('http://127.0.0.1:4173/kontra-kek-wars/index.html?v=field-test-007');await page.locator('[data-mission="2"]').click();await page.locator('#start').click();}
    async function reachGate(){await page.keyboard.down('ArrowRight');await page.keyboard.down('KeyJ');await page.waitForFunction(()=>kekDiagnostics().x>=2480,{},{timeout:20000});await release();await page.keyboard.press('KeyE');assert.equal((await read()).mode,'surge-offer');const d=await read();await page.waitForTimeout(160);assert.deepEqual(await read(),d);}
    async function takeRoute(choice,phone=false){
      await page.screenshot({path:'kontra-kek-wars/preview-surge-offer-v7.png',fullPage:true});
      await page.locator('#start').click();assert.equal((await read()).surge.status,'active');
      const entryArmor=(await read()).hp;let index=0,crossing=false,captured=false;
      const deadline=Date.now()+18000;
      while(Date.now()<deadline){
        const d=await read();if(d.mode==='surge-reward')break;assert.equal(d.mode,'playing');
        if(index<3&&d.x>d.gates[index].x+30){index++;crossing=false;}
        let right=index>=3;
        if(index<3){const gate=d.gates[index];if(d.x<gate.x-62)right=true;else if(crossing||gate.canCross){right=true;crossing=true;}
          if(!right&&gate.state==='charging'&&!captured){
            await release();await page.keyboard.press('Escape');const frozen=await read(),pixels=await page.locator('canvas').evaluate(c=>c.toDataURL());await page.waitForTimeout(160);assert.deepEqual(await read(),frozen);assert.equal(await page.locator('canvas').evaluate(c=>c.toDataURL()),pixels);
            await page.screenshot({path:'kontra-kek-wars/preview-surge-conduits-v7.png',fullPage:true,style:'#overlay{visibility:hidden}'});await page.locator('#start').click();captured=true;
          }
        }
        if(right)await page.keyboard.down('ArrowRight');else await page.keyboard.up('ArrowRight');await page.waitForTimeout(35);
      }
      await release();assert.equal((await read()).mode,'surge-reward');assert.equal((await read()).hp,entryArmor,'Read the gate cues for a zero-damage clear');assert.ok(captured);
      assert.ok((await read()).hp>0);assert.equal((await read()).surge.passed,3);await page.keyboard.press('Enter');assert.equal((await read()).mode,'surge-reward');
      if(phone){await page.setViewportSize({width:390,height:844});const screen=await page.locator('.screen').boundingBox();for(const name of ['rails','overclock']){const b=await page.locator('[data-surge-reward='+name+']').boundingBox();assert.ok(b.y>=screen.y&&b.y+b.height<=screen.y+screen.height);}assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
      await page.screenshot({path:'kontra-kek-wars/preview-surge-reward-'+choice+'-v7.png',fullPage:true});await page.locator('[data-surge-reward='+choice+']').click();
      const d=await read();assert.equal(d.mode,'playing');assert.deepEqual(d.weaponMods,[choice]);assert.ok(d.completedEvents.includes('reactor-surge'));assert.equal(d.surge.status,'claimed');assert.ok(d.x<2700);const shots=d.combat.shots;await page.keyboard.down('KeyJ');await page.waitForTimeout(230);await release();const firing=await read();assert.equal(firing.shotStyle,choice);assert.ok(firing.combat.shots>shots);await page.screenshot({path:'kontra-kek-wars/preview-weapon-'+choice+'-v7.png',fullPage:true});return firing;
    }
    await deploy();await reachGate();await page.locator('#surge-bypass').click();assert.equal((await read()).surge.status,'skipped');assert.deepEqual((await read()).weaponMods,[]);
    await page.keyboard.down('ArrowRight');await page.keyboard.down('KeyJ');await page.waitForFunction(()=>kekDiagnostics().x>2850);await release();assert.equal((await read()).mode,'playing');assert.equal((await read()).hazards.some(h=>h.kind==='surge'),false);
    await deploy();await reachGate();const earned=await takeRoute('overclock');
    // A real death after claiming must retain the event modifier on checkpoint retry.
    await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>kekDiagnostics().mode==='dead',{},{timeout:24000});await release();await page.locator('#start').click();assert.deepEqual((await read()).weaponMods,['overclock']);
    let moving=false;await page.keyboard.down('KeyJ');
    for(let tick=0;tick<1300;tick++){
      const d=await read();if(d.mode==='won')break;assert.equal(d.mode,'playing',JSON.stringify(d));
      if(d.x<4180&&!moving){await page.keyboard.down('ArrowRight');moving=true;}if(d.x>=4180&&moving){await page.keyboard.up('ArrowRight');moving=false;}
      if(d.hazards.some(h=>!h.high&&h.timer>0&&h.timer<.28&&(h.kind==='beam'||Math.abs(h.x-d.x)<90)))await page.keyboard.press('Space');
      await page.waitForTimeout(35);
    }
    await release();assert.equal((await read()).mode,'won');await page.locator('#start').click();const carried=await read();assert.equal(carried.mission,3);assert.deepEqual(carried.weaponMods,['overclock']);assert.ok(carried.completedEvents.includes('reactor-surge'));
    await page.screenshot({path:'kontra-kek-wars/preview-surge-carry-v7.png',fullPage:true});
    await deploy();await reachGate();const rails=await takeRoute('rails',true);
    assert.deepEqual(errors,[]);fs.writeFileSync('kontra-kek-wars/reactor-verification-v7.json',JSON.stringify({result:'PASS',earned,carried,rails,checks:['safe bypass','offer freezes combat','zero-damage gate clear using displayed openings','pause freezes gate clock and canvas pixels','reward screen cannot be skipped with Enter','real death/retry keeps earned modifier','Stormforge boss clear and realm-three carryover','both weapon choices show distinct shot feedback','phone reward buttons fit and work','no duplicate claims or page errors'],errors},null,2));console.log('REACTOR SURGE BROWSER PASS');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
