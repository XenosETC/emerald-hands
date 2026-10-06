export const extraWeaponImage=new Image();extraWeaponImage.src='assets/weapons-v2.png';
import {CROWN_POSES} from './crown-poses.js';
import {drawTroopFrame} from './troop-motion.js';
import {troopIdentity} from './regional-troops.js';
import {drawSnow} from './atmosphere.js';
import {drawTownLife} from './town-life.js';
import {settlementTheme,settlementLandmarks} from './settlements.js';
// Rendering only: art never changes combat or campaign state.
export const armorImage=new Image();armorImage.src='assets/armor-v1.png';
export const shieldImage=new Image();shieldImage.src='assets/shields-v1.png';
export const equipmentImage=new Image();equipmentImage.src='assets/equipment-v1.png';
export const castleSoldiers=new Image();castleSoldiers.src='assets/castle-troops-v1.png';
export const environmentSoldiers=new Image();environmentSoldiers.src='assets/environment-troops-v1.png';
export const orderSoldiers=new Image();orderSoldiers.src='assets/orders-v1.png';
export const soldiers = new Image(); soldiers.src = 'assets/soldiers-v3.png';
export const townImage = new Image(); townImage.src = 'assets/crownhaven-v2.png';
export const frontierImage=new Image();frontierImage.src='assets/cinderford-v1.png';
export const winterImage=new Image();winterImage.src='assets/winter-scenes-v1.png';
export const corruptedImage=new Image();corruptedImage.src='assets/corrupted-citadel-v1.png';
export const settlementImage = new Image(); settlementImage.src = 'assets/settlements-v1.png';
export const LANDMARKS = [
  {id:'castle',name:'Crown Hall',x:600,y:147,description:'The seat of the Emerald Crown. Review the campaign and plan your next conquest.'},
  {id:'barracks',name:'Reed Barracks',x:300,y:314,description:'Spears hold the line. Archers punish exposed enemies. Crown Guards unlock when Reedwatch falls.'},
  {id:'forge',name:'Ember Forge',x:864,y:320,description:'Choose a weapon that changes Crown’s damage, reach and attack speed. Improve its blade at the forge.'},
  {id:'market',name:'Quest Board',x:564,y:461,description:'Inspect your warband and its equipment. Each troop arrives with its own battlefield kit.'},
  {id:'gate',name:'March Gate',x:996,y:531,description:'Return to the Emerald Marches and choose your next destination.'}
];
const frames = [{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:0,y:1},{x:1,y:1},{x:2,y:1}];
export function drawSoldier(g,u,time,scale=1,motion=null){
  const eliteIndex={holyKnight:0,holyMage:1,shadowKnight:2,shadowMage:3,frogGuardian:4}[u.type];
  if(eliteIndex!==undefined){if(!orderSoldiers.complete||!orderSoldiers.naturalWidth)return;const w=orderSoldiers.naturalWidth/3,h=orderSoldiers.naturalHeight/2;g.save();g.translate(u.x,u.y+(u.moving?Math.abs(Math.sin(time*8+u.id))*2:0));g.scale((u.facing??1)*scale,scale);if(u.flash>0){g.shadowColor='#fff';g.shadowBlur=10;}drawTroopFrame(g,orderSoldiers,(eliteIndex%3)*w,Math.floor(eliteIndex/3)*h,w,h,u,time,136,136,motion);g.restore();return;}
  const regiment=troopIdentity(u.type,u.origin).regiment,castleRow={sun:0,river:1}[regiment],regionRow=castleRow??{winter:0,coast:1,jade:2,frontier:3}[regiment],regionalImage=castleRow===undefined?environmentSoldiers:castleSoldiers;
  const roleColumn={spearman:0,archer:1,guard:2}[u.type];
  if(regionRow!==undefined&&roleColumn!==undefined){
    if(!regionalImage.complete||!regionalImage.naturalWidth)return;
    const w=regionalImage.naturalWidth/3,h=regionalImage.naturalHeight/(castleRow===undefined?4:2),phase=motion?.phase??time*9+u.id;
    g.save();g.translate(u.x,u.y+(u.moving?Math.abs(Math.sin(phase))*2:0));g.scale((u.facing??1)*scale,scale);
    if(u.flash>0){g.shadowColor='#fff5b0';g.shadowBlur=12;}
    drawTroopFrame(g,regionalImage,roleColumn*w,regionRow*h,w,h,u,time,118,126,motion);if(u.team){g.fillStyle='#cf4b49';g.strokeStyle='#ffe4ae';g.lineWidth=1;g.beginPath();g.moveTo(-10,-70);g.lineTo(0,-80);g.lineTo(10,-70);g.lineTo(0,-60);g.closePath();g.fill();g.stroke();}g.restore();return;
  }
  if(!soldiers.complete || !soldiers.naturalWidth)return;
  const index=(u.team?3:0)+({spearman:0,archer:1,guard:2}[u.type]??0);
  const f=frames[index],w=soldiers.naturalWidth/3,h=soldiers.naturalHeight/2;
  const moving=u.moving, phase=motion?.phase??time*9+u.id,bob=motion?.bob??(moving?Math.abs(Math.sin(phase))*2:Math.sin(time*2+u.id)*.6);
  g.save();g.translate(u.x,u.y+bob);g.scale((u.facing??1)*scale,scale);
  if(u.flash>0){g.shadowColor='#fff5b0';g.shadowBlur=12*u.flash/.18;}
  drawTroopFrame(g,soldiers,f.x*w,f.y*h,w,h,u,time,116,116,motion);
  if(u.origin&&u.origin!=='home'){g.fillStyle=troopIdentity(u.type,u.origin).color;g.fillRect(-13,-65,24,5);g.fillRect(6,-60,5,17);}
  g.restore();
}
export function drawTown(g,hover,selected,time,node={id:'home',kind:'town'},state=null,crown=null,townHero=null){
  g.fillStyle='#283c2e';g.fillRect(0,0,1200,640);
  const theme=settlementTheme(node);
  if(theme==='frontier'&&frontierImage.complete&&frontierImage.naturalWidth)g.drawImage(frontierImage,0,0,1200,640);
  else if(theme.startsWith('winter')&&winterImage.complete&&winterImage.naturalWidth){const h=winterImage.naturalHeight/3;g.drawImage(winterImage,0,theme==='winterCastle'?h:0,winterImage.naturalWidth,h,0,0,1200,640);}
  else if(theme==='corrupted'&&corruptedImage.complete&&corruptedImage.naturalWidth)g.drawImage(corruptedImage,0,0,corruptedImage.naturalWidth,corruptedImage.naturalHeight/2,0,0,1200,640);
  else if(theme==='capital'&&townImage.complete&&townImage.naturalWidth)g.drawImage(townImage,0,0,1200,640);
  else if(settlementImage.complete&&settlementImage.naturalWidth){const row={port:0,village:1,castle:2}[theme],h=settlementImage.naturalHeight/3;g.drawImage(settlementImage,0,row*h,settlementImage.naturalWidth,h,0,0,1200,640);}
  const vignette=g.createRadialGradient(600,320,170,600,320,720);vignette.addColorStop(0,'#0000');vignette.addColorStop(1,'#071b2666');g.fillStyle=vignette;g.fillRect(0,0,1200,640);
  if(theme==='frontier'&&frontierImage.complete&&frontierImage.naturalWidth)g.drawImage(frontierImage,0,0,1200,640);
  else if(theme.startsWith('winter'))drawSnow(g,time);
  drawTownLife(g,node,time,state,crown,townHero,(g,index,pose)=>{const sockets=pose??CROWN_POSES[[0,1,3][index]];if(state?.shield)drawShield(g,state.shield,...sockets.shield,.8);if(state?.weapon)drawHeldWeapon(g,state.weapon,...sockets.hand,.65);});
  for(const p of settlementLandmarks(node)){const active=hover===p.id||selected===p.id;g.save();g.translate(p.x,p.y);g.strokeStyle=active?'#ffe1a1':'#ebdba088';g.lineWidth=active?3:1;g.beginPath();g.ellipse(0,12,65,26,0,0,Math.PI*2);g.stroke();g.fillStyle=active?'#c4a963':'#183529eb';g.strokeStyle='#d6bb77';g.lineWidth=1;g.beginPath();g.roundRect(-83,37,166,30,5);g.fill();g.stroke();g.fillStyle=active?'#15261e':'#f2dfaa';g.font='15px Georgia';g.textAlign='center';g.fillText(p.name,0,57);g.restore();}
  if(theme==='port'){g.strokeStyle='#dbf2e466';g.lineWidth=2;for(let i=0;i<4;i++){g.beginPath();g.ellipse(165+i*65,555+Math.sin(time*1.3+i)*6,25,3,0,0,Math.PI);g.stroke();}}
  // Visible ambient forge sparks, independent of interactive hit areas.
  for(let i=0;i<5;i++){const phase=(time*.5+i*.2)%1;g.fillStyle=`rgba(255,180,73,${1-phase})`;g.fillRect(858+Math.sin(i*4)*12,290-phase*35,2,3);}
}
// Inventory art uses the same clean crop as held gear, centered and scaled to its slot.
export function drawWeaponIcon(g,id,x,y,height=110){
 const dimensions={sword:[95,-35.5],spear:[130,-32.5],axe:[95,-23.75],mace:[85,-21.25],dagger:[62,-20.46]}[id];
 if(!dimensions)return;
 g.save();g.translate(x,y);g.rotate(-.12);g.scale(height/dimensions[0],height/dimensions[0]);
 drawHeldWeapon(g,id,0,-dimensions[1],0);g.restore();
}

