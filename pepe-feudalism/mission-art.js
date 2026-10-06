import {missionProgress,missionHint,captiveGuarded} from './missions.js';

export const missionProps=new Image();
missionProps.src='assets/mission-props-v1.png';
// Explicit bounds keep the tall intact totem above its atlas quadrant intact.
const FRAMES={closed:[65,10,500,545,250],open:[675,10,560,545,235],totem:[65,565,500,665,250],rubble:[640,755,595,475,295]};
function prop(g,key,x,y,scale){
 const [sx,sy,w,h,anchor]=FRAMES[key];
 if(missionProps.complete&&missionProps.naturalWidth)g.drawImage(missionProps,sx,sy,w,h,x-anchor*scale,y-h*scale,w*scale,h*scale);
}
export function drawCaptive(g,b,c){
 const guarded=captiveGuarded(b,c),color=c.freed?'#a9d99c':guarded?'#e6ab80':'#ffe19a';
 g.save();g.strokeStyle=color;g.lineWidth=2;g.beginPath();g.ellipse(c.x,c.y,49,15,0,0,Math.PI*2);g.stroke();
 prop(g,c.freed?'open':'closed',c.x,c.y,.255);
 g.font='bold 13px Georgia';g.textAlign='center';g.fillStyle='#12291fe8';g.fillRect(c.x-54,c.y+13,108,23);g.fillStyle=color;
 g.fillText(c.freed?'Herbalist safe':guarded?'Guarded cage':'F / Free herbalist',c.x,c.y+29);g.restore();
}
export function drawTotem(g,b,u){
 g.save();
 if(u.hp>0){g.strokeStyle='#ed9f50';g.globalAlpha=.45+Math.sin(b.time*3)*.15;g.lineWidth=2;g.beginPath();g.ellipse(u.x,u.y,43,13,0,0,Math.PI*2);g.stroke();g.globalAlpha=1;}
 prop(g,u.hp>0?'totem':'rubble',u.x,u.y,.225);
 if(u.flash>0){g.strokeStyle='#ffe9b4';g.globalAlpha=u.flash/.18;g.lineWidth=3;g.beginPath();g.ellipse(u.x,u.y-73,48,70,0,0,Math.PI*2);g.stroke();}
 g.restore();
}
export function drawMissionHud(g,b){
 const progress=missionProgress(b);if(!progress)return;
 const y=b.targetId!==null?113:49;
 g.save();g.fillStyle='#14271feb';g.strokeStyle=progress.complete?'#9ecb8c':'#cfa96a';g.lineWidth=1;g.fillRect(355,y,490,54);g.strokeRect(355,y,490,54);
 g.textAlign='center';g.fillStyle='#f5e3b2';g.font='bold 16px Georgia';g.fillText(`${b.mission.title} / ${progress.completed} of ${progress.total}`,600,y+21);
 g.fillStyle='#d7d6bc';g.font='12px Georgia';g.fillText(missionHint(b),600,y+41);g.restore();
}
