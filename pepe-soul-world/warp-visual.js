// Preserve Crown's painted palette; the energy carries the spectral colors.
export const WARP_COLORS=Object.freeze(['#51e8ff','#b56bff','#ffd477']);
export function drawWarpTrail(ctx,p,reduced=false){
  if(!p.warp||p.warp.elapsed<=.06||p.warp.elapsed>=.2)return;
  const from=p.warp.from,to=p.x,y=p.y-65;
  ctx.save();ctx.globalCompositeOperation='lighter';
  const colors=reduced?WARP_COLORS.slice(0,1):WARP_COLORS;
  colors.forEach((color,i)=>{
    ctx.strokeStyle=color;ctx.globalAlpha=reduced?.5:.65;ctx.lineWidth=i===0?3:2;
    const bend=(i-1)*16;
    ctx.beginPath();ctx.moveTo(from,y);ctx.quadraticCurveTo((from+to)/2,y+bend,to,y);ctx.stroke();
  });
  ctx.restore();
}
