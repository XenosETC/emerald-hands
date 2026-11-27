const { test, expect } = require('@playwright/test');

for (const viewport of [{width:320,height:568},{width:390,height:844},{width:1440,height:900}]) {
  test(`Poker commitment preview, invalid draft polling and new decision at ${viewport.width}px`, async ({page,browser,baseURL}) => {
    await page.setViewportSize(viewport);
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('/pepe-poker/index.html');
    await page.getByLabel('Screen name').fill('Host clarity');
    await page.getByRole('button',{name:'Create table',exact:true}).click();
    const guestContext=await browser.newContext({baseURL,viewport});
    try {
    const guest=await guestContext.newPage();await guest.goto(page.url());
    await guest.getByLabel('Screen name').fill('Guest clarity');
    await guest.getByRole('button',{name:'Join table',exact:true}).click();
    await page.getByRole('button',{name:'Deal hand',exact:true}).click();
    const amount=page.locator('#amount'),raise=page.locator('#raise'),preview=page.locator('#raise-preview');
    await expect(raise).toHaveText('Raise to 40');
    await expect(preview).toHaveText('Raise to 40 total · 30 chips added · 1,960 behind');
    if(viewport.width<651) expect(await page.locator('#raise-sizing').evaluate(el=>el.open)).toBe(false);
    await expect(preview).toBeVisible();
    await page.locator('#raise-sizing').evaluate(el=>{el.open=true;});
    for(const bad of ['', '1.5', '39', '2001']) {
      await amount.fill(bad);
      await expect(raise).toBeDisabled();await expect(page.locator('#call')).toBeEnabled();await expect(page.locator('#fold')).toBeEnabled();
      await expect(amount).toHaveAttribute('aria-invalid','true');
      // Both focused and blurred drafts must survive actual room polling.
      await page.waitForTimeout(1000);await expect(amount).toHaveValue(bad);
      await page.locator('#fold').focus();await page.waitForTimeout(1000);
      await expect(amount).toHaveValue(bad);await expect(raise).toBeDisabled();
    }
    await page.getByRole('button',{name:'Set all-in amount',exact:true}).click();
    await expect(raise).toHaveText('All-in 2,000');await expect(raise).toBeEnabled();
    await expect(preview).toHaveText('All-in 2,000 total · 1,990 chips added · 0 behind');
    await page.locator('#raise-sizing').evaluate(el=>{el.open=false;});
    await expect(preview).toBeVisible();
    // Choosing a size does not commit chips. A call/check sequence creates a
    // fresh decision whose default must not inherit the previous all-in draft.
    await page.getByRole('button',{name:'Call 10',exact:true}).click();
    await guest.getByRole('button',{name:'Check',exact:true}).click();
    await guest.getByRole('button',{name:'Check',exact:true}).click();
    await expect(raise).toHaveText('Bet 20');await expect(amount).toHaveValue('20');
    await expect(preview).toHaveText('Bet 20 total · 20 chips added · 1,960 behind');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
    expect(errors).toEqual([]);
    } finally { await guestContext.close(); }
  });
}
