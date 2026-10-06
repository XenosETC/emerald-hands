import {troopStats} from './campaign.js';
export function armySummary(state){
 const summary={frontline:0,ranged:0,healers:0,experienced:0,health:0,notes:[]};
 state.army.forEach((type,i)=>{const rank=state.armyXp?.[i]??0,t=troopStats(type,rank);summary.health+=t.hp;if(rank>0)summary.experienced++;if(type==='archer'||t.spell)summary.ranged++;else summary.frontline++;if(type==='holyMage')summary.healers++;});
 if(!state.army.length)summary.notes.push('Crown is marching alone. Hire soldiers before challenging a garrison.');
 else {if(!summary.frontline)summary.notes.push('No frontline: ranged troops are exposed when enemies close in.');if(!summary.ranged)summary.notes.push('No ranged support: your army must close the distance to deal damage.');if(!summary.healers)summary.notes.push('No Holy Mage: rely on Crown’s Rally and carried healing draughts.');if(!summary.experienced)summary.notes.push('All soldiers are fresh recruits. Surviving victories strengthen them.');}
 return summary;
}
