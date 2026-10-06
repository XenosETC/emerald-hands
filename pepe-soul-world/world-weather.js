export const WEATHER=Object.freeze({temple:{color:'#79ffd0',kind:'wisp',back:65,front:22},academy:{color:'#d5c58b',kind:'leaf',back:40,front:16},frozen:{color:'#e5f6ff',kind:'snow',back:95,front:38},crimson:{color:'#ffc08a',kind:'ember',back:65,front:22},void:{color:'#c6adf2',kind:'wisp',back:40,front:14}});
const mod=(n,m)=>((n%m)+m)%m;
export function snowFlake(index,time,width,floor,camera,front=false){
 const depth=front?1:.45,wind=18+Math.sin(time*.23)*14+Math.pow(Math.max(0,Math.sin(time*.41)),6)*45;
 return {x:mod(index*197.31+time*wind-camera*depth,width+80)-40,y:mod(index*89.73+time*(front?39:19),floor+30)-20,radius:front?1.5+index%3*.45:.7+index%3*.25,alpha:front?.26:.18};
}
export function realmParticle(world,index,time,width,floor,camera,front=false){
 const f=snowFlake(index,time,width,floor,camera,front);
 if(world==='frozen')return f;
 if(world==='crimson'){const ash=index%3===0;return {...f,y:ash?mod(index*89.73+time*12,floor+20)-20:floor-mod(index*89.73+time*(front?27:14),floor+20),radius:f.radius*(ash?1:.7),alpha:front?(ash?.18:.34):(ash?.12:.2)};}
 if(world==='void'||world==='temple')return {...f,y:floor-18-mod(index*37.13+time*8,front?110:190),x:f.x+Math.sin(time*.7+index)*12,radius:f.radius*1.3,alpha:front?.2:.12};
 return {...f,x:f.x+Math.sin(time*.8+index)*18,radius:f.radius*1.3,alpha:front?.28:.16};
}
export class WorldWeather{
 constructor(){this.puffs=[];this.lastFoot=null;this.world=null;}
 react(e,s,reduced=false){if(e.type==='world'){this.puffs=[];this.lastFoot=null;this.world=s.world;return;}if(!WEATHER[s.world])return;if(e.type==='warp')this.puff(e.from,e.y,reduced?4:18,150);if(e.type==='warpLand'||e.type==='land'||e.type==='riftImpact')this.puff(e.x,e.y??590,reduced?4:14,110);if(e.type==='domainPulse')this.puff(e.x,590,reduced?8:40,330);}
 puff(x,y,count,speed){for(let i=0;i<count;i++){const a=Math.PI+(i/(count-1))*Math.PI;this.puffs.push({x,y:y-3,vx:Math.cos(a)*speed*(.3+(i%5)*.12),vy:Math.sin(a)*speed*.55-15,life:.55,max:.55,r:1+i%3});}this.puffs=this.puffs.slice(-100);}
 update(dt,s,reduced){if(this.world!==s.world){this.world=s.world;this.puffs=[];this.lastFoot=null;}for(const p of this.puffs){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=130*dt;}this.puffs=this.puffs.filter(p=>p.life>0);if(!WEATHER[s.world])return;const p=s.player;if(p.mode==='run'&&p.y>=590){if(this.lastFoot===null||Math.abs(p.x-this.lastFoot)>48){this.puff(p.x,590,reduced?3:7,55);this.lastFoot=p.x;}}else this.lastFoot=null;}
 draw(ctx,s,camera,floor,width,front,reduced){const spec=WEATHER[s.world];if(!spec)return;ctx.save();ctx.fillStyle=spec.color;ctx.strokeStyle=spec.color;const count=reduced?Math.ceil((front?spec.front:spec.back)/4):(front?spec.front:spec.back);
 for(let i=0;i<count;i++){const f=realmParticle(s.world,i,s.time,width,floor,camera,front);let x=f.x,y=f.y;const heroX=s.player.x-camera,domain=s.player.domain;
 if(!reduced&&domain){const dx=x-heroX,dy=y-floor+100,dist=Math.hypot(dx,dy);if(dist<420){const elapsed=domain.elapsed;if(elapsed<1.25){const turn=elapsed*.85,angle=Math.atan2(dy,dx)+turn;x=heroX+Math.cos(angle)*dist;y=floor-100+Math.sin(angle)*dist-elapsed*25;}else{const push=Math.max(0,1-(elapsed-1.25)/.6)*75;x+=dx/(dist||1)*push;y+=dy/(dist||1)*push;}}}
 if(!reduced&&s.player.warp&&Math.abs(x-heroX)<100&&Math.abs(y-floor)<230){x+=(x<heroX?-1:1)*35;}
 // Weather stops at the visible surface, keeping ground and combat silhouettes clear.
 if(y>floor-3)continue;ctx.globalAlpha=f.alpha;ctx.save();ctx.translate(x,y);if(s.world==='crimson'&&i%3===0){ctx.fillStyle='#b3a6a0';ctx.rotate(s.time*.4+i);ctx.fillRect(-f.radius,-f.radius*.4,f.radius*2,f.radius*.8);}else if(spec.kind==='leaf'){ctx.rotate(s.time*.8+i);ctx.beginPath();ctx.ellipse(0,0,f.radius*2,f.radius*.65,0,0,Math.PI*2);ctx.fill();}else if(spec.kind==='wisp'){ctx.lineWidth=front?1.4:.8;ctx.beginPath();ctx.moveTo(-f.radius*3,0);ctx.quadraticCurveTo(0,-f.radius*3,f.radius*3,0);ctx.stroke();}else{ctx.beginPath();ctx.arc(0,0,f.radius,0,Math.PI*2);ctx.fill();}ctx.restore();}
 if(front){for(const p of this.puffs){ctx.globalAlpha=p.life/p.max*.4;ctx.beginPath();ctx.arc(p.x-camera,p.y+(floor-590),p.r,0,Math.PI*2);ctx.fill();}}
 ctx.restore();}
}
