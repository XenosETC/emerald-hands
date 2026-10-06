import test from 'node:test';
import assert from 'node:assert/strict';
import {newCampaign} from '../campaign.js';
import {createBattle,stepBattle} from '../combat.js';
import {formationTarget,issueOrder,updateFollowHeading,retreatTarget} from '../formation.js';
import {soldierIntent} from '../soldier-tactics.js';
import {addDamageNumber} from '../combat-numbers.js';

function regiment(types){const state=newCampaign();state.army=types;state.armyXp=types.map(()=>0);return createBattle(state,'keep');}
const allies=b=>b.units.filter(u=>u.team===0&&!u.hero&&u.hp>0);

test('casualties keep survivor posts and reinforcements inherit only vacant space',()=>{
 const b=regiment([...Array(12).fill('spearman'),'holyMage']);
 const before=new Map(allies(b).map(u=>[u.id,{post:u.formationPost,target:formationTarget(b,u)}]));
 const fallen=allies(b)[3],vacant=fallen.formationPost;fallen.hp=0;
 for(const u of allies(b))assert.deepEqual(formationTarget(b,u),before.get(u.id).target);
 stepBattle(b,1/60);assert.equal(b.reserves.length,0);
 const incoming=allies(b).find(u=>u.type==='holyMage');assert.equal(incoming.formationPost,vacant);
 for(const u of allies(b).filter(u=>u!==incoming))assert.equal(u.formationPost,before.get(u.id).post);
 assert.equal(new Set(allies(b).map(u=>u.formationPost)).size,12);
});

test('twelve posts remain separated at all battlefield corners for both facings',()=>{
 const b=regiment(Array(12).fill('guard'));
 for(const x of [35,1165])for(const y of [230,600])for(const facing of [-1,1]){
  b.hold={x,y,facing};const posts=allies(b).map(u=>formationTarget(b,u));
  for(const p of posts)assert.ok(p.x>=65&&p.x<=1135&&p.y>=235&&p.y<=595);
  for(let i=0;i<posts.length;i++)for(let j=i+1;j<posts.length;j++)assert.ok(Math.hypot(posts[i].x-posts[j].x,posts[i].y-posts[j].y)>=68);
 }
});

test('preferred ranged posts survive frontline overflow and retreat has twelve distinct posts',()=>{
 const b=regiment([...Array(10).fill('guard'),'holyMage','archer']);
 assert.ok(allies(b).filter(u=>u.type!=='guard').every(u=>u.formationPost>=8));
 const targets=allies(b).map(u=>retreatTarget(b,u));assert.equal(new Set(targets.map(p=>p.x+','+p.y)).size,12);
});

test('follow heading ignores attack-facing flips and small steps, turns after a real march',()=>{
 const b=regiment(['guard','spearman','archer']);b.hero.x=600;issueOrder(b,'follow');
 const before=allies(b).map(u=>formationTarget(b,u));b.hero.facing=-1;updateFollowHeading(b);
 assert.deepEqual(allies(b).map(u=>formationTarget(b,u)),before);
 b.hero.x=580;updateFollowHeading(b);assert.equal(b.follow.facing,1);
 b.hero.x=550;updateFollowHeading(b);assert.equal(b.follow.facing,-1);
 const ranged=allies(b).find(u=>u.type==='archer');assert.ok(formationTarget(b,ranged).x>b.hero.x);
 b.hero.facing=1;updateFollowHeading(b);assert.equal(b.follow.facing,-1);
});

test('stationary following posts leave room for Crown at the opening position',()=>{
 const b=regiment(['guard','holyKnight','spearman','archer']);issueOrder(b,'follow');
 for(const u of allies(b)){const p=formationTarget(b,u);assert.ok(Math.hypot(p.x-b.hero.x,p.y-b.hero.y)>=67.99);}
});

test('hold returns displaced soldiers to their posts and does not pursue enemies away',()=>{
 const b=regiment(['guard']),unit=allies(b)[0],enemy=b.units.find(u=>u.team===1);
 const post=formationTarget(b,unit);Object.assign(unit,post);
 for(const e of b.units.filter(u=>u.team===1)){e.x=1100;e.y=250;}
 enemy.x=unit.x+30;enemy.y=unit.y;assert.equal(soldierIntent(b,unit).target,enemy);
 enemy.x=post.x+unit.range+50;assert.deepEqual(soldierIntent(b,unit).post,post);
 unit.x=post.x+80;enemy.x=unit.x+20;assert.deepEqual(soldierIntent(b,unit).post,post);
 issueOrder(b,'retreat');assert.ok(!soldierIntent(b,unit).target);
});

test('soldiers retain a target through small distance changes, replace dead or distant targets',()=>{
 const b=regiment(['guard']),unit=allies(b)[0];issueOrder(b,'attack');
 const [a,c]=b.units.filter(u=>u.team===1);a.x=unit.x+100;a.y=unit.y;c.x=unit.x+120;c.y=unit.y;
 assert.equal(soldierIntent(b,unit).target,a);c.x=unit.x+90;assert.equal(soldierIntent(b,unit).target,a);
 c.x=unit.x+30;assert.equal(soldierIntent(b,unit).target,c);c.hp=0;assert.equal(soldierIntent(b,unit).target,a);
});

test('damage feedback groups simultaneous troop hits while preserving actual Crown amounts',()=>{
 const b={time:1,effects:[]},victim={id:1,x:400,y:400},troop={hero:false},hero={hero:true};
 addDamageNumber(b,troop,victim,12);b.time+=.05;addDamageNumber(b,troop,victim,13);addDamageNumber(b,hero,victim,42);
 assert.equal(b.effects.length,2);assert.deepEqual(b.effects.map(e=>e.text),['25','42']);
 assert.notEqual(b.effects[0].x,b.effects[1].x);assert.notEqual(b.effects[0].y,b.effects[1].y);
 b.time+=.3;addDamageNumber(b,troop,victim,7);assert.equal(b.effects.length,3);
 addDamageNumber(b,troop,{...victim,id:2,hero:true},9);assert.equal(b.effects.at(-1).source,'incoming');
});

test('enemy target selection keeps the nearest threat instead of retaining an old focus',()=>{
 const b=regiment(['guard']),soldier=allies(b)[0],enemy=b.units.find(u=>u.team===1);
 enemy.x=600;enemy.y=400;b.hero.x=570;b.hero.y=400;soldier.x=550;soldier.y=400;
 enemy.enemyId=b.hero.id;assert.equal(soldierIntent(b,enemy).target,b.hero);
 soldier.x=580;assert.equal(soldierIntent(b,enemy).target,soldier);
});
