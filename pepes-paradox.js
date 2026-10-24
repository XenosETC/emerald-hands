(() => {
  const canvas = document.querySelector("#paradoxCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height, WORLD_W = 5400, FLOOR = 610;
  const ui = {
    overlay: document.querySelector("#startOverlay"), start: document.querySelector("#startButton"),
    dialogue: document.querySelector("#dialogue"), next: document.querySelector("#dialogueNext"),
    text: document.querySelector("#dialogueText"), name: document.querySelector("#speakerName"),
    portrait: document.querySelector("#speakerPortrait"), sound: document.querySelector("#soundToggle"),
    recovery: document.querySelector("#recoveryStatus"),
    report: document.querySelector("#completionReport"),
    trail: document.querySelector("#trailProgress"),
    goal: document.querySelector("#trailGoal"),
    shards: document.querySelector("#shardCount"), relics: document.querySelector("#relicCount"), frogs: document.querySelector("#frogCount"),
  };
  const loadImage = (src) => { const image = new Image(); image.src = src; return image; };
  const sprites = {
    sheet:loadImage("assets/pepes-paradox/crown-platformer-sheet.png"),
    collectibles:loadImage("assets/pepes-paradox/paradox-collectibles.png"),
    bambooDistant:loadImage("assets/pepes-paradox/bamboo-distant.png"),
    bambooTemple:loadImage("assets/pepes-paradox/bamboo-temple-path.png"),
    bambooForeground:loadImage("assets/pepes-paradox/bamboo-foreground.png"),
    fallen:loadImage("assets/pepe-relic-rumble/fallen-idle.png")
  };
  const parallaxRates = { distant:.055, temple:.16, foreground:.32 };
  const spriteAtlas = { idle:[0,0],runA:[1,0],runB:[2,0],rise:[0,1],apex:[1,1],fall:[2,1],dash:[0,2],hurt:[1,2],victory:[2,2] };
  const keys = new Set();
  const touchPointers = new Map();
  const controlButtons = new Map();
  const touchHeld = action => [...touchPointers.values()].includes(action);
  function syncTouchButtons(){
    for(const [action,button] of controlButtons)button.setAttribute("aria-pressed",String(touchHeld(action)));
  }
  const ability = { realm:"jade", shiftCooldown:0, dashCooldown:0, coyote:.12, jumpBuffer:0, flash:0, hurt:0, hits:0, dispersals:0 };
  const echoPlatforms = [
    {x:910,y:500,w:125,h:22,realm:"echo"}, {x:1510,y:430,w:150,h:22,realm:"echo"},
    {x:3330,y:455,w:180,h:22,realm:"jade"}, {x:3500,y:395,w:145,h:22,realm:"echo"},
    {x:4120,y:440,w:150,h:22,realm:"echo"}
  ];
  const solidPlatforms = () => [...platforms,...echoPlatforms.filter(p=>p.realm===ability.realm)];
  const state = { mode:"ready", time:0, platformTime:0, camera:0, sound:true, cutsceneStep:0, cutsceneClock:0, tauntDone:false, finished:false, petCollectRadius:0 };
  const player = { x:180, y:FLOOR-154, w:104, h:154, vx:0, vy:0, grounded:true, facing:1, shards:0, relics:0, frogs:0, dash:0 };
  const rival = { x:2740, y:FLOOR-165, w:112, h:165, facing:-1, alpha:0 };
  const platforms = [
    {x:0,y:FLOOR,w:900,h:110},{x:1020,y:565,w:520,h:155},{x:1660,y:610,w:940,h:110},
    {x:2730,y:610,w:780,h:110},{x:3630,y:565,w:500,h:155},{x:4250,y:610,w:1150,h:110},
    {x:700,y:470,w:170,h:24,moving:true,baseX:700,amplitude:115,speed:1.1,phase:0,dx:0},{x:1270,y:410,w:180,h:24,moving:true,baseX:1270,amplitude:90,speed:1.35,phase:2,dx:0},{x:1900,y:455,w:210,h:24,moving:true,baseX:1900,amplitude:150,speed:.9,phase:4,dx:0},{x:3850,y:400,w:180,h:24,moving:true,baseX:3850,amplitude:120,speed:1.2,phase:1,dx:0},
    {x:2630,y:640,w:85,h:80},
  ];
  const shards = [560,760,1110,1320,1780,2020,2350,2940,3260,3770,4070,4680].map((x,i)=>({x,y:(i%3===1?390:510),got:false}));
  const relics = [{x:1430,y:345,got:false},{x:4050,y:335,got:false}];
  const frogs = [{x:850,y:535,got:false}];
  const wisps = [
    {x:1180,y:510,r:27,homeX:1180,range:65,speed:1.25,phase:0,banished:0},
    {x:2410,y:550,r:28,homeX:2410,range:60,speed:1.05,phase:1.2,banished:0},
    {x:3910,y:510,r:30,homeX:3910,range:85,speed:1.4,phase:2.3,banished:0}
  ];
  const shrines = [180,1100,1740,2810,3710,4330].map((x,i)=>({x,y:platforms[i].y,lit:i===0}));
  const signs = [
    {x:400,y:610,title:"MOONLIT APPROACH",hint:"Space · jump / Shift · dash"},
    {x:800,y:610,title:"ECHO CROSSING",hint:"Q reveals violet stepping stones"},
    {x:1380,y:565,title:"WISP PATROL",hint:"Jump over · dash through"},
    {x:1970,y:610,title:"THE BROKEN BELLS",hint:"Follow Pepina’s emerald trail"},
    {x:3060,y:610,title:"SPLIT REALITY",hint:"Jade below · Echo above"},
    {x:4450,y:610,title:"TEMPLE APPROACH",hint:"The gate is just ahead →"}
  ];
  const particles = [];
  const dialogue = [
    {name:"Fallen Pepe", text:"You really climbed the whole mountain for one trail of emerald dust?", portrait:"assets/pepe-relic-rumble/fallen-idle.png"},
    {name:"Fallen Pepe", text:"You'll never get Pepina back! LMAOOOOOO.", portrait:"assets/pepe-relic-rumble/fallen-special.png"},
    {name:"Fallen Pepe", text:"Finish the stage if you want the next clue. Try not to rage quit, hero.", portrait:"assets/pepe-relic-rumble/fallen-walk.png"},
  ];
  let checkpoint = {x:180,y:FLOOR-154};
  let falls = 0;
  let runId = 0;
  const originalWisps = wisps.map(w => ({...w}));
  let audio;
  function stopMotion(){player.vx=0;player.dash=0;ability.jumpBuffer=0;}
  function clearInput(){keys.clear();touchPointers.clear();syncTouchButtons();stopMotion();}

  function tone(freq=330,duration=.08,type="sine",gain=.045){
    if(!state.sound) return; try { audio ||= new (window.AudioContext||window.webkitAudioContext)();
    const o=audio.createOscillator(),g=audio.createGain(); o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(gain,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+duration); } catch { /* optional audio must not interrupt play */ }
  }
  function start(){
    if(window.EmeraldArcade?.isPaused?.() || ["playing","cutscene","escape"].includes(state.mode)) return;
    runId++;ui.report.hidden=true;ui.report.textContent="";
    clearInput(); particles.length=0;
    Object.assign(ability,{realm:"jade",shiftCooldown:0,dashCooldown:0,coyote:.12,jumpBuffer:0,flash:0,hurt:0,hits:0,dispersals:0});
    checkpoint={x:180,y:FLOOR-154};falls=0;ui.recovery.textContent="Falls return you to your last safe footing. Collected items stay collected.";
    wisps.forEach((w,i)=>Object.assign(w,originalWisps[i]));
    shrines.forEach((shrine,i)=>shrine.lit=i===0);
    for(const p of platforms) if(p.moving){p.x=p.baseX+Math.sin(p.phase)*p.amplitude;p.dx=0;}
    Object.assign(rival,{x:2740,y:FLOOR-165,alpha:0});
    loop.last=null;
    window.EmeraldArcade?.beginSession("paradox","pepes-paradox.html");
    const petBonus=window.ArcadePet?.activeBonus("paradox");
    Object.assign(player,{x:180,y:FLOOR-154,vx:0,vy:0,grounded:true,shards:0,relics:0,frogs:0,dash:0,facing:1});
    Object.assign(state,{mode:"playing",time:0,platformTime:0,camera:0,cutsceneStep:0,tauntDone:false,finished:false,petCollectRadius:Number(petBonus?.collectibleRadius||0)});
    [...shards,...relics,...frogs].forEach(o=>o.got=false); ui.overlay.classList.add("is-hidden"); ui.dialogue.hidden=true; canvas.focus(); syncHud(); tone(220,.15,"triangle");
  }
  function jump(){
    if(window.EmeraldArcade?.isPaused?.()||!["playing","escape"].includes(state.mode))return;
    ability.jumpBuffer=.14;
    tryJump();
  }
  function tryJump(){
    if(ability.jumpBuffer>0&&(player.grounded||ability.coyote>0)){
      player.vy=-740;player.grounded=false;ability.coyote=0;ability.jumpBuffer=0;tone(440,.08,"triangle");
    }
  }
  function shiftRealm(){
    if(window.EmeraldArcade?.isPaused?.()||!["playing","escape"].includes(state.mode)||ability.shiftCooldown>0)return;
    ability.realm=ability.realm==="jade"?"echo":"jade";ability.shiftCooldown=.6;ability.flash=.35;
    burst(player.x+52,player.y+80,ability.realm==="echo"?"#d8a5ff":"#9affac",28);
    tone(ability.realm==="echo"?330:660,.18,"triangle");
    ui.recovery.textContent=`${ability.realm==="echo"?"Echo":"Jade"} realm revealed. Glowing stones are solid; outlined stones are memories.`;
  }
  function dash(){ if(!window.EmeraldArcade?.isPaused?.()&&["playing","escape"].includes(state.mode)&&ability.dashCooldown<=0){ability.dashCooldown=.9;player.dash=.24;player.vx=player.facing*720;tone(170,.12,"sawtooth",.03);burst(player.x+player.w/2,player.y+player.h/2,"#9affac",16);} }
  function beginTaunt(){ stopMotion(); state.mode="cutscene";state.cutsceneStep=0;state.cutsceneClock=0;rival.x=player.x+720;rival.alpha=1;player.vx=0;showLine();ui.next.focus();tone(85,.35,"sawtooth",.025); }
  function showLine(){ const line=dialogue[state.cutsceneStep];ui.name.textContent=line.name;ui.text.textContent=line.text;ui.portrait.src=line.portrait;ui.dialogue.hidden=false; }
  function advanceDialogue(){
    if(state.mode!=="cutscene"||window.EmeraldArcade?.isPaused?.()) return; state.cutsceneStep++;
    if(state.cutsceneStep<dialogue.length){showLine();tone(120+state.cutsceneStep*35,.08,"square",.02);return;}
    ui.dialogue.hidden=true;stopMotion();canvas.focus();state.mode="escape";state.cutsceneClock=0;state.tauntDone=true;tone(520,.1,"triangle");
  }
  function finish(){ if(state.finished||!["playing","escape"].includes(state.mode)||!state.tauntDone)return;clearInput();state.finished=true;state.mode="won";tone(523,.18);const wonRun=runId;setTimeout(()=>{if(runId===wonRun&&state.mode==="won")tone(659,.18);},180);setTimeout(()=>{if(runId===wonRun&&state.mode==="won")tone(784,.3);},360);window.EmeraldArcade?.recordAndNotify("paradox",{score:player.shards*120+player.relics*600+player.frogs*1000,rank:"Mountain Pursuer",shards:player.shards,relics:player.relics,frogs:player.frogs,stage:2,played:true});ui.overlay.querySelector("p:first-child").textContent="Mountain Archive · Rage Bait Survived";ui.overlay.querySelector("h1").textContent="The Ancient Temple has opened.";ui.overlay.querySelectorAll("p")[1].textContent="The bamboo bells speak Pepina's name. Fallen escaped through the temple gate, but the recovered frog sigil remembers the path.";ui.report.textContent=`Bamboo Mountains cleared · ${player.shards*120+player.relics*600+player.frogs*1000} points · ${player.shards}/${shards.length} shards · ${player.relics}/${relics.length} relics · ${player.frogs}/${frogs.length} hidden frogs · ${falls} fall recoveries. The Ancient Temple is the next story lead; this build ends here.`;ui.report.hidden=false;ui.start.textContent="Replay Bamboo Mountains";ui.overlay.classList.remove("is-hidden");syncHud();ui.start.focus(); }
  function update(dt){
    if(window.EmeraldArcade?.isPaused?.())return;
    state.time+=dt;
    if(state.tauntDone&&["playing","escape"].includes(state.mode)&&rival.alpha>0){rival.x+=660*dt;rival.alpha=Math.max(0,rival.alpha-dt*.65);}
    if(state.mode==="escape"){state.cutsceneClock+=dt;if(state.cutsceneClock>1.5)state.mode="playing";}
    if(!["playing","escape"].includes(state.mode)) return;
    state.platformTime+=dt;
    ability.shiftCooldown=Math.max(0,ability.shiftCooldown-dt);
    ability.dashCooldown=Math.max(0,ability.dashCooldown-dt);
    ability.flash=Math.max(0,ability.flash-dt);
    ability.hurt=Math.max(0,ability.hurt-dt);
    ability.coyote=player.grounded?.12:Math.max(0,ability.coyote-dt);
    ability.jumpBuffer=Math.max(0,ability.jumpBuffer-dt);
    if(touchHeld("jump")&&player.grounded)ability.jumpBuffer=.14;
    tryJump();
    const move=(keys.has("ArrowRight")||keys.has("KeyD")||touchHeld("right")?1:0)-(keys.has("ArrowLeft")||keys.has("KeyA")||touchHeld("left")?1:0);
    const dashTime=Math.min(dt,player.dash),walkTime=dt-dashTime;
    const drag=-Math.log(1-11/60)*60,target=move*390,decay=Math.exp(-drag*walkTime);
    const travel=player.vx*dashTime+target*walkTime+(player.vx-target)*(1-decay)/drag;
    player.vx=target+(player.vx-target)*decay;
    player.dash=Math.max(0,player.dash-dt);if(move&&!player.dash)player.facing=move;
    let carried=0;for(const p of platforms){if(!p.moving)continue;const oldX=p.x;p.x=p.baseX+Math.sin(state.platformTime*p.speed+p.phase)*p.amplitude;p.dx=p.x-oldX;if(player.grounded&&Math.abs(player.y+player.h-p.y)<4&&player.x+player.w>oldX&&player.x<oldX+p.w)carried=p.dx;}
    const oldBottom=player.y+player.h;player.x=Math.max(0,Math.min(WORLD_W-player.w,player.x+travel+carried));player.y+=player.vy*dt+.5*1850*dt*dt;player.vy+=1850*dt;player.grounded=false;
    let landing=null;
    for(const p of solidPlatforms()){
      if(player.x+player.w>p.x&&player.x<p.x+p.w&&oldBottom<=p.y+12&&player.y+player.h>=p.y&&player.vy>=0&&(!landing||p.y<landing.y))landing=p;
    }
    if(landing){
      player.y=landing.y-player.h;player.vy=0;player.grounded=true;
      if(!landing.moving&&!landing.realm){
        checkpoint={x:Math.max(landing.x+12,Math.min(landing.x+landing.w-player.w-12,player.x)),y:landing.y-player.h};
        const shrine=shrines[platforms.indexOf(landing)];
        if(shrine&&!shrine.lit){shrine.lit=true;burst(shrine.x,shrine.y-55,"#edcf86",18);ui.recovery.textContent="Safe footing reached. This island is your new recovery point.";tone(480,.15,"triangle");}
      }
    }
    // Resolve a landed gate crossing before a held/buffered jump launches again.
    if(player.grounded&&player.x>5100&&state.tauntDone&&player.y+player.h<=FLOOR+1){
      state.camera=Math.max(0,Math.min(WORLD_W-W,player.x-W*.36));finish();return;
    }
    if(player.grounded){if(touchHeld("jump"))ability.jumpBuffer=.14;tryJump();}
    if(player.y>H+100)recover();
    for(const item of shards) collect(item,player.x+52,player.y+70,26,"shards");for(const item of relics) collect(item,player.x+52,player.y+70,34,"relics");for(const item of frogs) collect(item,player.x+52,player.y+70,38,"frogs");
    updateWisps(dt);
    if(!state.tauntDone&&player.x>2180)beginTaunt();if(player.x>5100&&player.grounded&&player.y+player.h<=FLOOR+1)finish();
    state.camera=Math.max(0,Math.min(WORLD_W-W,player.x-W*.36));
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=260*dt;if(p.life<=0)particles.splice(i,1);}
  }
  function recover(){
    // Preserve held movement; blur/pause still clear input independently.
    stopMotion();Object.assign(player,{x:checkpoint.x,y:checkpoint.y,vy:0,grounded:true});
    ability.coyote=.12;ability.hurt=1.5;ability.dashCooldown=0;falls++;
    ui.recovery.textContent=`Recovered from fall ${falls}. Your collected items are safe. Brief protection active.`;
    burst(player.x+52,player.y+100,"#edcf86",20);tone(90,.25,"sawtooth");
  }
  const wispY = w => w.y+Math.sin(state.platformTime*4+w.homeX)*12;
  function updateWisps(dt){
    for(const w of wisps){
      w.banished=Math.max(0,w.banished-dt);
      // Patrol stays inside its authored island, including after contact.
      w.x=w.homeX+Math.sin(state.platformTime*w.speed+w.phase)*w.range;
      if(w.banished>0)continue;
      const dx=player.x+52-w.x,dy=player.y+80-wispY(w);
      if(Math.hypot(dx,dy)>=w.r+34)continue;
      if(player.dash>0){
        w.banished=3.5;ability.dispersals++;burst(w.x,wispY(w),"#dfadff",26);
        ui.recovery.textContent="Wisp dispersed! Its lantern will reform in a few seconds.";tone(830,.12,"triangle");
      }else if(ability.hurt<=0){
        ability.hurt=1.1;ability.hits++;ability.coyote=0;player.grounded=false;
        player.vx=(dx<0?-1:1)*310;player.vy=-390;
        ui.recovery.textContent="Wisp struck! Brief protection active. Jump over it or dash through.";
        burst(player.x+52,player.y+80,"#e3a6ff",12);tone(105,.18,"square",.03);
      }
    }
  }
  function collect(item,px,py,r,key){if(!["playing","escape"].includes(state.mode))return;const distance=Math.hypot(px-item.x,py-item.y),baseRadius=r+42;if(item.got||distance>baseRadius+state.petCollectRadius)return;if(state.petCollectRadius>0&&distance>baseRadius)window.ArcadePet?.showAssist("paradox",true);item.got=true;player[key]++;burst(item.x,item.y,key==="relics"?"#ffd86c":"#72ff9b",18);tone(key==="relics"?760:620,.1,"sine");syncHud();}
  function burst(x,y,color,count){for(let i=0;i<count;i++)particles.push({x,y,vx:(Math.random()-.5)*260,vy:-Math.random()*260,life:.45+Math.random()*.5,color});}
  function syncHud(){ui.trail.value=state.mode==="won"?1:Math.max(0,Math.min(1,(player.x-180)/(5100-180)));ui.trail.setAttribute("aria-valuetext",`${Math.round(ui.trail.value*100)}% along the Bamboo Mountains trail`);const goal=state.mode==="ready"?"Begin the pursuit to explore Bamboo Mountains.":state.mode==="cutscene"?`Fallen’s taunt · line ${state.cutsceneStep+1} of ${dialogue.length}. Choose Continue or press Enter.`:state.mode==="escape"?"Fallen is escaping. Move now to pursue him!":state.mode==="won"?"Bamboo Mountains cleared. Replay to find missed collectibles.":state.tauntDone?"Reach the temple gate. Collectibles are optional score bonuses.":"Follow the trail to Fallen, then reach the temple gate. Collectibles are optional score bonuses.";if(ui.goal.textContent!==goal)ui.goal.textContent=goal;ui.shards.textContent=`${player.shards} / ${shards.length}`;ui.relics.textContent=`${player.relics} / ${relics.length}`;ui.frogs.textContent=`${player.frogs} / ${frogs.length}`;canvas.dataset.debugState=JSON.stringify({mode:state.mode,realm:ability.realm,dashCooldown:ability.dashCooldown,shiftCooldown:ability.shiftCooldown,grounded:player.grounded,touches:[...touchPointers.values()],vx:Math.round(player.vx),vy:Math.round(player.vy),falls,hits:ability.hits,dispersals:ability.dispersals,protection:ability.hurt,checkpoint:{...checkpoint},x:Math.round(player.x),y:Math.round(player.y),camera:Math.round(state.camera),tauntDone:state.tauntDone,shards:player.shards,relics:player.relics,frogs:player.frogs,parallax:{distant:Math.round(state.camera*parallaxRates.distant),temple:Math.round(state.camera*parallaxRates.temple),foreground:Math.round(state.camera*parallaxRates.foreground)},movingPlatforms:platforms.filter(p=>p.moving).map(p=>({x:Math.round(p.x),y:p.y}))});}
  function draw(){ctx.clearRect(0,0,W,H);drawSky();ctx.save();ctx.translate(-state.camera,0);drawWorld();drawLandmarks();drawRealmStones();drawItems();drawWisps();drawRival();drawPlayer();drawParticles();ctx.restore();drawForeground();drawProgress();drawAbilities();syncHud();}
  function drawLoopLayer(image,rate,alpha=1){if(!image.complete||!image.naturalWidth)return false;const dw=H*(image.naturalWidth/image.naturalHeight);const travel=state.camera*rate;const offset=-((travel%dw)+dw)%dw;ctx.save();ctx.globalAlpha=alpha;for(let x=offset-dw;x<W+dw;x+=dw)ctx.drawImage(image,x,0,dw,H);ctx.restore();return true;}
  function drawSky(){ctx.fillStyle="#062018";ctx.fillRect(0,0,W,H);drawLoopLayer(sprites.bambooDistant,parallaxRates.distant,1);drawLoopLayer(sprites.bambooTemple,parallaxRates.temple,.58);const mist=ctx.createLinearGradient(0,180,0,H);mist.addColorStop(0,"rgba(8,40,34,.03)");mist.addColorStop(1,"rgba(0,7,4,.34)");ctx.fillStyle=mist;ctx.fillRect(0,0,W,H);}
  function drawForeground(){drawLoopLayer(sprites.bambooForeground,parallaxRates.foreground,.3);}
  function drawWorld(){
    for(const p of platforms){
      ctx.save();
      const rock=ctx.createLinearGradient(0,p.y,0,p.y+Math.min(p.h,100));
      rock.addColorStop(0,p.moving?"#677760":"#355541");rock.addColorStop(.18,"#233c30");rock.addColorStop(1,"#071510");
      ctx.fillStyle=rock;ctx.fillRect(p.x,p.y,p.w,p.h);
      // Layered stone seams and moss follow the exact walkable top edge.
      ctx.strokeStyle="rgba(137,166,131,.16)";ctx.lineWidth=2;
      for(let row=0;row<Math.min(p.h,110);row+=27){
        ctx.beginPath();ctx.moveTo(p.x,p.y+row+18);ctx.lineTo(p.x+p.w,p.y+row+18);ctx.stroke();
        for(let x=p.x+((row/27)%2)*37+15;x<p.x+p.w;x+=83){ctx.beginPath();ctx.moveTo(x,p.y+row+18);ctx.lineTo(x+7,p.y+row+43);ctx.stroke();}
      }
      ctx.fillStyle=p.moving?"#d8cb8a":"#86b780";ctx.fillRect(p.x,p.y,p.w,4);
      ctx.fillStyle=p.moving?"#7d9476":"#476f43";ctx.fillRect(p.x+4,p.y+4,p.w-8,7);
      if(p.moving){
        ctx.strokeStyle="#c8c28e";ctx.lineWidth=2;ctx.strokeRect(p.x+7,p.y+5,p.w-14,p.h-7);
        ctx.fillStyle="#e6dfa5";ctx.font="16px serif";ctx.textAlign="center";ctx.fillText("◇",p.x+p.w/2,p.y+20);
        ctx.strokeStyle="rgba(219,217,155,.22)";ctx.setLineDash([3,9]);ctx.beginPath();ctx.moveTo(p.baseX-p.amplitude,p.y+40);ctx.lineTo(p.baseX+p.amplitude+p.w,p.y+40);ctx.stroke();
      }else{
        ctx.strokeStyle="#6d9b64";ctx.lineWidth=2;
        for(let x=p.x+22;x<p.x+p.w-12;x+=47){ctx.beginPath();ctx.moveTo(x,p.y);ctx.lineTo(x-4,p.y-8);ctx.moveTo(x,p.y);ctx.lineTo(x+6,p.y-5);ctx.stroke();}
      }
      ctx.restore();
    }
    // Temple gate: pillars, a curved lintel, and a visible threshold.
    ctx.save();const open=state.tauntDone;
    ctx.fillStyle="#203d32";ctx.fillRect(5150,315,26,295);ctx.fillRect(5304,315,26,295);
    ctx.strokeStyle="#a3c69a";ctx.lineWidth=3;ctx.strokeRect(5150,315,26,295);ctx.strokeRect(5304,315,26,295);
    ctx.fillStyle="#547255";ctx.beginPath();ctx.moveTo(5126,320);ctx.quadraticCurveTo(5240,270,5354,320);ctx.lineTo(5336,338);ctx.lineTo(5144,338);ctx.closePath();ctx.fill();
    ctx.shadowColor=open?"#96ffc4":"#687a71";ctx.shadowBlur=22;
    const portal=ctx.createLinearGradient(5176,0,5304,0);portal.addColorStop(0,"rgba(112,255,184,.08)");portal.addColorStop(.5,open?"rgba(126,255,187,.4)":"rgba(126,155,137,.12)");portal.addColorStop(1,"rgba(112,255,184,.08)");ctx.fillStyle=portal;ctx.fillRect(5176,340,128,270);
    ctx.fillStyle="#d9edc1";ctx.font="bold 18px system-ui";ctx.textAlign="center";ctx.fillText(open?"ANCIENT TEMPLE →":"FOLLOW THE TRAIL",5240,284);ctx.restore();
  }
  function drawLandmarks(){
    for(const s of signs){
      ctx.fillStyle="#624d30";ctx.fillRect(s.x-3,s.y-110,6,110);
      ctx.fillStyle="rgba(8,23,17,.94)";ctx.fillRect(s.x-105,s.y-126,210,51);
      ctx.strokeStyle="#a28c5b";ctx.lineWidth=1;ctx.strokeRect(s.x-105,s.y-126,210,51);
      ctx.textAlign="center";ctx.fillStyle="#dfd6ac";ctx.font="bold 12px system-ui";ctx.fillText(s.title,s.x,s.y-106);
      ctx.fillStyle="#c0d1be";ctx.font="11px system-ui";ctx.fillText(s.hint,s.x,s.y-88);
    }
    for(const shrine of shrines){
      const x=shrine.x,y=shrine.y;
      ctx.save();ctx.fillStyle="#2c4538";ctx.fillRect(x-14,y-14,28,14);ctx.fillRect(x-6,y-49,12,35);
      ctx.fillStyle=shrine.lit?"#f4d98b":"#536358";ctx.shadowColor="#ffdc83";ctx.shadowBlur=shrine.lit?22:0;
      ctx.fillRect(x-9,y-77,18,27);ctx.shadowBlur=0;ctx.fillStyle="#3b5742";ctx.beginPath();ctx.moveTo(x-20,y-77);ctx.lineTo(x,y-90);ctx.lineTo(x+20,y-77);ctx.closePath();ctx.fill();
      ctx.font="bold 10px system-ui";ctx.textAlign="center";ctx.fillStyle=shrine.lit?"#eddfb5":"#829486";ctx.fillText(shrine.lit?"SAFE FOOTING":"RECOVERY SHRINE",x,y+28);ctx.restore();
    }
  }
  function drawRealmStones(){
    for(const p of echoPlatforms){
      const active=p.realm===ability.realm,color=p.realm==="echo"?"#d8a5ff":"#9affac";
      ctx.save();ctx.globalAlpha=active?1:.32;ctx.strokeStyle=color;ctx.lineWidth=2;
      if(!active)ctx.setLineDash([8,7]);
      ctx.shadowColor=color;ctx.shadowBlur=active?20:0;
      ctx.beginPath();ctx.moveTo(p.x+8,p.y);ctx.lineTo(p.x+p.w-9,p.y);ctx.lineTo(p.x+p.w,p.y+8);ctx.lineTo(p.x+p.w-14,p.y+p.h);ctx.lineTo(p.x+16,p.y+p.h+8);ctx.lineTo(p.x,p.y+10);ctx.closePath();
      if(active){const stone=ctx.createLinearGradient(0,p.y,0,p.y+p.h+8);stone.addColorStop(0,p.realm==="echo"?"#977eb2":"#6a9c79");stone.addColorStop(1,"#172723");ctx.fillStyle=stone;ctx.fill();}
      ctx.stroke();ctx.beginPath();ctx.moveTo(p.x+12,p.y+5);ctx.lineTo(p.x+p.w-12,p.y+5);ctx.stroke();
      if(active){ctx.font="18px serif";ctx.fillStyle=color;ctx.textAlign="center";ctx.fillText("◇  ⋮  ◇",p.x+p.w/2,p.y+21);}ctx.setLineDash([]);ctx.font="bold 12px system-ui";ctx.fillStyle=color;
      ctx.textAlign="center";ctx.fillText(p.realm.toUpperCase(),p.x+p.w/2,p.y-12);ctx.restore();
    }
  }
  function drawAbilities(){
    const echo=ability.realm==="echo",color=echo?"#d8a5ff":"#9affac";
    if(echo||ability.flash>0){ctx.fillStyle=echo?"rgba(113,43,160,.09)":`rgba(130,255,160,${ability.flash*.25})`;ctx.fillRect(0,0,W,H);}
    ctx.fillStyle="rgba(1,8,7,.88)";ctx.fillRect(24,H-100,260,66);
    ctx.font="bold 16px system-ui";ctx.textAlign="left";ctx.fillStyle=color;
    ctx.fillText(`Q · ${ability.realm.toUpperCase()} REALM`,38,H-73);
    ctx.font="12px system-ui";ctx.fillStyle="#d5e5df";
    ctx.fillText(ability.dashCooldown>0?"DASH RECHARGING":"SHIFT · DASH READY",38,H-50);
    ctx.fillStyle="#21382f";ctx.fillRect(195,H-60,72,7);ctx.fillStyle=color;
    ctx.fillRect(195,H-60,72*(1-ability.dashCooldown/.9),7);
  }
  function diamond(x,y,size,color){ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4+state.time);ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=16;ctx.fillRect(-size/2,-size/2,size,size);ctx.restore();}
  function drawAtlasItem(cellX,cellY,x,y,size){if(!sprites.collectibles.complete)return;const cw=sprites.collectibles.naturalWidth/3,ch=sprites.collectibles.naturalHeight/2;ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(state.time*2+x)*.05);ctx.shadowColor="#74ff9d";ctx.shadowBlur=16;ctx.drawImage(sprites.collectibles,cellX*cw,cellY*ch,cw,ch,-size/2,-size/2,size,size);ctx.restore();}
  function drawItems(){for(const s of shards)if(!s.got)drawAtlasItem(0,0,s.x,s.y+Math.sin(state.time*3+s.x)*8,76);for(const r of relics)if(!r.got)drawAtlasItem(1,0,r.x,r.y,92);for(const f of frogs)if(!f.got)drawAtlasItem(2,0,f.x,f.y,82);}
  function drawWisps(){
    for(const w of wisps){
      const y=wispY(w);
      ctx.save();ctx.translate(w.x,y);
      if(w.banished>0){
        ctx.globalAlpha=.4;ctx.strokeStyle="#deb5f5";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(10,0);ctx.lineTo(0,14);ctx.lineTo(-10,0);ctx.closePath();ctx.stroke();
        ctx.font="10px system-ui";ctx.fillStyle="#ead5f4";ctx.textAlign="center";ctx.fillText(`REFORMING ${Math.ceil(w.banished)}s`,0,-28);ctx.restore();continue;
      }
      ctx.scale(Math.cos(state.platformTime*w.speed+w.phase)>=0?1:-1,1);
      ctx.shadowColor="#c365ff";ctx.shadowBlur=18;
      for(let i=0;i<5;i++){
        ctx.globalAlpha=.32-i*.05;ctx.fillStyle="#b151ea";
        ctx.beginPath();ctx.ellipse(-18-i*11,Math.sin(state.time*6+i)*9,20-i*2,15-i*2,0,0,Math.PI*2);ctx.fill();
      }
      ctx.globalAlpha=1;ctx.fillStyle="#7e38aa";ctx.beginPath();
      ctx.moveTo(-25,8);ctx.quadraticCurveTo(-29,-30,0,-35);ctx.quadraticCurveTo(31,-27,25,8);
      ctx.lineTo(14,20);ctx.lineTo(4,13);ctx.lineTo(-6,23);ctx.closePath();ctx.fill();
      ctx.shadowBlur=0;ctx.fillStyle="#fff0af";ctx.fillRect(-12,-12,8,5);ctx.fillRect(6,-12,8,5);
      ctx.strokeStyle="#e5a6ff";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-24,5);ctx.quadraticCurveTo(-31,-26,0,-35);ctx.quadraticCurveTo(30,-26,25,6);ctx.stroke();
      ctx.restore();ctx.save();ctx.font="bold 11px system-ui";ctx.textAlign="center";ctx.fillStyle="#f3ceff";ctx.fillText("WISP · JUMP / DASH",w.x,y-50);ctx.restore();
    }
  }
  function drawSprite(image,x,y,w,h,facing=1,alpha=1){if(!image.complete)return;ctx.save();ctx.globalAlpha=alpha;ctx.translate(x+(facing<0?w:0),y);ctx.scale(facing,1);ctx.drawImage(image,0,0,w,h);ctx.restore();}
  function drawPlayerFrame(frame){if(!sprites.sheet.complete)return;const [cx,cy]=spriteAtlas[frame];const sw=sprites.sheet.naturalWidth/3,sh=sprites.sheet.naturalHeight/3;const dw=148,dh=148;ctx.save();ctx.translate(player.x+(player.facing<0?dw:0)-22,player.y+player.h-dh);ctx.scale(player.facing,1);ctx.drawImage(sprites.sheet,cx*sw,cy*sh,sw,sh,0,0,dw,dh);ctx.restore();}
  function drawPlayer(){ctx.save();if(ability.hurt>0)ctx.globalAlpha=.5+Math.sin(state.time*35)*.25;const moving=Math.abs(player.vx)>40;let frame="idle";if(player.dash)frame="dash";else if(!player.grounded)frame=player.vy<-120?"rise":player.vy>120?"fall":"apex";else if(moving)frame=Math.floor(state.time*9)%2?"runA":"runB";else if(state.mode==="won")frame="victory";drawPlayerFrame(frame);if(player.dash){ctx.strokeStyle="rgba(123,255,159,.55)";ctx.lineWidth=5;for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(player.x-player.facing*i*30,player.y+70+i*6);ctx.lineTo(player.x-player.facing*(i+2)*30,player.y+80+i*6);ctx.stroke();} }ctx.restore();}
  function drawRival(){if(rival.alpha<=0&&state.mode!=="cutscene")return;drawSprite(sprites.fallen,rival.x,rival.y,rival.w,rival.h,rival.facing,rival.alpha);ctx.fillStyle=`rgba(255,45,70,${rival.alpha*.22})`;ctx.beginPath();ctx.arc(rival.x+55,rival.y+85,100,0,Math.PI*2);ctx.fill();}
  function drawParticles(){for(const p of particles){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,5,5);}ctx.globalAlpha=1;}
  function drawProgress(){const p=Math.min(1,player.x/(WORLD_W-player.w));ctx.fillStyle="rgba(0,0,0,.6)";ctx.fillRect(340,H-25,600,8);ctx.fillStyle="#7eff97";ctx.fillRect(340,H-25,600*p,8);ctx.fillStyle="#e9c96c";ctx.fillRect(340+600*.42,H-29,4,16);ctx.font="900 11px system-ui";ctx.fillStyle="#c8ddcf";ctx.textAlign="center";ctx.fillText(state.tauntDone?"RAGE BAIT SURVIVED":"THE TRAIL",640,H-36);}
  function loop(now){const dt=loop.last==null?0:Math.max(0,Math.min(.033,(now-loop.last)/1000));loop.last=now;update(dt);draw();requestAnimationFrame(loop);}
  addEventListener("blur",clearInput);
  addEventListener("emeraldarcade:pause",clearInput);
  document.addEventListener("visibilitychange",()=>{if(document.hidden)clearInput();});
  addEventListener("keydown",e=>{
    if(window.EmeraldArcade?.isPaused?.()||e.ctrlKey||e.metaKey||e.altKey||e.target?.closest?.("input,select,textarea,[contenteditable],a,.arcade-runtime-dock,.arcade-runtime-modal"))return;
    const movement=["ArrowLeft","ArrowRight","KeyA","KeyD"].includes(e.code);
    if(movement&&["playing","escape","cutscene"].includes(state.mode)){e.preventDefault();keys.add(e.code);return;}
    if(state.mode==="cutscene"){if(e.code==="Enter"&&!e.repeat){e.preventDefault();advanceDialogue();}return;}
    if(!["playing","escape"].includes(state.mode))return;
    if(["Space","ArrowUp","KeyW"].includes(e.code)){e.preventDefault();if(!e.repeat)jump();}
    if(e.code==="KeyQ"&&!e.repeat){e.preventDefault();shiftRealm();}
    if(["ShiftLeft","ShiftRight"].includes(e.code)&&!e.repeat){e.preventDefault();dash();}
  });
  // Secondary fingers do not reliably produce compatibility clicks. Activate UI
  // buttons on touch release, then ignore only that gesture's duplicate click.
  function bindPress(button,action){
    let pointer=null,activatedByTouch=false;
    button.addEventListener("pointerdown",e=>{
      activatedByTouch=false;
      if(e.pointerType!=="touch"&&e.pointerType!=="pen")return;
      e.preventDefault();pointer=e.pointerId;
      try{button.setPointerCapture?.(pointer);}catch{/* Cancelled pointers are released below. */}
    });
    button.addEventListener("pointerup",e=>{
      if(pointer!==e.pointerId)return;
      pointer=null;e.preventDefault();
      const box=button.getBoundingClientRect?.();
      if(box&&(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom))return;
      activatedByTouch=true;action();
    });
    button.addEventListener("pointercancel",()=>{pointer=null;});
    button.addEventListener("lostpointercapture",()=>{pointer=null;});
    button.addEventListener("click",e=>{
      if(activatedByTouch&&(e.detail!==0||e.pointerType==="touch"||e.pointerType==="pen")){activatedByTouch=false;return;}
      activatedByTouch=false;action();
    });
  }
  addEventListener("keyup",e=>keys.delete(e.code));
  bindPress(ui.start,start);bindPress(ui.next,advanceDialogue);
  bindPress(ui.sound,()=>{state.sound=!state.sound;ui.sound.textContent=`Sound: ${state.sound?"on":"off"}`;ui.sound.setAttribute("aria-pressed",String(state.sound));});
  for(const button of document.querySelectorAll("[data-paradox-control]")){
    const action=button.dataset.paradoxControl;
    controlButtons.set(action,button);button.setAttribute("aria-pressed","false");
    button.addEventListener("pointerdown",e=>{
      e.preventDefault();
      if(window.EmeraldArcade?.isPaused?.()||!["playing","escape","cutscene"].includes(state.mode))return;
      touchPointers.set(e.pointerId,action);syncTouchButtons();
      try{button.setPointerCapture?.(e.pointerId);}catch{/* Cancellation still releases this pointer through the handlers below. */}
      if(action==="jump")jump();else if(action==="dash")dash();else if(action==="shift")shiftRealm();
    });
    const release=e=>{touchPointers.delete(e.pointerId);syncTouchButtons();};
    button.addEventListener("pointerup",release);button.addEventListener("pointercancel",release);button.addEventListener("lostpointercapture",release);
    // Keyboard activation remains available when a player tabs onto a control.
    button.addEventListener("click",e=>{
      if(e.detail!==0||window.EmeraldArcade?.isPaused?.())return;
      if(action==="jump")jump();else if(action==="dash")dash();else if(action==="shift")shiftRealm();
    });
  }
  bindPress(document.querySelector("#pauseToggle"),()=>window.EmeraldArcade?.setPaused?.(!window.EmeraldArcade?.isPaused?.()));
  addEventListener("emeraldarcade:pause",()=>{
    const paused=!!window.EmeraldArcade?.isPaused?.();
    document.querySelector("#pauseToggle").textContent=paused?"Resume":"Pause";
    document.querySelector("#pauseToggle").setAttribute("aria-pressed",String(paused));
  });
  window.__pepesParadoxDebug={
    getState:()=>{syncHud();return JSON.parse(canvas.dataset.debugState||"{}");},
    getWorld:()=>({platforms:solidPlatforms().map(p=>({x:p.x,y:p.y,w:p.w,moving:!!p.moving,realm:p.realm||null})),
      wisps:wisps.map(w=>({x:w.x,y:wispY(w),r:w.r,banished:w.banished})),
      collectibles:[...shards.map(o=>({...o,kind:"shard"})),...relics.map(o=>({...o,kind:"relic"})),...frogs.map(o=>({...o,kind:"frog"}))]})
  };
  const previewParams=new URLSearchParams(location.search);
  if(previewParams.has("taunt-preview")){start();player.x=2240;state.camera=1740;beginTaunt();}
  if(previewParams.has("platform-preview")){start();state.tauntDone=true;const p=platforms.find(item=>item.moving);player.x=p.x+32;player.y=p.y-player.h;player.grounded=true;state.camera=Math.max(0,player.x-W*.36);}
  syncHud();requestAnimationFrame(loop);
})();
