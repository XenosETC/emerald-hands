import {settlementLandmarks} from './settlements.js';
import {townPeople} from './town-life.js';
export function nearbyInteraction(node,hero,time){
 const people=townPeople(node,time).filter(p=>p.id==='questgiver').map(p=>({...p,service:'market',label:`Talk to ${p.name}`}));
 const buildings=settlementLandmarks(node).map(p=>({...p,y:Math.max(275,p.y+50),service:p.id,label:p.id==='gate'?`Leave through ${p.name}`:`Visit ${p.name}`}));
 return [...people,...buildings].map(p=>({...p,distance:Math.hypot(hero.x-p.x,hero.y-p.y)})).filter(p=>p.distance<=90).sort((a,b)=>a.distance-b.distance)[0]??null;
}
