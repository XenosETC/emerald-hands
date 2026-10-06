const {chromium}=require('C:/Users/Phantom Assassin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=path.join(__dirname,'../docs');

(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1500,height:950}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const read=()=>page.evaluate(()=>window.feudalismDiagnostics());
  const ready=()=>page.waitForFunction(()=>window.feudalismDiagnostics?.().artLoaded);
  await page.goto('http://127.0.0.1:4173/pepe-feudalism/index.html');await ready();
  // Prepared campaign fixture only. All travel, menu changes and fighting below use real input.
  const state=(await read()).campaign;
  Object.assign(state,{location:'home',level:10,wins:18,gold:1000,upgrade:2,weapon:'sword',weapons:['sword','axe','spear'],armor:'leather',armors:['leather','jade','basalt'],shield:'oak',shields:['oak','jade','holy'],attributes:{STR:2,DEX:3,VIT:3,INT:4,WIS:6},army:['frogGuardian','frogGuardian','spearman','spearman','spearman','archer','archer','holyMage'],armyXp:Array(8).fill(2),armyOrigins:Array(8).fill('home'),inventory:['potion','potion'],quests:{}});
  await page.evaluate(s=>localStorage.setItem('pepe-feudalism-campaign-v1',JSON.stringify(s)),state);await page.reload();await ready();
  async function clickCanvas(x,y){const r=await page.locator('#game').boundingBox(),scale=Math.min(r.width/1200,r.height/640);await page.mouse.click(r.x+(r.width-1200*scale)/2+x*scale,r.y+(r.height-640*scale)/2+y*scale);}
  async function category(name){await page.getByRole('button',{name,exact:true}).click();}
  await category('Forge');
  const dagger=page.locator('[data-gear="weapon-dagger"]');
  assert.match(await dagger.innerText(),/48/);assert.match(await dagger.innerText(),/0.28s/);
  assert.equal(await dagger.locator('.gear-loss').count(),2);assert.equal(await dagger.locator('.gear-gain').count(),1);
  await dagger.screenshot({path:path.join(out,'armory-comparison.png')});
  await page.getByRole('button',{name:'Find Elderwood Grove',exact:true}).click();
  assert.equal((await read()).selected,'elderwood');
  assert.match(await page.locator('#panel-body').innerText(),/Frog Guardian Mace/);
  await page.getByRole('button',{name:'Travel to Elderwood Grove',exact:true}).click();
  await page.keyboard.press('i');
  const during=(await read()).travel;assert.ok(during);
  assert.equal(await page.getByRole('button',{name:'Equip Ashbreaker Axe',exact:true}).isDisabled(),true);
  await category('Armor');assert.equal(await page.getByRole('button',{name:'Equip Jade Lotus Armor',exact:true}).isDisabled(),true);
  await category('Shields');assert.equal(await page.getByRole('button',{name:'Equip Holy Sun Shield',exact:true}).isDisabled(),true);
  await page.waitForTimeout(100);assert.equal((await read()).travel.x,during.x);
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!window.feudalismDiagnostics().travel,null,{timeout:30000});
  await page.getByRole('button',{name:'Enter forest encounter',exact:true}).click();
  await page.keyboard.press('i');await category('Weapons');
  assert.equal(await page.getByRole('button',{name:'Equip Jade War Spear',exact:true}).isDisabled(),true);
  await page.keyboard.press('Escape');
  async function fight({observeStagger=false}={}) {
   const deadline=Date.now()+65000;let stagger=false;
   await page.keyboard.press('3');await page.keyboard.down(' ');
   while(Date.now()<deadline){
    const d=await read();if(!d.battle){await page.keyboard.up(' ');return {d,stagger};}
    if(d.battle.targets.some(t=>t.stagger>0)||d.battle.techniqueEffects.includes('STAGGER')){
     if(!stagger&&observeStagger)await page.screenshot({path:path.join(out,'mace-stagger-battle.png')});stagger=true;
    }
    const target=d.battle.targets.sort((a,b)=>Math.hypot(a.x-d.battle.hero.x,a.y-d.battle.hero.y)-Math.hypot(b.x-d.battle.hero.x,b.y-d.battle.hero.y))[0];
    if(target)await clickCanvas(target.x,target.y-50);
    else if(d.battle.mission?.type==='rescue'){const c=d.battle.mission.captives.find(c=>!c.freed);if(c){await clickCanvas(c.x,c.y);await page.keyboard.press('f');}}
    if(!observeStagger)await page.keyboard.press('q');await page.keyboard.press('e');
    if(d.battle.hero.hp<d.battle.hero.max-80)await page.keyboard.press('r');
    await page.waitForTimeout(observeStagger?70:180);
   }
   throw Error('Combat did not finish in time');
  }
  let result=await fight();assert.equal(result.d.report.won,true);assert.deepEqual(result.d.report.weaponLoot,['mace']);
  assert.equal(result.d.campaign.weapon,'sword');assert.match(result.d.campaign.history.at(-1).gear,/Frog Guardian Mace/);
  await page.screenshot({path:path.join(out,'regional-weapon-reward.png')});
  await page.getByRole('button',{name:'Inspect recovered equipment',exact:true}).click();assert.equal((await read()).scroll,'inventory');assert.equal(await page.locator('#battle-report').isVisible(),false);
  await page.getByRole('button',{name:'Equip Frog Guardian Mace',exact:true}).click();
  await category('Armor');await page.getByRole('button',{name:'Equip Jade Lotus Armor',exact:true}).click();await ready();
  await category('Weapons');await page.locator('#scroll-panel').evaluate(el=>el.scrollTop=0);
  await page.screenshot({path:path.join(out,'armory-desktop.png')});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await page.locator('#scroll-panel').evaluate(el=>el.scrollWidth<=el.clientWidth),true);
  await page.screenshot({path:path.join(out,'armory-mobile.png')});
  await page.setViewportSize({width:1500,height:950});await page.reload();await ready();
  assert.equal((await read()).campaign.weapon,'mace');assert.equal((await read()).crownArt.look,'worn-jade');
  await page.getByRole('button',{name:'Current destination',exact:true}).click();
  assert.ok(!(await page.locator('#panel-body').innerText()).includes('Regional weapon to recover'));
  await page.getByRole('button',{name:'Enter forest encounter',exact:true}).click();
  result=await fight({observeStagger:true});assert.equal(result.d.report.won,true);assert.equal(result.stagger,true);assert.deepEqual(result.d.report.weaponLoot,[]);
  assert.equal(result.d.campaign.weapons.filter(id=>id==='mace').length,1);
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'armory-adventure-verification.json'),JSON.stringify({result:'PASS',fixture:'Prepared level-10 campaign, funds, ownership and veteran army; real keyboard/mouse thereafter',checks:['attribute-aware comparisons','forge reward finder','real world travel','travel and battle equipment lock','Elderwood weapon recovery','chronicle record','manual equip','mobile panel fit','saved gear and worn sprite','real mace stagger','repeat victory has no duplicate weapon'],errors},null,2));
  console.log('ARMORY ADVENTURE QA PASS');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
