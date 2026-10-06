import {equippedPose,drawCrownFrame} from './crown-equipped.js';
import {CROWN_POSES} from './crown-poses.js';
import {RESIDENTS} from './residents.js';
import {QUESTS} from './adventure.js';
export const residentImage=(typeof Image==='undefined'?{}:new Image());residentImage.src='assets/residents-v1.png';
export function drawResident(g,p,time,scale=1){if(!residentImage.complete||!residentImage.naturalWidth)return;const column={questgiver:0,porter:1,villager:2}[p.id]??0,w=residentImage.naturalWidth/3,h=residentImage.naturalHeight;g.save();g.translate(p.x,p.y);g.scale((p.facing??1)*scale,scale);const bob=p.moving?Math.abs(Math.sin(time*6))*1.2:Math.sin(time*2)*.4;g.drawImage(residentImage,column*w,0,w,h,-21,-82+bob,42,84);g.restore();}
export function townPeople(node,time){
 const resident=RESIDENTS[node.id],walk=Math.sin(time*.22);
 return [
  ...(resident?[{id:'questgiver',name:resident.name,x:710,y:420,coat:'#655579',moving:false,facing:1}]:[]),
  {id:'porter',x:440+walk*100,y:405,coat:'#805b3b',moving:true,facing:Math.cos(time*.22)>0?1:-1},
  {id:'villager',x:650-walk*90,y:305,coat:'#3f6b6c',moving:true,facing:Math.cos(time*.22)>0?-1:1}
 ];
}
export function townPersonAt(node,time,p){return townPeople(node,time).find(n=>n.id==='questgiver'&&Math.hypot(n.x-p.x,n.y-28-p.y)<38);}
export function drawTownLife(g,node,time,state,crown,hero=null,drawGear=null){
 const h=hero??{x:650,y:390,facing:1,moving:false,distance:0};
 for(const p of [...townPeople(node,time),{...h,id:'crown'}].sort((a,b)=>a.y-b.y)){
  if(p.id==='crown'){drawTownHero(g,crown,p,time,drawGear);continue;}
  g.save();g.fillStyle='#142d2544';g.beginPath();g.ellipse(p.x,p.y+2,13,4,0,0,7);g.fill();g.restore();drawResident(g,p,time);
  if(p.id==='questgiver'){const q=QUESTS.find(q=>q.board===node.id),status=state?.quests[q?.id];g.fillStyle=status==='ready'?'#b9eb91':'#ffe09b';g.strokeStyle='#35432b';g.lineWidth=2;g.beginPath();g.arc(p.x,p.y-94,11,0,0,7);g.fill();g.stroke();g.fillStyle='#203729';g.font='bold 16px Georgia';g.textAlign='center';g.fillText(status==='ready'?'✓':status==='completed'?'·':'!',p.x,p.y-88);g.fillStyle='#17352be8';g.fillRect(p.x-75,p.y+9,150,22);g.fillStyle='#f2dfaa';g.font='13px Georgia';g.fillText(p.name,p.x,p.y+25);}
 }
 if(hero?.target){g.save();g.strokeStyle='#f7dea877';g.setLineDash([3,7]);g.lineWidth=1;g.beginPath();g.moveTo(hero.x,hero.y);for(const p of [hero.target,...hero.path])g.lineTo(p.x,p.y);g.stroke();g.setLineDash([]);const end=hero.path.at(-1)??hero.target;g.beginPath();g.ellipse(end.x,end.y,10,4,0,0,7);g.stroke();g.restore();}

}

export function drawTownHero(g,crown,h,time,drawGear=null){
 if(!crown?.complete||!crown.naturalWidth)return;
 const poseIndex=h.moving?(Math.sin(h.distance/13)>0?1:2):0,p=crown.renderSet?equippedPose([0,1,3][poseIndex],crown.renderSet):CROWN_POSES[[0,1,3][poseIndex]],scale=.15;
 g.save();g.translate(h.x,h.y);g.fillStyle='#18382b55';g.beginPath();g.ellipse(0,3,22,7,0,0,Math.PI*2);g.fill();
 g.strokeStyle='#e5cb8b88';g.lineWidth=1;g.beginPath();g.ellipse(0,3,24,8,0,0,Math.PI*2);g.stroke();
 g.scale(h.facing,1);drawCrownFrame(g,crown,p,scale);if(drawGear&&!crown.bakedGear){g.save();g.scale(.6,.6);drawGear(g,poseIndex,p);g.restore();}g.restore();
}
