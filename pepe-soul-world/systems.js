// Prototype RPG rules. No DOM, rendering, storage, or shared arcade state.
export const ITEMS = Object.freeze({
  ribbitFang:{name:'Ribbit Fang',slot:'weapon',icon:0,attack:0,color:'#bbdfcc',description:'The blade that crossed the veil with you.'},
  frostFang:{name:'Rime Fang',slot:'weapon',icon:1,attack:8,color:'#a9dffe',description:'A blade tempered in the Frozen District.'},
  emberFang:{name:'Ember Fang',slot:'weapon',icon:2,attack:12,color:'#eda48b',description:'A surviving spark from the Crimson Marsh.'},
  voidFang:{name:'Veil Fang',slot:'weapon',icon:3,attack:18,color:'#c7b1f5',description:'A quiet edge, drawn from the Void Swamp.'},
  academyRobe:{name:'Academy Robe',slot:'robe',icon:4,health:0,defense:0,color:'#bbdfcc',description:'Black cloth. An ivory scarf. Your first oath.'},
  frostRobe:{name:'Frostweave Cloak',slot:'robe',icon:5,health:20,defense:2,color:'#a9dffe',description:'Spirit-woven lining against the cold.'},
  emberRobe:{name:'Ashkeeper Robe',slot:'robe',icon:6,health:30,defense:3,color:'#eda48b',description:'The embers remember who carried them.'},
  voidRobe:{name:'Veilwalker Mantle',slot:'robe',icon:7,health:40,defense:4,color:'#c7b1f5',description:'A mantle stitched from the edge of the veil.'},
  jadeBeads:{name:'Goribbit’s Beads',slot:'charm',icon:8,regen:1,color:'#bbdfcc',description:'+1 spirit regenerated each second.'},
  veilTalisman:{name:'Echo Talisman',slot:'charm',icon:9,warp:40,wave:6,color:'#c7b1f5',description:'+40 Warp Step reach. +6 wave damage.'},
  healthFlask:{name:'Healing Flask',slot:'consumable',icon:10,heal:45,price:8,description:'Restore 45 HP. Consumed only when needed.'},
  spiritFlask:{name:'Spirit Flask',slot:'consumable',icon:11,spirit:50,price:8,description:'Restore 50 spirit. Consumed only when needed.'},
});
export const SKILLS = Object.freeze({
  blade:{name:'Soul Edge',symbol:'⚔',max:3,minLevel:2,description:'+4 sword damage per rank.'},
  warp:{name:'Warp Step',symbol:'✧',max:3,minLevel:2,description:'+35 reach, lower cost and cooldown per rank.'},
  wave:{name:'Kek Wave',symbol:'≈',max:3,minLevel:2,description:'+8 wave damage and longer flight per rank.'},
  vitality:{name:'Rooted Soul',symbol:'◈',max:3,minLevel:2,description:'+12 maximum HP per rank.'},
  spirit:{name:'Spirit Flow',symbol:'❖',max:3,minLevel:2,description:'+10 maximum spirit and +1 regeneration per rank.'},
  awakening:{name:'Soul Release',symbol:'☽',max:2,minLevel:3,description:'+2 seconds and +6 awakened cut damage per rank. Requires a seal.'},
});
export const QUESTS = Object.freeze([
  {id:'firstCut',name:'The first cut',description:'Accept Goribbit’s oath and land three cuts on the effigy.',need:3,progress:s=>s.training,xp:30,fragments:12},
  {id:'frostBounty',name:'The frostbound watch',description:'Defeat three Frostbound Tads.',need:3,progress:s=>s.kills.frozen,xp:35,fragments:15,item:'frostRobe'},
  {id:'emberBounty',name:'Ashes of the oath',description:'Defeat three Ashen Ronin.',need:3,progress:s=>s.kills.crimson,xp:45,fragments:18,item:'emberRobe'},
  {id:'voidBounty',name:'Names in the dark',description:'Defeat three Lost Ones.',need:3,progress:s=>s.kills.void,xp:55,fragments:22,item:'voidRobe'},
  {id:'echoes',name:'Echoes beyond the lantern',description:'Attune to the shrine in each enemy realm. Press E beside it.',need:3,progress:s=>s.discoveries.length,xp:60,fragments:25,item:'veilTalisman'},
  {id:'guardian',name:'An unbroken oath',description:'Recover all three seals and return to Goribbit.',need:1,progress:s=>s.complete?1:0,xp:0,fragments:40},
]);
export const STARTER_ITEMS = Object.freeze({ribbitFang:1,academyRobe:1,jadeBeads:1,healthFlask:2,spiritFlask:1});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const integer=(v,max=99999)=>clamp(Number.isFinite(v)?Math.floor(v):0,0,max);
export function levelFor(xp){let level=1,remaining=xp,need=60;while(remaining>=need&&level<30){remaining-=need;level++;need=60+(level-1)*30;}return {level,remaining,need};}
export function sanitizeProgress(v){
  const inventory={...STARTER_ITEMS};if(v.version===2 && v.inventory && typeof v.inventory==='object'){for(const id of Object.keys(ITEMS))inventory[id]=integer(v.inventory[id],ITEMS[id].slot==='consumable'?99:1);for(const id of ['ribbitFang','academyRobe','jadeBeads'])inventory[id]=1;}
  const equipped={weapon:'ribbitFang',robe:'academyRobe',charm:'jadeBeads'};for(const slot of Object.keys(equipped)){const id=v.equipped?.[slot];if(ITEMS[id]?.slot===slot&&inventory[id]>0)equipped[slot]=id;}
  const xp=integer(v.xp,100000),skills={};let points=levelFor(xp).level-1;for(const [id,spec] of Object.entries(SKILLS)){const rank=Math.min(integer(v.skills?.[id],spec.max),points);skills[id]=rank;points-=rank;}
  const gearLevels={};for(const [id,item] of Object.entries(ITEMS))if(item.slot==='weapon')gearLevels[id]=inventory[id]?integer(v.gearLevels?.[id],3):0;
  return {xp,inventory,equipped,skills,gearLevels,fragments:integer(v.fragments),kills:Object.fromEntries(['frozen','crimson','void','temple'].map(id=>[id,integer(v.kills?.[id])])),discoveries:[...new Set((Array.isArray(v.discoveries)?v.discoveries:[]).filter(id=>['frozen','crimson','void','temple'].includes(id)))],bossRewards:[...new Set((Array.isArray(v.bossRewards)?v.bossRewards:[]).filter(id=>['frozen','crimson','void','temple'].includes(id)))],claimedQuests:[...new Set((Array.isArray(v.claimedQuests)?v.claimedQuests:[]).filter(id=>QUESTS.some(q=>q.id===id)))]};
}
export function skillPoints(s){return Math.max(0,levelFor(s.xp).level-1-Object.values(s.skills).reduce((a,b)=>a+b,0));}
export function stats(s){const weapon=ITEMS[s.equipped.weapon],robe=ITEMS[s.equipped.robe],charm=ITEMS[s.equipped.charm];return {health:100+(levelFor(s.xp).level-1)*15+(robe.health||0)+s.skills.vitality*12,spirit:100+s.skills.spirit*10,attack:(weapon.attack||0)+s.gearLevels[s.equipped.weapon]*4+s.skills.blade*4,defense:robe.defense||0,regen:9+(charm.regen||0)+s.skills.spirit,wave:s.skills.wave*8+(charm.wave||0),warpRange:240+s.skills.warp*35+(charm.warp||0),warpCost:20-s.skills.warp*2,warpCooldown:.9-s.skills.warp*.1,releaseDuration:8+s.skills.awakening*2,releaseAttack:s.skills.awakening*6,color:weapon.color};}
export function addItem(s,id,count=1){if(!ITEMS[id])return;s.inventory[id]=Math.min(ITEMS[id].slot==='consumable'?99:1,(s.inventory[id]||0)+count);}
// Preview through the same stat rules as equipment, without changing the run.
export function compareGear(s,id){const item=ITEMS[id];if(!item||item.slot==='consumable'||!s.inventory[id])return null;const before=stats(s),after=stats({...s,equipped:{...s.equipped,[item.slot]:id}});return {current:s.equipped[item.slot],after,changes:Object.fromEntries(['attack','health','defense','regen','warpRange','wave'].map(key=>[key,after[key]-before[key]]).filter(([,delta])=>delta!==0))};}
function changed(s,text){s.events.push({type:'message',text},{type:'save'});return true;}
export function equip(s,id){const item=ITEMS[id];if(!item||item.slot==='consumable'||!s.inventory[id]||s.dead)return false;s.equipped[item.slot]=id;s.player.hp=Math.min(s.player.hp,stats(s).health);s.player.sp=Math.min(s.player.sp,stats(s).spirit);return changed(s,`${item.name} equipped.`);}
export function skillPreview(s,id){
 const spec=SKILLS[id];if(!spec)return null;const rank=s.skills[id],reasons=[];
 if(rank>=spec.max)return {rank,maxed:true,reasons:['Maximum rank reached'],changes:[]};
 if(s.dead)reasons.push('Revive before learning');
 if(skillPoints(s)<1)reasons.push('Earn a skill point by leveling up');
 if(levelFor(s.xp).level<spec.minLevel+rank)reasons.push('Requires level '+(spec.minLevel+rank));
 if(id==='awakening'&&!s.seals.length)reasons.push('Recover one guardian seal');
 const before=stats(s),after=stats({...s,skills:{...s.skills,[id]:rank+1}});
 const fields={blade:['attack'],warp:['warpRange','warpCost','warpCooldown'],wave:['wave'],vitality:['health'],spirit:['spirit','regen'],awakening:['releaseDuration','releaseAttack']}[id];
 return {rank,maxed:false,reasons,changes:fields.map(key=>({key,before:before[key],after:after[key]}))};
}
export function learn(s,id){const preview=skillPreview(s,id);if(!preview||preview.maxed||preview.reasons.length)return false;s.skills[id]++;return changed(s,`${SKILLS[id].name} · rank ${s.skills[id]} learned.`);}
export function useItem(s,id){const item=ITEMS[id];if(!item||item.slot!=='consumable'||!s.inventory[id]||s.dead)return false;const st=stats(s),p=s.player;if(item.heal&&p.hp>=st.health||item.spirit&&p.sp>=st.spirit)return false;if(item.heal)p.hp=Math.min(st.health,p.hp+item.heal);if(item.spirit)p.sp=Math.min(st.spirit,p.sp+item.spirit);s.inventory[id]--;s.events.push({type:'restore',x:p.x,y:p.y-80});return changed(s,`${item.name} used.`);}
export function atMentor(s){return s.world==='academy'&&Math.abs(s.player.x-490)<190&&!s.dead;}
export function buyItem(s,id){const item=ITEMS[id];if(!atMentor(s)||!item?.price||s.fragments<item.price||(s.inventory[id]||0)>=99)return false;s.fragments-=item.price;addItem(s,id);return changed(s,`${item.name} added to your pack.`);}
export function upgradeGear(s){const id=s.equipped.weapon,rank=s.gearLevels[id]||0,cost=(rank+1)*20;if(!atMentor(s)||rank>=3||s.fragments<cost)return false;s.fragments-=cost;s.gearLevels[id]=rank+1;return changed(s,`${ITEMS[id].name} tempered to +${rank+1}.`);}
export function questReady(s,q){return !s.claimedQuests.includes(q.id)&&q.progress(s)>=q.need;}
export function claimQuest(s,id){const q=QUESTS.find(q=>q.id===id);if(!q||!questReady(s,q)||s.dead)return false;const oldLevel=levelFor(s.xp).level;s.claimedQuests.push(id);s.xp+=q.xp;s.fragments+=q.fragments;if(q.item)addItem(s,q.item);if(levelFor(s.xp).level>oldLevel)s.events.push({type:'level',level:levelFor(s.xp).level});return changed(s,`${q.name} completed · ${q.xp?`${q.xp} XP · `:''}${q.fragments} spirit fragments${q.item?` · ${ITEMS[q.item].name}`:''}.`);}
