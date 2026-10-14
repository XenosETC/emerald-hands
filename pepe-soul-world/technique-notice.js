import {canRift} from './core.js?v=enemy-timing-20261014';

// Session feedback only; no acknowledgement or progression is added to the save.
export function techniqueNotice(known,state){
 const unlocked=canRift(state);
 return {known:unlocked,text:!known&&unlocked?'NEW · R: Soul Release. Jump + L: Kek Rift. Grounded L stays Kek Wave. Skills: costs and timing.':null};
}
export function techniqueMessage(text,notice,now){return notice&&now<notice.until?notice.text+(text?' · '+text:''):text;}
