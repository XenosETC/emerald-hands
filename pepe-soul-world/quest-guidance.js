import {QUESTS,questReady} from './systems.js';
import {WORLDS,approachRemaining} from './core.js';
export function questGuidance(s){
 if(s.world==='temple'){
  const left=approachRemaining(s),returnText=s.bossRewards.includes('temple')?'Jade Abbot defeated · Reward already recovered. E at 2250 to return home.':'Jade Abbot defeated · Collect your fragments and flask, then return home at 2250.';
  return {text:s.zone==='arena'?(s.guardianDefeated?returnText:'Inner Sanctuary · Defeat the Jade Abbot to open your return portal.'):(left?'Temple Approach · '+left+' / 3 disciples remain. Clear them to open the sanctuary.':'Temple Approach cleared · E at 2250 to enter the Inner Sanctuary.'),ready:0};
 }
 if(s.world!=='academy'&&s.zone==='arena')return {text:s.guardianDefeated?'Guardian defeated · Collect the seal and gear, then E at the return portal (2250).':'Guardian arena · Defeat '+WORLDS.find(w=>w.id===s.world).boss+' to open your return portal.',ready:0};
 if(s.world!=='academy'&&['approach','approach2'].includes(s.zone))return {text:approachRemaining(s)?`${s.zone==='approach2'?'Approach II':'Approach I'} · ${approachRemaining(s)} / 3 enemies remain. Clear them to open the next passage.`:(s.zone==='approach2'?'Approach II cleared · E at 2250 to enter the third map: guardian arena.':'Approach I cleared · E at 2250 to enter the second map: Approach II.'),ready:0};
 const ready=QUESTS.filter(q=>questReady(s,q));
 if(ready.length)return {text:`${ready.length} quest reward${ready.length===1?'':'s'} ready · ${ready[0].name}. Open Quests to claim.`,ready:ready.length};
 if(!s.oath)return {text:'Meet Goribbit at the academy lantern (490). Press E to accept your oath.',ready:0};
 if(s.training<3)return {text:`J · Cut the academy effigy at 870. Training ${s.training} / 3.`,ready:0};
 if(s.seals.length===3&&!s.complete)return {text:'Return to Goribbit at Kek Academy. Press E to fulfill your oath.',ready:0};
 if(s.complete){const pending=QUESTS.find(q=>!s.claimedQuests.includes(q.id));return {text:pending?`Oath fulfilled · ${pending.name}. Open Quests for your remaining objective.`:'All quests claimed. Revisit the realms, temper your blade, and master your skills.',ready:0};}
 return {text:`Seals ${s.seals.length} / 3 · ${s.world==='academy'?'Reach the veil gate at 2250, then open Map.':'Open Map to return to the academy for your next crossing.'}`,ready:0};
}
