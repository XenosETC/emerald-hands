import {hydrateChronicle} from './chronicle.js';
import {hydrateEquipment} from './equipment.js';
export const ATTRIBUTES={STR:'Melee damage +3',DEX:'Movement +4; attack recovery -2%',VIT:'Maximum health +12',INT:'Sweep damage +5',WIS:'Rally healing +4; ability recovery -2%'};
export const ITEMS={jade:{name:'Jade Fragment',value:12,description:'Recovered from an old battlefield. Sell at a town market.'},steel:{name:'Tempered Steel',value:18,description:'A useful smithing salvage. Trade it for gold.'},potion:{name:'Healing Draught',value:20,description:'Use in battle to restore 80 health. Consumed on use.'}};
export const QUESTS=[
 {id:'greenroad',board:'greenmere',target:'elderwood',name:'The Gatherers’ Road',text:'Free both trapped herbalists and clear the Elderwood raiders. Report to Greenmere.',reward:55},
 {id:'pearlpass',board:'pearlport',target:'highpass',name:'Salt for the Snowbound',text:'Clear Highpass Shrine so Pearlport’s salt caravans can reach the northern villages. Return to Pearlport.',reward:60},
 {id:'pass',board:'snowcastle',target:'highpass',name:'The Broken Pass',text:'Clear raiders from Highpass Shrine and report to Wintercrown Castle.',reward:65},
 {id:'ashveil',board:'cinderford',target:'ashgrove',name:'Smoke on the Forest Road',text:'Destroy both healing totems and defeat the Ashveil raiders. Return to Cinderford before marching toward the volcano.',reward:70},
 {id:'briar',board:'home',target:'hunt',name:'Raiders in the Briar',text:'Clear the forest raiders and report to Crown Hall.',reward:45},
 {id:'elder',board:'mossford',target:'elderwood',name:'The Elderwood Watch',text:'Free both trapped herbalists and defeat the Elderwood raiders. Return to Mossford.',reward:65},
 {id:'relic',board:'port',target:'ruins',name:'The Lost Harbor Cargo',text:'Defeat the Moonwell guards, approach the marked cargo and press F to recover it. Return to Tideharbor.',reward:70},
 {id:'crossing',board:'sunspire',target:'outpost',name:'Secure the Crossing',text:'Capture Reedwatch. Report to Sunspire Castle.',reward:90},
 {id:'jade',board:'eastport',target:'jadeforest',name:'Shadows of Jadefall',text:'Defeat Varric the Thorn and his Jadefall war camp. Bring a reinforced warband, then return to Eastwatch Port.',reward:80},
 {id:'river',board:'outpost',target:'jadeforest',name:'Patrol the Eastern Road',text:'Clear Jadefall and return to Reedwatch.',reward:60},
 {id:'peace',board:'keep',target:'ruins',name:'Peace in the Marches',text:'Clear the Moonwell raiders and report to the captured keep.',reward:75},
 {id:'crown',board:'frostford',target:'keep',name:'Break the Ashfang Banner',text:'Defeat Lord Ashfang and conquer his volcanic keep after taking Reedwatch. Return to Frostford.',reward:120}
];
export function hydrateAdventure(s){
 hydrateEquipment(s);hydrateChronicle(s);
 s.attributes=Object.fromEntries(Object.keys(ATTRIBUTES).map(k=>[k,Number.isInteger(s.attributes?.[k])&&s.attributes[k]>=0&&s.attributes[k]<=50?s.attributes[k]:0]));
 s.spentPoints=Object.values(s.attributes).reduce((a,b)=>a+b,0);
 if(s.spentPoints>2*(s.level-1)){s.attributes=Object.fromEntries(Object.keys(ATTRIBUTES).map(k=>[k,0]));s.spentPoints=0;}
 s.inventory=Array.isArray(s.inventory)?s.inventory.filter(i=>Object.hasOwn(ITEMS,i)).slice(0,60):[];
 s.quests=Object.fromEntries(QUESTS.filter(q=>['active','ready','completed'].includes(s.quests?.[q.id])).map(q=>[q.id,s.quests[q.id]]));
 for(const q of QUESTS)if(s.quests[q.id]==='active'&&conquestSatisfied(s,q))s.quests[q.id]='ready';
 s.location=typeof s.location==='string'?s.location:'home';return s;
}
export function points(s){return Math.max(0,2*(s.level-1)-(s.spentPoints??0));}
export function allocate(s,key){if(!Object.hasOwn(ATTRIBUTES,key)||points(s)<1||s.attributes[key]>=50)return false;s.attributes[key]++;s.spentPoints++;return true;}
export function conquestSatisfied(s,q){return ['outpost','keep'].includes(q.target)&&s.owned.includes(q.target);}
export function acceptQuest(s,id,location){const q=QUESTS.find(q=>q.id===id);if(!q||q.board!==location||s.quests[id])return false;const already=conquestSatisfied(s,q);if(!already&&Object.values(s.quests).filter(v=>v==='active').length>=3)return false;s.quests[id]=already?'ready':'active';return true;}
export function markQuestVictory(s,target){for(const q of QUESTS)if(q.target===target&&s.quests[q.id]==='active')s.quests[q.id]='ready';}
export function claimQuest(s,id,location){const q=QUESTS.find(q=>q.id===id);if(!q||q.board!==location||s.quests[id]!=='ready')return false;s.quests[id]='completed';s.gold+=q.reward;return true;}
export function lootBattle(s,site){const loot=site==='keep'?['steel','jade','potion']:['jade',site==='hunt'?'potion':'steel'];const added=loot.slice(0,Math.max(0,60-s.inventory.length));s.inventory.push(...added);return added;}
export function sellItem(s,index){const item=s.inventory[index];if(!ITEMS[item])return false;s.gold+=ITEMS[item].value;s.inventory.splice(index,1);return true;}
export function usePotion(s,b){const index=s.inventory.indexOf('potion');if(index<0||!b||b.hero.hp<=0||b.hero.hp>=b.hero.max)return false;b.hero.hp=Math.min(b.hero.max,b.hero.hp+80);s.inventory.splice(index,1);return true;}
export const DRAUGHT_PRICE=25;
export function buyDraught(s,inSettlement){if(!inSettlement||s.gold<DRAUGHT_PRICE||s.inventory.length>=60)return false;s.gold-=DRAUGHT_PRICE;s.inventory.push('potion');return true;}

export function abandonQuest(s,id){if(s.quests[id]!=='active')return false;delete s.quests[id];s.journal='Contract abandoned without payment. You can take it again at its issuing settlement.';return true;}
