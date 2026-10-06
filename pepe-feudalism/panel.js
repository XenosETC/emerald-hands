import {renderGearTabs,renderGearCards} from './gear-panel.js';
import {weaponRecovery} from './gear-progression.js';
import {WEAPON_TECHNIQUES} from './weapon-techniques.js';
import {equippedPose,drawCrownFrame} from './crown-equipped.js';
import {CROWN_POSES} from './crown-poses.js';
import {ARMOR,SHIELDS} from './equipment.js';
import {armySummary} from './army-summary.js';
import {recruitDestinations} from './recruit-travel.js';
import {troopAvailable,troopIdentity} from './regional-troops.js';
import {drawResident} from './town-life.js';
import {heroStats} from './hero-stats.js';
import {drawItem} from './item-art.js';
import {RESIDENTS,residentDialogue} from './residents.js';
import {scout} from './scouting.js';
import {TROOPS,WEAPONS,RANKS,canMarch} from './campaign.js';
import {ATTRIBUTES,ITEMS,QUESTS,points,DRAUGHT_PRICE,conquestSatisfied} from './adventure.js';
import {NODES} from './world.js';
import {drawSoldier,drawArmor,drawShield,drawWeaponIcon,drawHeldWeapon} from './art.js';
const $=id=>document.getElementById(id);
export function renderScroll(c){
 const {state,crown,battle,scroll,selected,travel,gearTab='weapon',button,act}=c;
 const root=$('scroll-panel'),body=$('panel-body'),actions=$('actions');root.hidden=!scroll;$('shade').hidden=!scroll;if(!scroll)return;
 root.className=scroll==='inventory'?'right equipment-scroll':scroll==='forge'?'equipment-scroll':'';actions.replaceChildren();body.replaceChildren();
 const activeCount=Object.values(state.quests).filter(v=>v==='active').length;
 const loc=NODES.find(n=>n.id===state.location),node=NODES.find(n=>n.id===selected);let title='',description='';
 const paragraph=(content,parent=body)=>{const p=document.createElement('p');p.textContent=content;parent.append(p);return p;};
 const card=(name,content)=>{const d=document.createElement('div');d.className='card';const strong=document.createElement('strong');strong.textContent=name;d.append(strong);if(content)paragraph(content,d);body.append(d);return d;};
 const crownPreview=profile=>{const portrait=document.createElement('canvas');portrait.width=280;portrait.height=250;if(crown?.complete&&crown.naturalWidth){const g=portrait.getContext('2d');g.save();g.translate(115,238);g.scale(1.45,1.45);const pose=crown.renderSet?equippedPose(0,crown.renderSet):CROWN_POSES[0];drawCrownFrame(g,crown,pose,.25);if(!crown.bakedGear){if(state.shield)drawShield(g,state.shield,...pose.shield,.8);drawHeldWeapon(g,state.weapon,...pose.hand,.65);}g.restore();}profile.prepend(portrait);};
 const loadout=()=>{
  const slots=card('Crown’s equipped gear');slots.classList.add('loadout-card');
  for(const [slot,id,item]of [['Weapon',state.weapon,WEAPONS[state.weapon]],['Armor',state.armor,ARMOR[state.armor]],['Shield',state.shield,SHIELDS[state.shield]]]){const entry=document.createElement('div'),icon=document.createElement('canvas'),name=document.createElement('strong');entry.className='gear-slot';icon.width=100;icon.height=130;const g=icon.getContext('2d');if(id){if(slot==='Weapon')drawWeaponIcon(g,id,50,65,105);else if(slot==='Armor')drawArmor(g,id,50,65,90,110);else drawShield(g,id,50,65,id==='holy'?1.25:1.7);}else{g.strokeStyle='#a88b58';g.strokeRect(20,20,60,90);g.fillStyle='#8c754c';g.font='22px Georgia';g.textAlign='center';g.fillText('—',50,70);}name.textContent=slot;entry.append(name,icon);paragraph(item?.name??'Empty slot',entry);slots.append(entry);}
  if(scroll!=='inventory')button(slots,'Manage equipment',()=>act.serviceInventory());return slots;
 };
 const army=()=>{
  const groups=new Map();state.army.forEach((type,i)=>{const origin=state.armyOrigins?.[i]??'home',key=type+':'+origin;if(!groups.has(key))groups.set(key,{type,origin,ranks:[]});groups.get(key).ranks.push(state.armyXp[i]??0);});
  if(!groups.size)paragraph('No soldiers in your warband. Recruit at a settlement barracks.');
  for(const {type,origin,ranks}of groups.values()){const t=TROOPS[type],identity=troopIdentity(type,origin),row=card(identity.troopName+' / '+ranks.length);row.classList.add('unit-card');const preview=document.createElement('canvas');preview.width=100;preview.height=140;drawSoldier(preview.getContext('2d'),{x:50,y:135,type,origin,team:0,facing:1,id:0},0,.8);row.prepend(preview);const copy=document.createElement('div');const name=document.createElement('strong');name.textContent=identity.troopName+' / '+ranks.length;copy.append(name);paragraph(identity.name,copy);paragraph(RANKS.map((r,x)=>{const n=ranks.filter(rank=>rank===x).length;return n?`${r}: ${n}`:'';}).filter(Boolean).join(' · '),copy);if(t.description)paragraph(t.description,copy);if(scroll==='army'){const indices=state.army.flatMap((id,i)=>id===type&&(state.armyOrigins?.[i]??'home')===origin?[i]:[]),deployed=indices.filter(i=>i<12).length;paragraph(`${deployed} opening deployment / ${indices.length-deployed} reserves`,copy);const firstDeployed=indices.find(i=>i<12);if(state.army.length>12&&firstDeployed!==undefined)button(copy,`Keep one ${identity.troopName} in reserve`,()=>act.reserve(firstDeployed),!!battle||!act.inSettlement);const nextReserve=indices.find(i=>i>=12);if(nextReserve!==undefined)button(copy,`Deploy one ${identity.troopName} first`,()=>act.prioritize(nextReserve),!!battle||!act.inSettlement);for(const rank of [...new Set(ranks)].sort((a,b)=>a-b)){const label=`Dismiss one ${RANKS[rank]} ${identity.troopName}`;button(copy,label,()=>act.dismiss(state.army.findIndex((id,i)=>id===type&&(state.armyOrigins?.[i]??'home')===origin&&(state.armyXp[i]??0)===rank)),!!battle||!act.inSettlement);}}row.append(copy);}
 };
 if(scroll==='character'){
  title='Crown Pepe';description=`Level ${state.level} / ${points(state)} skill points available. Two points per level. Allocation applies to your next battle.`;
  const stats=heroStats(state),profile=card('The Emerald Crown');profile.classList.add('crown-profile');crownPreview(profile);paragraph(`${WEAPONS[state.weapon].name} / Weapon tier ${state.upgrade+1}`,profile);paragraph(`${2-state.wins%2} victories to next level`,profile);loadout();card('Protection',`${stats.armorReduction} less damage per incoming hit (minimum 1 damage) / +${stats.shieldHealth} health from shield.`);card('Next battle',`${stats.max} health / ${stats.damage} attack / ${stats.range} reach / ${stats.speed} movement speed / ${stats.attackCooldown.toFixed(2)}s attack recovery`);card(WEAPON_TECHNIQUES[state.weapon].name,WEAPON_TECHNIQUES[state.weapon].description);card('Crown abilities',`Sweep: ${stats.sweep} damage / ${stats.sweepCooldown.toFixed(1)}s recovery. Rally: ${stats.rally} healing / ${stats.rallyCooldown.toFixed(1)}s recovery.`);
  for(const [key,effect]of Object.entries(ATTRIBUTES)){const row=document.createElement('div');row.className='stat-row';const copy=document.createElement('div');const strong=document.createElement('strong');strong.textContent=`${key} / ${state.attributes[key]}`;const p=paragraph(effect,copy);p.style.margin='4px 0';copy.prepend(strong);row.append(copy);button(row,`+ ${key}`,()=>act.allocate(key),points(state)<1);body.append(row);}
  paragraph(`Equipped: ${WEAPONS[state.weapon].name}. Veteran ranks add 15 HP and 2 attack per rank to surviving troops.`);
 }else if(scroll==='inventory'){
  title='Crown’s Satchel';description=`${state.inventory.length}/60 loot items. Equipped: ${WEAPONS[state.weapon].name}. Battle victories add loot; selling is available in settlements.`;
  const summary=document.createElement('div');summary.className='equipment-summary';body.append(summary);
  const preview=card('Crown’s loadout');preview.classList.add('crown-profile');crownPreview(preview);summary.append(preview,loadout());
  renderGearTabs(body,gearTab,act.chooseGearTab,true);
  paragraph(battle||travel?'Equipment is locked during battle and travel.':'Comparisons include Crown’s attributes and weapon upgrades. Changes apply at the next battle.');
  renderGearCards({parent:body,state,slot:gearTab,forge:false,locked:!!battle||!!travel,button,equip:{weapon:act.equip,armor:act.armor,shield:act.shield}[gearTab],track:act.track});
  if(gearTab==='armor'&&state.armor)button(actions,'Unequip armor',()=>act.armor(null),!!battle||!!travel);
  if(gearTab==='shield'&&state.shield)button(actions,'Unequip shield',()=>act.shield(null),!!battle||!!travel);
  if(gearTab==='loot'){
  const groups=Object.keys(ITEMS).filter(id=>state.inventory.includes(id));if(!groups.length)paragraph('Your satchel is empty. Win a battle to collect salvage and healing draughts.');
  if(act.inSettlement&&!battle){const shop=card('Town supplies','Healing draughts restore 80 HP during battle. Carry them in your satchel.');button(shop,`Buy healing draught / ${DRAUGHT_PRICE} gold`,act.buyDraught,state.gold<DRAUGHT_PRICE||state.inventory.length>=60);}
  for(const id of groups){const item=ITEMS[id],d=card(`${item.name} × ${state.inventory.filter(x=>x===id).length}`,item.description);const picture=document.createElement('canvas');picture.width=64;picture.height=70;drawItem(picture.getContext('2d'),id);d.prepend(picture);if(id==='potion')button(d,'Drink healing draught',act.potion,!battle||battle.hero.hp>=battle.hero.max);button(d,`Sell one / ${item.value} gold`,()=>act.sell(state.inventory.indexOf(id)),!!battle||!act.inSettlement);}
  }
 }else if(scroll==='quests'){
  title='Quest Journal';description=`${activeCount}/3 active contracts. Ready rewards appear first. Gold diamonds mark objectives; green diamonds mark reward towns.`;
  for(const q of QUESTS.filter(q=>state.quests[q.id]).sort((a,b)=>({ready:0,active:1,completed:2}[state.quests[a.id]]-{ready:0,active:1,completed:2}[state.quests[b.id]]))){const d=card(q.name,`${q.text} / ${state.quests[q.id].toUpperCase()} / Requested by ${RESIDENTS[q.board]?.name??'the local steward'}`);if(state.quests[q.id]==='active'){button(d,'Show destination on map',()=>act.track(q.target),!!battle);button(d,'Abandon contract / no reward',()=>act.abandon(q.id),!!battle||!!travel);paragraph('You can accept it again at the issuing settlement.',d);}if(state.quests[q.id]==='ready'){button(d,'Show reward town on map',()=>act.track(q.board),!!battle);button(d,`Claim ${q.reward} gold at ${NODES.find(n=>n.id===q.board).name}`,()=>act.claim(q.id),state.location!==q.board||!act.inSettlement);}}
  if(!Object.keys(state.quests).length)paragraph('Visit a town, castle or port and open its quest board to accept a contract.');
 }else if(scroll==='board'){
  title=`${loc.name} / Quest Board`;description=`${activeCount}/3 active contracts. Contracts belong to this settlement; return here for payment.`;const resident=RESIDENTS[loc.id];if(resident){const quest=QUESTS.find(q=>q.board===loc.id);const person=card(`${resident.name} / ${resident.role}`);person.classList.add('resident-card');const portrait=document.createElement('canvas');portrait.width=90;portrait.height=125;drawResident(portrait.getContext('2d'),{id:'questgiver',x:45,y:122,facing:1},0,1.4);person.prepend(portrait);const quote=document.createElement('blockquote');quote.textContent=residentDialogue(loc.id,state.quests[quest?.id]);person.append(quote);}
  if(!QUESTS.some(q=>q.board===loc.id))paragraph('No local contracts are posted here. The barracks, forge and supply shop remain open.');
  for(const q of QUESTS.filter(q=>q.board===loc.id)){const status=state.quests[q.id],full=!status&&!conquestSatisfied(state,q)&&activeCount>=3,d=card(q.name,`${q.text} / Reward: ${q.reward} gold`);if(!status&&conquestSatisfied(state,q))paragraph('Crown already holds this territory. Accept the contract to report your victory and claim payment.',d);button(d,status==='ready'?`Claim ${q.reward} gold`:status==='completed'?'Completed':status==='active'?'Quest active':full?'Journal full / 3 active':'Accept quest',()=>status==='ready'?act.claim(q.id):act.accept(q.id),status==='completed'||status==='active'||full);if(full)paragraph('Finish an active objective before accepting another contract. Ready rewards do not occupy an active slot.',d);}
 }else if(scroll==='army'){title='Your Warband';description=`${state.army.length}/36 soldiers. 12 deploy at once; reserves replace fallen troops every 3 seconds. Surviving victories grant rank; casualties persist. Dismiss soldiers in a settlement to free slots. Hiring gold is not refunded.`;const summary=armySummary(state);card('Army composition',`${summary.frontline} frontline / ${summary.ranged} ranged / ${summary.healers} healers (included in ranged). ${summary.experienced} experienced soldiers / ${summary.health} total troop health at the next battle.`);for(const note of summary.notes)paragraph(note);army();const find=card('Find special recruits','Inspect the nearest friendly barracks. Travel remains your choice.');for(const type of ['holyKnight','holyMage','shadowKnight','shadowMage','frogGuardian']){const nearest=recruitDestinations(state,type)[0];if(nearest)button(find,`Find ${TROOPS[type].name} / ${nearest.node.name}`,()=>act.track(nearest.node.id),!!battle||!!travel);}}
 else if(scroll==='barracks'){
  title=`${loc.name} / Barracks`;description=troopIdentity('spearman',loc.id).name+' / '+state.army.length+'/36 soldiers under your banner.';
  for(const [type,t]of Object.entries(TROOPS).filter(([id])=>troopAvailable(id,loc.id))){
   const identity=troopIdentity(type,loc.id),row=card(identity.troopName),preview=document.createElement('canvas'),copy=document.createElement('div');row.classList.add('recruit-card');preview.width=120;preview.height=145;drawSoldier(preview.getContext('2d'),{x:60,y:140,type,origin:loc.id,team:0,facing:1,id:0},0,.95);row.prepend(preview);
   paragraph(t.description??identity.kit,copy);paragraph(`${t.hp} health / ${t.damage} attack / ${t.range} reach`,copy);
   const reason=state.army.length>=36?'Warband full / 36 soldiers':type==='guard'&&!state.owned.includes('outpost')?'Capture Reedwatch to unlock':state.gold<t.cost?`Need ${t.cost-state.gold} more gold`:'';
   button(copy,`Recruit ${identity.troopName} / ${t.cost} gold`,()=>act.recruit(type),!!reason);if(reason)paragraph(reason,copy);row.append(copy);
  }
  paragraph('Recruits keep their home regiment while traveling. Surviving victories raise their rank.');
 }
 else if(scroll==='forge'){
  title=`${loc.name} / Forge`;description='Buy once, then equip freely. Compare against your current gear, including attributes and upgrades.';
  renderGearTabs(body,gearTab,act.chooseGearTab);
  renderGearCards({parent:body,state,slot:gearTab,forge:true,locked:!!battle||!!travel,button,equip:{weapon:act.equip,armor:act.armor,shield:act.shield}[gearTab],track:act.track});
  paragraph(`Weapon tier ${state.upgrade+1}/4. Strengthening adds 12 attack to every weapon, including future recoveries.`);
  button(actions,state.upgrade>=3?'Weapons fully strengthened':`Strengthen weapons / ${70+state.upgrade*50} gold`,act.upgrade,state.upgrade>=3||state.gold<70+state.upgrade*50);
 }
 else if(scroll==='hall'){title=loc.name;description='The warband rests beneath your banner. Prepare, take a contract, or march into the world.';button(actions,'Open quest board',()=>act.service('board'));button(actions,'Visit barracks',()=>act.service('barracks'));button(actions,'Visit forge',()=>act.service('forge'));button(actions,'World map',act.world);button(actions,'Campaign chronicle',()=>act.service('chronicle'));paragraph(state.journal);const resident=RESIDENTS[loc.id];if(resident){const local=QUESTS.filter(q=>q.board===loc.id),quest=local[0];card(`${resident.name} / ${resident.role}`,residentDialogue(loc.id,state.quests[quest?.id]));for(const q of local.filter(q=>state.quests[q.id]==='completed'))card('Recorded in the settlement annals',`${q.name} / completed and paid. ${q.reward} gold awarded.`);}}
 else if(scroll==='location'){
  title=node.name;description=`${node.kind.toUpperCase()} / ${node.id===state.location?'Crown is here.':'Choose this destination to march along connected roads.'}`;
  if(node.id!==state.location)button(actions,`Travel to ${node.name}`,()=>act.travel(node.id),!!travel);
  else if(node.battle&&!state.owned.includes(node.id))button(actions,node.kind==='forest'?'Enter forest encounter':node.kind==='ruins'?'Explore the ruins':`Attack ${node.name}`,act.march,!canMarch(state,node.battle));
  else button(actions,`Enter ${node.name}`,act.enterTown);
  if(node.corrupted)card('The corrupted citadel','A black-stone fortress on the volcanic foothills. Capturing it changes the banner, while its scorched towers remain part of the landscape.');
  const intel=scout(state,node);
  if(intel.stops)card('Road journey',`${intel.stops} road legs / about ${intel.seconds} seconds of travel. Crown follows the marked road route.`);
  if(intel.enemies.length){
   const force=armySummary(state),stats=heroStats(state);card('Your marching force',`${Math.min(12,state.army.length)} opening troops / ${Math.max(0,state.army.length-12)} reserves. ${force.frontline} frontline / ${force.ranged} ranged / ${force.healers} Holy Mages across the full army.`);
   card('Crown’s battle loadout',`${WEAPONS[state.weapon].name} / ${stats.max} health / ${stats.damage} attack. ${ARMOR[state.armor]?.name??'No body armor'} / ${stats.armorReduction} damage protection. ${SHIELDS[state.shield]?.name??'No shield'}.`);
   for(const note of force.notes)paragraph(note);
   if(intel.mission)card(intel.mission.title,`${intel.mission.description} ${intel.mission.type==='purge'?'Two totems, 120 health each. ':''}Complete the objective and win for an additional ${intel.mission.bonus} gold.`);
   if(intel.reserves)paragraph('This garrison has reinforcements. Enemy reserves must be defeated before victory; your unused reserves survive without earning experience.');
   const report=card('Scout report',`${intel.enemies.reduce((n,u)=>n+u.count,0)} enemies hold this site, including ${intel.reserves} reserves. Enemy reserves enter as frontline slots open. Defeat every defender${intel.mission?' and complete the site objective':''} to win.`);
   for(const enemy of intel.enemies){const row=document.createElement('div');row.className='unit-card';const preview=document.createElement('canvas');preview.width=75;preview.height=90;drawSoldier(preview.getContext('2d'),{x:38,y:88,type:enemy.type,origin:enemy.origin,team:1,facing:1,id:0},0,.72);row.append(preview);paragraph(`${enemy.count} ${troopIdentity(enemy.type,enemy.origin).troopName}`,row);report.append(row);}
   const rewardId={hunt:'oak',outpost:'jade',keep:'holy'}[node.battle];if(rewardId&&!state.shields.includes(rewardId))card('Equipment to recover',SHIELDS[rewardId].name+' / guaranteed on victory if not already owned. Equip through inventory.');
   const weaponReward=weaponRecovery(state,node.id);if(weaponReward){const recovered=card('Regional weapon to recover',`${WEAPONS[weaponReward].name} / guaranteed on victory. Added to your armory without replacing your equipped weapon.`),icon=document.createElement('canvas');icon.width=80;icon.height=120;drawWeaponIcon(icon.getContext('2d'),weaponReward,40,60,105);recovered.prepend(icon);}
   const armorReward={hunt:'leather',outpost:'jade',keep:'basalt'}[node.battle];if(armorReward&&!state.armors.includes(armorReward))card('Armor to recover',ARMOR[armorReward].name+' / guaranteed on victory if not already owned.');
   if(intel.captain)card(intel.captain.name,`${intel.captain.hp} HP / ${intel.captain.damage} attack. Bring seasoned troops and strengthen your weapon before challenging this captain.`);
   if(intel.enemies.some(u=>u.type==='shadowMage'))card('Shadow order reserves','Shadow Knights hold the approach while Shadow Mages strike from range. Bring ranged support and healing; the full garrison has 24 defenders.');
   if(node.id==='ruins'&&state.quests.relic==='active')card('Recovery objective','Clear the guards, approach the marked cargo, then press F. Recovery is required before victory and quest return.');
  }else {
   card('Settlement services','Quest board, barracks and forge available on arrival.');
   card('Local regiment',troopIdentity('spearman',node.id).name+' / '+troopIdentity('spearman',node.id).kit);
   for(const [type,t]of Object.entries(TROOPS).filter(([id])=>troopAvailable(id,node.id))){const row=card(troopIdentity(type,node.id).troopName),preview=document.createElement('canvas'),copy=document.createElement('div');row.classList.add('unit-card');preview.width=100;preview.height=140;drawSoldier(preview.getContext('2d'),{x:50,y:135,type,origin:node.id,team:0,facing:1,id:0},0,.8);row.prepend(preview);const name=document.createElement('strong');name.textContent=troopIdentity(type,node.id).troopName;copy.append(name);paragraph(`${t.cost} gold / ${t.hp} health / ${t.damage} attack`,copy);if(t.description)paragraph(t.description,copy);if(type==='guard'&&!state.owned.includes('outpost'))paragraph('Requires capturing Reedwatch',copy);row.append(copy);}
   const contracts=QUESTS.filter(q=>q.board===node.id);for(const q of contracts)card('Local contract / '+q.name,`${q.text} Reward: ${q.reward} gold. ${state.quests[q.id]??'Available at the local quest board'}`);
  }
  if(node.battle==='keep'&&!state.owned.includes('outpost'))paragraph('Capture Reedwatch before attacking Ashfang Keep.');
  for(const q of QUESTS.filter(q=>q.target===node.id&&state.quests[q.id]==='active'))paragraph(`Active contract: ${q.name}`);
 }else if(scroll==='chronicle'){
  const restored=state.owned.includes('keep');title='Chronicle of the Emerald Crown';description=restored?'The Emerald Crown restored':'A kingdom reclaimed one road at a time.';
  if(restored)card('The volcanic citadel has fallen','Lord Ashfang’s garrison is defeated. Crown’s banner flies beside the volcano, and the corrupted keep belongs to the Emerald Crown. Continue exploring, strengthen your warband, and finish the contracts still waiting in the towns.');
  else card('Your next conquest',state.owned.includes('outpost')?'Reedwatch is secured. Prepare your warband for Lord Ashfang and the volcanic keep.':'Raise a warband, clear the Briar raiders, and capture Reedwatch to secure the crossing.');
  for(const id of ['home','outpost','keep']){const n=NODES.find(n=>n.id===id),owned=state.owned.includes(id);const entry=card(n.name,owned?'Under Crown’s banner':id==='keep'&&!state.owned.includes('outpost')?'Secure Reedwatch before challenging the keep.':'Enemy garrison remains.');button(entry,'Show on world map',()=>act.track(id),!!battle);}
  card('The campaign record',`${state.wins} battle victories / Crown level ${state.level} / ${state.army.length} soldiers in the warband / ${Object.values(state.quests).filter(v=>v==='completed').length} of ${QUESTS.length} contracts completed and paid.`);
  for(const q of QUESTS.filter(q=>state.quests[q.id]==='completed'))card(q.name,`Recorded by ${RESIDENTS[q.board]?.name??'the local steward'} at ${NODES.find(n=>n.id===q.board).name}. Reward paid: ${q.reward} gold.`);
  for(const [i,event]of [...state.history].reverse().entries())card(`Battle record ${state.history.length-i} / ${event.name}`,`${event.won?'Victory':'Withdrawal'} / ${event.survivors} soldiers returned / ${event.losses} fallen.${event.objective?' '+event.objective+'.':''}${event.gear?' Recovered: '+event.gear+'.':''}`);
  button(actions,'Return to settlement hall',()=>act.service('castle'));
 }else if(scroll==='guide'){title='The Emerald Marches';description='A hero, a warband, and a kingdom to earn.';button(actions,act.soundEnabled?'Sound: On':'Sound: Off',act.toggleSound);paragraph('Sound begins after your first click or key press. Local synthesized cues cover footsteps, weapons, town services and victory.');paragraph('Map markers: parchment scroll / local contracts available; gold diamond / active quest destination; green check / reward ready at the issuing town.');paragraph('C / Crown. I / inventory. J / quests. M / map. Escape closes a scroll. Drag the world map to pan; wheel or +/− to zoom. Select a destination, then travel. Opening a scroll pauses road travel; close it to continue. Your position saves upon arrival; reloading during travel returns you to the last stop.');paragraph('Town: WASD or empty-ground click moves Crown. Press F near residents or services to interact, or click them directly. Battle: WASD / ground click moves. Enemy click / Space attacks. Q sweeps; E rallies; R drinks a carried healing draught. 1–4 orders follow, hold, attack, retreat. Guards prefer the front, spears the middle, and ranged troops the rear. Hold defends fixed posts; reserves fill empty posts. Follow turns with your march. Retreat falls back without attacking. P pauses. F recovers cargo or frees a nearby herbalist once its guards fall. In Ashveil, destroy Emberheart Totems to stop their healing. Complete the site objective and defeat all enemies to win. Managing a scroll pauses combat. Skills and equipment apply at the next battle.');button(actions,'Start a new campaign',act.reset);}
 $('scroll-label').textContent=scroll==='location'?'DESTINATION':scroll==='board'?'LOCAL CONTRACTS':'EMERALD CROWN';$('panel-title').textContent=title;$('description').textContent=description;
}
