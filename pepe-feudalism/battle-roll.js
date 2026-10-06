import {TROOPS,RANKS} from './campaign.js';
export function battleRoll(units,won){
 return Object.entries(TROOPS).map(([type,t])=>{
  const troops=units.filter(u=>!u.hero&&u.team===0&&u.type===type),living=troops.filter(u=>u.hp>0);
  return {name:t.name,deployed:troops.filter(u=>!u.reserve).length,reserve:living.filter(u=>u.reserve).length,promoted:won?living.filter(u=>!u.reserve&&(u.xp??0)<3).length:0,lost:troops.length-living.length,survived:living.length,ranks:RANKS.map((name,rank)=>({name,count:living.filter(u=>Math.min(3,(u.xp??0)+(won&&!u.reserve?1:0))===rank).length})).filter(r=>r.count)};
 }).filter(row=>row.lost||row.survived);
}
