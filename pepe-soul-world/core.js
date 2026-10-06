import {stepTempleEnemy,staggerTempleEnemy} from './temple-combat.js';
// Deterministic simulation. Rendering, audio and browser storage stay outside this module.
import {sanitizeProgress,levelFor,stats,addItem} from './systems.js';
import {RIFT,riftHit} from './kek-rift.js';
import {eliteSpec} from './realm-enemies.js';
export {levelFor} from './systems.js';
export const SAVE_KEY = 'pepe-soul-world-v1';
export const GROUND = 590;
export const WIDTH = 2600;
// Prototype timing: allow a short deliberate pause between committed cuts.
export const COMBO_GRACE = .65;
export const WORLDS = Object.freeze([
  {id:'academy',name:'Kek Academy',subtitle:'The lanterns remember your name',color:'#a4dfb8',symbol:'門',enemy:'Practice effigy',boss:'',art:'academy'},
  {id:'frozen',name:'Frozen District',subtitle:'An oath buried beneath the frost',color:'#9cddff',symbol:'❄',enemy:'Frostbound Tad',boss:'The Rime Warden',art:'frozen'},
  {id:'crimson',name:'Crimson Marsh',subtitle:'Where broken promises take root',color:'#f1a08b',symbol:'✧',enemy:'Ashen Ronin',boss:'The Ember Keeper',art:'crimson'},
  {id:'temple',name:'Emerald Temple',subtitle:'The jade oath watches from within',color:'#63ffc0',symbol:'蓮',enemy:'Jade Disciple',boss:'The Jade Abbot',art:'temple'},
  {id:'void',name:'Void Swamp',subtitle:'Something beyond the veil is listening',color:'#c5a2f3',symbol:'◈',enemy:'Lost One',boss:'The Unnamed',art:'void'},
]);
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
export function readSave(value) {
  if (!value || ![1,2].includes(value.version) || typeof value !== 'object') return null;
  const progress=sanitizeProgress(value),oath=value.oath===true,training=clamp(Number.isFinite(value.training)?Math.floor(value.training):0,0,3);
  return {version:2,...progress,zone:value.zone==='arena'&&Array.isArray(value.approachCleared)&&[1,2,3].every(id=>value.approachCleared.includes(id))?'arena':value.zone==='approach2'&&Array.isArray(value.approachCleared)&&[1,2,3].every(id=>value.approachCleared.includes(id))?'approach2':'approach',approachCleared:[...new Set((Array.isArray(value.approachCleared)?value.approachCleared:[]).filter(id=>[1,2,3,5,6,7].includes(id)))],guardianDefeated:value.guardianDefeated===true,oath,training,seals:[...new Set(Array.isArray(value.seals)?value.seals.filter(x=>['frozen','crimson','void'].includes(x)):[])],complete:value.complete===true,world:oath&&training===3&&WORLDS.some(w=>w.id===value.world)?value.world:'academy',x:clamp(Number.isFinite(value.x)?value.x:320,100,WIDTH-100),hp:Number.isFinite(value.hp)?value.hp:null,sp:Number.isFinite(value.sp)?value.sp:null,riftCooldown:clamp(Number.isFinite(value.riftCooldown)?value.riftCooldown:0,0,RIFT.cooldown),domainCooldown:clamp(Number.isFinite(value.domainCooldown)?value.domainCooldown:0,0,DOMAIN.cooldown)};
}
export function maxHealth(s){return stats(s).health;}
export function maxSpirit(s){return stats(s).spirit;}
export function canRift(s){return levelFor(s.xp).level>=3&&s.seals.length>0;}
export function riftInput(s){return canRift(s)&&(s.player.y<GROUND-30||s.player.vy<0);}
export function canRelease(s){return levelFor(s.xp).level>=3 && s.seals.length>0;}
export const DOMAIN=Object.freeze({cost:80,cooldown:30,duration:2.4,pulse:1.25,radius:420,damage:100});
export function canDomain(s){return s.complete&&s.seals.length===3;}
export function abilityReady(s,key){
 const p=s.player,st=stats(s);if(s.dead||p.hurt>0||p.domain||p.rift||p.riftQueued)return false;
 if(key==='rift')return riftInput(s)&&p.sp>=RIFT.cost&&(p.riftCooldown||0)<=0&&p.attack<=0&&p.dash<=0;
 if(key==='dash')return p.dashCooldown<=0&&p.sp>=st.warpCost&&p.attack<=.18;
 if(key==='wave'&&riftInput(s))return abilityReady(s,'rift');
 if(key==='wave')return p.waveCooldown<=0&&p.sp>=28&&p.attack<=0&&p.dash<=0;
 if(key==='release')return canRelease(s)&&p.sp>=55&&p.releaseCooldown<=0&&p.dash<=0;
 return false;
}
export function domainReady(s){const p=s.player;return canDomain(s)&&!s.dead&&p.hurt<=0&&!p.domain&&!p.rift&&!p.riftQueued&&p.y>=GROUND&&p.attack<=0&&p.dash<=0&&(p.domainCooldown||0)<=0&&p.sp>=DOMAIN.cost;}
export function snapshot(s){return {version:2,zone:s.zone,approachCleared:[...s.approachCleared],guardianDefeated:s.guardianDefeated,xp:s.xp,oath:s.oath,training:s.training,seals:[...s.seals],complete:s.complete,inventory:{...s.inventory},equipped:{...s.equipped},skills:{...s.skills},gearLevels:{...s.gearLevels},fragments:s.fragments,kills:{...s.kills},discoveries:[...s.discoveries],bossRewards:[...s.bossRewards],claimedQuests:[...s.claimedQuests],world:s.dead?'academy':s.world,x:s.dead?420:s.player.x,hp:s.dead?maxHealth(s):s.player.hp,sp:s.dead?maxSpirit(s):s.player.sp,riftCooldown:s.player.riftCooldown||0,domainCooldown:s.player.domainCooldown||0};}
function enemy(id,x,world,boss=false){return {id,x,y:GROUND,hp:boss?210:65,maxHp:boss?210:65,boss,world,face:-1,mode:'idle',timer:.4+id*.08,stun:0,anim:0,hitFlash:0,dead:false,death:0,attackCount:0};}
export function createState(saved){const v=readSave(saved);const s={...sanitizeProgress(v||{version:1}),time:0,zone:v?.zone||'approach',approachCleared:v?.approachCleared||[],guardianDefeated:v?.guardianDefeated||false,world:v?.world||'academy',oath:v?.oath||false,training:v?.training||0,seals:v?.seals||[],complete:v?.complete||false,events:[],enemies:[],rifts:[],projectiles:[],drops:[],player:{x:v?.x||320,y:GROUND,vx:0,vy:0,face:1,hp:100,sp:100,mode:'idle',anim:0,attack:0,combo:0,comboUntil:0,queued:false,dash:0,warp:null,dashCooldown:0,waveCooldown:0,invuln:0,hurt:0,release:0,releaseCooldown:0,riftQueued:null,rift:null,riftCooldown:v?.riftCooldown||0,domain:null,domainCooldown:v?.domainCooldown||0},dead:false};s.player.hp=clamp(v?.hp??maxHealth(s),1,maxHealth(s));s.player.sp=clamp(v?.sp??maxSpirit(s),0,maxSpirit(s));if(s.world==='academy'){s.zone='approach';s.approachCleared=[];s.guardianDefeated=false;}populate(s);return s;}
function emit(s,type,data={}){s.events.push({type,...data});}
export function approachRemaining(s){return s.enemies.filter(e=>!e.boss&&!e.dead&&e.world!=='academy').length;}
function populate(s){s.enemies=s.world==='academy'?[enemy(0,870,'academy')]:s.zone==='arena'?[enemy(4,2070,s.world,true)]:s.zone==='approach2'?[800,1160,1540].map((x,i)=>({...enemy(i+5,x,s.world),elite:i===1?'caster':'melee',hp:i===1?80:90,maxHp:i===1?80:90})):[enemy(1,800,s.world),enemy(2,1160,s.world),enemy(3,1540,s.world)];s.rifts=[];s.projectiles=[];s.drops=[];for(const e of s.enemies){if(!e.boss&&s.approachCleared.includes(e.id)||e.boss&&s.guardianDefeated){e.dead=true;e.hp=0;}}if(s.zone==='arena'&&s.guardianDefeated){if(s.world!=='temple'&&!s.seals.includes(s.world))s.drops.push({kind:'seal',x:2070,y:GROUND-70,world:s.world});if(!s.bossRewards.includes(s.world))s.drops.push({kind:'loot',x:2100,y:GROUND-45,world:s.world,boss:true,amount:20,item:{frozen:'frostFang',crimson:'emberFang',void:'voidFang',temple:'healthFlask'}[s.world]});}}
export function enterArena(s){if(s.dead||s.world==='academy'||!['approach','approach2'].includes(s.zone)||approachRemaining(s)>0||Math.abs(s.player.x-2250)>200)return false;s.zone=s.world==='temple'?'arena':s.zone==='approach'?'approach2':'arena';s.guardianDefeated=false;s.player.x=260;s.player.riftQueued=null;s.player.rift=null;s.player.attack=0;s.player.dash=0;s.player.warp=null;s.player.queued=false;s.player.combo=0;s.player.comboUntil=0;s.player.vx=0;s.player.vy=0;s.player.y=GROUND;s.player.invuln=1;populate(s);emit(s,'world',{world:s.world});emit(s,'message',{text:s.zone==='arena'?'Guardian arena · Defeat the guardian to open the return portal.':'Approach II · Clear the new enemy patrol to unlock the guardian arena.'});emit(s,'save');return true;}
export function revive(s){
  if(!s.dead)return false;
  if(s.world==='academy'||!s.discoveries.includes(s.world))return enterWorld(s,'academy');
  // An attuned shrine keeps this run's cleared enemies, but resets the living guardian.
  if(s.zone==='arena'){s.zone=s.world==='temple'?'approach':'approach2';s.guardianDefeated=false;populate(s);}s.dead=false;Object.assign(s.player,{x:1360,y:GROUND,vx:0,vy:0,hp:maxHealth(s),sp:maxSpirit(s),face:1,mode:'idle',anim:0,attack:0,combo:0,comboUntil:0,queued:false,dash:0,warp:null,dashCooldown:0,waveCooldown:0,releaseCooldown:0,hurt:0,invuln:1.5,release:0,riftQueued:null,rift:null,riftCooldown:0,domain:null,domainCooldown:0});
  for(const e of s.enemies)if(!e.dead){e.hp=e.maxHp;e.y=GROUND;e.vy=0;if(e.boss)e.x=2070;e.face=-1;e.mode='idle';e.timer=.8;e.stun=0;e.attackCount=0;e.hitFlash=0;}
  s.rifts=[];s.projectiles=[];emit(s,'world',{world:s.world});emit(s,'message',{text:'The shrine remembers you. Rise with your oath intact.'});emit(s,'save');return true;
}
export function enterWorld(s,id){
  if(!WORLDS.some(w=>w.id===id))return false;
  if(id==='academy'&&!s.dead&&s.zone==='arena'&&(!s.guardianDefeated||Math.abs(s.player.x-2250)>200))return false;
  if(id==='temple'&&!s.complete)return false;
  if(id!=='academy' && (s.world!=='academy'||!s.oath||s.training<3||Math.abs(s.player.x-2250)>200))return false;
  if(s.dead&&id!=='academy')return false;
  s.world=id;s.zone='approach';s.approachCleared=[];s.guardianDefeated=false;s.dead=false;Object.assign(s.player,{x:id==='academy'?420:260,y:GROUND,vx:0,vy:0,hp:maxHealth(s),sp:maxSpirit(s),mode:'idle',anim:0,attack:0,combo:0,comboUntil:0,dash:0,warp:null,hurt:0,invuln:1,release:0,queued:false,riftQueued:null,rift:null,domain:null});populate(s);emit(s,'world',{world:id});emit(s,'save');return true;
}
export function interact(s){
  if(s.dead)return;
  if(s.world!=='academy'&&s.zone==='arena'){if(s.guardianDefeated&&Math.abs(s.player.x-2250)<=200)enterWorld(s,'academy');else emit(s,'message',{text:s.guardianDefeated?'Collect your rewards, then reach the return portal at 2250.':'Defeat the guardian to open the return portal.'});return;}
  if(s.world!=='academy'&&Math.abs(s.player.x-2250)<=200){if(!enterArena(s))emit(s,'message',{text:approachRemaining(s)+' enemies remain. Clear the approach to open '+(s.zone==='approach2'||s.world==='temple'?'the guardian passage.':'Approach II.')});return;}
  if(s.world!=='academy' && Math.abs(s.player.x-1360)<170){
    if(!s.discoveries.includes(s.world)){s.discoveries.push(s.world);s.fragments+=10;award(s,15);emit(s,'attune',{x:1360,y:GROUND-70});emit(s,'message',{text:'Shrine attuned · 15 XP · 10 spirit fragments. Its echo is marked on your map.'});emit(s,'save');}
    else emit(s,'message',{text:'The shrine remembers your oath. Its echo is already attuned.'});
  }else if(s.world==='academy' && Math.abs(s.player.x-490)<180){
    if(s.seals.length===3){if(!s.complete)award(s,120);s.complete=true;emit(s,'message',{text:'Three seals. One unbroken oath. You are a guardian of Kek Academy.'});emit(s,'save');}
    else if(!s.oath){s.oath=true;emit(s,'message',{text:'Goribbit: First, land three cuts on the training effigy. Then cross the gate.'});emit(s,'save');}
    else emit(s,'message',{text:s.training<3?'Goribbit: Commit to your swing. Strike the effigy three times.':`Goribbit: ${s.seals.length}/3 seals returned. Bring the others home. I have restored your spirit.`});
    s.player.hp=maxHealth(s);s.player.sp=maxSpirit(s);emit(s,'mentor');
  }else if(s.world==='academy' && Math.abs(s.player.x-2250)<=200){emit(s,'message',{text:s.training<3?'Finish your academy training before crossing the veil.':'The gate is open. Choose your destination in the map.'});}
  if(s.world==='academy'&&s.oath&&s.training===3&&Math.abs(s.player.x-2250)<=200)emit(s,'gate');
  else if(s.world!=='academy' && s.player.x<470){enterWorld(s,'academy');}
}
export function act(s,key){
  const p=s.player,st=stats(s);if(s.dead||p.hurt>0)return false;
  if(p.domain||p.rift||p.riftQueued)return false;
  if(key==='rift'||key==='wave'&&riftInput(s)){
    if(!abilityReady(s,'rift'))return false;
    if(p.y>=GROUND-30){p.riftQueued={life:.15,face:p.face};emit(s,'message',{text:'KEK RIFT · Jump buffered.'});return true;}
    p.sp-=RIFT.cost;p.riftCooldown=RIFT.cooldown;p.rift={elapsed:0,x:p.x,face:p.face,startY:p.y,impacted:false};p.vy=0;p.attack=0;p.queued=false;p.combo=0;p.comboUntil=0;p.mode='rift';emit(s,'message',{text:'KEK RIFT · Split the world ahead.'});emit(s,'save');return true;
  }
  if(key==='domain'){
    if(!canDomain(s)){emit(s,'message',{text:'Complete the three-seal oath with Goribbit to unlock Kek Domain.'});return false;}
    if(!domainReady(s))return false;
    p.sp-=DOMAIN.cost;p.domainCooldown=DOMAIN.cooldown;p.domain={elapsed:0,x:p.x,pulsed:false};p.invuln=DOMAIN.duration;p.vx=0;p.mode='domain';emit(s,'domain');emit(s,'message',{text:'KEK DOMAIN · Your oath takes form.'});emit(s,'save');return true;
  }
  if(key==='interact'){interact(s);return true;}
  if(key==='jump' && p.y>=GROUND-.1 && p.attack<=0){p.vy=-720;emit(s,'jump');return true;}
  if(key==='attack' && p.dash<=0){if(p.attack>0){if(p.anim>.12)p.queued=true;return false;}if(s.time>=(p.comboUntil||0))p.combo=0;p.attack=.48;p.anim=0;p.combo=(p.combo%3)+1;p.comboUntil=s.time+.48+COMBO_GRACE;p.mode='attack';p.queued=false;emit(s,'swing',{combo:p.combo});return true;}
  // The active cut must connect before Warp can cancel its recovery.
  if(key==='dash' && abilityReady(s,'dash')){p.attack=0;p.queued=false;p.sp-=st.warpCost;p.dash=.34;p.dashCooldown=st.warpCooldown;p.invuln=.27;p.mode='warp';p.warp={elapsed:0,from:p.x,to:clamp(p.x+p.face*st.warpRange,100,WIDTH-100),duration:.34,y:p.y};emit(s,'warp',{from:p.warp.from,to:p.warp.to,y:p.y,face:p.face});return true;}
  if(key==='wave' && abilityReady(s,'wave')){p.sp-=28;p.waveCooldown=1.2;s.projectiles.push({x:p.x+p.face*75,y:p.y-75,vx:p.face*650,life:1.35+s.skills.wave*.1,age:0,hit:[],friendly:true});emit(s,'wave',{x:p.x+p.face*75,y:p.y-75,face:p.face});return true;}
  if(key==='release' && abilityReady(s,'release')){p.sp-=55;p.release=st.releaseDuration;p.releaseCooldown=16;p.invuln=.8;emit(s,'release');emit(s,'message',{text:`${ITEM_NAME(s)} · AWAKENED — ${st.releaseDuration} seconds of spirit-powered cuts.`});return true;}
  if(key==='release' && !canRelease(s)){emit(s,'message',{text:'Reach level 3 and recover a seal to awaken Ribbit Fang.'});}
  return false;
}
function ITEM_NAME(s){return s.equipped.weapon==='ribbitFang'?'RIBBIT FANG':s.equipped.weapon==='frostFang'?'RIME FANG':s.equipped.weapon==='emberFang'?'EMBER FANG':'VEIL FANG';}
function award(s,amount){const before=levelFor(s.xp).level;s.xp+=amount;const after=levelFor(s.xp).level;if(after>before){s.player.hp=maxHealth(s);emit(s,'level',{level:after});}emit(s,'save');}
function damageEnemy(s,e,amount,direction){
  if(e.dead)return;
  e.hitFlash=.18;e.stun=.24;if(e.world!=='academy')e.x=clamp(e.x+direction*(e.boss?12:32),530,2400);emit(s,'hit',{x:e.x,y:e.y-85,amount});
  if(e.world==='academy'){if(s.oath && s.training<3){s.training++;award(s,10);if(s.training===3){emit(s,'message',{text:'Training complete. Cross the academy gate to recover the lost seals.'});emit(s,'save');}}return;}
  e.hp=Math.max(0,e.hp-amount);
  if(e.hp===0){e.dead=true;e.death=.7;if(!e.boss){s.kills[s.world]++;if(!s.approachCleared.includes(e.id))s.approachCleared.push(e.id);if(approachRemaining(s)===0)emit(s,'message',{text:s.zone==='approach2'||s.world==='temple'?'Approach cleared · The guardian passage at 2250 is open.':'Approach I cleared · The passage to Approach II at 2250 is open.'});}else{s.guardianDefeated=true;emit(s,'message',{text:'Guardian defeated · The return portal at 2250 is open.'});}award(s,e.boss?55:22);emit(s,'defeat',{x:e.x,y:e.y-65,boss:e.boss});if(e.boss && s.world!=='temple'&&!s.seals.includes(s.world)){s.drops.push({kind:'seal',x:e.x,y:GROUND-70,world:s.world});emit(s,'message',{text:'The seal and guardian’s gear are free. Step into their light to recover them.'});}if(e.boss&&!s.bossRewards.includes(s.world)){s.drops.push({kind:'loot',x:e.x+30,y:GROUND-45,world:s.world,boss:true,amount:20,item:{frozen:'frostFang',crimson:'emberFang',void:'voidFang',temple:'healthFlask'}[s.world]});}else if(!e.boss)s.drops.push({kind:'loot',x:e.x,y:GROUND-30,amount:5,item:e.id===2?'healthFlask':null});}
}
function damagePlayer(s,e,amount){const p=s.player;if(p.invuln>0||s.dead)return;p.hp=Math.max(0,p.hp-Math.max(1,amount-stats(s).defense));p.invuln=1;p.hurt=.32;p.x=clamp(p.x+e.face*40,100,WIDTH-100);p.riftQueued=null;p.rift=null;p.attack=0;p.queued=false;p.combo=0;p.comboUntil=0;emit(s,'hurt',{x:p.x,y:p.y-70});if(p.hp===0){s.dead=true;emit(s,'death');emit(s,'save');}}
export function step(s,input,dt){
  if(s.dead)return;dt=Math.min(dt,1/30);s.time+=dt;const p=s.player;
  if(p.riftQueued){const queued=p.riftQueued;queued.life-=dt;if(queued.life<=0||p.hurt>0||p.vy>=0)p.riftQueued=null;else if(p.y<GROUND-30){p.riftQueued=null;p.face=queued.face;act(s,'rift');}}
  p.domainCooldown=Math.max(0,(p.domainCooldown||0)-dt);
  for(const key of ['riftCooldown','invuln','hurt','dashCooldown','waveCooldown','releaseCooldown','release'])p[key]=Math.max(0,p[key]-dt);
  if(p.domain){p.domain.elapsed+=dt;if(!p.domain.pulsed&&p.domain.elapsed>=DOMAIN.pulse){p.domain.pulsed=true;const targets=s.enemies.filter(e=>!e.dead&&e.world!=='academy'&&Math.abs(e.x-p.domain.x)<=DOMAIN.radius);let defeated=0;for(const e of targets){damageEnemy(s,e,DOMAIN.damage,p.domain.x<e.x?1:-1);if(e.dead)defeated++;}emit(s,'domainPulse',{x:p.domain.x,y:GROUND,hit:targets.length,defeated});emit(s,'message',{text:targets.length?'KEK DOMAIN · '+targets.length+' struck · '+defeated+' defeated':'KEK DOMAIN · No enemies in reach.'});}if(p.domain.elapsed>=DOMAIN.duration)p.domain=null;}
  if(p.rift){const cast=p.rift;cast.elapsed+=dt;if(!cast.impacted&&cast.elapsed>=RIFT.windup+RIFT.slam){cast.impacted=true;p.y=GROUND;p.vy=0;s.rifts.push({x:cast.x,face:cast.face,elapsed:0,hit:[],damage:RIFT.damage+levelFor(s.xp).level*3});emit(s,'riftImpact',{x:cast.x,y:GROUND,face:cast.face});}if(cast.elapsed>=RIFT.windup+RIFT.slam+RIFT.recovery)p.rift=null;}
  for(const r of s.rifts){r.elapsed+=dt;for(const e of s.enemies)if(riftHit(r,e,GROUND)){r.hit.push(e.id);damageEnemy(s,e,r.damage,r.face);if(!e.dead){if(e.world==='temple')staggerTempleEnemy(e);else{e.mode='recover';e.timer=.8;}e.stun=e.boss?.4:.8;if(!e.boss)e.vy=-420;}emit(s,'riftHit',{x:e.x,y:e.y,boss:e.boss});}}s.rifts=s.rifts.filter(r=>r.elapsed<RIFT.range/RIFT.speed+.25);
  const st=stats(s);p.sp=clamp(p.sp+dt*st.regen,0,st.spirit);p.anim+=dt;
  if(p.attack>0){const before=p.attack;p.attack=Math.max(0,p.attack-dt);if(before>.22 && p.attack<=.22){for(const e of s.enemies){const dx=e.x-p.x;if(!e.dead && dx*p.face>-35 && dx*p.face<180 && Math.abs(p.y-e.y)<135)damageEnemy(s,e,(p.release>0?34+st.releaseAttack:22)+levelFor(s.xp).level*3+p.combo*3+st.attack,p.face);}}if(p.attack===0 && p.queued){p.queued=false;act(s,'attack');}}
  const moving=(input.right?1:0)-(input.left?1:0);
  if(p.rift){p.vx=0;p.x=p.rift.x;p.face=p.rift.face;p.mode='rift';}
  else if(p.domain){p.vx=0;p.x=p.domain.x;p.mode='domain';}
  else if(p.dash>0&&p.warp){p.dash=Math.max(0,p.dash-dt);p.warp.elapsed+=dt;const t=clamp((p.warp.elapsed-.06)/.14,0,1),ease=t*t*(3-2*t),next=p.warp.from+(p.warp.to-p.warp.from)*ease;p.vx=0;p.x=next;p.mode='warp';if(p.dash===0){emit(s,'warpLand',{x:p.x,y:p.y});p.warp=null;}}
  else if(p.hurt>0){p.vx=0;p.mode='hurt';}
  else if(p.attack>0){p.vx=0;p.mode='attack';}
  else {p.vx=moving*285;if(moving)p.face=moving;p.mode=p.y<GROUND-1?'jump':moving?'run':'idle';}
  p.x=clamp(p.x+p.vx*dt,100,WIDTH-100);if(p.rift){const fall=clamp((p.rift.elapsed-RIFT.windup)/RIFT.slam,0,1);p.y=p.rift.startY+(GROUND-p.rift.startY)*fall*fall;p.vy=0;}else{p.vy+=dt*1700;p.y+=p.vy*dt;}if(p.y>=GROUND){if(p.vy>300)emit(s,'land',{x:p.x});p.y=GROUND;p.vy=0;}
  for(const e of s.enemies){if((e.vy||0)!==0||e.y<GROUND){e.vy=(e.vy||0)+dt*1700;e.y+=e.vy*dt;if(e.y>=GROUND){e.y=GROUND;e.vy=0;}}e.anim+=dt;e.hitFlash=Math.max(0,e.hitFlash-dt);e.stun=Math.max(0,e.stun-dt);if(e.dead){e.death=Math.max(0,e.death-dt);continue;}if(e.world==='academy')continue;if(e.stun>0)continue;
    if(e.world==='temple'){for(const action of stepTempleEnemy(e,p,dt,GROUND)){if(action.type==='damage')damagePlayer(s,action,action.amount);else if(action.type==='projectile'){s.projectiles.push(action);emit(s,'enemyWave',{world:'temple',x:action.x,y:action.y,face:Math.sign(action.vx)});}else emit(s,action.type,action);}continue;}
    const spec=eliteSpec(e),dx=p.x-e.x,dist=Math.abs(dx),range=spec?.range||(e.boss?155:110);if(e.mode==='idle')e.face=dx<0?-1:1;e.timer-=dt;
    if(e.mode==='windup' && e.timer<=0){e.mode='strike';e.timer=.18;e.attackCount++;emit(s,'enemySwing',{x:e.x,y:GROUND-70,boss:e.boss,face:e.face});if(e.elite==='caster'){if(e.world==='frozen'){if(Math.abs(p.x-e.targetX)<75&&p.y>GROUND-100)damagePlayer(s,e,20);emit(s,'enemySwing',{x:e.targetX,y:GROUND-30,face:e.face});}else s.projectiles.push({x:e.x+e.face*55,y:GROUND-40,vx:e.face*(e.world==='void'?240:280),life:3,damage:18,friendly:false,world:e.world});}else{if(e.elite==='melee'&&e.world!=='crimson')e.x=clamp(e.x+e.face*65,530,2400);if((p.x-e.x)*e.face>=-25&&Math.abs(p.x-e.x)<(spec?spec.range:e.boss?165:115)&&p.y>GROUND-135)damagePlayer(s,e,spec?18:e.boss?24:12);}
      if(e.boss && e.attackCount%2===0){s.projectiles.push({x:e.x,y:GROUND-40,vx:e.face*360,life:2.6,friendly:false,world:e.world,hit:[]});emit(s,'enemyWave',{world:e.world,x:e.x,y:GROUND-40,face:e.face});}
    }else if(e.mode==='strike' && e.timer<=0){e.mode='recover';e.timer=e.boss?.9:.8;}
    else if(e.mode==='recover' && e.timer<=0){e.mode='idle';e.timer=.2;}
    else if(e.mode==='idle' && dist<620){if(dist<range && e.timer<=0){e.mode='windup';e.timer=spec?.9:e.boss?.65:.55;e.targetX=p.x;emit(s,'telegraph',{x:e.x,y:GROUND-110});}else if(dist>(e.elite==='caster'?300:85)){e.x+=e.face*dt*(spec?.speed||(e.boss?75:105));}}
  }
  for(const q of s.projectiles){if(q.owner&&s.enemies.some(e=>e.id===q.owner&&e.dead)){q.life=0;continue;}q.x+=q.vx*dt;q.life-=dt;q.age=(q.age||0)+dt;if(q.friendly){for(const e of s.enemies){if(!e.dead && Math.abs(e.x-q.x)<65 && Math.abs(e.y-75-q.y)<120 && !q.hit.includes(e.id)){q.hit.push(e.id);emit(s,'waveHit',{x:e.x,y:q.y,face:Math.sign(q.vx)});damageEnemy(s,e,36+levelFor(s.xp).level*3+st.wave,Math.sign(q.vx));}}}else if(Math.abs(q.x-p.x)<48 && Math.abs(q.y-(p.y-45))<60){damagePlayer(s,{face:Math.sign(q.vx)},q.damage||16);q.life=0;}}
  s.projectiles=s.projectiles.filter(q=>q.life>0 && q.x>0 && q.x<WIDTH);
  s.drops=s.drops.filter(d=>{if(Math.abs(d.x-p.x)<90 && Math.abs(d.y-(p.y-60))<130){if(d.kind==='seal'){if(!s.seals.includes(d.world))s.seals.push(d.world);emit(s,'seal',{world:d.world});emit(s,'message',{text:s.seals.length===3?'All three seals recovered. Return to Master Goribbit.':'Seal recovered. Return to the academy to cross into another realm.'});}else{s.fragments+=d.amount||0;if(d.item)addItem(s,d.item);if(d.boss&&!s.bossRewards.includes(d.world))s.bossRewards.push(d.world);emit(s,'loot',{item:d.item,amount:d.amount});}emit(s,'save');return false;}return true;});
}
