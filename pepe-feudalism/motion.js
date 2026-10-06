// Visual state follows simulation time and actual distance, including pause.
export function createMotionTracker(){
 const tracks=new WeakMap();
 return (unit,time)=>{
  let t=tracks.get(unit);
  if(!t){t={x:unit.x,y:unit.y,time,distance:0};tracks.set(unit,t);}
  const dt=Math.max(0,time-t.time),distance=Math.hypot(unit.x-t.x,unit.y-t.y);
  if(dt>0){t.distance+=Math.min(distance,unit.speed*dt*1.5);t.x=unit.x;t.y=unit.y;t.time=time;}
  const phase=t.distance/18,attack=unit.swing>0?1-Math.min(1,unit.swing/.22):null;
  return {phase,bob:unit.moving?Math.abs(Math.sin(phase))*2:Math.sin(time*2+unit.id)*.6,attack};
 };
}
export function weaponSwing(weapon,progress){
 if(progress===null)return .65;
 const ease=Math.sin(progress*Math.PI/2);
 return weapon==='spear'?.85+ease*.4:(weapon==='axe'||weapon==='mace')?.65+ease*1.2:.5+ease*1.1;
}
