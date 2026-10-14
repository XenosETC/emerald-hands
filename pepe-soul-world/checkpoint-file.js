import {snapshot,createState,readSave,levelFor,WORLDS} from './core.js?v=checkpoint-timers-20261013';
export const MAX_BACKUP_SIZE=250000;
export function checkpointFile(s){return JSON.stringify({game:'pepe-soul-world',format:1,checkpoint:snapshot(s)},null,2);}
export function parseCheckpointFile(text){
 if(typeof text!=='string'||text.length>MAX_BACKUP_SIZE)throw Error('Choose a Soul World backup smaller than 250 KB.');
 let file;try{file=JSON.parse(text);}catch{throw Error('This file is not readable JSON.');}
 if(file?.game!=='pepe-soul-world'||file.format!==1||!readSave(file.checkpoint))throw Error('Choose a backup downloaded from Soul World’s Save tab.');
 return snapshot(createState(file.checkpoint));
}
export function checkpointSummary(value){
 const s=createState(value);return `Level ${levelFor(s.xp).level} · ${WORLDS.find(w=>w.id===s.world).name} · ${s.seals.length}/3 seals · ${s.fragments} fragments`;
}
