const {test,expect}=require('@playwright/test');

const square=(page,name)=>page.locator('#board').getByRole('button',{name:new RegExp('^'+name+'(?: |,)','i')});
async function multiJumpFixture() {
  const engine=await import('../../pepe-checkers/engine.mjs');
  const {encodeMatch}=await import('../../pepe-checkers/match-save.mjs');
  for(let seed=1;seed<100;seed++) {
    let game=engine.newGame(),random=seed;const moves=[];
    for(let step=0;step<120&&!engine.isFinished(game);step++) {
      const routes=engine.captureRoutes(game);
      const route=game.chain===null&&routes.find(route=>route.path.length>=2);
      if(route) return {raw:encodeMatch({mode:'local',difficulty:'standard',moves,wins:{1:0,'-1':0},draws:0}),path:route.path};
      const legal=engine.legalMoves(game);
      random=(Math.imul(random,1664525)+1013904223)>>>0;
      const move=legal[random%legal.length];moves.push([move.from,move.to]);game=engine.play(game,move.from,move.to);
    }
  }
  throw Error('No legal multi-jump fixture found');
}

const coordinate=index=>'abcdefgh'[index%8]+(8-Math.floor(index/8));
for(const size of [{width:320,height:568},{width:844,height:390},{width:1440,height:900}]) {
  test(`capture preview returns to the board without playing or saving at ${size.width}×${size.height}`,async({page},testInfo)=>{
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.setViewportSize(size);
    const fixture=await multiJumpFixture();
    await page.addInitScript(raw=>{
      localStorage.setItem('pepe-checkers:settings',JSON.stringify({mode:'local',difficulty:'standard'}));
      localStorage.setItem('pepe-checkers:match',raw);
    },fixture.raw);
    await page.goto('/pepe-checkers/index.html');
    await expect(page.locator('#board')).toHaveAttribute('data-forced-capture','true');
    const shortcut=page.locator('#show-capture-routes');await expect(shortcut).toBeVisible();
    const controls=await page.locator('.board-actions').boundingBox();
    expect(controls.y+controls.height).toBeLessThanOrEqual(size.height);
    const board=await page.locator('#board').boundingBox();expect(board.width).toBeGreaterThanOrEqual(180);
    expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const save=await page.evaluate(()=>localStorage.getItem('pepe-checkers:match'));
    const label=[fixture.path[0].from,...fixture.path.map(move=>move.to)].map(coordinate).map(text=>text.toUpperCase()).join(' × ');
    const choose=()=>page.locator('#capture-routes button').filter({hasText:label}).first().click();
    await shortcut.click();
    await expect(page.locator('#capture-routes .route-outcome').first()).toContainText(/Wins this turn|Draws by repetition|Landing can be captured|No immediate reply/);
    await choose();
    await expect(page.locator('#match-options-dialog')).not.toBeVisible();
    await expect(square(page,coordinate(fixture.path[0].to))).toBeFocused();
    await expect(square(page,coordinate(fixture.path[0].from))).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('#board .route-marker')).not.toHaveCount(0);
    expect(await page.evaluate(()=>localStorage.getItem('pepe-checkers:match'))).toBe(save);
    if(size.width===320) await page.screenshot({path:testInfo.outputPath('capture-preview-phone.png')});
    await page.keyboard.press('Escape');
    await expect(page.locator('#board .route-marker')).toHaveCount(0);
    expect(await page.evaluate(()=>localStorage.getItem('pepe-checkers:match'))).toBe(save);

    await shortcut.click();await choose();
    await square(page,coordinate(fixture.path[0].to)).press('Enter');
    await expect(page.locator('#turn-title')).toHaveText('Jump again');
    await expect(page.locator('#board')).toHaveAttribute('data-forced-capture','true');
    // The engine still requires the remaining landings with this same piece.
    for(const move of fixture.path.slice(1)) await square(page,coordinate(move.to)).click();
    const finalSquare=coordinate(fixture.path.at(-1).to);
    await expect(square(page,finalSquare)).toHaveAccessibleName(/piece|king/);
    const after=JSON.parse(await page.evaluate(()=>localStorage.getItem('pepe-checkers:match')));
    expect(after.moves.length).toBe(JSON.parse(save).moves.length+fixture.path.length);
    expect(errors).toEqual([]);
  });
}

test('capture shortcut stays hidden for ordinary moves and options restores its opener',async({page})=>{
  await page.goto('/pepe-checkers/index.html');
  await expect(page.locator('#show-capture-routes')).toBeHidden();
  await page.locator('#match-options').click();await page.locator('#close-match-options').click();
  await expect(page.locator('#match-options')).toBeFocused();
});
