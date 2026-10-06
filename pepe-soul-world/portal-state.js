// Presentation follows existing travel rules; map recall remains available in approaches.
export function realmPortals(s){
 if(s.world==='academy'){
  const locked=!s.oath||s.training<3;
  return [{x:2250,locked,title:locked?'VEIL GATE · SEALED':'VEIL GATE · OPEN',prompt:!s.oath?'ACCEPT GORIBBIT’S OATH':s.training<3?'COMPLETE THREE TRAINING CUTS':'E · CHOOSE A REALM'}];
 }
 if(s.zone==='arena')return [{x:2250,locked:!s.guardianDefeated,title:s.guardianDefeated?'RETURN TO KEK ACADEMY':'RETURN SEAL · CLOSED',prompt:s.guardianDefeated?'E · RETURN HOME':'DEFEAT THE GUARDIAN'}];
 const remaining=s.enemies.filter(e=>!e.dead).length,elite=s.zone==='approach2'||s.world==='temple';
 return [{x:230,locked:false,title:'RETURN TO KEK ACADEMY',prompt:'E · RETURN HOME'},
  {x:2250,locked:remaining>0,title:remaining?`${remaining} ENEMIES REMAIN`:elite?'GUARDIAN PASSAGE · OPEN':'APPROACH II · OPEN',prompt:remaining?'CLEAR THIS APPROACH':elite?'E · ENTER GUARDIAN ARENA':'E · ENTER APPROACH II'}];
}
