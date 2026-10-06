// Temple encounter timing and tells. Damage is applied by the simulation caller.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const TEMPLE_ATTACKS=Object.freeze({
 cleave:{name:'JADE CLEAVE',hint:'Watch the blade · Warp behind',windup:.8,recovery:1.05,range:215,damage:24,clearance:100},
 lotus:{name:'LOTUS ERUPTION',hint:'Leave the marked ground',windup:1.1,recovery:1.2,range:540,damage:22},
 wave:{name:'LOTUS WAVE',hint:'Jump over the low wave',windup:.85,recovery:1.1,range:540,damage:18},
 staff:{name:'STAFF SWEEP',hint:'Watch the staff · Warp past',windup:.7,recovery:.85,range:145,damage:12,clearance:100}
});
const order=['cleave','lotus','wave'];
export function templeAttack(e){return TEMPLE_ATTACKS[e.templeAttack||(e.boss?order[e.attackCount%order.length]:'staff')];}
export function templeTelegraph(e){
 if(e.dead)return null;
 const a=templeAttack(e),remaining=Math.max(0,e.timer),melee=e.templeAttack==='cleave'||e.templeAttack==='staff';
 if(e.mode==='windup'){
  const jump=melee&&remaining<=.5&&remaining>.3,late=melee&&remaining<=.3;
  return {phase:'windup',urgent:remaining<=.5,name:a.name,hint:jump?'Jump now or Warp behind':late?'Warp behind or stay clear':a.hint,label:jump?'JUMP / WARP NOW':late?'WARP / STAY CLEAR':'WINDUP',remaining,progress:clamp(1-remaining/a.windup,0,1)};
 }
 if(e.mode==='strike')return {phase:'strike',urgent:true,name:a.name,hint:'Attack released',label:'RELEASE',remaining,progress:1};
 if(e.mode==='recover')return {phase:'recover',urgent:false,name:'OPEN',hint:'Counterattack',label:'COUNTER WINDOW',remaining,progress:clamp(remaining/(e.recoveryDuration||a.recovery),0,1)};
 return null;
}
export function templeCue(e){const tell=templeTelegraph(e);return tell?tell.name+' · '+tell.hint:null;}
export function staggerTempleEnemy(e,duration=.8){
 e.recoveryFrame=e.mode==='windup'?2:e.mode==='strike'?3:0;
 e.mode='recover';e.timer=duration;e.recoveryDuration=duration;e.poseTime=0;e.marks=[];e.walking=false;e.guardWalkDistance=null;
}
export function stepTempleEnemy(e,p,dt,ground){
 const actions=[],dx=p.x-e.x,dist=Math.abs(dx),wasWalking=e.walking;
 e.walking=false;e.walkStopTime=(e.walkStopTime||0)+dt;e.timer-=dt;e.poseTime=(e.poseTime||0)+dt;
 if(e.mode==='idle'){
  e.face=dx<0?-1:1;const key=e.boss?order[e.attackCount%order.length]:'staff',a=TEMPLE_ATTACKS[key];
  if(dist<600){
   if(dist<=a.range&&e.timer<=0){
    e.guardFrame=Math.floor(e.poseTime/.6)%2;e.guardWalkDistance=wasWalking?e.walkDistance:null;e.poseTime=0;e.mode='windup';e.timer=a.windup;e.templeAttack=key;e.windupDuration=a.windup;e.recoveryDuration=a.recovery;
    // Once painted, these positions and the facing never track the player.
    e.marks=key==='lotus'?[...new Set((e.hp<=e.maxHp*.5?[-210,0,210]:[0]).map(d=>clamp(p.x+d,100,2500)))]:[];
    actions.push({type:'templeTell',attack:key,x:e.x,y:ground,marks:[...e.marks],face:e.face});
   }else if(dist>Math.min(a.range-20,200)){
    const before=e.x;e.x=clamp(e.x+e.face*dt*(e.boss?75:92),100,2500);
    const travel=Math.abs(e.x-before);e.walking=travel>0;
    if(e.walking){e.walkDistance=(e.walkDistance||0)+travel;e.walkTime=wasWalking?(e.walkTime||0)+dt:dt;}
   }
  }
 }else if(e.mode==='windup'&&e.timer<=0){
  const a=templeAttack(e);e.mode='strike';e.timer=.2;e.poseTime=0;e.attackCount++;
  if(e.templeAttack==='lotus'){
   for(const x of e.marks)actions.push({type:'templeLotus',x,y:ground});
   if(e.marks.some(x=>Math.abs(p.x-x)<76)&&p.y>ground-115)actions.push({type:'damage',amount:a.damage,face:p.x<e.x?-1:1});
  }else if(e.templeAttack==='wave')actions.push({type:'projectile',x:e.x+e.face*55,y:ground-40,vx:e.face*350,life:2.8,damage:a.damage,friendly:false,world:'temple',owner:e.id,hit:[]});
  else {
   actions.push({type:'templeCleave',x:e.x,y:ground,face:e.face,range:a.range});
   if((p.x-e.x)*e.face>=-20&&Math.abs(p.x-e.x)<=a.range&&p.y>ground-a.clearance)actions.push({type:'damage',amount:a.damage,face:e.face});
  }
 }else if(e.mode==='strike'&&e.timer<=0){e.recoveryFrame=3;e.mode='recover';e.timer=e.recoveryDuration||templeAttack(e).recovery;e.poseTime=0;}
 else if(e.mode==='recover'&&e.timer<=0){e.mode='idle';e.timer=.28;e.poseTime=0;e.marks=[];e.templeAttack=null;}
 if(wasWalking&&!e.walking){e.stoppedWalkDistance=e.walkDistance;e.walkStopTime=0;}
 return actions;
}
export function drawTempleTell(ctx,e,ground,reduced=false){
 if(e.dead||e.mode!=='windup')return;
 const a=templeAttack(e),t=clamp(1-e.timer/a.windup,0,1);
 ctx.save();ctx.strokeStyle='#efd47e';ctx.fillStyle='#36bb8060';ctx.lineWidth=2;ctx.globalAlpha=.45+t*.5;
 if(e.templeAttack==='lotus'){
  for(const x of e.marks||[]){ctx.beginPath();ctx.ellipse(x,ground+1,76,12,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(x,ground+1,76*(1-t),12*(1-t),0,0,Math.PI*2);ctx.stroke();
   if(!reduced){ctx.globalAlpha=.12+t*.15;ctx.fillRect(x-76,ground-115,152,115);ctx.globalAlpha=.45+t*.5;}}
 }else{const range=e.templeAttack==='wave'?380:a.range;ctx.beginPath();ctx.moveTo(e.x,ground-4);ctx.lineTo(e.x+e.face*range,ground-4);ctx.stroke();ctx.lineWidth=4;ctx.strokeStyle=e.timer<=.5?'#fff0b5':'#efd47e';ctx.beginPath();ctx.moveTo(e.x,ground-4);ctx.lineTo(e.x+e.face*range*t,ground-4);ctx.stroke();ctx.beginPath();ctx.moveTo(e.x+e.face*range,ground-4);ctx.lineTo(e.x+e.face*(range-16),ground-13);ctx.lineTo(e.x+e.face*(range-16),ground+5);ctx.closePath();ctx.fillStyle='#efd47e';ctx.fill();}
 ctx.restore();
}
export function drawTempleImpact(ctx,f,reduced=false){
 const t=1-f.life/f.max;ctx.save();ctx.translate(f.x,f.y);ctx.globalAlpha*=Math.max(0,1-t);
 ctx.strokeStyle='#ffe9a1';ctx.shadowColor='#2dff9a';ctx.shadowBlur=reduced?0:14;
 if(f.type==='templeLotus'){
  ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,76+12*t,12,0,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<(reduced?3:7);i++){
   const x=(i-(reduced?1:3))*(reduced?45:21),h=(115-Math.abs(x)*.65)*Math.min(1,t*8+.45),bend=x*.22;
   const petal=ctx.createLinearGradient(x,0,x,-h);petal.addColorStop(0,'#073f4160');petal.addColorStop(.4,'#17af7da0');petal.addColorStop(.85,'#79efb8bb');petal.addColorStop(1,'#edffd7');ctx.fillStyle=petal;
   ctx.lineWidth=1;ctx.strokeStyle='#bcf7bb99';ctx.beginPath();ctx.moveTo(x-13,0);ctx.quadraticCurveTo(x-23,-h*.4,x+bend,-h);ctx.quadraticCurveTo(x+23,-h*.4,x+13,0);ctx.closePath();ctx.fill();ctx.stroke();
   ctx.strokeStyle='#f4e7a799';ctx.beginPath();ctx.moveTo(x,-4);ctx.quadraticCurveTo(x+bend*.4,-h*.45,x+bend,-h);ctx.stroke();
  }
  if(!reduced){ctx.shadowBlur=0;ctx.fillStyle='#ccffe5';for(let i=0;i<9;i++){const x=Math.sin(i*2.4)*65,y=-18-(i%4)*19-t*72;ctx.save();ctx.translate(x,y);ctx.rotate(i+t);ctx.fillRect(-1.5,-3,3,6);ctx.restore();}}
 }else{ctx.scale(f.face,1);ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(28,-75,f.range-28,75,.15,-1.2,1.1);ctx.stroke();}
 ctx.restore();
}
