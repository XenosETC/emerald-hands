import test from 'node:test';
import assert from 'node:assert/strict';
import {GuardControls} from '../guard-controls.js';
import {PointerControls} from '../pointer-controls.js';
import {createState,step,act} from '../core.js';
import {guardCounterPose,guardHit} from '../sword-guard.js';
import {heroFrame,clipFrame} from '../render.js';

function setup(){
 const state=createState(),keys=new Set(),pointers=new PointerControls();
 state.enemies=[];
 return {state,keys,pointers,guard:new GuardControls(state.player,keys,pointers)};
}
function raise(t){for(let i=0;i<9;i++)step(t.state,{guard:t.guard.held},1/60);assert.ok(t.state.player.guarding);}

test('Keyboard guard release accepts a counter before the next simulation tick',()=>{
 for(const code of ['KeyS','ArrowDown']){
  const t=setup();t.keys.add(code);t.guard.takeOver(code);raise(t);
  const hp=t.state.player.hp;guardHit(t.state.player,{face:-1},12);
  t.keys.delete(code);t.guard.sync(); // No step between release and action.
  assert.ok(act(t.state,'attack'));assert.equal(t.state.player.combo,1);
  assert.equal(t.state.player.guarding,false);assert.equal(t.state.player.hp,hp);
  assert.deepEqual(heroFrame(t.state.player,t.state.time),clipFrame('attack',0));
 }
});

test('Touch takes ownership from the click toggle; releasing it can immediately slash',()=>{
 const t=setup();t.guard.toggle();raise(t);
 t.pointers.hold(7,'KeyS');t.guard.takeOver('KeyS');t.guard.sync();
 assert.equal(t.guard.latched,false);assert.equal(t.guard.held,true);
 t.pointers.release(7);t.guard.sync();assert.equal(t.guard.held,false);
 assert.ok(act(t.state,'attack'));assert.equal(t.state.player.guarding,false);
});

test('Releasing one keyboard or touch source preserves another held guard',()=>{
 const t=setup();t.keys.add('KeyS');t.keys.add('ArrowDown');t.pointers.hold(1,'KeyS');t.pointers.hold(2,'KeyS');raise(t);
 t.keys.delete('KeyS');t.guard.sync();assert.ok(t.state.player.guarding);
 t.pointers.release(1);t.guard.sync();assert.ok(t.state.player.guarding);
 t.keys.delete('ArrowDown');t.guard.sync();assert.ok(t.state.player.guarding);
 t.pointers.release(2);t.guard.sync();assert.equal(t.state.player.guarding,false);
 t.pointers.release(2);t.guard.sync();assert.ok(act(t.state,'jump'));
});

test('Click release is immediate and held guards still reject attack attempts',()=>{
 const t=setup();t.guard.toggle();raise(t);
 t.guard.takeOver('KeyJ');t.guard.sync();assert.equal(act(t.state,'attack'),false);
 t.guard.toggle();assert.ok(act(t.state,'attack'));
});

test('Release then re-press between ticks clears break rearm, while the recovery lock stays enforced',()=>{
 const t=setup();t.keys.add('KeyS');raise(t);t.state.player.sp=8;
 assert.equal(guardHit(t.state.player,{face:-1},24).type,'guardBreak');
 t.keys.delete('KeyS');t.guard.sync();t.keys.add('KeyS');t.guard.takeOver('KeyS');
 t.state.player.sp=100;step(t.state,{guard:t.guard.held},1/60);
 assert.equal(t.state.player.guarding,false);assert.equal(t.state.player.guardMustRelease,false);
 for(let i=0;i<50;i++)step(t.state,{guard:t.guard.held},1/60);
 assert.ok(t.state.player.guarding);
 t.keys.clear();t.pointers.clear();t.guard.reset();assert.equal(t.state.player.guarding,false);assert.equal(t.guard.held,false);assert.equal(t.state.player.guardLower,0);
});

test('Guard-to-cut pose blends from the brace, completes before damage, and honors reduced effects',()=>{
 const t=setup();t.guard.toggle();raise(t);guardHit(t.state.player,{face:-1},12);
 t.guard.toggle();assert.ok(act(t.state,'attack'));
 assert.deepEqual(guardCounterPose(t.state.player),{from:2,blend:0});
 assert.equal(guardCounterPose(t.state.player,true),null);
 step(t.state,{},1/60);const first=guardCounterPose(t.state.player);assert.ok(first.blend>0&&first.blend<1);
 step(t.state,{},1/60);assert.ok(guardCounterPose(t.state.player).blend>first.blend);
 for(let i=0;i<2;i++)step(t.state,{},1/60);
 assert.equal(guardCounterPose(t.state.player),null);assert.ok(t.state.player.anim<.26);
 assert.equal(guardCounterPose({attack:.48,anim:0}),null,'ordinary attacks do not use a guard pose');
});
