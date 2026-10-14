import test from 'node:test';import assert from 'node:assert/strict';
import {bindAccessibleAction} from '../accessible-controls.js';
import {createState,act,step} from '../core.js';import {GuardControls} from '../guard-controls.js';
function click(button,detail){const event=new Event('click');Object.defineProperty(event,'detail',{value:detail});button.dispatchEvent(event);}
test('native activation reaches a real action while pointer clicks do not duplicate pointerdown',()=>{
 const state=createState(),button=new EventTarget();let attempts=0;
 bindAccessibleAction(button,()=>{attempts++;act(state,'jump');});
 click(button,1);click(button,2);assert.equal(attempts,0);assert.equal(state.player.vy,0);
 click(button,0);assert.equal(attempts,1);assert.ok(state.player.vy<0);
});
test('accessible guard clicks toggle through existing ownership and release immediately for a cut',()=>{
 const state=createState(),button=new EventTarget(),guard=new GuardControls(state.player,new Set(),new Set());
 bindAccessibleAction(button,()=>guard.toggle());click(button,0);step(state,{guard:guard.held},1/60);assert.equal(state.player.guarding,true);
 click(button,1);assert.equal(guard.held,true);
 click(button,0);assert.equal(guard.held,false);assert.equal(state.player.guarding,false);assert.equal(act(state,'attack'),true);
});
