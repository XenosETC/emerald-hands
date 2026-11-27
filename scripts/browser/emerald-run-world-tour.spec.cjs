const {test,expect}=require('@playwright/test');
async function setup(page,width){
  await page.setViewportSize({width,height:900});
  await page.route('https://api.coingecko.com/**',r=>r.fulfill({json:{prices:Array.from({length:96},()=>[0,20])}}));
  await page.goto('/pepecoin-run.html');await page.getByRole('button',{name:'Start Run',exact:true}).click();
}
async function enter(page,x){
  await page.evaluate(x=>{state.distance=x-player.x;buildCourse();hazards.length=0;statues.length=0;crowns.length=0;rushStatues.length=0;player.y=terrainAt(x)-player.radius;player.vy=0;player.grounded=true;},x);
}
for(const width of [390,1440]){
  test(`all twelve generated worlds render, pause and retry at ${width}px`,async({page},info)=>{
    const errors=[];page.on('pageerror',e=>errors.push(e.message));await setup(page,width);
    const worlds=await page.evaluate(()=>route.odyssey.worlds);
    for(const [index,world] of worlds.entries()){
      await enter(page,world.start+1);
      await expect(page.locator('#routeTitle')).toContainText(world.name.toUpperCase());
      await expect.poll(()=>page.evaluate(()=>worldTour.snapshot().shown)).toBe(index);
      await expect.poll(()=>page.evaluate(()=>worldTour.snapshot().blend)).toBe(1);
      const rendered=await page.evaluate(()=>({cache:worldTour.snapshot().cached,images:worldTour.layers().map(l=>({src:l.image.src,width:l.image.naturalWidth}))}));
      expect(rendered.cache).toBeLessThanOrEqual(4);expect(rendered.images).toHaveLength(1);expect(rendered.images[0].src).toContain(world.asset);expect(rendered.images[0].width).toBeGreaterThan(0);
      if([0,2,8,10,11].includes(index))await page.screenshot({path:info.outputPath(world.id+'.png')});
    }
    await page.getByRole('button',{name:/Jump/}).click();await expect.poll(()=>page.evaluate(()=>player.grounded)).toBe(false);
    await page.evaluate(()=>window.EmeraldArcade.setPaused(true));const before=await page.evaluate(()=>JSON.stringify([worldTour.snapshot(),state.distance]));await page.waitForTimeout(150);expect(await page.evaluate(()=>JSON.stringify([worldTour.snapshot(),state.distance]))).toBe(before);
    await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>window.EmeraldArcade.setPaused(false));
    await enter(page,151201);await expect(page.locator('#routeTitle')).toContainText('BEYOND ALL WORLDS');
    await page.evaluate(()=>hazards.push({x:state.distance+player.x+5,width:50,height:70,hit:false}));
    await expect(page.getByRole('button',{name:'Retry Same Road'})).toBeVisible();await expect(page.locator('#resultRoute')).toContainText('Grand tour complete');
    await page.getByRole('button',{name:'Retry Same Road'}).click();expect(await page.evaluate(()=>worldTour.snapshot().cached)).toBe(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
  });
  test(`world previews fit inside game info at ${width}px`,async({page},info)=>{
    await setup(page,width);await page.getByRole('button',{name:'Game info',exact:true}).click();
    await page.locator('#worldTourGallery summary').click();await expect(page.locator('#worldTourGallery img')).toHaveCount(12);
    const last=page.locator('#worldTourGallery figure').last();await last.scrollIntoViewIfNeeded();
    await expect.poll(()=>last.locator('img').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
    await page.screenshot({path:info.outputPath('world-preview-gallery.png')});
    await page.getByRole('button',{name:'Done',exact:true}).click();await expect(page.locator('#canvasGameInfo')).not.toBeVisible();
    await expect.poll(()=>page.evaluate(()=>window.EmeraldArcade.isPaused())).toBe(false);
  });
}

test('a missing next-world asset retains the previous sky and a playable road',async({page})=>{
  await page.route('**/worlds-v1/time-space-v1.webp',r=>r.abort());await setup(page,390);
  await enter(page,109201);await expect.poll(()=>page.evaluate(()=>worldTour.snapshot().shown)).toBe(7);await expect.poll(()=>page.evaluate(()=>worldTour.snapshot().blend)).toBe(1);
  await enter(page,117601);await page.waitForTimeout(700);
  expect(await page.evaluate(()=>worldTour.snapshot().shown)).toBe(7);expect(await page.evaluate(()=>worldTour.layers()[0].image.naturalWidth)).toBeGreaterThan(0);
  await page.getByRole('button',{name:/Jump/}).click();await expect.poll(()=>page.evaluate(()=>player.grounded)).toBe(false);
  expect(await page.evaluate(()=>state.mode)).toBe('running');
});
