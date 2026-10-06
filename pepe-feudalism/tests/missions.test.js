import {enemyAtPoint} from '../battle-targeting.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {newCampaign} from '../campaign.js';
import {createBattle,stepBattle,collectObjective} from '../combat.js';
import {configureEncounter} from '../encounters.js';
import {missionProgress,missionReport,stepMission,captiveGuarded} from '../missions.js';
import {recordBattle,hydrateChronicle} from '../chronicle.js';
import {scout} from '../scouting.js';
import {NODES} from '../world.js';

function battle(destination){const s=newCampaign();s.army=[];const b=createBattle(s,'hunt');configureEncounter(b,destination);return b;}

test('rescue requires proximity, a living Crown and no nearby living guard, and cannot repeat',()=>{
 const b=battle('elderwood'),c=b.mission.captives[0],guard=b.units[1];
 assert.equal(collectObjective(b),false);
 Object.assign(b.hero,{x:c.x,y:c.y});Object.assign(guard,{x:c.x+40,y:c.y});
 assert.equal(captiveGuarded(b,c),true);assert.equal(collectObjective(b),false);
 guard.hp=0;b.hero.hp=0;assert.equal(collectObjective(b),false);
 b.hero.hp=b.hero.max;assert.equal(collectObjective(b),true);assert.equal(collectObjective(b),false);
 assert.equal(missionProgress(b).completed,1);assert.equal(b.effects.filter(e=>e.text==='HERBALIST FREED').length,1);
});

test('clearing raiders alone cannot win a rescue; both rescues grant the bonus only on victory',()=>{
 const b=battle('elderwood');for(const u of b.units.filter(u=>u.team===1))u.hp=0;
 stepBattle(b,1/60);assert.equal(b.result,null);
 for(const [i,c]of b.mission.captives.entries()){
  Object.assign(b.hero,{x:c.x,y:c.y});assert.equal(collectObjective(b),true);stepBattle(b,1/60);
  assert.equal(b.result,i===0?null:'victory');
 }
 assert.equal(missionReport(b,true).bonus,30);assert.equal(missionReport(b,false).bonus,0);
 assert.equal(collectObjective(b),false);
});

test('a rescue completed before clearing the camp still requires defeating every raider',()=>{
 const b=battle('elderwood');for(const u of b.units.filter(u=>u.team===1))Object.assign(u,{x:350,y:230,speed:0});
 for(const c of b.mission.captives){Object.assign(b.hero,{x:c.x,y:c.y});collectObjective(b);}
 stepBattle(b,1/60);assert.equal(missionProgress(b).complete,true);assert.equal(b.result,null);
 b.hero.hp=0;stepBattle(b,1/60);assert.equal(b.result,'defeat');assert.equal(missionReport(b,false).bonus,0);
});

test('Emberheart pulses heal only nearby living raiders, cap recovery, and respect cooldown and destroyed totems',()=>{
 const b=battle('ashgrove'),wards=b.units.filter(u=>u.structure),[near,far,dead]=b.units.filter(u=>u.team===1&&!u.structure);
 wards[1].hp=0;const w=wards[0];w.hp=40;w.pulseCd=.1;
 Object.assign(near,{x:w.x+10,y:w.y,hp:near.max-5});Object.assign(far,{x:35,y:600,hp:1});Object.assign(dead,{x:w.x,y:w.y,hp:0});
 Object.assign(b.hero,{x:w.x,y:w.y,hp:10});stepMission(b,.1);
 assert.equal(near.hp,near.max);assert.equal(far.hp,1);assert.equal(dead.hp,0);assert.equal(b.hero.hp,10);assert.equal(w.hp,40);
 assert.ok(b.effects.some(e=>e.wardHeal&&e.text==='+5'));
 near.hp-=20;stepMission(b,3.9);assert.equal(near.hp,near.max-20);
 stepMission(b,.11);assert.equal(near.hp,near.max-8);
 w.hp=0;stepMission(b,5);assert.equal(near.hp,near.max-8);
});

test('totems are stationary damageable targets; mace does not stun scenery and hit flashes expire',()=>{
 const b=battle('ashgrove'),w=b.units.find(u=>u.structure);for(const u of b.units.filter(u=>u.team===1&&!u.structure))u.hp=0;
 Object.assign(b.hero,{x:w.x-45,y:w.y,weapon:'mace',damage:34});b.targetId=w.id;b.attack=true;
 const position=[w.x,w.y];stepBattle(b,1/60);
 assert.equal(w.hp,86);assert.equal(w.stagger,undefined);assert.deepEqual([w.x,w.y],position);assert.ok(w.flash>0);
 b.attack=false;b.targetId=null;stepBattle(b,.2);assert.equal(w.flash,0);assert.equal(b.result,null);
 w.hp=0;w.flash=.18;stepBattle(b,.2);assert.equal(b.result,null);assert.equal(w.flash,0);
 b.units.filter(u=>u.structure).forEach(u=>u.hp=0);stepBattle(b,1/60);assert.equal(b.result,'victory');assert.equal(missionReport(b,true).bonus,45);
});

test('scouting distinguishes raiders from objectives and chronicle survives old and new saves',()=>{
 const s=newCampaign(),intel=scout(s,NODES.find(n=>n.id==='ashgrove'));
 assert.equal(intel.enemies.reduce((sum,u)=>sum+u.count,0),5);assert.equal(intel.mission.total,2);assert.equal(intel.mission.bonus,45);
 const b=battle('elderwood');recordBattle(s,{name:'Elderwood',won:false,survivors:0,losses:3,mission:missionReport(b,false)});
 assert.equal(hydrateChronicle(JSON.parse(JSON.stringify(s))).history[0].objective,'0/2 herbalists rescued');
 delete s.history[0].objective;assert.equal(hydrateChronicle(s).history[0].objective,'');
});


test('clicking a totem selects its foreground body rather than a soldier behind it',()=>{
 const soldier={id:1,team:1,hp:50,x:850,y:313},ward={id:2,team:1,hp:120,x:865,y:325,structure:'emberTotem'};
 assert.equal(enemyAtPoint([soldier,ward],{x:865,y:275}),ward);
 assert.equal(enemyAtPoint([soldier,ward],{x:865,y:195}),ward);
 ward.hp=0;assert.equal(enemyAtPoint([soldier,ward],{x:865,y:275}),soldier);
 assert.equal(enemyAtPoint([soldier,ward],{x:300,y:400}),null);
});
