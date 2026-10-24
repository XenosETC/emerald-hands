const {chromium}=require('C:/Users/Phantom Assassin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:4173/kontra-kek-wars/index.html?v=field-test-008');
    const read=()=>page.evaluate(()=>kekDiagnostics()),pressed=new Set();
    async function key(code,on){if(on&&!pressed.has(code)){await page.keyboard.down(code);pressed.add(code);}else if(!on&&pressed.has(code)){await page.keyboard.up(code);pressed.delete(code);}}
    async function release(){for(const code of [...pressed])await key(code,false);}
    async function shot(name){await release();await page.keyboard.press('Escape');const d=await read();await page.waitForTimeout(100);assert.deepEqual(await read(),d);await page.screenshot({path:'kontra-kek-wars/'+name+'.png',fullPage:true,style:'#overlay{visibility:hidden}'});await page.locator('#start').click();pressed.clear();}
    await page.locator('#start').click();
    const results=[];
    for(const [id,target,checkpoint] of [[1,3610,1720],[2,4180,2040],[3,3780,1840]]){
      assert.equal((await read()).mission,id);
      let scenic=false,boss=false,phase2=false,retries=0;
      const deadline=Date.now()+65000;
      while(Date.now()<deadline){
        const d=await read();if(d.mode==='won')break;
        if(d.mode==='dead'){await release();assert.ok(++retries<=2);await page.locator('#start').click();continue;}
        if(d.x>checkpoint+30&&!scenic){assert.equal(d.checkpoint,checkpoint);await shot('preview-realm-'+id+'-v8');scenic=true;}
        if(d.bossActive){phase2 ||= d.bossPhase===2;if(d.hazards.length&&!boss){await shot('preview-boss-'+id+'-v8');boss=true;}}
        const danger=d.hazards.some(h=>h.kind==='rootwave'?h.timer<=0&&h.x-h.w/2-(d.x+26)<80&&h.x+h.w/2>d.x:!h.high&&h.timer>0&&h.timer<.28&&(h.kind==='beam'||Math.abs(h.x-d.x)<90));
        await key('KeyJ',true);await key('ArrowRight',d.x<target);await key('ArrowLeft',d.bossActive&&d.x>target+80);await key('Space',danger&&d.pose.grounded);
        if(d.bossActive&&d.dashCool===0&&d.threats.some(b=>Math.abs(b.x-d.x)<70&&Math.abs(b.y-d.y-20)<35))await page.keyboard.press('Shift');
        await page.waitForTimeout(40);
      }
      await release();const result=await read();assert.equal(result.mode,'won',JSON.stringify(result));assert.ok(scenic&&boss&&phase2);assert.ok(result.hp>0);results.push({mission:id,score:result.score,armor:result.hp,kills:result.kills,retries,weapon:result.weapon});
      await page.screenshot({path:'kontra-kek-wars/preview-realm-'+id+'-clear-v8.png',fullPage:true});
      if(id<3){
        await page.locator('[data-reward="'+(id===1?'coil':'pulse')+'"]').click();
        await page.screenshot({path:'kontra-kek-wars/preview-loadout-'+id+'-v8.png',fullPage:true});
        await page.locator('#start').click();const next=await read();assert.equal(next.mission,id+1);assert.equal(next.score,result.score);assert.equal(next.hp,5);assert.ok(next.upgrades.includes('coil'));
        if(id===2){assert.ok(next.weapons.includes('PULSE'));assert.equal(next.weapon,'PULSE');for(let i=0;i<next.weapons.length;i++)await page.keyboard.press('KeyQ');assert.equal((await read()).weapon,'PULSE');}
      }
    }
    const final=await read();assert.equal(final.mission,3);assert.match(await page.locator('#tag').textContent(),/CAMPAIGN COMPLETE/);
    await page.reload();assert.ok(Number((await page.locator('#best').textContent()).replace(/\D/g,''))>=final.score);
    await page.setViewportSize({width:390,height:844});await page.locator('[data-mission="3"]').click();
    const screen=await page.locator('.screen').boundingBox(),start=await page.locator('#start').boundingBox();assert.ok(start.y+start.height<=screen.y+screen.height);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:'kontra-kek-wars/preview-realm-select-phone-v8.png',fullPage:true});await page.locator('#start').click();assert.equal((await read()).mission,3);await page.locator('#restart').click();assert.equal((await read()).mission,3);
    assert.deepEqual(errors,[]);fs.writeFileSync('kontra-kek-wars/campaign-verification-v8.json',JSON.stringify({result:'PASS',results,checks:['three realms completed by keyboard inputs without state injection','realm-clear rewards and score carry','pulse weapon switching','boss phase warnings','pause freeze','fresh realm-three deploy and restart','phone deployment layout','best score persistence'],errors},null,2));console.log('THREE REALM CAMPAIGN PASS',JSON.stringify(results));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
