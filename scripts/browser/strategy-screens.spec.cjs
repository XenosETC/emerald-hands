const {test,expect}=require('@playwright/test');
const games=[
 ['emerald-hands','hands','#shardButton','Upgrades'],
 ['satoshi-system','satoshi','#genesisStar','Build'],
 ['pepe-tower-defense','tower','#startButton','How to play'],
 ['pepe-wars','wars','#startButton','Battle info'],
 ['etc-rocket-simulator','rocket','#launchButton','Hangar'],
];
const sizes=[{width:320,height:568},{width:390,height:844},{width:844,height:390},{width:1440,height:900}];
async function onScreen(page,selector){const box=await page.locator(selector).boundingBox();expect(box).not.toBeNull();const viewport=page.viewportSize();expect(box.x).toBeGreaterThanOrEqual(-1);expect(box.y).toBeGreaterThanOrEqual(-1);expect(box.x+box.width).toBeLessThanOrEqual(viewport.width+1);expect(box.y+box.height).toBeLessThanOrEqual(viewport.height+1);expect(box.width).toBeGreaterThan(20);expect(box.height).toBeGreaterThan(20);}
for(const [file,kind,primary,panel]of games)for(const size of sizes){
 test(`${kind} screen fits and keeps actions usable at ${size.width}×${size.height}`,async({page})=>{
  await page.setViewportSize(size);const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('/'+file+'.html');
  expect(await page.evaluate(()=>({width:document.documentElement.scrollWidth<=innerWidth,height:document.documentElement.scrollHeight<=innerHeight,scroll:scrollY}))).toEqual({width:true,height:true,scroll:0});
  await onScreen(page,primary);await onScreen(page,'.strategy-screen-tools');
  if(kind==='hands'){
   for(let i=0;i<16;i++)await page.locator(primary).click();
   expect(Number((await page.locator('#shardCount').textContent()).replace(/,/g,''))).toBeGreaterThanOrEqual(16);
  }
  if(kind==='satoshi'){
   for(let i=0;i<8;i++)await page.locator(primary).click();
   await expect(page.locator('#treasuryBalance')).toHaveText('64');
  }
  const opener=page.locator('.strategy-screen-tools').getByRole('button',{name:panel,exact:true});await opener.click();
  const details=page.locator('.strategy-details');await expect(details).toBeVisible();await onScreen(page,'.strategy-details');
  if(kind==='hands'){
   await details.locator('[data-buy="click"]').click();await expect(details.locator('[data-buy="click"]')).toContainText('Lv 1');
  }
  if(kind==='satoshi'){
   await details.locator('[data-buy="routing"]').click();await expect(page.locator('[data-level-chip="routing"]')).toHaveText('Level 1 / 25');
  }
  if(kind==='rocket'){
   await details.locator('[data-upgrade="engine"]').click();await expect(page.locator('#shardBalance')).toHaveText('90');
  }
  await details.locator('[data-strategy-close]').click();await expect(opener).toBeFocused();
  if(kind==='wars'){
   await page.locator('#startButton').click();await expect(page.locator('#gameOverlay')).toBeHidden();await page.locator('[data-unit="miner"]').click();await expect(page.locator('#shardLabel')).not.toHaveText('120');await page.locator('[data-stance="hold"]').click();await expect(page.locator('[data-stance="hold"]')).toHaveClass(/is-selected/);await onScreen(page,'[data-stance="defend"]');
  }
  if(kind==='tower'){
   await page.locator('#startButton').click();await expect(page.locator('#gameOverlay')).toBeHidden();await onScreen(page,'canvas');await onScreen(page,'#waveButton');await page.locator('[data-pad="0"]').click();await expect(page.locator('#shardLabel')).toHaveText('105');await page.locator('#waveButton').click();await expect(page.locator('#waveButton')).not.toHaveText('Start Wave');
  }
  if(kind==='rocket'){
   await page.locator('#launchButton').click();await expect(page.locator('#distanceLabel')).not.toHaveText('0 km');await onScreen(page,'canvas');
  }
  if(['hands','satoshi'].includes(kind)){
   await page.reload();if(kind==='hands')expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('emerald-hands-v1')).levels.click)).toBe(1);else await expect(page.locator('#perClickStat')).toHaveText('10');
  }
  expect(errors).toEqual([]);
 });
}
