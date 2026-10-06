import {equippedPose,drawCrownFrame} from './crown-equipped.js';
import {CROWN_POSES} from './crown-poses.js';
import {drawCaptive,drawTotem,drawMissionHud} from './mission-art.js';
import {drawUnitHealth} from './unit-health.js';
import {drawOrder} from './orders.js';
import {drawReinforcements} from './reinforcement-view.js';
import {drawSelectedEnemy,drawBattleMarkers} from './battle-markers.js';
import {drawCamp} from './encounters.js';
import {drawAtmosphere} from './atmosphere.js';
import {createMotionTracker,weaponSwing} from './motion.js';
import {drawSoldier,drawShield,drawHeldWeapon,corruptedImage,winterImage} from './art.js';
import {drawCombatEffects} from './feedback.js';
export function createBattleRenderer(g,crown,battleImage,forestImage,ruinsImage){let battle,paused=false;const motion=createMotionTracker();
function ellipse(x,y,rx,ry,color){g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();}

function path(points,color,width){g.strokeStyle=color;g.lineWidth=width;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();}

function text(t,x,y,size=18,color='#f1e7c3'){g.fillStyle=color;g.font=`${size}px Georgia`;g.textAlign='center';g.fillText(t,x,y);}

function tree(x,y,size=1){g.fillStyle='#594d30';g.fillRect(x-4,y,8,22*size);for(let i=0;i<3;i++){g.fillStyle=['#253f32','#34533a','#416342'][i];g.beginPath();g.moveTo(x,y-55*size+i*15*size);g.lineTo(x-23*size,y+i*13*size);g.lineTo(x+23*size,y+i*13*size);g.fill();}}

function castle(x,y,owned,keep=false){g.fillStyle='#0003';ellipse(x,y+15,65,15,'#0003');g.fillStyle=owned?'#d3c5a0':'#a29c8c';g.fillRect(x-42,y-45,84,55);for(const dx of [-45,30]){g.fillRect(x+dx,y-75,18,86);for(let i=0;i<3;i++)g.fillRect(x+dx+i*6,y-81,4,9);}g.fillStyle='#343c31';g.fillRect(x-9,y-20,18,30);g.fillStyle=owned?'#9fc366':'#ce7452';g.beginPath();g.moveTo(x,y-98);g.lineTo(x+35,y-88);g.lineTo(x,y-77);g.fill();path([[x,y-55],[x,y-100]],'#decba2',3);if(keep)text('♜',x,y-40,38,'#756752');}

function soldier(u){if(u.captain){g.save();g.translate(u.x,u.y);g.scale(u.facing,1);g.fillStyle='#963d32';g.strokeStyle='#deb77c';g.lineWidth=2;g.beginPath();g.moveTo(-18,-103);g.quadraticCurveTo(-52,-70,-43, -15+Math.sin(battle.time*3)*3);g.lineTo(6,-23);g.lineTo(13,-100);g.closePath();g.fill();g.stroke();g.restore();}drawSoldier(g,u,battle.time,u.lord?1.12:1,motion(u,battle.time));}

function hero(u){
 g.save();g.translate(u.x,u.y);g.scale(u.facing,1);
 const moving=u.moving,m=motion(u,battle.time);let index=u.swing>0?2:moving?(Math.sin(m.phase)>0?1:3):0;
 const p=crown.renderSet?equippedPose(index,crown.renderSet):CROWN_POSES[index],scale=.25,bob=m.bob;
 if(crown.complete&&crown.naturalWidth)drawCrownFrame(g,crown,p,scale,bob);
 const sockets=p;
 if(!crown.bakedGear){
 if(u.shield)drawShield(g,u.shield,sockets.shield[0],sockets.shield[1]+bob,.8);
 drawHeldWeapon(g,u.weapon,sockets.hand[0],sockets.hand[1]+bob,weaponSwing(u.weapon,m.attack));
 }
 if(m.attack!==null&&u.weapon!=='spear'){g.strokeStyle=u.weapon==='axe'?'#ffd08c99':'#e4f8db99';g.lineWidth=u.weapon==='axe'?7:4;g.beginPath();g.arc(40,-75,u.weapon==='dagger'?34:u.weapon==='mace'?40:u.weapon==='axe'?58:67,-1.7,-1.7+m.attack*2.3);g.stroke();}
 if(u.flash>0){g.strokeStyle='#fff0b2';g.globalAlpha=u.flash/.18;g.lineWidth=3;g.beginPath();g.ellipse(0,-70,50,66,0,0,Math.PI*2);g.stroke();}
 g.restore();
}
function battlefield(){const sky=g.createLinearGradient(0,0,0,250);sky.addColorStop(0,'#798e83');sky.addColorStop(1,'#c2c4a1');g.fillStyle=sky;g.fillRect(0,0,1200,250);for(let i=0;i<8;i++){g.fillStyle=i%2?'#627264':'#6e7e6b';g.beginPath();g.moveTo(i*180-100,245);g.lineTo(i*180+20,60+i%3*24);g.lineTo(i*180+170,245);g.fill();}g.fillStyle='#68734a';g.fillRect(0,230,1200,410);castle(920,228,false,battle.site==='keep');for(let i=0;i<13;i++)tree(i*105,230,.85);for(let i=0;i<110;i++)ellipse((i*137)%1200,250+(i*73)%370,7,3,'#b7ae7433');const background=battle.environment==='winter'?winterImage:battle.environment==='volcanic'?corruptedImage:battle.environment==='forest'?forestImage:battle.environment==='ruins'?ruinsImage:battleImage;if(background.complete&&background.naturalWidth){if(battle.environment==='winter')g.drawImage(background,0,background.naturalHeight*2/3,background.naturalWidth,background.naturalHeight/3,0,0,1200,640);else if(battle.environment==='volcanic')g.drawImage(background,0,background.naturalHeight/2,background.naturalWidth,background.naturalHeight/2,0,0,1200,640);else g.drawImage(background,0,0,1200,640);}drawAtmosphere(g,battle);drawCamp(g,battle);drawBattleMarkers(g,battle);for(const u of [...battle.units,...(battle.mission?.captives??[]).map(c=>({...c,cage:true}))].sort((a,b)=>a.y-b.y)){if(u.cage){drawCaptive(g,battle,u);continue;}if(u.structure){drawTotem(g,battle,u);continue;}if(u.hp<=0){ellipse(u.x,u.y,20,6,'#463c3488');continue;}ellipse(u.x,u.y+3,u.hero?30:20,8,'#172d254a');if(u.hero){g.strokeStyle='#e8d992';g.lineWidth=2;g.beginPath();g.ellipse(u.x,u.y+2,34,12,0,0,Math.PI*2);g.stroke();hero(u);}else{soldier(u);if(u.captain){if(u.lord)text('♜',u.x,u.y-164,21,'#ffd287');g.strokeStyle='#f6b56b';g.lineWidth=3;g.beginPath();g.ellipse(u.x,u.y+3,27,10,0,0,Math.PI*2);g.stroke();text(u.captain,u.x,u.y-143,13,'#ffe1a4');}if(u.xp>0)text('★'.repeat(u.xp),u.x,u.y-136,11,'#efcf7f');}}drawUnitHealth(g,battle.units);if(battle.objective){const o=battle.objective,pulse=Math.sin(battle.time*3)*5;g.strokeStyle=o.unlocked?'#ffe49a':'#bf8b6a';g.lineWidth=3;g.beginPath();g.ellipse(o.x,o.y,38+pulse,14,0,0,Math.PI*2);g.stroke();g.fillStyle='#684a2f';g.fillRect(o.x-23,o.y-34,46,30);g.strokeStyle='#e3bd72';g.strokeRect(o.x-23,o.y-34,46,30);path([[o.x-12,o.y-34],[o.x-12,o.y-4],[o.x+12,o.y-4],[o.x+12,o.y-34]],'#e3bd72',3);text(o.unlocked?'F / Recover cargo':'Clear the cargo guards',o.x,o.y-52,16);}
 drawCombatEffects(g,battle);drawReinforcements(g,battle);drawSelectedEnemy(g,battle);drawOrder(g,battle);drawMissionHud(g,battle);if(battle.hero.hp>0&&battle.hero.hp/battle.hero.max<.25){const warning=g.createRadialGradient(600,320,230,600,320,680);warning.addColorStop(0,'#a5352000');warning.addColorStop(1,'#a5352055');g.fillStyle=warning;g.fillRect(0,0,1200,640);}if(paused){g.fillStyle='#101d1b99';g.fillRect(0,0,1200,640);text('BATTLE PAUSED',600,320,40);}}


return (b,isPaused=false)=>{battle=b;paused=isPaused;battlefield();};
}
