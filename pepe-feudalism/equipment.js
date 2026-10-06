export const ARMOR={leather:{name:'Marsh Scout Vest',cost:55,reduction:1},jade:{name:'Jade Lotus Armor',cost:110,reduction:2},basalt:{name:'Basalt Warplate',cost:180,reduction:3}};
export const SHIELDS={oak:{name:'Oak Frog Shield',cost:45,health:25},jade:{name:'Jade Lotus Shield',cost:90,health:50},holy:{name:'Holy Sun Shield',cost:150,health:80}};
export function hydrateEquipment(s){s.armors=Array.isArray(s.armors)?[...new Set(s.armors.filter(id=>Object.hasOwn(ARMOR,id)))]:[];s.armor=s.armors.includes(s.armor)?s.armor:null;s.shields=Array.isArray(s.shields)?[...new Set(s.shields.filter(id=>Object.hasOwn(SHIELDS,id)))]:[];s.shield=s.shields.includes(s.shield)?s.shield:null;return s;}
export function equipShield(s,id,inForge=false){if(id===null){s.shield=null;return true;}const item=SHIELDS[id];if(!item)return false;s.shields??=[];if(!s.shields.includes(id)){if(!inForge||s.gold<item.cost)return false;s.gold-=item.cost;s.shields.push(id);}s.shield=id;s.journal=`Crown equips ${item.name}. +${item.health} maximum health at the next battle.`;return true;}

// Guaranteed first acquisition by encounter tier; no duplicate item farming.
export function awardEquipment(s,site){const id={hunt:'oak',outpost:'jade',keep:'holy'}[site];s.shields??=[];if(!id||s.shields.includes(id))return [];s.shields.push(id);return [id];}

export function equipArmor(s,id,inForge=false){if(id===null){s.armor=null;return true;}const item=ARMOR[id];if(!item)return false;s.armors??=[];if(!s.armors.includes(id)){if(!inForge||s.gold<item.cost)return false;s.gold-=item.cost;s.armors.push(id);}s.armor=id;return true;}

export function awardArmor(s,site){const id={hunt:'leather',outpost:'jade',keep:'basalt'}[site];s.armors??=[];if(!id||s.armors.includes(id))return [];s.armors.push(id);return [id];}