export function drawWeapon(g,id,x,y,size=1,swing=0){if(id==='mace'||id==='dagger'){g.save();g.translate(x,y-20);g.scale(size,size);drawHeldWeapon(g,id,0,0,-.15+swing);g.restore();return;}if(equipmentImage.complete&&equipmentImage.naturalWidth){const w=equipmentImage.naturalWidth/3,h=equipmentImage.naturalHeight,index={sword:0,spear:1,axe:2}[id]??0;g.save();g.translate(x,y);g.scale(size,size);g.rotate(-.28+swing);if(id==='sword'){g.scale(1,-1);g.drawImage(equipmentImage,index*w,0,w,h,-25,-20,50,125);}else g.drawImage(equipmentImage,index*w,0,w,h,-25,-105,50,125);g.restore();return;}g.save();g.translate(x,y);g.scale(size,size);g.rotate(-.28+swing);g.lineCap='round';
  g.strokeStyle='#6b4026';g.lineWidth=id==='spear'?5:8;g.beginPath();g.moveTo(0,14);g.lineTo(0,id==='spear'?-80:-7);g.stroke();
  if(id==='spear'){g.fillStyle='#a8d1b9';g.strokeStyle='#e6efd1';g.lineWidth=1;g.beginPath();g.moveTo(0,-106);g.lineTo(-9,-76);g.lineTo(0,-81);g.lineTo(9,-76);g.closePath();g.fill();g.stroke();}
  else if(id==='axe'){g.fillStyle='#99a6a5';g.strokeStyle='#edf0d2';g.lineWidth=2;g.beginPath();g.moveTo(-4,-55);g.lineTo(16,-67);g.quadraticCurveTo(31,-44,18,-28);g.lineTo(-4,-39);g.closePath();g.fill();g.stroke();}
  else{g.fillStyle='#c9d8cf';g.strokeStyle='#f4eac1';g.lineWidth=1;g.beginPath();g.moveTo(0,-78);g.lineTo(-6,-62);g.lineTo(-6,-9);g.lineTo(6,-9);g.lineTo(6,-62);g.closePath();g.fill();g.stroke();g.strokeStyle='#dfb969';g.lineWidth=5;g.beginPath();g.moveTo(-15,-7);g.lineTo(15,-7);g.stroke();}
  g.restore();}

