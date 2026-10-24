import {realmTrack} from './realms.mjs';
import {parts,fresh,sanitize,cost,buy,createFlight,step,settle,MAX_UPGRADE_LEVEL} from './sim.mjs';
import {worldAt,worlds,createWorldRenderer} from './worlds.mjs';
import {Director,clamp,smooth,lerp,rigPose} from './presentation.mjs';
import {Effects} from './effects.mjs';
import {createActor} from './actor.mjs';
import {Soundscape} from './audio.mjs';

const $=id=>document.getElementById(id);
const canvas=$('flight'),ctx=canvas.getContext('2d'),stage=$('stage');
const renderer=createWorldRenderer(),actor=createActor(),fx=new Effects(),director=new Director(),audio=new Soundscape();
const KEY='pepe-one-more-launch-v1';
document.querySelector('.world-route').innerHTML=[...worlds].reverse().map(w=>`<span data-world="${w.id}" title="${w.name} · ${w.at.toLocaleString()} m"><i></i><b>${w.id==='beyond'?'THE BEYOND':w.name.replace(/^THE /,'')}</b><small>${w.end===Infinity?'ENDLESS':w.at===0?'HOME':w.at.toLocaleString()+' m'}</small></span>`).join('');
let save=fresh();try{save=sanitize(JSON.parse(localStorage.getItem(KEY)));}catch{}
const blast=new Image();let blastLoaded=false;blast.src='assets/explosion-atlas-v2.png';
const blastReady=blast.decode().then(()=>{blastLoaded=true;return true;}).catch(()=>false);
let flight=null,last=0,time=0,W=900,H=700,boostHeld=false,boost=0,fear=0,steer=0,drift=0,viewAlt=0;
let reward=0,death={x:0,y:0},returnAlt=0,zone='lily',zoneAge=10,paused=false,assetsReady=false,upgradeGlow=0;
let gentle=matchMedia('(prefers-reduced-motion: reduce)').matches;
let bannerTimer=0,lastCount=-1,lastHud=0,wasPowered=false;

