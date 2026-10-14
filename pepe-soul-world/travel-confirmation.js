import {groundRewards} from './ground-rewards.js?v=1';
import {approachRemaining} from './core.js';

// Only actual E transitions need confirmation; shrine interactions and locked gates do not.
export function interactionLeavesArea(s){
 const p=s.player;
 if(s.dead||s.world==='academy'||p.hurt>0||p.guarding||p.domain||p.rift||p.riftQueued)return false;
 const atPassage=Math.abs(s.player.x-2250)<=200;
 if(s.zone==='arena')return s.guardianDefeated&&atPassage;
 return atPassage?approachRemaining(s)===0:s.player.x<470;
}
export function confirmTravel(s,travel,confirm){
 const rewards=groundRewards(s);
 if(rewards.length){
  const list=rewards.map(reward=>'• '+reward.label+' at '+reward.x).join('\n');
  if(!confirm('Leave these ground rewards behind?\n\n'+list+'\n\nThey will be cleared when you leave this area. Cancel to keep exploring and collect them.'))return false;
 }
 return travel();
}
