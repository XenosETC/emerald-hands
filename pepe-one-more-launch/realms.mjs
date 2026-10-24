const realmStages={lily:['LILY POND','THE WILLOW CANOPY','ABOVE THE TREETOPS'],cloud:['THE FLOATING GARDENS','THE STORM FRONT','UPPER ATMOSPHERE'],emerald:['PLANETARY RINGS','THE EMERALD BELT','THE VIOLET NEBULA'],beyond:['BROKEN CLOCKWORK','THE ASCENDANT TEMPLES','THE CELESTIAL GATE'],outer:['THE OPAL CITADELS','STELLAR FILAMENTS','THE DEEP NIGHT'],everafter:['STARLESS FRONTIER','THE DISTANT LIGHT','ANOTHER HORIZON']};
// Bottom-to-top realm registry. Add a realm before the final endless entry;
// keep its start/end contiguous and supply as many connected panels as needed.
export const realms = [
  {id:'lily',name:'THE LILY MARSH',tag:'LOCAL FROG. GLOBAL CONSEQUENCES.',at:0,end:500,color:'#d9ed90',sky:['#718d66','#263e35'],panels:['assets/lily-ascent-v4.png'],fallback:'assets/lily-marsh-v2.png',chapter:'HOME IS A LILY PAD'},
  {id:'cloud',name:'THE THUNDER GARDEN',tag:'YOU ARE NOW THE WEATHER PROBLEM.',at:500,end:2000,color:'#f9dcaf',sky:['#496c91','#e6bd9e'],panels:['assets/cloud-ascent-v4.png'],fallback:'assets/cloud-kingdom-v2.png',chapter:'ABOVE THE NEIGHBORS'},
  {id:'emerald',name:'EMERALD SPACE',tag:'ONE SMALL KEK FOR FROGKIND.',at:2000,end:5000,color:'#8bffd4',sky:['#020c15','#074b3f'],panels:['assets/emerald-ascent-v4.png'],fallback:'assets/emerald-space-v2.png',chapter:'ONE SMALL KEK FOR FROGKIND'},
  {id:'beyond',name:'BEYOND THE LAST BRAIN CELL',tag:'THE UNIVERSE WOULD LIKE A REFUND.',at:5000,end:20000,color:'#efbdff',sky:['#180c35','#643f7e'],panels:['assets/beyond-ascent-v4.png'],fallback:'assets/beyond-v2.png',chapter:'REALITY WAS OPTIONAL'},
  {id:'outer',name:'THE OPAL DEEP',tag:'EVEN THE STARS ARE GETTING NERVOUS.',at:20000,end:60000,color:'#b1edff',sky:['#080c22','#28364f'],panels:['assets/outer-void-ascent-v4.png'],fallback:'assets/beyond-v2.png',chapter:'BEYOND THE KNOWN MAP'},
  {id:'everafter',name:'THE EVERAFTER',tag:'NO CEILING. JUST MORE BAD IDEAS.',at:60000,end:Infinity,sectorMeters:40000,color:'#e2f5ee',sky:['#030916','#172339'],panels:['assets/outer-void-ascent-v4.png'],fallback:'assets/emerald-space-v2.png',chapter:'THE MAP KEEPS GOING'},
].map(r=>Object.freeze({...r,stages:Object.freeze(realmStages[r.id]||[r.chapter]),asset:r.panels[0],panels:Object.freeze(r.panels)}));

export function realmAt(altitude,registry=realms){
  const a=Number.isFinite(altitude)?Math.max(0,altitude):0;
  return registry.find(r=>a>=r.at&&a<r.end)||registry.at(-1);
}

export function realmTrack(altitude,registry=realms){
  const a=Math.max(0,Number.isFinite(altitude)?altitude:0);
  let base=0;
  for(const realm of registry){
    if(a<realm.end){
      const length=realm.end===Infinity?realm.sectorMeters:realm.end-realm.at;
      const units=(a-realm.at)/length*realm.panels.length;
      return {realm,position:base+units,sector:realm.end===Infinity?Math.floor((a-realm.at)/realm.sectorMeters)+1:1};
    }
    base+=realm.panels.length;
  }
  throw new Error('Realm registry must end with an endless realm');
}

export function panelAt(index,registry=realms){
  if(index<0)return null;
  let offset=0;
  for(const realm of registry){
    if(index<offset+realm.panels.length||realm.end===Infinity){
      const local=index-offset;
      return {realm,asset:realm.panels[local%realm.panels.length],sequence:realm.end===Infinity?Math.floor(local/realm.panels.length):0,index};
    }
    offset+=realm.panels.length;
  }
  return null;
}

export function validateRealms(registry=realms){
  if(registry[0]?.at!==0)throw new Error('Realms must begin at ground level');
  const ids=new Set();
  registry.forEach((r,i)=>{
    if(ids.has(r.id)||!r.panels.length||r.end<=r.at)throw new Error(`Invalid realm ${r.id}`);
    ids.add(r.id);
    if(i&&registry[i-1].end!==r.at)throw new Error(`Realm gap before ${r.id}`);
    if(r.end===Infinity&&(!(r.sectorMeters>0)||i!==registry.length-1))throw new Error('Endless realm must be last and have a sector size');
  });
  if(registry.at(-1).end!==Infinity)throw new Error('Realm track has a ceiling');
  return true;
}