function persist(){try{localStorage.setItem(KEY,JSON.stringify(save));}catch{$('save').textContent='Save unavailable — this session only.';}}
function hangar(open){$('hangar').hidden=!open;$('hangarToggle').setAttribute('aria-expanded',String(open));}
function announce(kicker,title,detail,duration=2.4){$('bannerKicker').textContent=kicker;$('bannerTitle').textContent=title;$('bannerText').textContent=detail;bannerTimer=duration;$('banner').classList.add('visible');}
function updateShop(){
  $('cash').textContent=save.cash.toLocaleString();$('best').textContent=save.best.toLocaleString()+' m';$('flightNo').textContent=String(save.flights+1).padStart(2,'0');
  $('shipTier').textContent=save.engine>=3?'MK II / EMERALD THUNDER':'MK I / LILY HOPPER';$('shipName').textContent=save.engine>=3?'The Worse Idea':'The Bad Idea';
  $('modules').textContent=`ENGINE ${save.engine} · FUEL ${save.tank} · COOLING ${save.cooling}`;
  $('shop').replaceChildren(...parts.map(p=>{
    const b=document.createElement('button');b.className='upgrade';b.disabled=director.phase!=='pad'||save.cash<cost(save,p)||save[p.id]>=MAX_UPGRADE_LEVEL;
    b.innerHTML=`<b>${p.name}</b><span>${p.desc}</span><i>${save[p.id]>=MAX_UPGRADE_LEVEL?'MAX LEVEL':`$${cost(save,p)} · LEVEL ${save[p.id]} → ${save[p.id]+1}`}</i>`;
    b.onclick=()=>{if(director.phase==='pad'&&buy(save,p.id)){persist();updateShop();upgradeGlow=1;audio.cue(500,.18);announce('SHIPYARD / INSTALLED',p.id==='engine'?'MORE ENGINE. LESS SENSE.':p.id==='tank'?'A BIGGER EXPLOSION BUDGET.':'COOLER HEADS. SAME FROG.','YOUR NEXT FLIGHT USES THE NEW HARDWARE.',1.7);}};
    return b;
  }));
  const next=worlds.find(w=>w.at>save.best);$('goal').textContent=next?`${next.name} · ${next.at.toLocaleString()} m`:'The void has no ceiling. Neither does the repair bill.';
}
function controls(){
  const grounded=director.phase==='pad';
  $('launch').hidden=!grounded;$('boost').hidden=grounded;$('launch').disabled=!assetsReady;
  $('boost').disabled=director.phase!=='flight';$('left').disabled=director.phase!=='flight';$('right').disabled=director.phase!=='flight';
  $('hangarToggle').disabled=!grounded;stage.dataset.phase=director.phase;
}
function start(){
  if(director.phase!=='pad'||!assetsReady)return;
  flight=createFlight(save);boostHeld=false;boost=0;fear=0;steer=0;drift=0;viewAlt=0;wasPowered=false;zone='lily';zoneAge=10;lastCount=-1;
  fx.particles=[];fx.rings=[];$('result').hidden=true;hangar(false);director.enter('countdown');controls();updateShop();
}
function stop(){boostHeld=false;steer=0;}
function pause(value){paused=value;stop();$('pauseOverlay').hidden=!value;$('pause').textContent=value?'▶':'Ⅱ';$('pause').setAttribute('aria-label',value?'Resume game':'Pause game');audio.update({powered:false,boost:0,paused:value});last=0;}
$('launch').onclick=start;$('pause').onclick=()=>pause(!paused);$('resume').onclick=()=>pause(false);
$('sound').onclick=()=>{$('sound').textContent=audio.toggle()?'SOUND ON':'SOUND OFF';};
$('motion').onclick=()=>{gentle=!gentle;$('motion').textContent=gentle?'FX: GENTLE':'FX: FULL';};
$('hangarToggle').onclick=()=>hangar($('hangar').hidden);$('closeHangar').onclick=()=>hangar(false);
function holdButton(id,down,up){const b=$(id);b.onpointerdown=e=>{if(director.phase==='flight'){b.setPointerCapture(e.pointerId);down();}};b.onpointerup=up;b.onpointercancel=up;b.onlostpointercapture=up;}
holdButton('boost',()=>boostHeld=true,()=>boostHeld=false);
holdButton('left',()=>steer=-1,()=>steer=0);
holdButton('right',()=>steer=1,()=>steer=0);
window.addEventListener('blur',stop);
document.addEventListener('visibilitychange',()=>{stop();last=0;if(document.hidden&&['countdown','flight','boom','return','rebuild'].includes(director.phase))pause(true);});
window.addEventListener('keydown',e=>{
  if(e.target.matches('input,select,textarea')||['sound','motion','pause','resume','closeHangar','hangarToggle'].includes(e.target.id))return;
  if(e.code==='Escape'){if(!$('hangar').hidden)hangar(false);else pause(!paused);return;}
  if(paused)return;
  if(['Space','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  if(e.code==='Space'&&!e.repeat){if(director.phase==='pad')start();else if(director.phase==='flight')boostHeld=true;}
  if(['KeyA','ArrowLeft'].includes(e.code))steer=-1;if(['KeyD','ArrowRight'].includes(e.code))steer=1;
});
window.addEventListener('keyup',e=>{if(e.code==='Space')boostHeld=false;if(['KeyA','KeyD','ArrowLeft','ArrowRight'].includes(e.code))steer=0;});

function explode(pose){
  death={x:pose.x,y:pose.y};reward=settle(save,flight);persist();director.enter('boom');
  fx.explode(death.x,death.y,worldAt(flight.alt).color);boostHeld=false;audio.cue(55,1.2);announce('FLIGHT STATUS / TECHNICALLY STILL SCIENCE','KEK-ABOOM.','THE CROWN HAS DECLINED TO PARTICIPATE.',2.4);updateShop();controls();
}
function report(){
  $('result').hidden=false;
  $('result').innerHTML=`<small>FLIGHT ${String(save.flights).padStart(2,'0')} / RECOVERED</small><b>THE CROWN SURVIVED.<br>THE BUDGET DID NOT.</b><p>${flight.reason}<br>${Math.floor(flight.peak).toLocaleString()} m reached · ship rebuilt</p><div class="payout">+$${reward}</div><button id="reportUpgrade">PUT THE GRANT TO BAD USE ↗</button>`;
  $('reportUpgrade').onclick=()=>hangar(true);
}
function events(){
  for(const event of director.drain()){
    controls();
    if(event==='flight'){
      fx.ignition(W*.5,H*.76);audio.cue(100,.7);announce('LILY MARSH / DEPARTURE','WE HAVE A FROG OFF.','THE NEIGHBORS HAVE FILED A COMPLAINT.',1.8);
    }else if(event==='return'){
      returnAlt=viewAlt;fx.rings=[];announce('RECOVERY / ZERO LESSONS LEARNED','ROYAL EXPRESS RETURN.','LILY-LEAF PARACHUTE. EMOTIONAL DAMAGE.',2.2);
    }else if(event==='rebuild'){
      viewAlt=0;fx.particles=[];announce('LILY MARSH / SHIPYARD','REASSEMBLING THE PROBLEM.','A FEW BOLTS. A LOT OF OPTIMISM.',1.8);audio.cue(240,.25);
    }else if(event==='pad'){
      report();flight=null;viewAlt=0;fear=0;boost=0;drift=0;updateShop();controls();
    }
  }
}

function drawBlast(age){
  const {x,y}=death;
  if(blastLoaded&&age<2.7){
    const index=age<.12?0:age<.4?1:age<1.2?2:3,cuts=[[0,.185],[.185,.455],[.455,.765],[.765,1]];
    const sx=cuts[index][0]*blast.width,sw=(cuts[index][1]-cuts[index][0])*blast.width,size=Math.min(W*.8,510)*(index===0?.45:index===1?.8:1);
    ctx.save();ctx.globalAlpha=age>1.8?clamp(1-(age-1.8)/.9):1;ctx.drawImage(blast,sx,0,sw,blast.height,x-size/2,y-size*.64,size,size);ctx.restore();
  }
  actor.wreck(ctx,death,age*.8,save.engine);
  if(age>.35&&age<3.2){
    const t=age-.35;ctx.save();ctx.translate(x+Math.sin(t*1.8)*72,y-110-t*100+t*t*65);ctx.rotate(t*3);actor.crown(ctx,0,0,1);ctx.restore();
  }
  if(age<.15&&!gentle){ctx.fillStyle=`rgba(255,244,207,${.45*(1-age/.15)})`;ctx.fillRect(0,0,W,H);}
}
function drawRebuild(pose){
  const t=smooth(director.age/2);

  ctx.save();ctx.globalAlpha=t;
  actor.drawRig(ctx,{...pose,y:pose.y+(1-t)*65},{time,active:false,boost:0,heat:0,engine:save.engine,tank:save.tank,cooling:save.cooling,fear:0,build:t});ctx.restore();
  for(let i=0;i<6;i++){
    const side=i%2?1:-1,xx=lerp(pose.x+side*(W*.38),pose.x+side*31,t),yy=lerp(pose.y-150+i*25,pose.y-45+i*12,t);
    ctx.save();ctx.globalAlpha=1-t;ctx.translate(xx,yy);ctx.rotate((1-t)*i*3);ctx.fillStyle=i%2?'#c8aa5a':'#33644e';ctx.fillRect(-8,-6,16,12);ctx.restore();
  }
}
function hud(world){
  const alt=['return','rebuild'].includes(director.phase)?viewAlt:flight?.alt||0,fuel=flight?.fuel??100,heat=flight?.heat??0;
  $('alt').innerHTML=`${Math.floor(alt).toLocaleString()}<span>m</span>`;
  $('fuel').value=fuel;$('heat').value=heat;$('fuelText').textContent=`${Math.ceil(fuel)}%`;$('heatText').textContent=`${Math.floor(heat)}%`;
  $('worldName').textContent=world.name;$('worldName').style.color=world.color;
  const sector=realmTrack(viewAlt).sector;
  const progress=world.end===Infinity?((viewAlt-world.at)/world.sectorMeters)%1:clamp((viewAlt-world.at)/(world.end-world.at));
  const chapter=world.stages[Math.min(world.stages.length-1,Math.floor(progress*world.stages.length))];
  $('worldIndex').textContent=String(worlds.indexOf(world)+1).padStart(2,'0')+' / '+chapter+(world.id==='everafter'?' / SECTOR '+String(sector).padStart(3,'0'):'');
  $('ascentFill').style.width=`${Math.round(progress*100)}%`;
  const next=worlds[worlds.indexOf(world)+1];
  $('nextRealm').textContent=next?`NEXT: ${next.name.replace(/^THE /,'')} · ${Math.max(0,Math.ceil(next.at-viewAlt)).toLocaleString()} m`:`SECTOR ${String(sector+1).padStart(3,'0')} · ${Math.ceil(world.sectorMeters*(1-progress)).toLocaleString()} m`;
  $('callout').textContent=director.phase==='return'?'RETURNING ONE SLIGHTLY USED MONARCH.':director.phase==='rebuild'?'ALL ORIGINAL BAD DECISIONS RETAINED.':heat>75?'RELEASE BOOST. YOUR MAJESTY IS BECOMING SOUP.':world.tag;
  $('pilotStatus').textContent=paused?'FLIGHT HELD. CROWN STILL SECURE.':director.phase==='boom'?'SHIP: NO. CROWN: YES.':director.phase==='return'?'ROYAL PARACHUTE DEPLOYED.':director.phase==='rebuild'?'REATTACHING THE BAD IDEA.':director.phase==='countdown'?'HARNESS TIGHT. INSURANCE DECLINED.':fuel<=0&&flight?'ENGINE OUT. COASTING ON CONFIDENCE.':heat>75?'CORE HOT. RELEASE BOOST.':boostHeld?'YOUR MAJESTY REGRETS EVERYTHING.':'CROWN SECURED. JUDGMENT QUESTIONABLE.';
  document.querySelectorAll('[data-world]').forEach(el=>{const w=worlds.find(w=>w.id===el.dataset.world);el.classList.toggle('discovered',save.best>=w.at);el.classList.toggle('current',world.id===w.id);});
  stage.dataset.world=world.id;stage.dataset.phase=director.phase;
}
function frame(ms){
  const elapsed=last?Math.min((ms-last)/1000,.08):0;last=ms;
  const dt=paused?0:elapsed;time+=dt;zoneAge+=dt;upgradeGlow=Math.max(0,upgradeGlow-dt);bannerTimer=Math.max(0,bannerTimer-dt);if(!bannerTimer)$('banner').classList.remove('visible');
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,2);
  if(W!==rect.width||H!==rect.height||canvas.width!==Math.round(rect.width*dpr)||canvas.height!==Math.round(rect.height*dpr)){W=rect.width;H=rect.height;canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);}
  ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);ctx.imageSmoothingEnabled=false;
  director.advance(dt);events();
  boost=lerp(boost,boostHeld?1:0,1-Math.exp(-dt*9));
  if(director.phase==='flight'&&!paused){
    // Substeps keep the simulation stable without tying it to display frame rate.
    let remaining=dt;while(remaining>0&&!flight.dead){const stepDt=Math.min(remaining,1/120);step(flight,stepDt,boostHeld);remaining-=stepDt;}
    drift=clamp(drift+steer*dt*125,-W*.24,W*.24);
    viewAlt=lerp(viewAlt,flight.alt,1-Math.exp(-dt*5));
  }else if(director.phase==='return')viewAlt=lerp(returnAlt,0,smooth(director.age/3.2));
  const pose=rigPose({width:W,height:H,drift,time,steer,boost,altitude:viewAlt,phase:director.phase,age:director.age});
  if(director.phase==='flight'&&flight.dead)explode(pose);
  const powered=director.phase==='flight'&&flight.fuel>0;
  const charge=director.phase==='countdown'?smooth((director.age-1.3)/1.1):0;
  fear=lerp(fear,clamp((flight?.heat||0)/110+boost*.7),1-Math.exp(-dt*5));
  if(powered&&!paused){for(const anchor of actor.exhaustAnchors(pose,save.engine))fx.exhaust(anchor.x,anchor.y,boost>.5,dt/nozzleCount());}
  if(wasPowered&&!powered&&director.phase==='flight')announce('PROPULSION / TAKING A BREAK','COASTING ON CONFIDENCE.','NO FUEL. NO PLAN. STILL GOING UP.',1.8);wasPowered=powered;
  if(director.phase==='countdown'){
    const n=3-Math.min(2,Math.floor(director.age/.8));
    if(n!==lastCount){lastCount=n;audio.cue(200+n*85,.12);announce(['INSURANCE: DECLINED','COMMON SENSE: REMOVED','CROWN: SECURED'][n-1],`${n}`,n===1?'COMMITTING TO THE BIT.':n===2?'PLEASE KEEP ALL LIMBS OUTSIDE.':'ONE FROG. AN ENTIRELY AVOIDABLE INCIDENT.',.82);}
  }
  const world=worldAt(viewAlt);
  if(world.id!==zone){zone=world.id;zoneAge=0;if(director.phase==='flight'){announce(`EXPEDITION / ${worlds.indexOf(world)+1} OF ${worlds.length}`,world.name,world.tag,2.6);audio.cue(world.id==='beyond'?640:420,.4);}}
  const shake=gentle?0:director.phase==='boom'?clamp(1-director.age/1.1)*12:director.phase==='flight'&&director.age<1.3?(1-director.age/1.3)*8:charge*1.8+boost*1.1;
  ctx.save();ctx.translate(Math.sin(time*91)*shake,Math.cos(time*103)*shake*.6);
  renderer.draw(ctx,W,H,viewAlt,time,flight?.velocity||0,charge>.4||director.phase==='flight'&&director.age<1.5,{cameraX:drift});
  if((director.phase==='pad'||director.phase==='countdown')&&viewAlt<1){
    const retract=director.phase==='countdown'?smooth((director.age-1.5)/.7):0;
    ctx.save();ctx.globalAlpha=1-retract;
    for(const side of [-1,1]){
      const px=pose.x+side*(91+retract*45)*pose.scale,top=pose.y+19*pose.scale,bottom=H*.81;
      ctx.fillStyle='#16332c';ctx.fillRect(px-7,top,14,bottom-top);
      ctx.fillStyle='#9e955f';ctx.fillRect(px-5,top,10,7);ctx.fillRect(px-13,bottom-5,26,6);
      ctx.strokeStyle='#b6a975';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(px,top+10);ctx.lineTo(pose.x+side*66*pose.scale,top+10);ctx.stroke();
    }ctx.restore();
  }
  if(director.phase==='pad'||director.phase==='countdown'||director.phase==='flight'){
    actor.drawRig(ctx,pose,{time,active:powered,boost,heat:flight?.heat||0,engine:save.engine,tank:save.tank,cooling:save.cooling,charge,fear,build:1});
    if(upgradeGlow>0){ctx.save();ctx.globalAlpha=upgradeGlow*.2;ctx.strokeStyle='#d4f591';ctx.lineWidth=3;ctx.strokeRect(pose.x-85*pose.scale,pose.y-175*pose.scale,170*pose.scale,245*pose.scale);ctx.restore();}
  }else if(director.phase==='boom')drawBlast(director.age);
  else if(director.phase==='return')actor.pilot(ctx,W*.5+Math.sin(time*1.4)*22,H*.6,{time,fear:.4,scale:pose.scale,parachute:true});
  else if(director.phase==='rebuild')drawRebuild({...pose,x:W*.5});
  fx.draw(ctx,dt);renderer.foreground(ctx,W,H,viewAlt,time,flight?.velocity||0);ctx.restore();
  audio.update({powered,boost,charge,paused});$('boost').classList.toggle('held',boostHeld);
  if(ms-lastHud>80||!lastHud){hud(world);lastHud=ms;}
  requestAnimationFrame(frame);
}
function nozzleCount(){return save.engine>=3?3:1;}
$('motion').textContent=gentle?'FX: GENTLE':'FX: FULL';updateShop();controls();
Promise.all([renderer.ready,actor.ready,blastReady]).then(([bg,character,explosion])=>{assetsReady=true;$('artStatus').textContent=bg.every(x=>x.loaded)&&character&&explosion?'ALL SYSTEMS QUESTIONABLE':'ART FALLBACK ACTIVE';controls();});
requestAnimationFrame(frame);
