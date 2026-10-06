import {stepMission,missionProgress,rescueCaptive} from './missions.js';
import {secondaryStrikes, staggerDuration} from './weapon-techniques.js';
import {ARMOR} from './equipment.js';
import {formationTarget,assignFormationPosts,updateFollowHeading} from './formation.js';
import {soldierIntent} from './soldier-tactics.js';
import {addDamageNumber} from './combat-numbers.js';
import {TROOPS,WEAPONS,troopStats} from './campaign.js';

const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

export function createBattle(campaign,site){let id=0;const unit=(team,type,x,y)=>({id:id++,team,type,x,y,hp:TROOPS[type].hp,max:TROOPS[type].hp,damage:TROOPS[type].damage,range:TROOPS[type].range,speed:TROOPS[type].speed,cd:0,flash:0,swing:0,moving:false,facing:team===0?1:-1});const weapon=WEAPONS[campaign.weapon??'sword'];const hero=unit(0,'guard',220,475);Object.assign(hero,{hero:true,armor:campaign.armor??null,armorReduction:ARMOR[campaign.armor]?.reduction??0,hp:260+campaign.level*20,max:260+campaign.level*20,weapon:campaign.weapon??'sword',attackCooldown:weapon.cooldown,damage:weapon.damage+campaign.upgrade*12,speed:165,range:weapon.range});const units=[hero,...campaign.army.map((t,i)=>Object.assign(unit(0,t,75+(i%3)*70,285+Math.floor(i/3)*85),{origin:campaign.armyOrigins?.[i]??'home',xp:campaign.armyXp?.[i]??0,hp:troopStats(t,campaign.armyXp?.[i]??0).hp,max:troopStats(t,campaign.armyXp?.[i]??0).hp,damage:troopStats(t,campaign.armyXp?.[i]??0).damage}))];const n={hunt:5,outpost:8,keep:11}[site];for(let i=0;i<n;i++)units.push(unit(1,i%4===3?'archer':site==='keep'&&i%3===0?'guard':'spearman',850+i%3*80,245+Math.floor(i/3)*68));const reserves=units.filter(u=>u.team===0&&!u.hero).slice(12);for(const u of reserves)u.reserve=true;for(const u of reserves)units.splice(units.indexOf(u),1);hero.x=300;hero.y=420;const b={site,hero,units,reserves,reinforcementCd:0,time:0,order:'hold',hold:{x:300,y:420,facing:1},target:null,targetId:null,attack:false,q:0,e:0,effects:[],result:null};for(const u of units.filter(u=>u.team===0&&!u.hero))Object.assign(u,formationTarget(b,u));return b;}

function move(u,p,dt,stop=0){const d=dist(u,p);if(d>stop){u.moving=true;const step=Math.min(u.speed*dt,d-stop);u.x+=(p.x-u.x)/d*step;u.y+=(p.y-u.y)/d*step;if(Math.abs(p.x-u.x)>1)u.facing=p.x>u.x?1:-1;}u.x=Math.max(35,Math.min(1165,u.x));u.y=Math.max(230,Math.min(600,u.y));}

function hit(b,u,t,damage){const incoming=damage;damage=Math.max(1,damage-(t.armorReduction??0));if(damage<incoming)b.effects.push({x:t.x,y:t.y-75,armor:true,life:.25});t.hp=Math.max(0,t.hp-damage);t.flash=.18;addDamageNumber(b,u,t,damage);u.swing=.22;if(u.hero&&u.weapon==='spear')b.effects.push({x:u.x,y:u.y-55,toX:t.x,toY:t.y-48,life:.22,thrust:true});else if(u.hero&&u.weapon==='mace')b.effects.push({x:t.x,y:t.y-42,life:.3,crush:true});else if((u.type!=='archer'&&!TROOPS[u.type].spell)||u.hero)b.effects.push({x:t.x,y:t.y-42,life:.22,slash:true,facing:u.facing,hero:!!u.hero,weapon:u.weapon});if(TROOPS[u.type].spell&&!u.hero)b.effects.push({x:u.x,y:u.y-65,toX:t.x,toY:t.y-45,life:.35,spell:TROOPS[u.type].spell});if(u.type==='archer'&&!u.hero)b.effects.push({x:u.x,y:u.y-45,toX:t.x,toY:t.y-45,life:.25,arrow:true});}

