// Shared scene definitions keep painted building labels and mouse targets aligned.
export function settlementTheme(node){
  if(node?.id==='cinderford')return 'frontier';
  if(node?.id==='frostford')return 'winterVillage';
  if(node?.id==='snowcastle')return 'winterCastle';
  if(node?.corrupted)return 'corrupted';
  if(node?.kind==='port')return 'port';
  if(['castle','fortress'].includes(node?.kind))return 'castle';
  return node?.id==='home'?'capital':'village';
}
export function settlementLandmarks(node){
  const theme=settlementTheme(node);
  const names={frontier:['Frontier Hall','Ashroad Barracks','Emberworks Forge','Scout Quest Board','Basalt Gate'],winterVillage:['Frostford Hall','Northern Barracks','Hearth Smithy','Winter Quest Board','Pine Gate'],winterCastle:['Wintercrown Hall','Snowguard Barracks','Royal Forge','Castle Quest Board','Mountain Gate'],corrupted:['Ashfang Citadel','Basalt Barracks','Cinder Forge','Citadel Quest Board','Blackstone Gate'],capital:['Crown Hall','Reed Barracks','Ember Forge','Quest Board','March Gate'],port:['Harbormaster','Marine Barracks','Shipwright Forge','Dockside Quest Board','Coastal Gate'],village:['Village Hall','Militia Barracks','Village Smithy','Village Quest Board','Forest Gate'],castle:['Royal Keep','Castle Barracks','Castle Forge','Courtyard Quest Board','Great Gate']}[theme];
  return ['castle','barracks','forge','market','gate'].map((id,i)=>({id,name:names[i],x:[600,300,864,564,996][i],y:[147,314,320,461,531][i]}));
}
