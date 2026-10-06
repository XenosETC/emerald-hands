import {templeFrames} from './temple-motion.js';

const smooth=t=>{const n=Math.max(0,Math.min(1,t));return n*n*(3-2*n);};
export function templeStride(e){return e.boss?112:96;}
function descriptor(e,index,walking=false){
 const cols=walking?3:2;
 return {sheet:`jade-${e.boss?'abbot':'disciple'}${walking?'-walk':''}-v1`,row:Math.floor(index/cols),col:index%cols,cols,rows:2,size:e.boss?400:290};
}
export function templeWalkIndex(e,distance=e.walkDistance||0){return Math.floor(distance/templeStride(e)*6)%6;}
export function templeVisual(e,reduced=false){
 const f=templeFrames(e,reduced),combat={from:descriptor(e,f.from),to:descriptor(e,f.to),blend:f.blend};
 if(e.mode==='windup'&&e.guardWalkDistance!=null&&!reduced){
  const elapsed=(e.windupDuration||.8)-e.timer;
  if(elapsed<.09)return {from:descriptor(e,templeWalkIndex(e,e.guardWalkDistance),true),to:descriptor(e,2),blend:smooth(elapsed/.09)};
 }
 if(e.mode!=='idle')return combat;
 if(e.walking){
  const phase=(e.walkDistance||0)/templeStride(e)*6,index=Math.floor(phase)%6;
  const current=descriptor(e,index,true);
  // Gait advances only with real travel. A stun holds its current planted pose.
  if(!reduced&&(e.walkTime||0)<.08)return {from:descriptor(e,0),to:current,blend:smooth((e.walkTime||0)/.08)};
  const mix=reduced?0:smooth(((phase%1)-.78)/.22);
  return {from:current,to:descriptor(e,(index+1)%6,true),blend:mix};
 }
 if(e.stoppedWalkDistance!=null&&!reduced&&(e.walkStopTime||0)<.1)return {
  from:descriptor(e,templeWalkIndex(e,e.stoppedWalkDistance),true),to:descriptor(e,0),blend:smooth((e.walkStopTime||0)/.1)
 };
 return combat;
}
