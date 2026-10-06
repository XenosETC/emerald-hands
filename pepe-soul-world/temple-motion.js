// Existing production atlas poses, timed to the simulation. No world-space foot drift.
const smooth=t=>{const v=Math.max(0,Math.min(1,t));return v*v*(3-2*v);};
export function templeFrames(e,reduced=false){
 if(reduced)return {from:0,to:e.mode==='windup'?2:e.mode==='strike'?3:0,blend:1};
 if(e.mode==='windup'){
  const elapsed=(e.windupDuration||.8)-e.timer;
  if(elapsed<.09)return {from:e.guardFrame||0,to:2,blend:smooth(elapsed/.09)};
  // Finish the blade's travel exactly when the simulation releases its attack.
  if(e.timer<.045)return {from:2,to:3,blend:smooth(1-e.timer/.045)};
  return {from:2,to:2,blend:1};
 }
 if(e.mode==='strike')return {from:3,to:3,blend:1};
 if(e.mode==='recover')return {from:e.recoveryFrame??3,to:0,blend:smooth(((e.recoveryDuration||1)-e.timer)/.12)};
 const time=e.poseTime||0,to=Math.floor(time/.6)%2;
 return {from:time<.6?0:1-to,to,blend:smooth((time%.6)/.065)};
}
