// Preserve Crown's painted palette; only the echoes and energy carry jade.
export const WARP_COLORS=Object.freeze(['#aaf3d1','#55c997','#26795e']);
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
// Visual transitions stay inside the existing 60 / 140 / 140ms cast phases.
// null refers to the ordinary idle pose, so both ends settle without a snap.
export function warpFrames(elapsed,reduced=false){
  if(elapsed<.06)return {from:null,to:0,blend:reduced?1:smooth(elapsed/.035)};
  if(elapsed<.2)return {from:0,to:1,blend:reduced?1:smooth((elapsed-.06)/.025)};
  if(elapsed<.29)return {from:1,to:2,blend:reduced?1:smooth((elapsed-.2)/.025)};
  if(elapsed<.315)return {from:2,to:3,blend:reduced?1:smooth((elapsed-.29)/.025)};
  return {from:3,to:null,blend:reduced?1:smooth((elapsed-.315)/.025)};
}
export function drawWarpTrail(ctx,p,reduced=false){
  if(!p.warp||p.warp.elapsed<=.06||p.warp.elapsed>=.2)return;
  const from=p.warp.from,to=p.x,y=p.y-65;
  ctx.save();ctx.globalCompositeOperation='lighter';
  const colors=reduced?WARP_COLORS.slice(0,1):WARP_COLORS;
  colors.forEach((color,i)=>{
    ctx.strokeStyle=color;ctx.globalAlpha=(reduced?.35:.4)*Math.sin(Math.PI*(p.warp.elapsed-.06)/.14);ctx.lineWidth=i===0?2:1;
    const bend=(i-1)*5;
    ctx.beginPath();ctx.moveTo(from,y);ctx.quadraticCurveTo((from+to)/2,y+bend,to,y);ctx.stroke();
  });
  ctx.restore();
}