function heroAttack(b, hero, target) {
 const secondary = secondaryStrikes(hero, target, b.units);
 hit(b, hero, target, hero.damage);
 for (const strike of secondary) hit(b, hero, strike.target, strike.damage);
 if (hero.weapon === 'mace' && target.hp > 0 && !target.structure) {
  target.stagger = Math.max(target.stagger ?? 0, staggerDuration(target));
  target.moving = false;
  b.effects.push({x:target.x,y:target.y-105,text:'STAGGER',life:.45});
 }
 if (secondary.length) b.effects.push({x:target.x,y:target.y-105,text:hero.weapon === 'spear' ? 'PIERCE' : 'CLEAVE',life:.45});
}

export function ability(b,key){if(b.result||b[key]>0)return false;if(key==='q'){b.q=5*Math.max(.5,1-(b.attributes?.WIS??0)*.02);for(const t of b.units.filter(u=>u.team===1&&u.hp>0&&dist(u,b.hero)<155))hit(b,b.hero,t,65+(b.attributes?.INT??0)*5);b.effects.push({x:b.hero.x,y:b.hero.y,text:'SWEEP',life:.55,ring:155});}else if(key==='e'){b.e=9*Math.max(.5,1-(b.attributes?.WIS??0)*.02);for(const t of b.units.filter(u=>u.team===0&&u.hp>0&&dist(u,b.hero)<220))t.hp=Math.min(t.max,t.hp+45+(b.attributes?.WIS??0)*4);b.effects.push({x:b.hero.x,y:b.hero.y,text:'RALLY +'+(45+(b.attributes?.WIS??0)*4),life:.7,ring:220});}return true;}

