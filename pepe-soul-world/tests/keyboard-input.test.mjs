import test from 'node:test';import assert from 'node:assert/strict';
import {keyboardIntent} from '../keyboard-input.js';
import {createState,step} from '../core.js';import {useItem} from '../systems.js';
const live={begun:true,ready:true,paused:false,dead:false,journalOpen:false,canvasFocused:true};
const intent=(code,event={},session={})=>keyboardIntent({code,...event},{...live,...session});
test('modified and composing shortcuts remain browser input in every session',()=>{
 for(const code of ['KeyR','KeyW','KeyL','KeyJ','KeyI','Digit1','Escape','Tab'])for(const modifier of ['ctrlKey','altKey','metaKey','isComposing']){
  assert.equal(intent(code,{[modifier]:true}),null);
  assert.equal(intent(code,{[modifier]:true},{journalOpen:true}),null);
 }
});
test('held shortcuts do not toggle menus or spend another flask after regeneration',()=>{
 for(const code of ['Escape','KeyM','KeyQ','KeyC','KeyI','KeyG','Digit1','Digit2'])assert.equal(intent(code,{repeat:true}),null);
 const state=createState();state.inventory.spiritFlask=3;state.player.sp=0;
 const apply=e=>{const action=keyboardIntent(e,live);if(action?.type==='item')useItem(state,action.id);};
 apply({code:'Digit2'});assert.equal(state.inventory.spiritFlask,2);
 for(let frame=0;frame<60;frame++){step(state,{},1/60);apply({code:'Digit2',repeat:true});}
 assert.equal(state.inventory.spiritFlask,2);
 apply({code:'Digit2'});assert.equal(state.inventory.spiritFlask,1);
});
test('movement and combat repeats suppress scrolling without retriggering actions',()=>{
 for(const code of ['ArrowLeft','ArrowRight','ArrowDown','Space','KeyJ','KeyK']){
  assert.deepEqual(intent(code),{type:'play',code});assert.deepEqual(intent(code,{repeat:true}),{type:'held'});
  assert.equal(intent(code,{repeat:true},{paused:true}),null);
 }
 assert.equal(intent('Space',{repeat:true},{buttonFocused:true}),null);
});
test('file inputs, native button activation, startup and modal navigation retain ownership',()=>{
 assert.equal(intent('KeyJ',{}, {inputFocused:true}),null);
 assert.deepEqual(intent('Escape',{}, {inputFocused:true,journalOpen:true}),{type:'escape'});
 assert.equal(intent('Space',{}, {buttonFocused:true}),null);
 assert.equal(intent('Tab',{shiftKey:true}),null);
 assert.equal(intent('Tab',{}, {journalOpen:true}),null);
 assert.deepEqual(intent('Tab'),{type:'journal',tab:'Map'});
 for(const block of [{begun:false},{ready:false},{dead:true},{paused:true},{journalOpen:true}])assert.equal(intent('Digit1',{},block),null);
 assert.deepEqual(intent('Escape',{}, {paused:true}),{type:'escape'});
});
