import {ITEMS} from './systems.js';

// Read the current ground drops; presentation never collects or grants a reward.
export function groundRewards(s){
 const seals={frozen:'Frost seal',crimson:'Ember seal',void:'Void seal'};
 return s.drops.filter(d=>Number.isFinite(d.x)&&(d.kind==='loot'||d.kind==='seal')).map(d=>({
  x:Math.round(d.x),label:d.kind==='seal'?(seals[d.world]||'Seal'):
   `${d.amount||0} spirit fragments${ITEMS[d.item]?' + '+ITEMS[d.item].name:''}`,
 })).sort((a,b)=>Math.abs(a.x-s.player.x)-Math.abs(b.x-s.player.x));
}
