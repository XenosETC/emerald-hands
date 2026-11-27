const {test,expect}=require('@playwright/test');
const emotes=[['rocket','Rocket Meltdown'],['berserk','Berserk Pepe'],['smug','Royal Smug'],['tears','Busted Pepe']];

test('fresh host and guest can send all four emotes and see each other, including after folding',async({browser,page:host,baseURL})=>{
  await host.setViewportSize({width:1440,height:900});
  const guestContext=await browser.newContext({baseURL,viewport:{width:390,height:844},hasTouch:true});
  const errors=[];host.on('pageerror',e=>errors.push(e.message));
  try {
    await host.goto('/pepe-poker/index.html');await host.getByLabel('Screen name').fill('Fresh host');
    await host.getByRole('button',{name:'Create table',exact:true}).click();
    const guest=await guestContext.newPage();guest.on('pageerror',e=>errors.push(e.message));
    await guest.goto(host.url());await guest.getByLabel('Screen name').fill('Fresh guest');
    await guest.getByRole('button',{name:'Join table',exact:true}).click();
    for(const sender of [host,guest]) {
      const other=sender===host?guest:host;
      for(const [id,label] of emotes) {
        await sender.getByRole('button',{name:'Emotes',exact:true}).click();
        const picker=sender.getByRole('dialog',{name:'Pepe emotes',exact:true});
        await expect(picker.getByRole('button',{name:/Rocket Meltdown|Berserk Pepe|Royal Smug|Busted Pepe/})).toHaveCount(4);
        await expect(picker).toContainText('No unlocks or chips required');
        const button=picker.getByRole('button',{name:label,exact:true});
        await expect(button).toBeEnabled();
        await expect(button.locator('img')).toHaveJSProperty('naturalWidth',192);
        await button.click();await expect(picker).toBeHidden();
        await expect(sender.getByRole('button',{name:'Emotes',exact:true})).toBeFocused();
        await sender.getByRole('button',{name:'Emotes',exact:true}).click();
        await expect(button).toBeDisabled();
        await expect(sender.locator('#emote-status')).toContainText('moment');
        await expect(other.locator('.seat:not(.your-seat) .seat-reaction')).toHaveAttribute('src','./reactions/'+id+'.webp');
        await expect(button).toBeEnabled();
        await picker.getByRole('button',{name:'Done',exact:true}).click();
      }
    }
    await host.getByRole('button',{name:'Deal hand',exact:true}).click();
    await host.getByRole('button',{name:'Fold',exact:true}).click();
    await host.getByRole('button',{name:'Emotes',exact:true}).click();
    await host.getByRole('dialog',{name:'Pepe emotes',exact:true}).getByRole('button',{name:'Royal Smug',exact:true}).click();
    await expect(guest.locator('.seat:not(.your-seat) .seat-reaction')).toHaveAttribute('src','./reactions/smug.webp');
    expect(errors).toEqual([]);
  } finally {await guestContext.close();}
});

for(const size of [{width:320,height:568},{width:844,height:390}]) {
  test(`practice emotes fit, recover from errors and return focus at ${size.width}×${size.height}`,async({page})=>{
    await page.setViewportSize(size);const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('/pepe-poker/index.html');await page.getByLabel('Screen name').fill('Fresh practice');
    await page.locator('#practice').click();await page.getByRole('button',{name:'Emotes',exact:true}).click();
    const picker=page.getByRole('dialog',{name:'Pepe emotes',exact:true});
    const box=await picker.boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x+box.width).toBeLessThanOrEqual(size.width);expect(box.y+box.height).toBeLessThanOrEqual(size.height);
    await page.route('**/api/pepe-poker/*/react',route=>route.fulfill({status:503,json:{error:'Fixture network interruption'}}));
    await picker.getByRole('button',{name:'Busted Pepe',exact:true}).click();
    await expect(picker).toBeVisible();await expect(page.locator('#emote-status')).toHaveText('Fixture network interruption');
    await expect(picker.getByRole('button',{name:'Busted Pepe',exact:true})).toBeEnabled();
    await page.unroute('**/api/pepe-poker/*/react');
    await picker.getByRole('button',{name:'Busted Pepe',exact:true}).click();await expect(picker).toBeHidden();
    await expect(page.locator('#notice')).toBeEmpty();
    await expect(page.locator('.your-seat .seat-reaction')).toHaveAttribute('src','./reactions/tears.webp');
    await page.getByRole('button',{name:'Emotes',exact:true}).click();await page.keyboard.press('Escape');
    await expect(picker).toBeHidden();await expect(page.getByRole('button',{name:'Emotes',exact:true})).toBeFocused();
    expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
