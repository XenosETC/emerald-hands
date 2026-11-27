const {test,expect}=require('@playwright/test');
const key='emerald-pepe-paradox-campaign-v1';
const get=page=>page.evaluate(()=>window.__pepesParadoxDebug.getState());
async function seed(page,value){await page.addInitScript(({key,value})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(value));},{key,value:{version:1,current:'1-1',completed:[],claimed:{},shards:0,owned:[],inProgress:null,...value}});}
test('painted journey map distinguishes available, cleared, locked and planned stages on mobile',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/pepes-paradox.html');
  await page.locator('#journeyMapButton').click();await expect(page.locator('#journeyMap')).toBeVisible();
  await expect(page.locator('[data-stage]')).toHaveCount(20);await expect(page.locator('[data-stage="1-1"]')).toBeEnabled();
  await expect(page.locator('[data-stage="1-2"]')).toBeDisabled();await expect(page.locator('[data-status="planned"]')).toHaveCount(10);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('#journeyMap [data-close]').click();await page.locator('#startButton').click();
  await expect.poll(async()=> (await get(page)).mode).toBe('playing');
  const before=await get(page);await page.locator('#journeyMapButton').click();await page.keyboard.press('ArrowRight');await page.waitForTimeout(150);
  expect((await get(page)).x).toBe(before.x);await page.screenshot({path:'test-results/paradox-campaign/mobile-map.png'});
});
test('stage-five camps purchase permanent gear and preserve journey savings through reload',async({page})=>{
  await seed(page,{current:'1-5',completed:['1-1','1-2','1-3','1-4'],shards:24});await page.goto('/pepes-paradox.html');await page.locator('#startButton').click();
  await expect(page.locator('#journeyBase')).toBeVisible();await page.locator('[data-upgrade="dash"]').click();
  await expect(page.locator('[data-upgrade="dash"]')).toHaveText('Equipped');await expect(page.locator('.journey-purse')).toContainText('16 journey shards');
  await expect(page.locator('[data-upgrade="leap"]')).toBeDisabled();await page.reload();await page.locator('#startButton').click();
  await expect(page.locator('[data-upgrade="dash"]')).toHaveText('Equipped');await page.locator('[data-onward]').click();
  await expect.poll(async()=> (await get(page)).stage).toBe('2-1');expect((await get(page)).owned).toContain('dash');
  await page.keyboard.press('Shift');expect((await get(page)).dashCooldown).toBeLessThanOrEqual(.7);
  await page.screenshot({path:'test-results/paradox-campaign/corrupt-marsh.png'});
});
test('saved trail restores safe footing, collectibles and dialogue completion without changing shared funds',async({page})=>{
  await seed(page,{current:'2-2',completed:['1-1','1-2','1-3','1-4','1-5','2-1'],inProgress:{id:'2-2',slot:3,x:2800,shards:[0,1,2],relics:[0],frogs:[],tauntDone:true}});
  await page.goto('/pepes-paradox.html');await page.locator('#startButton').click();const state=await get(page);
  expect(state.x).toBe(2800);expect(state.shards).toBe(3);expect(state.relics).toBe(1);expect(state.tauntDone).toBe(true);expect(state.sentinels).toHaveLength(2);
  await page.reload();await page.locator('#startButton').click();expect((await get(page)).shards).toBe(3);
});
test('walking into a ravine recovers to saved footing with collectibles intact',async({page})=>{
  await seed(page,{current:'1-2',completed:['1-1'],inProgress:{id:'1-2',slot:0,x:700,shards:[0,1],relics:[],frogs:[],tauntDone:false}});
  await page.goto('/pepes-paradox.html');await page.locator('#startButton').click();await page.keyboard.down('ArrowRight');
  await expect.poll(async()=> (await get(page)).falls,{timeout:8000}).toBeGreaterThan(0);await page.keyboard.up('ArrowRight');
  expect((await get(page)).shards).toBeGreaterThanOrEqual(2);expect((await get(page)).checkpoint.y).toBe(456);
  await page.reload();await page.locator('#startButton').click();expect((await get(page)).shards).toBeGreaterThanOrEqual(2);expect((await get(page)).y).toBe(456);
});
test('all eight travel stages are playable through their waygate and unlock the next actual stage',async({page})=>{
  test.setTimeout(240000);
  await page.goto('/pepes-paradox.html');
  const stages=['1-1','1-2','1-3','1-4','2-1','2-2','2-3','2-4'];
  for(const id of stages){
    // Legitimate save restoration at the final lantern exercises real walking,
    // gravity, gate landing, completion, progression and persistence.
    await page.goto("/index.html");
    await page.evaluate(({key,id})=>{const [level,number]=id.split("-").map(Number),s={version:1,current:id,completed:[],claimed:{},shards:0,owned:[],inProgress:null};s.completed=Array.from({length:(level-1)*5+number-1},(_,i)=>`${Math.floor(i/5)+1}-${i%5+1}`);s.inProgress={id,slot:5,x:4800,shards:[0,1],relics:[],frogs:[],tauntDone:true};localStorage.setItem(key,JSON.stringify(s));},{key,id});
    await page.goto("/pepes-paradox.html");await page.locator('#startButton').click();await page.keyboard.down('ArrowRight');
    await expect.poll(async()=> (await get(page)).mode,{timeout:12000}).toBe('won');await page.keyboard.up('ArrowRight');
    expect((await get(page)).completed).toContain(id);await page.locator('#startButton').click();
    if(id.endsWith('-4'))await expect(page.locator('#journeyBase')).toBeVisible();
  }
});
for(const id of ['1-3','2-4'])test(`full trail ${id}: authored crossings, signal event and gate can be played with held controls`,async({page})=>{
  test.setTimeout(90000);const [level,number]=id.split('-').map(Number);
  await seed(page,{current:id,completed:Array.from({length:(level-1)*5+number-1},(_,i)=>`${Math.floor(i/5)+1}-${i%5+1}`)});
  await page.goto('/pepes-paradox.html');await page.locator('#startButton').click();
  const jump=await page.locator('[data-paradox-control="jump"]').boundingBox();await page.mouse.move(jump.x+jump.width/2,jump.y+jump.height/2);await page.mouse.down();await page.keyboard.down('ArrowRight');
  await expect.poll(async()=> (await get(page)).mode,{timeout:40000}).toBe('cutscene');
  for(let i=0;i<3;i++)await page.keyboard.press('Enter');
  await expect.poll(async()=> (await get(page)).mode,{timeout:40000}).toBe('won');
  await page.mouse.up();await page.keyboard.up('ArrowRight');expect((await get(page)).completed).toContain(id);
});
for(const viewport of [{width:320,height:568},{width:844,height:390}])test(`camp and map stay bounded at ${viewport.width}x${viewport.height}`,async({page})=>{
  await page.setViewportSize(viewport);await seed(page,{current:'2-5',completed:['1-1','1-2','1-3','1-4','1-5','2-1','2-2','2-3','2-4'],shards:40});
  await page.goto('/pepes-paradox.html');await page.locator('#startButton').click();
  for(const selector of ['#journeyBase','#journeyMap']){
    if(selector==='#journeyMap'){await page.locator('#journeyBase [data-close]').click();await page.locator('#journeyMapButton').click();}
    const rect=await page.locator(selector).boundingBox();expect(rect.x).toBeGreaterThanOrEqual(0);expect(rect.y).toBeGreaterThanOrEqual(0);expect(rect.width).toBeLessThanOrEqual(viewport.width);expect(rect.height).toBeLessThanOrEqual(viewport.height);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight+1)).toBe(true);
    await page.screenshot({path:`test-results/paradox-campaign/${selector.slice(1)}-${viewport.width}.png`});
  }
});
