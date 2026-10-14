import {WORLDS} from './core.js';

// Presentation only. Quest readiness and rewards stay in systems.js.
export function questChecklist(s,id){
 if(id==='echoes')return WORLDS.filter(world=>world.id!=='academy').map(world=>({
  label:world.name+(world.id==='temple'?' · optional, after the oath':''),
  done:s.discoveries.includes(world.id),detail:s.discoveries.includes(world.id)?'Shrine attuned':'E at the shrine, position 1360',
 }));
 if(id==='guardian')return [
  ...['frozen','crimson','void'].map(id=>({label:WORLDS.find(world=>world.id===id).name,done:s.seals.includes(id),detail:s.seals.includes(id)?'Seal recovered':'Defeat its guardian and collect the seal'})),
  {label:'Return to Goribbit',done:s.complete,detail:s.complete?'Oath fulfilled':'Bring all three seals to the academy mentor at 490 · E'},
 ];
 return [];
}
