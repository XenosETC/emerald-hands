import {fractureGeometry,riftSlash} from './rift-motion.js';
const GEOMETRY=fractureGeometry();
// Prototype tuning: one committed airborne slam, then a bounded ground fracture.
export const RIFT=Object.freeze({cost:40,cooldown:8,windup:.16,slam:.16,recovery:.3,range:600,speed:1200,damage:55});
export function riftPhase(elapsed){return elapsed<RIFT.windup?'raise':elapsed<RIFT.windup+RIFT.slam?'slam':'recover';}
export function riftReach(rift){return Math.min(RIFT.range,rift.elapsed*RIFT.speed);}
export function riftHit(rift,enemy,ground){const dx=(enemy.x-rift.x)*rift.face;return !enemy.dead&&enemy.world!=='academy'&&!rift.hit.includes(enemy.id)&&dx>=-35&&dx<=riftReach(rift)+35&&enemy.y>=ground-125;}
export function drawRiftSlash(ctx,player,reduced=false){
 const trail=player.rift&&riftSlash(player.rift.elapsed,reduced);if(!trail)return;
 ctx.save();ctx.translate(player.x,player.y-95);ctx.scale(player.face,1);ctx.globalAlpha*=trail.alpha;ctx.strokeStyle='#78ffc6';ctx.shadowColor='#29f0a0';ctx.shadowBlur=reduced?0:14;ctx.lineWidth=trail.width;
 ctx.beginPath();ctx.ellipse(24,-8,115,94,.15,trail.angle-trail.tail,trail.angle);ctx.stroke();
 if(!reduced){ctx.lineWidth=1.5;ctx.strokeStyle='#effff7';ctx.beginPath();ctx.ellipse(24,-8,119,97,.15,trail.angle-.22,trail.angle+.025);ctx.stroke();}ctx.restore();
}
export function drawRift(ctx,rift,ground,reduced=false,art=null){
 const reach=riftReach(rift),fade=Math.min(1,(.75-rift.elapsed)/.25);ctx.save();ctx.translate(rift.x,ground);ctx.scale(rift.face,1);ctx.globalAlpha*=Math.max(0,fade);
 // A broad illuminated wound supports the narrow white-hot fracture core.
 if(!reduced){const bed=ctx.createLinearGradient(0,-40,0,25);bed.addColorStop(0,'transparent');bed.addColorStop(.62,'#20e99e55');bed.addColorStop(1,'transparent');ctx.fillStyle=bed;ctx.fillRect(-25,-40,reach+50,65);ctx.save();ctx.globalCompositeOperation='lighter';const bloom=ctx.createRadialGradient(0,-35,0,0,-35,160);bloom.addColorStop(0,'#baffde88');bloom.addColorStop(.25,'#2bffa944');bloom.addColorStop(1,'transparent');ctx.fillStyle=bloom;ctx.globalAlpha*=Math.max(0,1-rift.elapsed/.35);ctx.fillRect(-160,-195,320,320);ctx.restore();}
 ctx.strokeStyle='#aaffd8';ctx.lineWidth=reduced?3:5;ctx.shadowColor='#39ffaf';ctx.shadowBlur=reduced?0:22;ctx.beginPath();ctx.moveTo(-20,0);
 for(const point of GEOMETRY.points)if(point.x<=reach)ctx.lineTo(point.x,point.y);ctx.lineTo(reach,0);ctx.stroke();
 if(art){ctx.save();ctx.shadowBlur=0;ctx.globalAlpha*=reduced?.72:1;const count=reduced?6:8,spacing=reduced?112:78;for(let i=0;i<count;i++){const x=i*spacing+8;if(x>reach)break;const age=rift.elapsed-x/RIFT.speed,grow=Math.min(1,Math.max(0,age/.045)),collapse=Math.max(.35,1-age*1.4),height=(155+(i%3)*32)*grow*collapse,width=height*.8;ctx.save();ctx.globalAlpha*=Math.min(1,Math.max(0,(.64-age)/.18));ctx.drawImage(art,(i%4)*art.width/4,0,art.width/4,art.height,x-width*.5,-height+4,width,height);ctx.restore();}ctx.restore();}
 if(!art)for(const shard of GEOMETRY.shards){const {x,width,lean}=shard;if(x>=reach)break;const age=rift.elapsed-x/RIFT.speed,grow=Math.min(1,Math.max(0,age/.045)),height=shard.height*(reduced?1:1.85)*grow*Math.max(0,1-age*1.6),light=ctx.createLinearGradient(x,-height,x,0);light.addColorStop(0,'#e1ffee');light.addColorStop(.2,'#59ffbc');light.addColorStop(.55,'#168766');light.addColorStop(1,'#062c23');ctx.fillStyle=light;ctx.strokeStyle='#79ffca';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-width*.6,0);ctx.lineTo(x-width*.3,-height*.3);ctx.lineTo(x+lean,-height);ctx.lineTo(x+lean*.4,-height*.4);ctx.lineTo(x+width*.8,-height*.45);ctx.lineTo(x+width*.6,0);ctx.closePath();ctx.fill();ctx.stroke();if(!reduced){ctx.save();ctx.translate(x+lean,-height-6-age*35);ctx.rotate(x*.17+age*3);ctx.fillStyle='#102d28';ctx.beginPath();ctx.moveTo(-8,-4);ctx.lineTo(-2,-11);ctx.lineTo(7,-2);ctx.lineTo(4,7);ctx.lineTo(-6,5);ctx.closePath();ctx.fill();ctx.strokeStyle='#57cba0';ctx.stroke();ctx.restore();if(shard.branch){ctx.strokeStyle='#53cfa0';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,2);ctx.lineTo(x-width,6);ctx.lineTo(x-width*.4,12);ctx.lineTo(x-width*.8,18);ctx.stroke();}}}
 if(!reduced){ctx.save();const baseAlpha=ctx.globalAlpha;ctx.strokeStyle='#bdffdf';ctx.shadowBlur=20;ctx.lineWidth=2;for(let i=0;i<9;i++){const x=i*67+12;if(x>reach)break;const age=rift.elapsed-x/RIFT.speed,alpha=Math.max(0,1-age/.25);ctx.globalAlpha=baseAlpha*alpha;ctx.beginPath();ctx.moveTo(x,0);ctx.quadraticCurveTo(x-18,-35,x+8,-95-(i%3)*22);ctx.stroke();}ctx.restore();}
 ctx.restore();
}
