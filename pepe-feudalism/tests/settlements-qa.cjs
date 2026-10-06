const {chromium}=require('C:/Users/Phantom Assassin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:1500,height:950}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/pepe-feudalism/index.html');await page.evaluate(()=>localStorage.removeItem('pepe-feudalism-campaign-v1'));await page.reload();await page.waitForFunction(()=>window.feudalismDiagnostics?.().artLoaded);
 const read=()=>page.evaluate(()=>window.feudalismDiagnostics());
 async function click(x,y){const r=await page.locator('#game').boundingBox(),s=Math.min(r.width/1200,r.height/640);await page.mouse.click(r.x+(r.width-1200*s)/2+x*s,r.y+(r.height-640*s)/2+y*s);}
 const results=[];
 for(const [id,theme]of [['port','port'],['mossford','village'],['sunspire','castle']]){
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'World map',exact:true}).click();await page.getByRole('button',{name:'Overview',exact:true}).click();let d=await read(),n=d.nodes.find(n=>n.id===id);await click((n.x-d.camera.x)*d.camera.zoom+600,(n.y-d.camera.y)*d.camera.zoom+320);await page.getByRole('button',{name:`Travel to ${n.name}`,exact:true}).click();await page.waitForFunction(id=>{const d=window.feudalismDiagnostics();return !d.travel&&d.campaign.location===id},id,{timeout:30000});await page.getByRole('button',{name:`Enter ${n.name}`,exact:true}).click();await page.keyboard.press('Escape');d=await read();assert.equal(d.settlementScene,theme);
  await page.screenshot({path:path.join(__dirname,`../docs/${theme}-scene-v5.png`)});
  for(const [building,mode]of [['castle','hall'],['barracks','barracks'],['forge','forge'],['market','board']]){const target=d.buildingTargets.find(b=>b.id===building);await click(target.x,target.y+20);await page.waitForFunction(mode=>window.feudalismDiagnostics().scroll===mode,mode,{timeout:8000}).catch(async e=>{console.log(JSON.stringify({building,mode,d:await read()}));throw e;});assert.equal((await read()).scroll,mode);await page.keyboard.press('Escape');}
  results.push({id,theme,buildingClicks:'PASS'});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(__dirname,'../docs/settlements-verification-v5.json'),JSON.stringify({result:'PASS',results,errors},null,2));console.log('SETTLEMENT QA PASS');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
