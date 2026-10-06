import {NODES,route} from './world.js';
import {troopAvailable} from './regional-troops.js';
export function recruitDestinations(state,type){
 return NODES.filter(n=>['town','castle','port','fortress'].includes(n.kind)&&(!n.battle||state.owned.includes(n.id))&&troopAvailable(type,n.id)).map(node=>{
  const ids=route(state.location,node.id),distance=ids.slice(1).reduce((sum,id,i)=>{const a=NODES.find(n=>n.id===ids[i]),b=NODES.find(n=>n.id===id);return sum+Math.hypot(a.x-b.x,a.y-b.y);},0);
  return {node,seconds:Math.ceil(distance/330),stops:ids.length-1};
 }).sort((a,b)=>a.seconds-b.seconds||a.node.name.localeCompare(b.node.name));
}