export function stepBattle(b,dt,keys={}){if(b.result)return;b.time+=dt;b.enemyReinforcementCd=Math.max(0,(b.enemyReinforcementCd??0)-dt);if(b.enemyReserves?.length&&b.enemyReinforcementCd===0&&b.units.filter(u=>u.team===1&&u.hp>0).length<12){const u=b.enemyReserves.shift();u.id=Math.max(...b.units.map(t=>t.id))+1;u.x=1140;u.y=310+(b.enemyReserves.length%4)*65;b.units.push(u);b.enemyReinforcementCd=3;b.effects.push({x:u.x,y:u.y-135,text:TROOPS[u.type].name,reinforcement:true,team:1,life:1.1});}b.reinforcementCd=Math.max(0,(b.reinforcementCd??0)-dt);if(b.reserves?.length&&b.reinforcementCd===0&&b.units.filter(u=>u.team===0&&!u.hero&&u.hp>0).length<12){const u=b.reserves.shift();u.reserve=false;u.id=Math.max(...b.units.map(t=>t.id))+1;u.x=55;u.y=420;b.units.push(u);assignFormationPosts(b);b.reinforcementCd=3;b.effects.push({x:u.x,y:u.y-135,text:TROOPS[u.type].name,reinforcement:true,team:0,life:1.1});}b.q=Math.max(0,b.q-dt);b.e=Math.max(0,b.e-dt);b.effects=b.effects.filter(e=>(e.life-=dt)>0);const h=b.hero,dx=(keys.d?1:0)-(keys.a?1:0),dy=(keys.s?1:0)-(keys.w?1:0);h.moving=false;if(dx||dy){b.target=null;b.targetId=null;move(h,{x:h.x+dx*100,y:h.y+dy*100},dt);}else{const tracked=b.units.find(u=>u.id===b.targetId&&u.hp>0);if(tracked){h.facing=tracked.x>h.x?1:-1;move(h,tracked,dt,h.range*.8);}else if(b.targetId!==null){b.targetId=null;b.target=null;b.attack=false;}else if(b.target)move(h,b.target,dt,4);}

stepMission(b,dt);
updateFollowHeading(b);
for (const unit of b.units) {
 unit.swing=Math.max(0,unit.swing-dt);
 if(!unit.hero)unit.moving=false;
 unit.flash=Math.max(0,(unit.flash??0)-dt);
 if(unit.hp<=0)continue;
 unit.cd=Math.max(0,unit.cd-dt);
 if(unit.structure)continue;
 if((unit.stagger??0)>0){unit.stagger=Math.max(0,unit.stagger-dt);unit.moving=false;continue;}
 if(unit.type==='holyMage'){
  unit.healCd=Math.max(0,(unit.healCd??0)-dt);
  const ally=b.units.filter(t=>t.team===unit.team&&!t.structure&&t.hp>0&&t.hp<t.max&&dist(unit,t)<190).sort((a,c)=>a.hp/a.max-c.hp/c.max)[0];
  if(ally&&unit.healCd===0){
   const healed=Math.min(12,ally.max-ally.hp);ally.hp+=healed;unit.healCd=6;
   b.effects.push({x:unit.x,y:unit.y-65,toX:ally.x,toY:ally.y-55,heal:true,life:.45});
   b.effects.push({x:ally.x,y:ally.y-45,text:'+'+healed,healing:true,life:.6});
  }
 }
 if(unit.hero){
  const enemies=b.units.filter(t=>t.team!==unit.team&&t.hp>0);
  const target=enemies.find(t=>t.id===b.targetId)??enemies.reduce((a,t)=>!a||dist(unit,t)<dist(unit,a)?t:a,null);
  if(target&&(keys[' ']||b.attack)&&dist(unit,target)<=unit.range&&unit.cd===0){
   unit.facing=target.x>unit.x?1:-1;heroAttack(b,unit,target);unit.cd=unit.attackCooldown;
  }
  continue;
 }
 const intent=soldierIntent(b,unit),target=intent.target;
 if(target){
  if(dist(unit,target)>unit.range)move(unit,target,dt,unit.range-3);
  else if(unit.cd===0){
   unit.facing=target.x>unit.x?1:-1;hit(b,unit,target,unit.damage);
   unit.cd=TROOPS[unit.type].spell?1.6:unit.type==='archer'?1.15:.85;
  }
 }else if(intent.post)move(unit,intent.post,dt,10);
}

// Soft separation keeps melee crowds readable without trapping Crown behind allies.

for(let i=0;i<b.units.length;i++)for(let j=i+1;j<b.units.length;j++){
 const a=b.units[i],c=b.units[j];if(a.hp<=0||c.hp<=0||a.structure||c.structure)continue;
 const spacing=a.team===c.team?(a.hero||c.hero?58:a.type==='frogGuardian'||c.type==='frogGuardian'?58:50):32,d=dist(a,c);
 if(d<spacing){const angle=d?Math.atan2(c.y-a.y,c.x-a.x):i+j,push=(spacing-d)*.5,dx=Math.cos(angle)*push,dy=Math.sin(angle)*push;
  if(a.hero){c.x+=dx*2;c.y+=dy*2;}else if(c.hero){a.x-=dx*2;a.y-=dy*2;}else{a.x-=dx;c.x+=dx;a.y-=dy;c.y+=dy;}
  for(const unit of [a,c]){unit.x=Math.max(35,Math.min(1165,unit.x));unit.y=Math.max(230,Math.min(600,unit.y));}
 }
}

if(h.hp<=0)b.result='defeat';else if(!b.enemyReserves?.length&&!b.units.some(u=>u.team===1&&u.hp>0)){if(b.mission&&!missionProgress(b).complete)return;if(!b.objective||b.objective.collected)b.result='victory';else b.objective.unlocked=true;}}





export function collectObjective(b){if(b?.mission?.type==='rescue')return rescueCaptive(b);if(!b?.objective||!b.objective.unlocked||b.objective.collected||b.result||b.hero.hp<=0||dist(b.hero,b.objective)>85)return false;b.objective.collected=true;b.effects.push({x:b.objective.x,y:b.objective.y-45,text:'CARGO RECOVERED',life:.6});return true;}
