(() => {
  const canvas = document.querySelector("#paradoxCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height, WORLD_W = 5400, FLOOR = 610;
  const ui = {
    overlay: document.querySelector("#startOverlay"), start: document.querySelector("#startButton"),
    dialogue: document.querySelector("#dialogue"), next: document.querySelector("#dialogueNext"),
    text: document.querySelector("#dialogueText"), name: document.querySelector("#speakerName"),
    portrait: document.querySelector("#speakerPortrait"), sound: document.querySelector("#soundToggle"),
    shards: document.querySelector("#shardCount"), relics: document.querySelector("#relicCount"), frogs: document.querySelector("#frogCount"),
  };
  const loadImage = (src) => { const image = new Image(); image.src = src; return image; };
  const sprites = { sheet:loadImage("assets/pepes-paradox/crown-platformer-sheet.png"), collectibles:loadImage("assets/pepes-paradox/paradox-collectibles.png"), bamboo:loadImage("assets/pepes-paradox/bamboo-mountains-loop.png"), fallen:loadImage("assets/pepe-relic-rumble/fallen-idle.png") };
  const spriteAtlas = { idle:[0,0],runA:[1,0],runB:[2,0],rise:[0,1],apex:[1,1],fall:[2,1],dash:[0,2],hurt:[1,2],victory:[2,2] };
  const keys = new Set();
  const state = { mode:"ready", time:0, camera:0, sound:true, cutsceneStep:0, cutsceneClock:0, tauntDone:false, finished:false };
  const player = { x:180, y:FLOOR-154, w:104, h:154, vx:0, vy:0, grounded:true, facing:1, shards:0, relics:0, frogs:0, dash:0 };
  const rival = { x:2740, y:FLOOR-165, w:112, h:165, facing:-1, alpha:0 };
  const platforms = [
    {x:0,y:FLOOR,w:900,h:110},{x:1020,y:565,w:520,h:155},{x:1660,y:610,w:940,h:110},
    {x:2730,y:610,w:780,h:110},{x:3630,y:565,w:500,h:155},{x:4250,y:610,w:1150,h:110},
    {x:700,y:470,w:170,h:24,moving:true,baseX:700,amplitude:115,speed:1.1,phase:0,dx:0},{x:1270,y:410,w:180,h:24,moving:true,baseX:1270,amplitude:90,speed:1.35,phase:2,dx:0},{x:1900,y:455,w:210,h:24,moving:true,baseX:1900,amplitude:150,speed:.9,phase:4,dx:0},{x:3850,y:400,w:180,h:24,moving:true,baseX:3850,amplitude:120,speed:1.2,phase:1,dx:0},
  ];
  const shards = [560,760,1110,1320,1780,2020,2350,2940,3260,3770,4070,4680].map((x,i)=>({x,y:(i%3===1?390:510),got:false}));
  const relics = [{x:1430,y:345,got:false},{x:4050,y:335,got:false}];
  const frogs = [{x:850,y:535,got:false}];
  const wisps = [{x:1180,y:520,r:30},{x:2260,y:560,r:30},{x:3910,y:520,r:32}];
  const particles = [];
  const dialogue = [
    {name:"Fallen Pepe", text:"You really climbed the whole mountain for one trail of emerald dust?", portrait:"assets/pepe-relic-rumble/fallen-idle.png"},
    {name:"Fallen Pepe", text:"You'll never get Pepina back! LMAOOOOOO.", portrait:"assets/pepe-relic-rumble/fallen-special.png"},
    {name:"Fallen Pepe", text:"Finish the stage if you want the next clue. Try not to rage quit, hero.", portrait:"assets/pepe-relic-rumble/fallen-walk.png"},
  ];
  let audio;

  function tone(freq=330,duration=.08,type="sine",gain=.045){
    if(!state.sound) return; audio ||= new (window.AudioContext||window.webkitAudioContext)();
    const o=audio.createOscillator(),g=audio.createGain(); o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(gain,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+duration);
  }
  function start(){
    window.EmeraldArcade?.beginSession("paradox","pepes-paradox.html");
    Object.assign(player,{x:180,y:FLOOR-154,vx:0,vy:0,grounded:true,shards:0,relics:0,frogs:0,dash:0});
    Object.assign(state,{mode:"playing",time:0,camera:0,cutsceneStep:0,tauntDone:false,finished:false});
    [...shards,...relics,...frogs].forEach(o=>o.got=false); ui.overlay.classList.add("is-hidden"); ui.dialogue.hidden=true; syncHud(); tone(220,.15,"triangle");
  }
  function jump(){ if(state.mode==="playing"&&player.grounded){player.vy=-740;player.grounded=false;tone(440,.08,"triangle");} }
  function dash(){ if(state.mode==="playing"&&player.dash<=0){player.dash=.24;player.vx=player.facing*720;tone(170,.12,"sawtooth",.03);burst(player.x+player.w/2,player.y+player.h/2,"#9affac",16);} }
  function beginTaunt(){ state.mode="cutscene";state.cutsceneStep=0;state.cutsceneClock=0;rival.x=player.x+720;rival.alpha=1;player.vx=0;showLine();tone(85,.35,"sawtooth",.025); }
  function showLine(){ const line=dialogue[state.cutsceneStep];ui.name.textContent=line.name;ui.text.textContent=line.text;ui.portrait.src=line.portrait;ui.dialogue.hidden=false; }
  function advanceDialogue(){
    if(state.mode!=="cutscene") return; state.cutsceneStep++;
    if(state.cutsceneStep<dialogue.length){showLine();tone(120+state.cutsceneStep*35,.08,"square",.02);return;}
    ui.dialogue.hidden=true;state.mode="escape";state.cutsceneClock=0;state.tauntDone=true;tone(520,.1,"triangle");
  }
  function finish(){ if(state.finished)return;state.finished=true;state.mode="won";tone(523,.18);setTimeout(()=>tone(659,.18),180);setTimeout(()=>tone(784,.3),360);window.EmeraldArcade?.recordAndNotify("paradox",{score:player.shards*120+player.relics*600+player.frogs*1000,rank:"Mountain Pursuer",shards:player.shards,relics:player.relics,frogs:player.frogs,stage:2,played:true});ui.overlay.querySelector("p:first-child").textContent="Mountain Archive · Rage Bait Survived";ui.overlay.querySelector("h1").textContent="The Ancient Temple has opened.";ui.overlay.querySelectorAll("p")[1].textContent="The bamboo bells speak Pepina's name. Fallen escaped through the temple gate, but the recovered frog sigil remembers the path.";ui.start.textContent="Replay Bamboo Mountains";ui.overlay.classList.remove("is-hidden"); }
  function update(dt){
    state.time+=dt;
    if(state.mode==="escape"){rival.x+=660*dt;rival.alpha=Math.max(0,rival.alpha-dt*.28);state.cutsceneClock+=dt;if(state.cutsceneClock>1.5){state.mode="playing";}return;}
    if(state.mode!=="playing") return;
    const move=(keys.has("ArrowRight")||keys.has("KeyD")?1:0)-(keys.has("ArrowLeft")||keys.has("KeyA")?1:0);
    player.dash=Math.max(0,player.dash-dt);if(!player.dash)player.vx+=(move*390-player.vx)*Math.min(1,dt*11);if(move)player.facing=move;
    let carried=0;for(const p of platforms){if(!p.moving)continue;const oldX=p.x;p.x=p.baseX+Math.sin(state.time*p.speed+p.phase)*p.amplitude;p.dx=p.x-oldX;if(player.grounded&&Math.abs(player.y+player.h-p.y)<4&&player.x+player.w>oldX&&player.x<oldX+p.w)carried=p.dx;}
    player.vy+=1850*dt; const oldBottom=player.y+player.h;player.x=Math.max(0,Math.min(WORLD_W-player.w,player.x+player.vx*dt+carried));player.y+=player.vy*dt;player.grounded=false;
    for(const p of platforms){if(player.x+player.w>p.x&&player.x<p.x+p.w&&oldBottom<=p.y+12&&player.y+player.h>=p.y&&player.vy>=0){player.y=p.y-player.h;player.vy=0;player.grounded=true;}}
    if(player.y>H+100){player.x=Math.max(120,player.x-360);player.y=200;player.vy=0;tone(90,.25,"sawtooth");}
    for(const item of shards) collect(item,player.x+52,player.y+70,26,"shards");for(const item of relics) collect(item,player.x+52,player.y+70,34,"relics");for(const item of frogs) collect(item,player.x+52,player.y+70,38,"frogs");
    for(const w of wisps){const dx=player.x+52-w.x,dy=player.y+80-w.y;if(Math.hypot(dx,dy)<w.r+36){player.vx=-player.facing*380;player.vy=-390;w.x+=player.facing*150;tone(105,.18,"square",.03);}}
    if(!state.tauntDone&&player.x>2180)beginTaunt();if(player.x>5100)finish();
    state.camera=Math.max(0,Math.min(WORLD_W-W,player.x-W*.36));
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=260*dt;if(p.life<=0)particles.splice(i,1);}
  }
  function collect(item,px,py,r,key){if(item.got||Math.hypot(px-item.x,py-item.y)>r+42)return;item.got=true;player[key]++;burst(item.x,item.y,key==="relics"?"#ffd86c":"#72ff9b",18);tone(key==="relics"?760:620,.1,"sine");syncHud();}
  function burst(x,y,color,count){for(let i=0;i<count;i++)particles.push({x,y,vx:(Math.random()-.5)*260,vy:-Math.random()*260,life:.45+Math.random()*.5,color});}
  function syncHud(){ui.shards.textContent=`${player.shards} / ${shards.length}`;ui.relics.textContent=`${player.relics} / ${relics.length}`;ui.frogs.textContent=`${player.frogs} / ${frogs.length}`;canvas.dataset.debugState=JSON.stringify({mode:state.mode,x:Math.round(player.x),y:Math.round(player.y),camera:Math.round(state.camera),tauntDone:state.tauntDone,shards:player.shards,relics:player.relics,frogs:player.frogs,movingPlatforms:platforms.filter(p=>p.moving).map(p=>({x:Math.round(p.x),y:p.y}))});}
  function draw(){ctx.clearRect(0,0,W,H);drawSky();ctx.save();ctx.translate(-state.camera,0);drawWorld();drawItems();drawWisps();drawRival();drawPlayer();drawParticles();ctx.restore();drawProgress();syncHud();}
  function drawSky(){if(sprites.bamboo.complete&&sprites.bamboo.naturalWidth){const dw=H*(sprites.bamboo.naturalWidth/sprites.bamboo.naturalHeight),offset=-((state.camera*.18)%dw);for(let x=offset-dw;x<W+dw;x+=dw)ctx.drawImage(sprites.bamboo,x,0,dw,H);}else{ctx.fillStyle="#062018";ctx.fillRect(0,0,W,H);}const mist=ctx.createLinearGradient(0,200,0,H);mist.addColorStop(0,"rgba(3,28,24,.05)");mist.addColorStop(1,"rgba(0,7,4,.5)");ctx.fillStyle=mist;ctx.fillRect(0,0,W,H);}
  function drawWorld(){for(const p of platforms){const g=ctx.createLinearGradient(0,p.y,0,p.y+Math.min(p.h,70));g.addColorStop(0,p.moving?"#90f18a":"#5dd879");g.addColorStop(.12,"#245c39");g.addColorStop(1,"#08170f");ctx.fillStyle=g;ctx.fillRect(p.x,p.y,p.w,p.h);ctx.strokeStyle=p.moving?"rgba(224,207,107,.8)":"rgba(117,255,137,.45)";ctx.lineWidth=p.moving?4:2;ctx.strokeRect(p.x,p.y,p.w,p.h);for(let x=p.x+18;x<p.x+p.w-18;x+=48){ctx.strokeStyle="rgba(189,255,164,.18)";ctx.strokeRect(x,p.y+12,27,20);}if(p.moving){ctx.fillStyle="rgba(229,204,99,.85)";ctx.fillRect(p.x+12,p.y+7,p.w-24,3);}}ctx.fillStyle="#b2ff8d";ctx.fillRect(5240,310,18,300);ctx.shadowColor="#82ff91";ctx.shadowBlur=25;ctx.strokeStyle="#82ff91";ctx.lineWidth=7;ctx.strokeRect(5178,300,145,310);ctx.shadowBlur=0;}
  function diamond(x,y,size,color){ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4+state.time);ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=16;ctx.fillRect(-size/2,-size/2,size,size);ctx.restore();}
  function drawAtlasItem(cellX,cellY,x,y,size){if(!sprites.collectibles.complete)return;const cw=sprites.collectibles.naturalWidth/3,ch=sprites.collectibles.naturalHeight/2;ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(state.time*2+x)*.05);ctx.shadowColor="#74ff9d";ctx.shadowBlur=16;ctx.drawImage(sprites.collectibles,cellX*cw,cellY*ch,cw,ch,-size/2,-size/2,size,size);ctx.restore();}
  function drawItems(){for(const s of shards)if(!s.got)drawAtlasItem(0,0,s.x,s.y+Math.sin(state.time*3+s.x)*8,76);for(const r of relics)if(!r.got)drawAtlasItem(1,0,r.x,r.y,92);for(const f of frogs)if(!f.got)drawAtlasItem(2,0,f.x,f.y,82);}
  function drawWisps(){for(const w of wisps){ctx.fillStyle="rgba(195,70,255,.7)";ctx.shadowColor="#bd46ff";ctx.shadowBlur=22;ctx.beginPath();ctx.arc(w.x,w.y+Math.sin(state.time*4+w.x)*15,w.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}}
  function drawSprite(image,x,y,w,h,facing=1,alpha=1){if(!image.complete)return;ctx.save();ctx.globalAlpha=alpha;ctx.translate(x+(facing<0?w:0),y);ctx.scale(facing,1);ctx.drawImage(image,0,0,w,h);ctx.restore();}
  function drawPlayerFrame(frame){if(!sprites.sheet.complete)return;const [cx,cy]=spriteAtlas[frame];const sw=sprites.sheet.naturalWidth/3,sh=sprites.sheet.naturalHeight/3;const dw=148,dh=148;ctx.save();ctx.translate(player.x+(player.facing<0?dw:0)-22,player.y+player.h-dh);ctx.scale(player.facing,1);ctx.drawImage(sprites.sheet,cx*sw,cy*sh,sw,sh,0,0,dw,dh);ctx.restore();}
  function drawPlayer(){const moving=Math.abs(player.vx)>40;let frame="idle";if(player.dash)frame="dash";else if(!player.grounded)frame=player.vy<-120?"rise":player.vy>120?"fall":"apex";else if(moving)frame=Math.floor(state.time*9)%2?"runA":"runB";else if(state.mode==="won")frame="victory";drawPlayerFrame(frame);if(player.dash){ctx.strokeStyle="rgba(123,255,159,.55)";ctx.lineWidth=5;for(let i=1;i<4;i++)ctx.strokeRect(player.x-player.facing*i*38,player.y+28,player.w,player.h-45);}}
  function drawRival(){if(rival.alpha<=0&&state.mode!=="cutscene")return;drawSprite(sprites.fallen,rival.x,rival.y,rival.w,rival.h,rival.facing,rival.alpha);ctx.fillStyle=`rgba(255,45,70,${rival.alpha*.22})`;ctx.beginPath();ctx.arc(rival.x+55,rival.y+85,100,0,Math.PI*2);ctx.fill();}
  function drawParticles(){for(const p of particles){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,5,5);}ctx.globalAlpha=1;}
  function drawProgress(){const p=Math.min(1,player.x/(WORLD_W-player.w));ctx.fillStyle="rgba(0,0,0,.6)";ctx.fillRect(340,H-25,600,8);ctx.fillStyle="#7eff97";ctx.fillRect(340,H-25,600*p,8);ctx.fillStyle="#e9c96c";ctx.fillRect(340+600*.42,H-29,4,16);ctx.font="900 11px system-ui";ctx.fillStyle="#c8ddcf";ctx.textAlign="center";ctx.fillText(state.tauntDone?"RAGE BAIT SURVIVED":"THE TRAIL",640,H-36);}
  function loop(now){const dt=Math.min(.033,(now-(loop.last||now))/1000);loop.last=now;update(dt);draw();requestAnimationFrame(loop);}
  addEventListener("keydown",e=>{keys.add(e.code);if(["Space","ArrowUp","KeyW"].includes(e.code)){e.preventDefault();jump();}if(["ShiftLeft","ShiftRight"].includes(e.code))dash();if(e.code==="Enter")advanceDialogue();});
  addEventListener("keyup",e=>keys.delete(e.code));ui.start.addEventListener("click",start);ui.next.addEventListener("click",advanceDialogue);ui.sound.addEventListener("click",()=>{state.sound=!state.sound;ui.sound.textContent=`Sound: ${state.sound?"on":"off"}`;ui.sound.setAttribute("aria-pressed",String(state.sound));});
  window.__pepesParadoxDebug={getState:()=>JSON.parse(canvas.dataset.debugState||"{}")};
  const previewParams=new URLSearchParams(location.search);
  if(previewParams.has("taunt-preview")){start();player.x=2240;state.camera=1740;beginTaunt();}
  if(previewParams.has("platform-preview")){start();state.tauntDone=true;const p=platforms.find(item=>item.moving);player.x=p.x+32;player.y=p.y-player.h;player.grounded=true;state.camera=Math.max(0,player.x-W*.36);}
  syncHud();requestAnimationFrame(loop);
})();
