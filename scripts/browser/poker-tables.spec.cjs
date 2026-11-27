const {test,expect}=require('@playwright/test');

async function fullTable(page,request) {
  await page.goto('/pepe-poker/index.html');
  await page.getByLabel('Screen name').fill('Table host');
  await page.getByRole('button',{name:'Create table',exact:true}).click();
  await expect(page.locator('.your-seat')).toHaveCount(1);
  const id=new URL(page.url()).searchParams.get('room');
  const token=await page.evaluate(id=>localStorage.getItem('pepe-poker:seat:'+id),id);
  const tokens=[token];
  for(let i=1;i<8;i++){const joined=await request.post(`/api/pepe-poker/${id}/join`,{data:{name:'Player '+i}});expect(joined.ok()).toBe(true);tokens.push((await joined.json()).token);}
  const ninth=await request.post(`/api/pepe-poker/${id}/join`,{data:{name:'Ninth'}});expect(ninth.status()).toBe(400);
  expect((await request.post(`/api/pepe-poker/${id}/deal`,{headers:{Authorization:'Bearer '+token},data:{}})).ok()).toBe(true);
  await expect(page.locator('#seats .card')).toHaveCount(16);
  return {id,token,tokens};
}

test('watch mode never restores a saved seat, and private tables remain independent across tabs',async({page,context,request})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const {id,token}=await fullTable(page,request);
  await expect(page.locator('.your-seat .card')).toHaveCount(2);
  const watch=await context.newPage();const auth=[];
  watch.on('request',r=>{if(r.url().includes('/api/pepe-poker/'))auth.push(r.headers().authorization);});
  await watch.goto(`/pepe-poker/index.html?room=${id}&watch=1`);
  await expect(watch.locator('#watch-status')).toBeVisible();
  await expect(watch.locator('.your-seat')).toHaveCount(0);
  await expect(watch.locator('#seats [aria-label="Face-down card"]')).toHaveCount(16);
  await expect(watch.locator('#join')).toBeHidden();await expect(watch.locator('#actions')).toBeHidden();
  await watch.locator('#tables').click();await expect(watch.locator('#known-tables')).toContainText(id.slice(0,6));
  await watch.locator('#table-link').fill('https://example.com/pepe-poker/index.html?room='+id);
  await expect(watch.locator('#open-table-link')).toBeHidden();
  await watch.locator('#table-link').fill(page.url());await expect(watch.locator('#watch-table-link')).toHaveAttribute('href',new RegExp('watch=1'));
  await watch.locator('#close-tables').click();
  expect(auth.every(value=>!value)).toBe(true);
  await watch.locator('#take-seat').click();await expect(watch.locator('.your-seat .card')).toHaveCount(2);
  await page.locator('#tables').click();
  const popupPromise=context.waitForEvent('page');await page.locator('#create-another-table').click();const second=await popupPromise;
  await second.getByLabel('Screen name').fill('Second host');await second.getByRole('button',{name:'Create table',exact:true}).click();
  await expect(second.locator('.your-seat')).toHaveCount(1);
  const secondID=new URL(second.url()).searchParams.get('room');expect(secondID).not.toBe(id);
  await second.reload();await expect(second.locator('.your-seat')).toContainText('Second host');
  await page.locator('#close-tables').click();await page.reload();await expect(page.locator('.your-seat')).toContainText('Table host');
  expect(await page.evaluate(id=>localStorage.getItem('pepe-poker:seat:'+id),id)).toBe(token);
  await page.locator('#tables').click();await expect(page.locator('#known-tables .known-table')).toHaveCount(2);
  expect(errors).toEqual([]);
});

for(const size of [{width:320,height:568},{width:390,height:844},{width:844,height:390},{width:1440,height:900}]) {
  test(`eight occupied seats and decisions fit at ${size.width}x${size.height}`,async({page,request})=>{
    await page.setViewportSize(size);const {id,token,tokens}=await fullTable(page,request);
    let current=(await (await request.get(`/api/pepe-poker/${id}`,{headers:{Authorization:'Bearer '+token}})).json()).state;
    while(current.turn!==0){current=(await (await request.post(`/api/pepe-poker/${id}/act`,{headers:{Authorization:'Bearer '+tokens[current.turn]},data:{action:'call',revision:current.revision}})).json()).state;}
    await expect(page.locator('#call')).toBeVisible();
    const layout=await page.evaluate(()=>{
      const box=document.querySelector('.table').getBoundingClientRect();
      return {scroll:document.documentElement.scrollHeight>innerHeight||document.documentElement.scrollWidth>innerWidth,
        seats:[...document.querySelectorAll('#seats .seat')].map(node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};}),
        pot:(()=>{const r=document.querySelector('#pot').getBoundingClientRect();return {y:r.y,bottom:r.bottom};})(),
        table:{x:box.x,y:box.y,right:box.right,bottom:box.bottom}};
    });
    expect(layout.scroll).toBe(false);expect(layout.seats).toHaveLength(8);
    expect(layout.pot.y).toBeGreaterThanOrEqual(layout.table.y);expect(layout.pot.bottom).toBeLessThanOrEqual(layout.table.bottom);
    for(const seat of layout.seats){expect(seat.x).toBeGreaterThanOrEqual(layout.table.x-1);expect(seat.right).toBeLessThanOrEqual(layout.table.right+1);expect(seat.y).toBeGreaterThanOrEqual(0);expect(seat.bottom).toBeLessThanOrEqual(size.height);}
    await page.screenshot({path:`test-results/poker-eight-tables/table-${size.width}.png`});
  });
}
