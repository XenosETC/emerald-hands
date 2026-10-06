// Regional identity is cosmetic for now; role balance stays consistent.
export const REGIMENTS={
 river:{name:'Reedwatch Garrison',color:'#a4b677',names:['Reedwatch Pikeman','River Bowman','River Guard'],kit:'Reed cloaks, marsh leather and bronze river shields.'},
 crown:{name:'Emerald Crown',color:'#d4b457',names:['Reed Spearman','Marsh Archer','Crown Guard'],kit:'Reed spears, marsh bows and gilded shields.'},
 coast:{name:'Harbor Watch',color:'#67c4cf',names:['Harbor Pikeman','Coast Bowman','Tide Guard'],kit:'Boarding pikes, sea bows and blue harbor livery.'},
 winter:{name:'Winter Watch',color:'#d9edf4',names:['Frost Spearman','Snow Ranger','Winter Sentinel'],kit:'Fur-lined armor, pale cloaks and cold-weather weapons.'},
 frontier:{name:'Cinder Legion',color:'#e49651',names:['Cinder Pikeman','Ash Ranger','Basalt Guard'],kit:'Ash-colored armor, ember sashes and basalt shields.'},
 jade:{name:'Jade March',color:'#88bd76',names:['Jade Spearman','Grove Archer','Jade Sentinel'],kit:'Forest-green livery and jade-trimmed armor.'},
 sun:{name:'Sunspire Order',color:'#edcf80',names:['Sunspire Lancer','Dawn Bowman','Sun Guard'],kit:'Golden crests and sun-colored standards.'}
};
export function regimentAt(id){return id==='outpost'?'river':['port','eastport','pearlport'].includes(id)?'coast':['frostford','snowcastle'].includes(id)?'winter':['cinderford','keep'].includes(id)?'frontier':['mossford','greenmere'].includes(id)?'jade':id==='sunspire'?'sun':'crown';}
export function troopIdentity(type,origin='home'){const regiment=regimentAt(origin),r=REGIMENTS[regiment];return {...r,regiment,troopName:({holyKnight:'Holy Knight',holyMage:'Holy Mage',shadowKnight:'Shadow Knight',shadowMage:'Shadow Mage',frogGuardian:'Frog Guardian'})[type]??r.names[{spearman:0,archer:1,guard:2}[type]??0]};}

export function troopAvailable(type,location){return ['holyKnight','holyMage'].includes(type)?['sunspire','snowcastle'].includes(location):['shadowKnight','shadowMage'].includes(type)?['cinderford','keep'].includes(location):type==='frogGuardian'?['home','mossford','greenmere'].includes(location):true;}
