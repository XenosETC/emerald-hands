import {MISSIONS} from './missions.js';
import {TROOPS} from './campaign.js';
import {createBattle} from './combat.js';
import {configureEncounter} from './encounters.js';
import {NODES,route} from './world.js';
// Reports derive from the same encounter construction used when marching.
export function scout(state,node){
 const ids=route(state.location,node.id);
 const distance=ids.slice(1).reduce((sum,id,i)=>{const a=NODES.find(n=>n.id===ids[i]),b=NODES.find(n=>n.id===id);return sum+Math.hypot(a.x-b.x,a.y-b.y);},0);
 const report={stops:ids.length-1,seconds:Math.ceil(distance/330),enemies:[],reserves:0,captain:null};
 if(!node.battle||state.owned.includes(node.id))return report;
 const b=createBattle(state,node.battle);configureEncounter(b,node.id);
 report.reserves=b.enemyReserves?.length??0;report.mission=MISSIONS[node.id]?{...MISSIONS[node.id]}:null;
 for(const type of Object.keys(TROOPS)){const units=[...b.units,...(b.enemyReserves??[])].filter(u=>u.team===1&&!u.structure&&u.type===type);if(units.length)report.enemies.push({type,count:units.length,origin:b.enemyOrigin});}
 const captain=b.units.find(u=>u.captain);if(captain)report.captain={name:captain.captain,hp:captain.max,damage:captain.damage};
 return report;
}
