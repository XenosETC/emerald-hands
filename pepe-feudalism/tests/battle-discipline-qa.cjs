const {chromium}=require('C:/Users/Phantom Assassin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=path.join(__dirname,'../docs');

(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1500,height:950}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const read=()=>page.evaluate(()=>window.feudalismDiagnostics());
  await page.goto('http://127.0.0.1:4173/pepe-feudalism/index.html');await page.waitForFunction(()=>window.feudalismDiagnostics?.().artLoaded);
  const seed=(await read()).campaign;
  Object.assign(seed,{location:'keep',owned:['home','outpost'],level:10,wins:18,upgrade:2,weapon:'spear',weapons:['sword','spear'],armor:'jade',armors:['jade'],shield:'holy',shields:['holy'],attributes:{STR:2,DEX:0,VIT:6,INT:4,WIS:6},army:[...Array(12).fill('spearman'),...Array.from({length:24},(_,i)=>['holyKnight','archer','frogGuardian','holyMage'][i%4])],armyXp:[...Array(12).fill(0),...Array(24).fill(1)],armyOrigins:Array(36).fill('home')});
  // Fixture is campaign preparation only; battle orders, movement, attacks and casualties use real input.
  await page.evaluate(s=>localStorage.setItem('pepe-feudalism-campaign-v1',JSON.stringify(s)),seed);await page.reload();await page.waitForFunction(()=>window.feudalismDiagnostics?.().artLoaded);
  await page.getByRole('button',{name:'Current destination',exact:true}).click();await page.getByRole('button',{name:'Attack Ashfang Keep',exact:true}).click();
  let d=await read();assert.equal(d.battle.reserves,24);assert.equal(d.battle.enemyReserves,13);
  const posts=new Map(d.battle.allies.map(u=>[u.id,u.post])),positions=new Map(d.battle.allies.map(u=>[u.id,{x:u.x,y:u.y}]));
  await page.waitForTimeout(200);d=await read();
  for(const unit of d.battle.allies)assert.ok(Math.hypot(unit.x-positions.get(unit.id).x,unit.y-positions.get(unit.id).y)<.1);
  await page.screenshot({path:path.join(out,'disciplined-opening.png')});
  await page.keyboard.press('1');await page.keyboard.down('a');await page.waitForTimeout(100);await page.keyboard.up('a');
  assert.equal((await read()).battle.follow.facing,1);
  await page.keyboard.down('a');await page.waitForFunction(()=>window.feudalismDiagnostics().battle.follow.facing===-1);await page.keyboard.up('a');
  await page.screenshot({path:path.join(out,'disciplined-follow-turn.png')});
  await page.keyboard.down('d');await page.waitForFunction(()=>window.feudalismDiagnostics().battle.hero.x>330);await page.keyboard.up('d');
  assert.equal((await read()).battle.follow.facing,1);
  await page.keyboard.press('2');const held=(await read()).battle.hold;
  await page.keyboard.down('s');await page.waitForTimeout(200);await page.keyboard.up('s');assert.deepEqual((await read()).battle.hold,held);
  await page.keyboard.press('3');
  const deadline=Date.now()+45000;let reinforced=false;
  while(Date.now()<deadline){
   d=await read();assert.ok(d.battle,'Battle ended before a reserve entered');
   for(const unit of d.battle.allies){if(posts.has(unit.id))assert.equal(unit.post,posts.get(unit.id));}
   const alive=d.battle.allies.filter(u=>u.hp>0);assert.equal(new Set(alive.map(u=>u.post)).size,alive.length);
   if(d.battle.reserves<24){reinforced=true;break;}
   await page.waitForTimeout(100);
  }
  assert.ok(reinforced,'No battle casualty triggered a reinforcement');
  const newcomer=d.battle.allies.find(u=>!posts.has(u.id));assert.ok(newcomer);
  const deadPosts=d.battle.allies.filter(u=>u.hp<=0).map(u=>u.post);assert.ok(deadPosts.includes(newcomer.post));
  await page.screenshot({path:path.join(out,'disciplined-reinforcement.png')});
  await page.keyboard.press('p');const frozen=(await read()).battle;await page.waitForTimeout(200);
  assert.equal((await read()).battle.time,frozen.time);assert.deepEqual((await read()).battle.allies,frozen.allies);await page.keyboard.press('p');
  async function clickTarget(t){const r=await page.locator('#game').boundingBox(),scale=Math.min(r.width/1200,r.height/640);await page.mouse.click(r.x+(r.width-1200*scale)/2+t.x*scale,r.y+(r.height-640*scale)/2+(t.y-50)*scale);}
  await page.keyboard.down(' ');let crownHit=false;const hitDeadline=Date.now()+18000;
  while(Date.now()<hitDeadline){d=await read();if(!d.battle)break;
   if(d.battle.damageNumbers.some(e=>e.source==='crown')){crownHit=true;await page.screenshot({path:path.join(out,'disciplined-combat-feedback.png')});break;}
   const target=d.battle.targets.sort((a,b)=>Math.hypot(a.x-d.battle.hero.x,a.y-d.battle.hero.y)-Math.hypot(b.x-d.battle.hero.x,b.y-d.battle.hero.y))[0];
   if(target)await clickTarget(target);await page.keyboard.press('e');await page.waitForTimeout(80);
  }
  await page.keyboard.up(' ');assert.ok(crownHit);
  await page.keyboard.press('4');assert.equal((await read()).battle.order,'retreat');
  await page.getByRole('button',{name:'Withdraw',exact:true}).click();
  d=await read();assert.equal(d.report.won,false);assert.ok(d.report.losses>0);assert.ok(d.campaign.army.length<36);
  await page.reload();await page.waitForFunction(()=>window.feudalismDiagnostics?.().artLoaded);assert.equal((await read()).campaign.army.length,d.campaign.army.length);
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'battle-discipline-verification.json'),JSON.stringify({result:'PASS',fixture:'36 soldiers, prepared level-10 Crown and equipment; real input for all battle behavior',checks:['opening troops stand still','follow tolerates small turn','follow turns after sustained movement','hold anchor stays fixed','survivors retain posts','reserve fills casualty vacancy','unique living posts','pause freezes simulation','Crown damage appears distinctly','retreat order','casualties persist after withdrawal and reload'],losses:d.report.losses,remaining:d.campaign.army.length,errors},null,2));
  console.log('BATTLE DISCIPLINE QA PASS');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
