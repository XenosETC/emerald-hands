const {chromium}=require('C:/Users/Phantom Assassin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:4173/kontra-kek-wars/index.html');
    await page.locator('#start').click();
    const read=()=>page.evaluate(()=>kekDiagnostics());
    await page.keyboard.down('ArrowRight');await page.keyboard.press('Shift');
    await page.waitForTimeout(250);
    assert.ok((await read()).x>150,'Dash must move farther than walking');
    assert.ok((await read()).dashCool>0,'Dash must recharge');
    await page.locator('#restart').click();
    await page.keyboard.down('ArrowRight');await page.keyboard.down('KeyJ');
    let outpost=false,fortress=false,phase2=false,mortar=false,chain=false,dash=false;
    let moving=true;
    const deadline=Date.now()+60000;
    while(Date.now()<deadline){
      const d=await read();
      if(d.mode!=='playing')break;
      chain ||= d.combo>1;
      if(d.x>1750&&!outpost){
        assert.equal(d.checkpoint,1720);
        await page.keyboard.press('Escape');
        await page.screenshot({path:'kontra-kek-wars/preview-outpost-v3.png',fullPage:true,style:'#overlay{visibility:hidden}'});
        await page.locator('#start').click();
        await page.keyboard.down('ArrowRight');await page.keyboard.down('KeyJ');outpost=true;
      }
      if(d.bossActive&&!fortress){
        assert.equal(d.checkpoint,3340);fortress=true;
        // Walk into hostile fire to exercise a real checkpoint death and retry.
        const savedScore=d.score;
        await page.keyboard.up('KeyJ');await page.keyboard.down('ArrowRight');
        await page.waitForFunction(()=>kekDiagnostics().mode==='dead',{},{timeout:16000});
        assert.match(await page.locator('#start').textContent(),/CHECKPOINT/);
        await page.locator('#start').click();
        const retried=await read();assert.equal(retried.hp,5);assert.equal(retried.bossHp,90);
        assert.equal(retried.checkpoint,3340);assert.equal(retried.score,savedScore);
        assert.ok(retried.x>=3340&&retried.x<3350);
        await page.keyboard.down('ArrowRight');await page.keyboard.down('KeyJ');moving=true;continue;
      }
      if(d.x>=3610&&moving){await page.keyboard.up('ArrowRight');moving=false;}
      if(d.bossActive){
        phase2 ||= d.bossPhase===2;
        const danger=d.hazards.some(h=>Math.abs(h.x-d.x)<85&&h.timer<.45&&h.timer>0);
        if(danger){mortar=true;await page.keyboard.press('Space');}
        if(d.threats.some(b=>Math.abs(b.x-d.x)<80&&Math.abs(b.y-d.y-20)<35)&&d.dashCool===0){await page.keyboard.press('Shift');dash=true;}
        if(d.hazards.length&&!mortar){
          await page.keyboard.press('Escape');
          await page.screenshot({path:'kontra-kek-wars/preview-boss-v3.png',fullPage:true,style:'#overlay{visibility:hidden}'});
          await page.locator('#start').click();await page.keyboard.down('KeyJ');
          if(moving)await page.keyboard.down('ArrowRight');
          mortar=true;
        }
      }
      await page.waitForTimeout(45);
    }
    const result=await read();
    assert.equal(result.mode,'won',JSON.stringify(result));
    assert.ok(outpost&&fortress&&phase2&&chain&&mortar);
    assert.ok(result.hp>0);assert.equal(result.bossHp,0);
    await page.screenshot({path:'kontra-kek-wars/preview-victory-v3.png',fullPage:true});
    await page.locator('#start').click();
    const next=await read();assert.equal(next.mission,2);assert.equal(next.score,result.score);assert.equal(next.hp,5);assert.equal(next.grenades,3);
    assert.equal(next.bossName,'TEMPEST WARDEN');
    let foundry=false,warden=false,rail=false,wardenPhase2=false,retries=0;
    await page.keyboard.down('ArrowRight');await page.keyboard.down('KeyJ');moving=true;
    const campaignDeadline=Date.now()+70000;
    while(Date.now()<campaignDeadline){
      const d=await read();
      if(d.mode==='won')break;
      if(d.mode==='dead'){
        assert.ok(++retries<=3,'Too many foundry retries');await page.locator('#start').click();assert.equal((await read()).mission,2);
        await page.keyboard.down('ArrowRight');await page.keyboard.down('KeyJ');moving=true;continue;
      }
      if(d.x>2100&&!foundry){
        assert.equal(d.checkpoint,2040);await page.keyboard.press('Escape');
        await page.screenshot({path:'kontra-kek-wars/preview-stormforge-v4.png',fullPage:true,style:'#overlay{visibility:hidden}'});
        await page.locator('#start').click();await page.keyboard.down('ArrowRight');await page.keyboard.down('KeyJ');foundry=true;
      }
      if(d.x>=4180&&moving){await page.keyboard.up('ArrowRight');moving=false;}
      if(d.bossActive){
        warden=true;assert.equal(d.checkpoint,3940);wardenPhase2 ||= d.bossPhase===2;
        const danger=d.hazards.some(h=>!h.high&&h.timer>0&&h.timer<.42&&(h.kind==='beam'||Math.abs(h.x-d.x)<90));
        if(danger)await page.keyboard.press('Space');
        if(d.hazards.some(h=>h.kind==='beam')&&!rail){
          rail=true;await page.keyboard.press('Escape');await page.screenshot({path:'kontra-kek-wars/preview-warden-v4.png',fullPage:true,style:'#overlay{visibility:hidden}'});
          await page.locator('#start').click();await page.keyboard.down('KeyJ');if(moving)await page.keyboard.down('ArrowRight');
        }
      }
      if(d.threats.some(b=>Math.abs(b.x-d.x)<75&&Math.abs(b.y-d.y-20)<35)&&d.dashCool===0)await page.keyboard.press('Shift');
      await page.waitForTimeout(40);
    }
    const campaign=await read();assert.equal(campaign.mode,'won',JSON.stringify(campaign));assert.ok(foundry&&warden&&rail&&wardenPhase2);
    assert.ok(campaign.hp>0);assert.ok(campaign.score>result.score);assert.equal(campaign.mission,2);
    await page.screenshot({path:'kontra-kek-wars/preview-campaign-victory-v4.png',fullPage:true});
    await page.reload();assert.ok(Number((await page.locator('#best').textContent()).replace(/\D/g,''))>=campaign.score);
    await page.locator('[data-mission="2"]').click();await page.locator('#start').click();assert.equal((await read()).mission,2);assert.equal((await read()).score,0);
    await page.locator('#restart').click();assert.equal((await read()).mission,2);assert.equal((await read()).score,0);
    await page.setViewportSize({width:390,height:844});await page.reload();await page.locator('[data-mission="2"]').click();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:'kontra-kek-wars/preview-mission-select-phone-v4.png',fullPage:true});
    assert.deepEqual(errors,[]);
    const receipt={result:'PASS',run:result,checks:['full mission via real keyboard inputs; no state injection','both checkpoints reached','real death and checkpoint retry restore score, armor and boss','kill-chain multiplier','dash travel and cooldown','mortar warning rendered','boss phase two','boss defeated with normal health','victory score persisted across reload'],dash,errors};
    fs.writeFileSync('kontra-kek-wars/campaign-verification-v4.json',JSON.stringify({...receipt,campaign,retries,campaignChecks:['mission one -> two transition carries score and refills supplies','foundry checkpoint','Warden rail warning','Warden phase two','campaign completed with normal health','campaign best persists','direct mission-two deploy and restart','390px mission-selection layout']},null,2));
    console.log('CAMPAIGN PASS',JSON.stringify({first:result.score,second:campaign.score,hp:campaign.hp,retries}));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
