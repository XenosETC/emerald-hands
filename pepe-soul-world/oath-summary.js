import {QUESTS,questReady} from './systems.js';
import {canDomain} from './core.js';

// Completion presentation derives from earned progress; it never grants rewards.
export function oathSummary(s){
 if(!s.complete||!canDomain(s))return null;
 const claimed=QUESTS.filter(q=>s.claimedQuests.includes(q.id)).length;
 const ready=QUESTS.filter(q=>questReady(s,q)).length;
 return {claimed,total:QUESTS.length,ready,templeCleared:s.bossRewards.includes('temple'),
  rewardText:claimed===QUESTS.length?'All quest rewards claimed.':ready?`${ready} reward${ready===1?'':'s'} ready. Open Quests to claim.`:'Unfinished quests still have rewards to earn.'};
}
