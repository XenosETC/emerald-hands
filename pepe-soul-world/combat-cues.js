import {abilityReady,riftInput} from './core.js';
import {stats} from './systems.js';
import {RIFT,riftPhase} from './kek-rift.js';
import {attackCue} from './attack-motion.js';
import {guardCue} from './sword-guard.js';
export function combatCue(s){
 const p=s.player;
 const guard=guardCue(p);if(guard)return guard;
 if(p.riftQueued)return 'KEK RIFT · JUMP BUFFERED';
 if(p.rift)return 'KEK RIFT · '+riftPhase(p.rift.elapsed).toUpperCase();
 const cut=attackCue(p,abilityReady(s,'dash'));if(cut)return cut;
 const ability=(key,name,cooldown,cost)=>cooldown>0?name+' '+cooldown.toFixed(1)+'s':p.sp<cost?name+' · Need '+cost+' SP':!abilityReady(s,key)?name+' · Recovering':name+' · '+cost+' SP';
 const warp=ability('dash','K · Warp',p.dashCooldown,stats(s).warpCost);
 const sword=riftInput(s)?ability('rift','L · Kek Rift',p.riftCooldown,RIFT.cost):ability('wave','L · Kek Wave',p.waveCooldown,28);
 return warp+'  /  '+sword;
}
