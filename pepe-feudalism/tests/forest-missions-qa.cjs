const {chromium}=require('C:/Users/Phantom Assassin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=path.join(__dirname,'../docs');

(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:950}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const read=()=>page.evaluate(()=>window.feudalismDiagnostics());
  const ready=()=>page.waitForFunction(()=>window.feudalismDiagnostics?.().artLoaded);
  await page.goto('http://127.0.0.1:4173/pepe-feudalism/index.html');await ready();
  // Preparation only: isolated campaign, no writes to live battle or calls to game actions.
  const s=(await read()).campaign;
  Object.assign(s,{location:'elderwood',level:10,wins:18,gold:1000,upgrade:2,weapon:'sword',weapons:['sword'],armor:'leather',armors:['leather'],shield:'oak',shields:['oak'],attributes:{STR:2,DEX:3,VIT:3,INT:4,WIS:6},army:['frogGuardian','frogGuardian','spearman','spearman','archer','archer','holyMage'],armyXp:Array(7).fill(2),armyOrigins:Array(7).fill('home'),inventory:['potion','potion'],quests:{elder:'active',ashveil:'active'}});
  await page.evaluate(s=>localStorage.setItem('pepe-feudalism-campaign-v1',JSON.stringify(s)),s);await page.reload();await ready();
  async function click(x,y){const r=await page.locator('#game').boundingBox(),scale=Math.min(r.width/1200,r.height/640);await page.mouse.click(r.x+(r.width-1200*scale)/2+x*scale,r.y+(r.height-640*scale)/2+y*scale);}
  async function travel(id){await page.getByRole('button',{name:'Overview',exact:true}).click();const d=await read(),n=d.nodes.find(n=>n.id===id);await click((n.x-d.camera.x)*d.camera.zoom+600,(n.y-d.camera.y)*d.camera.zoom+320);await page.getByRole('button',{name:`Travel to ${n.name}`,exact:true}).click();await page.waitForFunction(id=>{const d=window.feudalismDiagnostics();return !d.travel&&d.campaign.location===id},id,{timeout:30000});}
  async function fight({stopAtCages=false}={}){
   await page.keyboard.press('3');await page.keyboard.down(' ');const until=Date.now()+60000;
   while(Date.now()<until){const d=await read();if(!d.battle||stopAtCages&&!d.battle.targets.length){await page.keyboard.up(' ');return d;}
    const targets=d.battle.targets.sort((a,b)=>Number(!!b.structure)-Number(!!a.structure)||Math.hypot(a.x-d.battle.hero.x,a.y-d.battle.hero.y)-Math.hypot(b.x-d.battle.hero.x,b.y-d.battle.hero.y));
    if(targets[0])await click(targets[0].x,targets[0].y-50);await page.keyboard.press('q');await page.keyboard.press('e');
    if(d.battle.hero.hp<d.battle.hero.max-80)await page.keyboard.press('r');await page.waitForTimeout(150);
   }
   throw Error('Forest battle timed out');
  }
  await page.getByRole('button',{name:'Current destination',exact:true}).click();
  assert.match(await page.locator('#panel-body').innerText(),/The trapped herbalists/);
  await page.getByRole('button',{name:'Enter forest encounter',exact:true}).click();
  await page.keyboard.press('f');assert.equal((await read()).battle.missionProgress.completed,0);
  await page.screenshot({path:path.join(out,'elderwood-captive-cages.png')});
  let d=await fight({stopAtCages:true});assert.equal(d.report,null);assert.equal(d.campaign.quests.elder,'active');
  assert.equal(d.battle.missionProgress.complete,false);
  const cages=d.battle.mission.captives;
  for(const [i,c]of cages.entries()){
   await click(c.x,c.y);await page.waitForFunction(c=>{const b=window.feudalismDiagnostics().battle;return Math.hypot(b.hero.x-c.x,b.hero.y-c.y)<75},c);
   if(i===0){await page.keyboard.press('p');const frozen=(await read()).battle.time;await page.keyboard.press('f');await page.waitForTimeout(150);assert.equal((await read()).battle.missionProgress.completed,0);assert.equal((await read()).battle.time,frozen);await page.keyboard.press('p');}
   await page.keyboard.press('f');
   if(i===0){d=await read();assert.equal(d.battle.missionProgress.completed,1);assert.equal(d.campaign.quests.elder,'active');await page.screenshot({path:path.join(out,'elderwood-first-rescue.png')});}
  }
  await page.waitForFunction(()=>window.feudalismDiagnostics().report?.won);d=await read();
  assert.match(d.campaign.journal,/Elderwood Grove! \+115 gold/);assert.equal(d.report.gold,115);assert.equal(d.report.mission.bonus,30);assert.equal(d.campaign.quests.elder,'ready');assert.deepEqual(d.report.weaponLoot,['mace']);
  await page.screenshot({path:path.join(out,'elderwood-rescue-report.png')});
  await page.reload();await ready();assert.equal((await read()).campaign.history.at(-1).objective,'2/2 herbalists rescued');
  await travel('mossford');await page.getByRole('button',{name:'Enter Mossford',exact:true}).click();await page.getByRole('button',{name:'Open quest board',exact:true}).click();
  await page.getByRole('button',{name:'Claim 65 gold',exact:true}).click();assert.equal((await read()).campaign.quests.elder,'completed');await page.keyboard.press('Escape');await page.keyboard.press('m');
  await travel('ashgrove');assert.match(await page.locator('#panel-body').innerText(),/Two totems, 120 health each/);
  await page.getByRole('button',{name:'Enter forest encounter',exact:true}).click();
  const ward=(await read()).battle.targets.find(t=>t.structure);assert.ok(ward);
  await click(ward.x,ward.y-50);assert.equal((await read()).battle.targetId,ward.id);
  await page.keyboard.press('p');const pause=(await read()).battle;await page.waitForTimeout(200);
  assert.equal((await read()).battle.targets.find(t=>t.id===ward.id).pulseCd,pause.targets.find(t=>t.id===ward.id).pulseCd);
  await page.screenshot({path:path.join(out,'ashveil-totem-target.png')});
  await page.keyboard.press('i');await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:path.join(out,'forest-mission-mobile.png')});await page.setViewportSize({width:1500,height:950});await page.keyboard.press('Escape');
  await page.keyboard.press('p');
  await page.waitForFunction(()=>window.feudalismDiagnostics().battle?.wardPulses>0,null,{timeout:7000});
  await page.screenshot({path:path.join(out,'ashveil-emberheart-totems.png')});
  d=await fight();assert.equal(d.report.won,true);assert.match(d.campaign.journal,/Ashveil Grove! \+130 gold/);assert.equal(d.report.gold,130);assert.equal(d.report.mission.completed,2);assert.equal(d.report.mission.bonus,45);
  assert.equal(d.campaign.quests.ashveil,'ready');assert.deepEqual(d.report.weaponLoot,['axe']);
  await page.screenshot({path:path.join(out,'ashveil-purge-report.png')});
  await page.reload();await ready();d=await read();assert.equal(d.campaign.history.at(-1).objective,'2/2 Emberheart Totems destroyed');assert.equal(d.campaign.quests.elder,'completed');assert.equal(d.campaign.quests.ashveil,'ready');
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'forest-missions-verification.json'),JSON.stringify({result:'PASS',fixture:'Prepared level-10 campaign, seven seasoned soldiers and two active contracts; real mouse and keyboard for combat, rescues, travel and claim',checks:['scouting objective details','no distant rescue','all-raiders-dead rescue gate','pause blocks rescue and time','two distinct cage interactions','rescue victory and 30 bonus gold','regional mace recovery','return to Mossford and claim','actual road travel to Ashveil','click-targetable totems','paused healing cooldown','live healing pulse','purge victory and 45 bonus gold','regional axe recovery','quest and chronicle persistence'],history:d.campaign.history,errors},null,2));
  console.log('FOREST MISSIONS QA PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
