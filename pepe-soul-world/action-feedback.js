import {act} from './core.js?v=enemy-timing-20261014';
import {abilityStatus} from './ability-status.js?v=1';

const TECHNIQUES=new Set(['dash','wave','rift','release','domain']);
// Explain rejected input through the existing message channel, without changing gates.
export function attemptAction(state,key){
 const start=state.events.length,accepted=act(state,key);
 if(!accepted&&TECHNIQUES.has(key)&&!state.events.slice(start).some(event=>event.type==='message')){
  const status=abilityStatus(state,key);
  if(!status.ready)state.events.push({type:'message',text:status.name+' · '+status.reason});
 }
 return accepted;
}
