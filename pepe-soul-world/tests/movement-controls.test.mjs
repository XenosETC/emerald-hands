import test from 'node:test';import assert from 'node:assert/strict';
import {MovementControls} from '../movement-controls.js';import {PointerControls} from '../pointer-controls.js';
import {bindAccessibleAction} from '../accessible-controls.js';import {createState,step,act} from '../core.js';
const fixture=()=>{const keys=new Set(),pointers=new PointerControls();return {keys,pointers,controls:new MovementControls(keys,pointers)};};
const tick=(s,c,n=60)=>{for(let i=0;i<n;i++)step(s,{left:c.left,right:c.right},1/60);};

test('accessible clicks start, switch and stop real walking without duplicate pointer activation',()=>{
 const {controls:c}=fixture(),s=createState(),button=new EventTarget();
 bindAccessibleAction(button,()=>c.toggle('KeyD'));
 const click=detail=>{const event=new Event('click');Object.defineProperty(event,'detail',{value:detail});button.dispatchEvent(event);};
 click(1);assert.equal(c.right,false);click(0);tick(s,c);assert.equal(s.player.x,605);
 click(0);tick(s,c);assert.equal(s.player.x,605);
 c.toggle('KeyD');c.toggle('KeyA');assert.equal(c.right,false);tick(s,c);assert.equal(s.player.x,320);
});

test('physical movement takes over and retains independent keyboard and pointer ownership',()=>{
 const {keys,pointers,controls:c}=fixture();c.toggle('KeyD');keys.add('KeyA');c.takeOver('KeyA');assert.equal(c.latched,null);assert.equal(c.left,true);assert.equal(c.right,false);
 pointers.hold(1,'KeyA');keys.delete('KeyA');assert.equal(c.left,true);pointers.release(1);assert.equal(c.left,false);
 c.toggle('KeyA');pointers.hold(2,'KeyD');c.takeOver('KeyD');assert.equal(c.latched,null);assert.equal(c.right,true);assert.equal(c.left,false);
 pointers.release(2);assert.equal(c.right,false);
});

test('walking resumes after a committed cut and reset clears the toggle without affecting other input sources',()=>{
 const {keys,controls:c}=fixture(),s=createState();c.toggle('KeyD');act(s,'attack');tick(s,c,10);assert.equal(s.player.x,320);
 tick(s,c,60);assert.ok(s.player.x>320);c.reset();const stopped=s.player.x;tick(s,c);assert.equal(s.player.x,stopped);
 keys.add('ArrowLeft');c.toggle('KeyD');c.reset();assert.equal(c.left,true);assert.equal(c.right,false);
});
