import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newCampaign} from '../campaign.js';
import {createBattle,stepBattle,ability} from '../combat.js';

function setup(weapon, points) {
 const state=newCampaign();state.weapon=weapon;state.army=[];
 const b=createBattle(state,'hunt');b.hero.x=300;b.hero.y=420;
 const sample=b.units.find(u=>u.team===1);
 b.units=[b.hero,...points.map(([x,y],i)=>({...sample,id:i+1,x:300+x,y:420+y,hp:500,max:500,speed:0,range:0}))];
 return b;
}

test('spear pierces one aligned enemy behind the target; excludes allies, wide and out-of-reach targets',()=>{
 const b=setup('spear',[[45,0],[80,0],[108,0],[75,40],[113,0],[-30,0]]);
 b.units[6].team=0;b.targetId=1;b.attack=true;
 stepBattle(b,1/60,{' ':true});
 assert.deepEqual(b.units.slice(1).map(u=>500-u.hp),[22,13,0,0,0,0]);
 assert.ok(b.effects.some(e=>e.text==='PIERCE'));
});

test('axe cleaves at most two foes in a forward cone and respects reach',()=>{
 const b=setup('axe',[[38,0],[43,20],[43,-20],[50,0],[-40,0],[65,0]]);b.targetId=1;b.attack=true;
 stepBattle(b,1/60,{' ':true});
 assert.deepEqual(b.units.slice(1).map(u=>500-u.hp),[42,19,19,0,0,0]);
});

test('mace stagger prevents attacks and walking, then releases; captains resist',()=>{
 const b=setup('mace',[[55,0]]),enemy=b.units[1];enemy.range=100;enemy.speed=80;
 stepBattle(b,1/60,{' ':true});
 assert.ok(enemy.stagger>.4);assert.equal(b.hero.hp,b.hero.max);
 const x=enemy.x;stepBattle(b,.2);assert.equal(enemy.x,x);assert.equal(b.hero.hp,b.hero.max);
 stepBattle(b,.3);stepBattle(b,1/60);assert.ok(b.hero.hp<b.hero.max);
 const captain=setup('mace',[[55,0]]);captain.units[1].captain='Warden';
 stepBattle(captain,1/60,{' ':true});assert.ok(captain.units[1].stagger<=.2);
});

test('Sweep does not proc weapon traits or multiply damage, and basic attack cooldown is honored',()=>{
 for(const weapon of ['spear','axe','mace']){
  const b=setup(weapon,[[40,0],[50,20]]);ability(b,'q');
  assert.deepEqual(b.units.slice(1).map(u=>u.hp),[435,435]);
  assert.ok(b.units.every(u=>!u.stagger));
  assert.ok(!b.effects.some(e=>['PIERCE','CLEAVE','STAGGER'].includes(e.text)));
 }
 const b=setup('axe',[[40,0]]);stepBattle(b,1/60,{' ':true});const hp=b.units[1].hp;
 stepBattle(b,1/60,{' ':true});assert.equal(b.units[1].hp,hp);
});
