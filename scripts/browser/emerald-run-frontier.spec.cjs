const {test,expect}=require('@playwright/test');
for(const width of [390,1440]) {
  test(`Corrupt and volcanic frontiers, animated motes and retry at ${width}px`,async({page},info)=>{
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.setViewportSize({width,height:900});
    await page.route('https://api.coingecko.com/**',r=>r.fulfill({json:{prices:Array.from({length:96},()=>[0,20])}}));
    await page.goto('/pepecoin-run.html');
    await page.waitForFunction(()=>[corruptWorldImage,volcanicWorldImage].every(image=>image.complete&&image.naturalWidth));
    await page.getByRole('button',{name:'Start Run',exact:true}).click();
    async function enter(x){await page.evaluate(x=>{state.distance=x-player.x;buildCourse();hazards.length=0;statues.length=0;crowns.length=0;rushStatues.length=0;player.y=terrainAt(x)-player.radius;player.vy=0;player.grounded=true;},x);}
    await enter(33601);await expect(page.locator('#routeTitle')).toContainText('CORRUPT FRONTIER');
    await expect.poll(()=>page.evaluate(()=>state.corruptWorldBlend)).toBeGreaterThan(.8);
    await page.evaluate(()=>collectStatue({collected:false},player.x,player.y));
    await expect(page.locator('#cosmicTitle')).toContainText('COSMIC');
    await page.screenshot({path:info.outputPath('corrupt-frontier-disco.png')});
    await page.evaluate(()=>window.EmeraldArcade.setPaused(true));
    const frozen=await page.evaluate(()=>[state.distance,state.cosmicTime,state.corruptWorldBlend]);await page.waitForTimeout(180);
    expect(await page.evaluate(()=>[state.distance,state.cosmicTime,state.corruptWorldBlend])).toEqual(frozen);
    await page.evaluate(()=>{window.EmeraldArcade.setPaused(false);state.cosmicTime=0;state.boost=0;});
    await enter(42001);await expect(page.locator('#routeTitle')).toContainText('VOLCANIC FORGE');
    await expect.poll(()=>page.evaluate(()=>state.volcanicWorldBlend)).toBeGreaterThan(.8);
    await page.screenshot({path:info.outputPath('volcanic-frontier.png')});
    await page.emulateMedia({reducedMotion:'reduce'});
    await enter(50401);await expect(page.locator('#routeTitle')).toContainText('JADE CANOPY');
    await page.evaluate(()=>hazards.push({x:state.distance+player.x+5,width:50,height:70,hit:false}));
    await expect(page.getByRole('button',{name:'Retry Same Road'})).toBeVisible();
    await expect(page.locator('#resultRoute')).toContainText('Frontier complete');
    await page.getByRole('button',{name:'Retry Same Road'}).click();
    expect(await page.evaluate(()=>state.corruptWorldBlend+state.volcanicWorldBlend)).toBe(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
  });
}
