import test from 'node:test';import assert from 'node:assert/strict';import {journalShortcut} from '../journal-input.js';
const active={begun:true,ready:true,paused:false,dead:false,journalOpen:false,canvasFocused:true,shiftKey:false};
test('Tab-to-map requires active canvas and preserves normal startup and reverse navigation',()=>{
 assert.equal(journalShortcut('Tab',active),'Map');
 for(const state of [{begun:false},{ready:false},{paused:true},{dead:true},{canvasFocused:false},{journalOpen:true},{shiftKey:true}])assert.equal(journalShortcut('Tab',{...active,...state}),null);
});
test('letter journal shortcuts remain available in live play and journal tabs',()=>{
 for(const [code,tab] of Object.entries({KeyM:'Map',KeyQ:'Quests',KeyC:'Skills',KeyI:'Inventory',KeyG:'Gear'})){
  assert.equal(journalShortcut(code,{...active,canvasFocused:false,journalOpen:true}),tab);
  assert.equal(journalShortcut(code,{...active,paused:true}),null);
 }
 assert.equal(journalShortcut('KeyJ',active),null);
});
