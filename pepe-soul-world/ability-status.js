import {abilityReady,domainReady,canDomain,canRelease,canRift,riftInput,GROUND,DOMAIN} from './core.js';
import {stats} from './systems.js';
import {RIFT} from './kek-rift.js';

// Explain existing action gates; never spend Spirit or alter combat state.
export function abilityStatus(s,input){
 const key=input==='wave'&&riftInput(s)?'rift':input,p=s.player;
 const cost={dash:stats(s).warpCost,wave:28,rift:RIFT.cost,release:55,domain:DOMAIN.cost}[key];
 const name={dash:'Warp',wave:'Kek Wave',rift:'Kek Rift',release:'Release',domain:'Kek Domain'}[key];
 const ready=key==='domain'?domainReady(s):abilityReady(s,key);
 const cooldown=p[{dash:'dashCooldown',wave:'waveCooldown',rift:'riftCooldown',release:'releaseCooldown',domain:'domainCooldown'}[key]]||0;
 let reason;
 if(s.dead)reason='Revive first';
 else if(key==='domain'&&!canDomain(s))reason='Complete the three-seal oath';
 else if(key==='release'&&!canRelease(s)||key==='rift'&&!canRift(s))reason='Reach level 3 and recover a seal';
 else if(p.guarding&&key!=='dash')reason='Release sword guard';
 else if(p.hurt>0)reason='Recover from the hit';
 else if(p.domain||p.rift||p.riftQueued)reason='Finish the current technique';
 else if(key==='domain'&&p.y<GROUND||key==='rift'&&!riftInput(s))reason=key==='domain'?'Land first':'Jump first';
 else if(cooldown>0)reason='Cooldown '+cooldown.toFixed(1)+'s';
 else if(p.sp<cost)reason='Need '+cost+' SP';
 else if(!ready)reason='Finish combat recovery';
 else reason=cost+' SP · Ready';
 return {key,name,ready,cost,cooldown,reason};
}
