const {test,expect}=require('@playwright/test');
const sizes=[{width:320,height:568},{width:390,height:844},{width:844,height:390},{width:1440,height:900}];
for(const size of sizes){
 test(`Hands all business purchases remain reachable at ${size.width}×${size.height}`,async({page},testInfo)=>{
  await page.setViewportSize(size);
  await page.addInitScript(()=>localStorage.setItem('emerald-hands-v1',JSON.stringify({version:1,shards:1e8,totalEarned:1e8,levels:{},ogPoints:0,lifetimePrestiges:0,history:[],lastSaved:Date.now()})));
  await page.goto('/emerald-hands.html');
  await page.locator('.strategy-screen-tools').getByRole('button',{name:'Upgrades',exact:true}).click();
  await page.screenshot({path:testInfo.outputPath('hands-shop.png')});
  await page.locator('.strategy-shop-shortcuts').getByRole('button',{name:'Market Building',exact:true}).click();
  await expect(page.locator('[data-buy="market"]')).toBeFocused();
  for(const id of ['click','infra','business','vault','media','acquisition','research','market']){
   const button=page.locator(`[data-buy="${id}"]`);await button.scrollIntoViewIfNeeded();
   const bounds=await button.boundingBox();
   await expect(page.locator('.strategy-purchase-context')).toBeInViewport();
   await expect(button).toBeEnabled();await button.click();
   await expect(button).toContainText('Lv 1');
   expect(bounds.x+bounds.width).toBeLessThanOrEqual(size.width);
  }
  expect(await page.locator('.strategy-panel-content').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  expect(await page.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('emerald-hands-v1')).levels))).toEqual(Array(8).fill(1));
  await page.locator('[data-strategy-close]').click();
  await expect(page.locator('#shardButton')).toBeInViewport();
 });
 test(`Satoshi build purchases and next action stay usable at ${size.width}×${size.height}`,async({page},testInfo)=>{
  await page.setViewportSize(size);
  await page.goto('/satoshi-system.html');
  await page.addInitScript(()=>{
   if(sessionStorage.getItem('idle-screen-funded'))return;
   const saved=JSON.parse(localStorage.getItem('satoshi-system-save-v1'));
   saved.treasury=100000; saved.circulation=saved.globalIssued-saved.treasury;
   localStorage.setItem('satoshi-system-save-v1',JSON.stringify(saved));
   sessionStorage.setItem('idle-screen-funded','1');
  });
  await page.reload();
  await expect(page.locator('.strategy-next-step')).toBeInViewport();
  await page.screenshot({path:testInfo.outputPath('satoshi-screen.png')});
  await page.locator('.strategy-next-step').click();
  await expect(page.locator('.strategy-build-guidance')).toContainText(/Relay|world/i);
  for(const key of ['routing','relay','merchant','resilience','expansion','forge']){
   const button=page.locator(`[data-buy="${key}"]`);
   await button.scrollIntoViewIfNeeded();await expect(button).toBeEnabled();await button.click();
   await expect(page.locator('.strategy-purchase-context')).toBeInViewport();
  }
  expect(await page.evaluate(()=>window.__satoshiSystemDebug.invariantHolds())).toBe(true);
  expect(await page.locator('.strategy-panel-content').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  await page.locator('[data-strategy-close]').click();
  await expect(page.locator('#genesisStar')).toBeInViewport();
  await page.reload();
  const state=await page.evaluate(()=>window.__satoshiSystemDebug.snapshot());
  expect(state.worlds.forge).toBe(1);expect(state.expansion).toBe(true);expect(state.routing).toBe(1);
 });
}
