// Pose timing follows the simulation's committed attack states.
export const GUARDIAN_STYLE = Object.freeze({
  temple:{color:'#83ffd0',name:'JADE CLEAVE',wave:'LOTUS WAVE',shape:'orbit'},
  frozen: {color:'#b7f1ff',name:'RIME CUT',wave:'FROST WAVE',shape:'crystal'},
  crimson: {color:'#ffc194',name:'EMBER CUT',wave:'EMBER WAVE',shape:'flame'},
  void: {color:'#d5b8ff',name:'VOID CUT',wave:'VOID WAVE',shape:'orbit'}
});
export const GUARDIAN_ART=Object.freeze({temple:'jade-abbot-v1',frozen:'rime-warden-v1',crimson:'ember-keeper-v1',void:'void-guardian-v2'});
export function guardianFrames(e,time,reduced=false){
  const index=e.mode==='windup'?2:e.mode==='strike'?3:e.mode==='recover'?0:Math.floor(time*5)%2;
  // Brief anchored blend softens the cut-to-guard snap without changing hit timing.
  const blend=e.mode==='recover'&&!reduced?Math.max(0,Math.min(1,((e.recoveryDuration||.9)-e.timer)/.12)):1;
  return {index,previous:3,blend};
}
export function enemyPose(e,time,reduced=false){
  const duration=e.windupDuration||(e.boss?.65:e.elite?.9:.55);
  const charge=e.mode==='windup'?Math.max(0,Math.min(1,1-e.timer/duration)):0;
  const recovery=e.mode==='recover'?Math.max(0,Math.min(1,e.timer/(e.recoveryDuration||(e.boss?.9:.8)))):0;
  const col=e.mode==='windup'?2:e.mode==='strike'?3:e.mode==='recover'?0:Math.floor(time*5)%2;
  // Scale and shear around the sole, never translate or rotate the floor anchor.
  const lean=reduced?0:e.mode==='windup'?-e.face*.045*charge:e.mode==='strike'?e.face*.065:e.mode==='recover'?e.face*.025*recovery:0;
  const scaleY=reduced?1:e.mode==='windup'?1-.035*charge:e.mode==='strike'?1.025:e.mode==='recover'?1-.025*recovery:1+Math.sin(time*2.4+e.id)*.006;
  return {col,charge,lean,scaleY,scaleX:2-scaleY,wave:e.boss&&e.attackCount%2===1};
}
