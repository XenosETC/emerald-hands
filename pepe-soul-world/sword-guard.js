// Prototype guard tuning: frontal hits trade Spirit for health; ground hazards bypass.
export const GUARD=Object.freeze({raise:.12,hit:.24,lower:.12,breakLock:.8,minCost:8,costScale:.8});
const smooth=t=>{const n=Math.max(0,Math.min(1,t));return n*n*(3-2*n);};
export function canGuard(p,ground){
 return p.y>=ground-.1&&p.vy===0&&p.hurt<=0&&p.attack<=0&&p.dash<=0&&!p.warp&&!p.rift&&!p.riftQueued&&!p.domain&&p.waveCooldown<=.92&&(p.guardBroken||0)<=0&&!p.guardMustRelease&&(p.guarding||p.sp>=GUARD.minCost);
}
export function dropGuard(p,animate=false){
 if(p.guarding&&animate){p.guardLower=GUARD.lower;p.guardLowerFrame=p.guardHit>.08?2:1;}
 else if(!animate)p.guardLower=0;
 p.guarding=false;p.guardTime=0;p.guardHit=0;if(p.mode==='guard')p.mode='idle';
}
export function stepGuard(p,held,dt,ground){
 for(const key of ['guardBroken','guardHit','guardLower'])p[key]=Math.max(0,(p[key]||0)-dt);
 if(!held)p.guardMustRelease=false;
 if(held&&canGuard(p,ground)){
  if(!p.guarding){p.guardTime=0;p.guardLower=0;p.combo=0;p.comboUntil=0;p.queued=false;}
  p.guarding=true;p.guardTime=(p.guardTime||0)+dt;
 }else if(p.guarding)dropGuard(p,true);
}
export function guardHit(p,source,damage){
 if(!p.guarding||p.guardTime<GUARD.raise||source.unblockable||p.face!==-source.face)return null;
 const cost=Math.max(GUARD.minCost,Math.ceil(damage*GUARD.costScale));
 if(p.sp<cost){p.sp=0;dropGuard(p);p.guardBroken=GUARD.breakLock;p.guardMustRelease=true;return {type:'guardBreak',cost};}
 p.sp=Math.max(0,p.sp-cost);p.guardHit=GUARD.hit;return {type:'guardBlock',cost};
}
export function guardFrames(p,reduced=false){
 if(p.guarding){
  if(reduced)return {from:1,to:p.guardHit>0?2:1,blend:1};
  if(p.guardHit>.16)return {from:1,to:2,blend:smooth((GUARD.hit-p.guardHit)/.045)};
  if(p.guardHit>.08)return {from:2,to:2,blend:1};
  if(p.guardHit>0)return {from:2,to:3,blend:smooth(1-p.guardHit/.08)};
  if(p.guardTime<.04)return {from:null,to:0,blend:smooth(p.guardTime/.04)};
  if(p.guardTime<GUARD.raise)return {from:0,to:1,blend:smooth((p.guardTime-.04)/(GUARD.raise-.04))};
  return {from:1,to:1,blend:1};
 }
 if(p.guardLower>0&&p.mode==='idle'&&!reduced)return {from:p.guardLowerFrame??1,to:null,blend:smooth(1-p.guardLower/GUARD.lower)};
 return null;
}
export function guardCounterPose(p,reduced=false){
 // Finish the visible handoff before the first attack pose advances at 80ms.
 // This is presentation only: the ordinary cut still connects at 260ms.
 if(reduced||p.guarding||(p.guardLower||0)<=0||p.attack<=0||p.anim>=.06||p.hurt>0||p.warp||p.rift||p.domain)return null;
 return {from:p.guardLowerFrame??1,blend:smooth(Math.max(p.anim/.06,1-p.guardLower/GUARD.lower))};
}
export function guardCue(p){
 if(p.guardBroken>0)return 'GUARD BROKEN · '+p.guardBroken.toFixed(1)+'s · Release guard';
 if(p.guardMustRelease)return 'Release guard to raise your sword again';
 if(p.guarding)return p.guardTime<GUARD.raise?'SWORD GUARD · Raising blade':p.guardHit>0?'SWORD BLOCK · Spirit absorbed the hit':'SWORD GUARD · Front protected · Release to attack · K to Warp';
 return null;
}
export function drawGuardImpact(ctx,f,reduced=false){
 const t=1-f.life/f.max;ctx.save();ctx.translate(f.x,f.y);ctx.scale(f.face,1);
 ctx.strokeStyle=f.type==='guardBreak'?'#ffb084':'#dbffe9';ctx.lineWidth=reduced?2:3;ctx.shadowColor='#63ffb9';ctx.shadowBlur=reduced?0:10;
 for(let i=0;i<(reduced?3:7);i++){const a=-1.25+i*2.5/(reduced?2:6),start=8+t*18,end=start+(f.type==='guardBreak'?36:22)*(1-t);ctx.beginPath();ctx.moveTo(Math.cos(a)*start,Math.sin(a)*start);ctx.lineTo(Math.cos(a)*end,Math.sin(a)*end);ctx.stroke();}
 ctx.restore();
}
