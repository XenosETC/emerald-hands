import {troopAvailable,troopIdentity} from './regional-troops.js';
export const SAVE_KEY='pepe-feudalism-campaign-v1';
export const WEAPONS={sword:{name:'Crown Longsword',cost:0,damage:25,range:68,cooldown:.48,description:'Balanced steel. Fast, reliable strikes.'},spear:{name:'Jade War Spear',cost:65,damage:22,range:112,cooldown:.58,description:'Reach past the frontline. Lower damage, longer reach.'},axe:{name:'Ashbreaker Axe',cost:90,damage:42,range:60,cooldown:.78,description:'Heavy blows. Close range and slower recovery.'}};
Object.assign(WEAPONS,{mace:{name:'Frog Guardian Mace',cost:120,damage:34,range:66,cooldown:.65,description:'A steady crushing blow with moderate reach.'},dagger:{name:'Tidefang Dagger',cost:55,damage:18,range:48,cooldown:.30,description:'Rapid close strikes. Low damage and short reach.'}});
export const RANKS=['Recruit','Seasoned','Veteran','Elite'];
export function troopStats(type,xp=0){const t=TROOPS[type],rank=Math.max(0,Math.min(3,xp));return {...t,hp:t.hp+rank*15,damage:t.damage+rank*2,rank};}
export function migrateSave(s){if(!validSave(s))return null;return {...s,weapon:s.weapon??'sword',weapons:s.weapons??['sword'],armyXp:s.armyXp??s.army.map(()=>0),armyOrigins:s.army.map((_,i)=>typeof s.armyOrigins?.[i]==='string'?s.armyOrigins[i]:'home')};}
export function equipWeapon(s,id){const w=WEAPONS[id];if(!w)return false;s.weapons??=['sword'];if(!s.weapons.includes(id)){if(s.gold<w.cost)return false;s.gold-=w.cost;s.weapons.push(id);}s.weapon=id;s.journal=`Crown equips ${w.name}. ${w.description}`;return true;}
export const TROOPS={spearman:{name:'Reed Spearman',cost:35,hp:80,damage:10,range:48,speed:82},archer:{name:'Marsh Archer',cost:45,hp:48,damage:8,range:235,speed:77},guard:{name:'Crown Guard',cost:60,hp:125,damage:13,range:44,speed:69}};
Object.assign(TROOPS,{holyKnight:{name:'Holy Knight',cost:95,hp:165,damage:18,range:52,speed:65,role:'guard',description:'Ivory-and-gold sword and shield frontline.'},holyMage:{name:'Holy Mage',cost:110,hp:65,damage:15,range:245,speed:72,role:'mage',spell:'holy',description:'Sun bolts; heals a nearby wounded ally for 12 every 6 seconds.'},shadowKnight:{name:'Shadow Knight',cost:105,hp:130,damage:26,range:62,speed:82,role:'guard',description:'Violet rune greatsword; faster, harder strikes.'},shadowMage:{name:'Shadow Mage',cost:115,hp:58,damage:24,range:260,speed:74,role:'mage',spell:'shadow',description:'Long-range violet hex bolts, fragile armor.'},frogGuardian:{name:'Frog Guardian',cost:120,hp:220,damage:16,range:54,speed:55,role:'guard',description:'Jade lotus shield and stone mace; absorbs the frontline.'}});
export const SITES=[{id:'home',name:'Crownhaven',x:235,y:390,kind:'home',text:'Your seat in the Emerald Marches. Recruit troops and strengthen Crown before marching.'},{id:'hunt',name:'Briar Hunt',x:460,y:480,kind:'hunt',text:'Ashfang raiders stalk the old forest. Clear their camp for gold. Repeatable.'},{id:'outpost',name:'Reedwatch',x:715,y:305,kind:'outpost',text:'An Ashfang outpost controls the river crossing. Capture it to unlock Crown Guards.'},{id:'keep',name:'Ashfang Keep',x:990,y:185,kind:'keep',text:'The enemy lord holds the northern ridge. Take Reedwatch first, then end his reign.'}];
export function newCampaign(){return {version:1,gold:140,level:1,wins:0,upgrade:0,weapon:'sword',weapons:['sword'],army:['spearman','spearman','archer'],armyXp:[0,0,0],owned:['home'],journal:'Crown arrives with three loyal soldiers and 140 gold. Raise a warband and clear Briar Hunt.'};}
export function validSave(s){return !!s&&s.version===1&&Number.isInteger(s.gold)&&s.gold>=0&&s.gold<=100000&&Number.isInteger(s.level)&&s.level>=1&&s.level<=100&&Number.isInteger(s.upgrade)&&s.upgrade>=0&&s.upgrade<=3&&Number.isInteger(s.wins)&&s.wins>=0&&s.wins<=10000&&Array.isArray(s.army)&&s.army.length<=36&&s.army.every(t=>Object.hasOwn(TROOPS,t))&&(s.armyXp===undefined||Array.isArray(s.armyXp)&&s.armyXp.length===s.army.length&&s.armyXp.every(x=>Number.isInteger(x)&&x>=0&&x<=3))&&Array.isArray(s.owned)&&s.owned.includes('home')&&s.owned.every(id=>['home','outpost','keep'].includes(id))&&(!s.owned.includes('keep')||s.owned.includes('outpost'))&&(s.weapon===undefined||Object.hasOwn(WEAPONS,s.weapon))&&(s.weapons===undefined||Array.isArray(s.weapons)&&s.weapons.length<=Object.keys(WEAPONS).length&&s.weapons.includes('sword')&&s.weapons.every(w=>Object.hasOwn(WEAPONS,w))&&s.weapons.includes(s.weapon??'sword'))&&typeof s.journal==='string'&&s.journal.length<=1000;}
export function recruit(s,type){const t=TROOPS[type];if(!t||!troopAvailable(type,s.location??'home')||s.gold<t.cost||s.army.length>=36||type==='guard'&&!s.owned.includes('outpost'))return false;s.armyXp??=s.army.map(()=>0);s.armyOrigins??=s.army.map(()=>'home');s.gold-=t.cost;s.armyOrigins.push(s.location??'home');s.army.push(type);s.armyXp.push(0);s.journal=`${troopIdentity(type,s.location).troopName} joins Crown's banner as a Recruit.`;return true;}
export function upgrade(s){const cost=70+s.upgrade*50;if(s.upgrade>=3||s.gold<cost)return false;s.gold-=cost;s.upgrade++;s.journal=`Crown's weapons strengthened to tier ${s.upgrade+1}.`;return true;}
export function canMarch(s,id){return ['hunt','outpost','keep'].includes(id)&&(!s.owned.includes(id))&&(id!=='keep'||s.owned.includes('outpost'));}
export function settle(s,id,won,survivors){
  if(!canMarch(s,id))return false;
  const matched=new Set();
  const troops=survivors.map(entry=>{
    if(typeof entry==='object'&&entry)return {type:entry.type,xp:entry.xp??0,origin:entry.origin??'home',reserve:!!entry.reserve};
    const i=s.army.findIndex((type,index)=>type===entry&&!matched.has(index));matched.add(i);
    return {type:entry,xp:s.armyXp?.[i]??0,origin:s.armyOrigins?.[i]??'home'};
  }).filter(t=>Object.hasOwn(TROOPS,t.type)&&Number.isInteger(t.xp)&&t.xp>=0&&t.xp<=3).slice(0,36);
  s.armyOrigins=troops.map(t=>t.origin);s.army=troops.map(t=>t.type);s.armyXp=troops.map(t=>Math.min(3,t.xp+(won&&!t.reserve?1:0)));
  if(won){const reward={hunt:85,outpost:140,keep:240}[id];s.gold+=reward;s.wins++;s.level=1+Math.floor(s.wins/2);if(id!=='hunt')s.owned.push(id);s.journal=`Victory at ${SITES.find(x=>x.id===id).name}! +${reward} gold. ${s.army.length} soldiers survived and gained experience.${id==='keep'?' The Emerald Marches are yours.':''}`;}
  else{s.gold+=25;s.journal='Crown escaped. Fallen soldiers are lost; 25 relief gold lets you rebuild.';}
  return true;
}



