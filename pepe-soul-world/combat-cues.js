import {abilityReady} from './core.js';
import {riftPhase} from './kek-rift.js';
import {abilityStatus} from './ability-status.js?v=1';
import {attackCue} from './attack-motion.js';
import {guardCue} from './sword-guard.js?v=status-20261013';
export function combatCue(s){
 const p=s.player;
 const guard=guardCue(p);if(guard)return guard;
 if(p.riftQueued)return 'KEK RIFT · JUMP BUFFERED';
 if(p.rift)return 'KEK RIFT · '+riftPhase(p.rift.elapsed).toUpperCase();
 const cut=attackCue(p,abilityReady(s,'dash'));if(cut)return cut;
 const ability=(key,input)=>{const info=abilityStatus(s,input);return key+' · '+info.name+' · '+(info.ready?info.cost+' SP':info.reason);};
 const warp=ability('K','dash'),sword=ability('L','wave');
 return warp+'  /  '+sword;
}
