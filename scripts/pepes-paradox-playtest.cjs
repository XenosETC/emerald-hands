const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

// Uses the shipped page, real animation frames, keyboard/pointer events and
// read-only telemetry. No teleportation, injected physics, or state writes.
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'output', 'paradox');
fs.mkdirSync(out, { recursive: true });
const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.webp':'image/webp' };
const server = http.createServer((req,res)=>{
  const target = path.resolve(root, '.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!target.startsWith(root+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile()){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream'});
  fs.createReadStream(target).pipe(res);
});
const result = { status:'running', method:'Real browser RAF and keyboard/pointer input; read-only telemetry; automated play, not human balance certification.', runs:[], errors:[] };
let browser, activePage, activeRun;
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  browser=await chromium.launch({headless:true,...(process.platform==='win32'?{channel:'msedge'}:{})});
  const base=`http://127.0.0.1:${server.address().port}/pepes-paradox.html`;
  for(const config of [{name:'keyboard-jade',touch:false,fall:false},{name:'echo-recovery-dash',touch:false,fall:true},{name:'touch-stage',touch:true,fall:false,width:390,height:844},{name:'touch-recovery-landscape',touch:true,fall:true,width:844,height:390}]){
    if(process.env.PARADOX_RUN&&(process.env.PARADOX_RUN==='mobile'?!config.touch:config.name!==process.env.PARADOX_RUN))continue;
    console.log('Starting '+config.name);
    const page=await browser.newPage({viewport:config.touch?{width:config.width,height:config.height}:{width:1440,height:1000},hasTouch:config.touch,isMobile:config.touch});
    activePage=page;
    page.setDefaultTimeout(8000);
    page.on('pageerror',e=>result.errors.push(config.name+': '+e.message));
    await page.addInitScript(()=>{
      window.__paradoxInputTrace=[];
      for(const type of ['pointerdown','pointerup','pointercancel','lostpointercapture','click','emeraldarcade:pause'])document.addEventListener(type,e=>{
        window.__paradoxInputTrace.push({type,id:e.pointerId,pointerType:e.pointerType,detail:e.detail,target:e.target?.id||e.target?.dataset?.paradoxControl||e.target?.className});
        if(window.__paradoxInputTrace.length>80)window.__paradoxInputTrace.shift();
      },true);
    });
    await page.goto(base);await page.locator('#startButton').click();
    const read=()=>page.evaluate(()=>window.__pepesParadoxDebug.getState());
    const world=()=>page.evaluate(()=>window.__pepesParadoxDebug.getWorld());
    const touchSession=config.touch?await page.context().newCDPSession(page):null;
    const contacts=new Map();
    const sendTouches=async(type,points=[...contacts.values()])=>{
      let timer;
      try{
        await Promise.race([touchSession.send('Input.dispatchTouchEvent',{type,touchPoints:points}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Touch dispatch timeout')),5000);})]);
      }finally{clearTimeout(timer);}
    };
    const pointer=async(action,down)=>{
      const id=action==='right'?11:action==='jump'?12:13;
      if(down){
        const box=await page.locator(`[data-paradox-control="${action}"]`).boundingBox();
        assert.ok(box&&box.y>=0&&box.y+box.height<=config.height,'Touch control must stay within the mobile viewport: '+action+' '+JSON.stringify(box));
        contacts.set(id,{x:box.x+box.width/2,y:box.y+box.height/2,id});
      }else{const ended=contacts.get(id);contacts.delete(id);if(ended)await sendTouches('touchEnd',[ended]);return;}
      await sendTouches('touchStart');
    };
    const pressUI=async(selector)=>{
      if(!config.touch){await page.locator(selector).click();return;}
      const box=await page.locator(selector).boundingBox();assert.ok(box&&box.y>=0&&box.y+box.height<=config.height,'UI control must stay visible: '+selector+' '+JSON.stringify(box));
      contacts.set(30,{x:box.x+box.width/2,y:box.y+box.height/2,id:30});await sendTouches('touchStart');
      const ended=contacts.get(30);contacts.delete(30);await sendTouches('touchEnd',[ended]);
    };
    const tap=async(action,key)=>{if(config.touch){await pointer(action,true);await pointer(action,false);}else await page.keyboard.press(key);};
    const right=async(down)=>{if(config.touch)await pointer('right',down);else await page.keyboard[down?'down':'up']('d');};
    let didFall=false,didPause=false,didDialogue=false,didShift=false,region=-1;
    let previousX=180,lastProgress=Date.now(),lastFalls=0,dialogueLines=0;
    const run={name:config.name,events:[],maxX:180};activeRun=run;const began=Date.now();
    if(config.touch)await page.locator('.paradox-controls').scrollIntoViewIfNeeded();
    await right(true);
    if(config.touch&&!config.fall)await pointer('jump',true);
    while(Date.now()-began<90000){
      const s=await read();run.maxX=Math.max(run.maxX,s.x);
      if(s.mode==='won'){run.final=s;break;}
      if(s.mode==='cutscene'){
        if(!didDialogue){await page.screenshot({path:path.join(out,config.name+'-dialogue.png')});}
        const before=s.x;
        while(!(await page.locator('#dialogue').isHidden())){
          assert.ok(dialogueLines<3,'Continue must advance exactly three lines');
          const text=await page.locator('#dialogueText').textContent();
          await pressUI('#dialogueNext');dialogueLines++;
          await page.waitForFunction(text=>document.querySelector('#dialogue').hidden||document.querySelector('#dialogueText').textContent!==text,text,{timeout:2000});
        }
        // Direction remains held across all three lines; do not re-press it.
        await page.waitForFunction(x=>window.__pepesParadoxDebug.getState().x>x+10,before,{timeout:3000});
        didDialogue=true;run.events.push('Dialogue closed: held movement resumed immediately');lastProgress=Date.now();continue;
      }
      if(Math.abs(s.x-previousX)>3||s.falls!==lastFalls){lastProgress=Date.now();previousX=s.x;lastFalls=s.falls;}
      assert.ok(Date.now()-lastProgress<6000,`${config.name}: movement stalled at ${JSON.stringify(s)}`);
      const nextRegion=Math.floor(s.x/900);
      if(nextRegion!==region){region=nextRegion;console.log(config.name+' region '+region+' x '+s.x);run.events.push({region,x:s.x,falls:s.falls,hits:s.hits,realm:s.realm});if(region===1||region===4)await page.screenshot({path:path.join(out,config.name+'-region-'+region+'.png')});}
      if(config.fall&&!didFall&&s.x>790){
        // Walk into the first ravine without jumping; keep D held through recovery.
        const count=s.falls;
        await page.waitForFunction(n=>window.__pepesParadoxDebug.getState().falls>n,count,{timeout:6000});
        const recovered=await read();assert.ok(recovered.protection>0);assert.ok(recovered.vx>=0);
        const x=recovered.x;await page.waitForFunction(x=>window.__pepesParadoxDebug.getState().x>x+8,x,{timeout:2000});
        didFall=true;if(config.touch)await pointer('jump',true);run.events.push('Intentional ravine fall recovered; held direction continued');lastProgress=Date.now();continue;
      }
      if(config.fall&&didFall&&!didShift){await tap('shift','q');didShift=true;run.events.push('Echo realm activated');}
      if(!didPause&&s.x>1700){
        await pressUI('#pauseToggle');await page.waitForFunction(()=>window.EmeraldArcade.isPaused(),null,{timeout:2000});const paused=await read();await page.waitForTimeout(250);assert.equal((await read()).x,paused.x);
        await right(false);if(config.touch)await pointer('jump',false);await pressUI('.arcade-runtime-resume');await page.waitForFunction(()=>!window.EmeraldArcade.isPaused(),null,{timeout:2000});await right(true);if(config.touch)await pointer('jump',true);didPause=true;run.events.push('Pause froze position; resume restored controls');continue;
      }
      const w=await world();
      const enemy=w.wisps.find(e=>e.banished<=0&&e.x>s.x+30&&e.x<s.x+220);
      if(config.fall&&enemy&&s.dashCooldown<=0&&Math.abs(s.y+80-enemy.y)<75){await tap('dash','Shift');}
      // Normal jumping policy. The dash route approaches enemies on foot.
      const approachEnemy=config.fall&&enemy&&s.x>1000&&s.dashCooldown<=0;
      if(!config.touch&&s.grounded&&!approachEnemy)await tap('jump','Space');
      await page.waitForTimeout(45);
    }
    await right(false);if(config.touch)await pointer('jump',false);
    assert.ok(run.final,`${config.name}: stage timed out`);assert.ok(didDialogue);assert.equal(dialogueLines,3);assert.ok(didPause);
    if(config.fall){assert.ok(didFall);assert.ok(didShift);if(!config.touch)assert.ok(run.final.dispersals>=1,'dash route must disperse a real enemy');}
    assert.ok(run.final.falls<=(config.fall?2:1),'Repeated falling loop detected');
    assert.ok(await page.locator('#completionReport').isVisible());
    await page.screenshot({path:path.join(out,config.name+'-complete.png')});
    // Replay is tested on the same live page; no reload hides stale state.
    await pressUI('#startButton');const replay=await read();assert.equal(replay.mode,'playing');assert.equal(replay.x,180);assert.equal(replay.falls,0);assert.equal(replay.hits,0);assert.equal(replay.realm,'jade');
    await right(true);await page.waitForFunction(()=>window.__pepesParadoxDebug.getState().x>200);await right(false);
    run.events.push('Completion and replay passed');run.wallSeconds=Math.round((Date.now()-began)/1000);
    result.runs.push(run);fs.writeFileSync(path.join(out,'stage-playtest.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(run));await page.close();
  }
  assert.deepEqual(result.errors,[]);result.status='passed';console.log(result.runs.length+' full-stage browser playthroughs passed.');
})().catch(async e=>{result.status='failed';result.failure=e.stack;result.incompleteRun=activeRun;if(activePage&&!activePage.isClosed()){result.inputTrace=await activePage.evaluate(()=>window.__paradoxInputTrace).catch(()=>null);result.lastState=await activePage.evaluate(()=>window.__pepesParadoxDebug?.getState()).catch(()=>null);await activePage.screenshot({path:path.join(out,'mobile-failure.png')}).catch(()=>{});}console.error(e);process.exitCode=1;}).finally(async()=>{
  fs.writeFileSync(path.join(out,'stage-playtest.json'),JSON.stringify(result,null,2));
  if(browser)await browser.close();server.close();
});
