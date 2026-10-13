import {GUARDIAN_REWARDS} from './guardian-rewards.js';
import {ITEMS} from './systems.js';
import {WORLDS} from './core.js';
export function guardianReceipts(s){
 return WORLDS.filter(w=>GUARDIAN_REWARDS[w.id]&&s.bossRewards.includes(w.id)).map(w=>{
  const reward=GUARDIAN_REWARDS[w.id];return {world:w.name,item:ITEMS[reward.item].name,amount:reward.amount};
 });
}