export function dismissTroop(s,index,inSettlement=false){
 if(!inSettlement||!Number.isInteger(index)||index<0||index>=s.army.length)return false;
 const name=troopIdentity(s.army[index],s.armyOrigins?.[index]??'home').troopName;
 s.armyXp??=s.army.map(()=>0);s.armyOrigins??=s.army.map(()=>'home');
 s.army.splice(index,1);s.armyXp.splice(index,1);s.armyOrigins.splice(index,1);
 s.journal=`${name} leaves Crown's banner. A warband slot is free; hiring gold is not refunded.`;return true;
}

export function prioritizeTroop(s,index,inSettlement=false){if(!inSettlement||!Number.isInteger(index)||index<1||index>=s.army.length)return false;s.armyXp??=s.army.map(()=>0);s.armyOrigins??=s.army.map(()=>'home');for(const key of ['army','armyXp','armyOrigins'])s[key].unshift(s[key].splice(index,1)[0]);s.journal='Deployment order updated. The first twelve soldiers deploy; the rest wait in reserve.';return true;}

export function reserveTroop(s,index,inSettlement=false){if(!inSettlement||s.army.length<=12||!Number.isInteger(index)||index<0||index>=12)return false;s.armyXp??=s.army.map(()=>0);s.armyOrigins??=s.army.map(()=>'home');for(const key of ['army','armyXp','armyOrigins'])s[key].push(s[key].splice(index,1)[0]);s.journal='Soldier assigned to reserve. The next soldier in line joins the opening deployment.';return true;}
