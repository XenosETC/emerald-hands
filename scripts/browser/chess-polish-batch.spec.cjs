const { test, expect } = require('@playwright/test');
const { readFile } = require('node:fs/promises');
const path = '/pepe-chess/index.html';
const saveKey = 'emerald-pepe-chess-match-v1';
const square = (page, name) => page.locator(`[data-square="${name}"]`);
async function move(page, from, to) { await square(page, from).click(); await square(page, to).click(); }
async function options(page) { await page.locator('#match-options').click(); }
async function upload(page, text, name = 'match.pgn') {
  await page.locator('#pgn-file').setInputFiles({name,mimeType:'application/x-chess-pgn',buffer:Buffer.from(text)});
}
const saved = page => page.evaluate(key => localStorage.getItem(key), saveKey);

for (const width of [390,1440]) {
  test(`Chess restores its exported PGN, reviews it and reloads the same position at ${width}px`, async ({page}) => {
    await page.setViewportSize({width,height:900});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(path);
    await move(page,'e2','e4');await move(page,'e7','e5');await move(page,'g1','f3');
    await options(page);
    const downloadEvent=page.waitForEvent('download');await page.locator('#export').click();
    const download=await downloadEvent;const pgn=await readFile(await download.path(),'utf8');
    await page.locator('#close-match-options').click();await move(page,'b8','c6');await options(page);
    page.once('dialog',dialog=>dialog.accept());await upload(page,pgn);
    await expect(page.locator('#import-note')).toContainText('Loaded 3 half-moves');
    expect(JSON.parse(await saved(page)).moves).toEqual(['e4','e5','Nf3']);
    await page.locator('#move-list [data-ply="1"]').click();await page.locator('#close-match-options').click();
    await expect(square(page,'g1')).toHaveAccessibleName('g1, White knight');
    await page.locator('#review-live').click();await expect(square(page,'f3')).toHaveAccessibleName('f3, White knight');
    await page.reload();await expect(square(page,'b8')).toHaveAccessibleName('b8, Black knight');
    await expect(square(page,'f3')).toHaveAccessibleName('f3, White knight');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
    expect(errors).toEqual([]);
  });

  test(`Chess rejects invalid/custom-start PGNs and preserves cancelled imports at ${width}px`, async ({page}) => {
    await page.setViewportSize({width,height:900});await page.goto(path);await move(page,'e2','e4');
    const before=await saved(page);await options(page);let confirmations=0;
    page.on('dialog',dialog=>{confirmations++;dialog.dismiss();});
    for (const [text,message] of [
      ['1. e4 e5 2. nonsense *','could not be read'],
      ['[SetUp "1"]\n[FEN "8/8/8/8/8/8/5k2/7K w - - 0 1"]\n*','standard starting position'],
      ['', 'empty'],
      [' '.repeat(131073), 'smaller than 128 KB'],
    ]) {
      await upload(page,text);await expect(page.locator('#import-note')).toContainText(message);
      expect(await saved(page)).toBe(before);
    }
    expect(confirmations).toBe(0);
    await upload(page,'1. d4 d5 *');await expect(page.locator('#import-note')).toContainText('Import cancelled');
    expect(confirmations).toBe(1);expect(await saved(page)).toBe(before);
    await page.locator('#close-match-options').click();await expect(square(page,'e4')).toHaveAccessibleName('e4, White pawn');
  });

  test(`Chess keeps bot and no-takeback rules and defers replies until options close at ${width}px`, async ({page}) => {
    await page.setViewportSize({width,height:900});await page.clock.install();await page.goto(path);await options(page);
    await page.locator('#match-mode').selectOption('bot');await page.locator('#no-takebacks').check();
    await page.locator('#close-match-options').click();await move(page,'e2','e4');await options(page);
    await page.clock.runFor(1000);await expect(page.locator('#move-list [data-ply]')).toHaveCount(1);
    page.once('dialog',dialog=>dialog.accept());
    await upload(page,'[Event "Unfamiliar tournament"]\n[White "<img src=x onerror=alert(1)>"]\n\n1. d4 d5 2. c4 *');
    await expect(page.locator('#import-note')).toContainText('Loaded 3 half-moves');
    await expect(page.locator('#match-mode')).toHaveValue('bot');await expect(page.locator('#no-takebacks')).toBeChecked();
    await page.clock.runFor(1000);await expect(page.locator('#move-list [data-ply]')).toHaveCount(3);
    expect(await page.locator('#match-options-dialog img[src="x"]').count()).toBe(0);
    await page.evaluate(()=>{window.optionsClosedForTest=new Promise(resolve=>document.querySelector('#match-options-dialog').addEventListener('close',resolve,{once:true}));});
    await page.locator('#close-match-options').click();await page.evaluate(()=>optionsClosedForTest);await page.clock.runFor(500);
    await options(page);await expect(page.locator('#move-list [data-ply]')).toHaveCount(4);
    await expect(page.locator('#undo')).toBeHidden();
    const data=JSON.parse(await saved(page));expect(data.mode).toBe('bot');expect(data.noTakebacks).toBe(true);
  });
}

test('Chess rejects a delayed PGN read if the board changes meanwhile',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{
    const original=File.prototype.text;
    File.prototype.text=function(){
      return this.name==='slow.pgn' ? new Promise(resolve=>{window.finishSlowPGN=()=>resolve('1. d4 *');}) : original.call(this);
    };
  });
  await page.goto(path);await move(page,'e2','e4');await options(page);await upload(page,'1. d4 *','slow.pgn');
  await expect(page.locator('#import-note')).toHaveText('Checking PGN…');
  await page.locator('#close-match-options').click();await move(page,'e7','e5');const before=await saved(page);
  await page.evaluate(()=>finishSlowPGN());await expect(page.locator('#import-note')).toContainText('board changed while reading');
  expect(await saved(page)).toBe(before);await expect(square(page,'e5')).toHaveAccessibleName('e5, Black pawn');
});

test('Chess imports completed PGNs as terminal boards without duplicating moves or touching arcade funds',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('emerald-arcade-v1','keep-existing-profile'));
  await page.goto(path);await options(page);await upload(page,'1. f3 e5 2. g4 Qh4# 0-1');
  await expect(page.locator('#import-note')).toContainText('Loaded 4 half-moves');
  await page.locator('#close-match-options').click();await expect(page.locator('#match-status')).toHaveText('Checkmate. Black wins.');
  await expect(square(page,'h4')).toHaveAttribute('aria-disabled','true');
  await options(page);page.once('dialog',dialog=>dialog.accept());await upload(page,'1. f3 e5 2. g4 Qh4# 0-1');
  await expect(page.locator('#move-list [data-ply]')).toHaveCount(4);
  expect(await page.evaluate(()=>localStorage.getItem('emerald-arcade-v1'))).toBe('keep-existing-profile');
  await page.reload();await expect(page.locator('#match-status')).toHaveText('Checkmate. Black wins.');
});