export function drawShield(g,id,x,y,size=1){if(!shieldImage.complete||!shieldImage.naturalWidth||!id)return;const index={oak:0,jade:1,holy:2}[id],bounds=[[9,213,525,735],[20,182,558,769],[70,25,491,975]][index],w=shieldImage.naturalWidth/3,[l,t,r,b]=bounds;const height=id==='holy'?78*size:58*size,width=height*(r-l)/(b-t);g.drawImage(shieldImage,index*w+l,t,r-l,b-t,x-width/2,y-height/2,width,height);}
export function drawArmor(g,id,x,y,width=70,height=75){if(!armorImage.complete||!armorImage.naturalWidth||!id)return;const index={leather:0,jade:1,basalt:2}[id],[l,t,r,b]=[[33,130,512,865],[0,137,512,892],[0,131,507,874]][index],w=armorImage.naturalWidth/3;g.drawImage(armorImage,index*w+l,t,r-l,b-t,x-width/2,y-height/2,width,height);}
export function drawHeldWeapon(g,id,x,y,angle){if(id==='mace'||id==='dagger'){if(!extraWeaponImage.complete||!extraWeaponImage.naturalWidth)return;const [l,t,r,b]=id==='mace'?[99,11,605,1220]:[816,53,1106,1220],height=id==='mace'?85:62,width=height*(r-l)/(b-t),grip=id==='mace'?.75:.83;g.save();g.translate(x,y);g.rotate(angle);g.drawImage(extraWeaponImage,l,t,r-l,b-t,-width/2,-height*grip,width,height);g.restore();return;}if(!equipmentImage.complete||!equipmentImage.naturalWidth)return;const index={sword:0,spear:1,axe:2}[id],w=equipmentImage.naturalWidth/3,[l,t,r,b]=[[127,11,414,1005],[203,11,407,1005],[43,11,469,1007]][index],height=id==='spear'?130:id==='axe'?95:95,width=height*(r-l)/(b-t);g.save();g.translate(x,y);g.rotate(angle);if(id==='sword'){g.scale(1,-1);g.drawImage(equipmentImage,index*w+l,t,r-l,b-t,-width/2,-12,width,height);}else g.drawImage(equipmentImage,index*w+l,t,r-l,b-t,-width/2,-height*.75,width,height);g.restore();}
