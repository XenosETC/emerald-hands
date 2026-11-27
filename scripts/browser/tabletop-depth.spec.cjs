const {test,expect}=require('@playwright/test');
for(const size of [{width:320,height:568},{width:844,height:390},{width:1440,height:900}]) {
  test(`Chess attack coach follows moves, review and flip without saving at ${size.width}px`,async({page},info)=>{
    await page.setViewportSize(size);const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto('/pepe-chess/index.html');
    const square=name=>page.locator(`[data-square="${name}"]`);
    const move=async(from,to)=>{await square(from).click();await square(to).click();};
    await move('e2','e4');await move('d7','d5');
    const saved=await page.evaluate(()=>localStorage.getItem('emerald-pepe-chess-match-v1'));
    await page.locator('#show-threats').click();
    await expect(square('e4')).toHaveAccessibleName('e4, White pawn, under attack');
    await expect(page.locator('#threat-note')).toContainText('White: 1 piece is attacked');
    await page.locator('#flip-board').click();await expect(square('e4')).toHaveClass(/under-attack/);
    await expect(page.locator('#show-threats')).toHaveAttribute('aria-pressed','true');
    expect(await page.evaluate(()=>localStorage.getItem('emerald-pepe-chess-match-v1'))).toBe(saved);
    expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const rect=await page.locator('.board').boundingBox();expect(rect.height).toBeGreaterThanOrEqual(180);expect(rect.y+rect.height).toBeLessThanOrEqual(size.height);
    await page.screenshot({path:info.outputPath('chess-threats.png')});
    await page.locator('#match-options').click();await page.locator('#move-list [data-ply="1"]').click();await page.locator('#close-match-options').click();
    await expect(page.locator('#threat-note')).toContainText('Black: 0 pieces');
    await page.locator('#review-live').click();await expect(square('e4')).toHaveClass(/under-attack/);
    await page.locator('#show-threats').click();await expect(square('e4')).not.toHaveClass(/under-attack/);
    await move('e4','d5');await expect(square('d5')).toHaveAccessibleName('d5, White pawn');
    expect(errors).toEqual([]);
  });
}
