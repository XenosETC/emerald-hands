const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function game(blocked=false){
 const saves=new Map([['emerald-arcade-v1','unrelated-arcade'],['emerald-arcade-pets-v1','unrelated-pet']]),nodes=new Map();
 const node=()=>({dataset:{},style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},getBoundingClientRect:()=>({left:0,top:0,width:100,height:100}),appendChild(){},remove(){}});
 const window={setTimeout(){},addEventListener(){},AudioContext:class{constructor(){throw Error('no audio');}},EmeraldArcade:{isPaused:()=>false,isMuted:()=>false,beginSession(){throw Error('session unavailable');}}};
 const document={body:node(),activeElement:null,querySelector(selector){if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector);},querySelectorAll:()=>[],createElement:node,addEventListener(){}};
 const context=vm.createContext({window,document,localStorage:{getItem:key=>saves.get(key)??null,setItem:(key,value)=>{if(blocked)throw Error('quota');saves.set(key,value);},removeItem:key=>saves.delete(key)},confirm:()=>true});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../satoshi-system.js'),'utf8'),context);
 return {saves,nodes,unblock(){blocked=false;},read:expression=>vm.runInContext(expression,context)};
}
test('Satoshi blocked writes and unavailable audio leave a balanced playable tab and warning',()=>{
 const h=game(true);
 assert.match(h.nodes.get('#saveStatus').textContent,/held only in this tab/);
 assert.doesNotThrow(()=>h.read('for(let i=0;i<8;i++)advanceTick();buy("relay")'));
 assert.equal(h.read('state.worlds.relay'),1);assert.equal(h.read('state.treasury'),0);
 assert.equal(h.read('window.__satoshiSystemDebug.invariantHolds()'),true);
 assert.equal(h.saves.get('emerald-arcade-v1'),'unrelated-arcade');
 assert.equal(h.saves.get('emerald-arcade-pets-v1'),'unrelated-pet');
});
test('Satoshi storage recovery saves current tab progress and clears the warning',()=>{
 const h=game(true);h.read('advanceTick();advanceTick()');
 h.unblock();h.read('saveState()');
 assert.equal(h.nodes.get('#saveStatus').textContent,'Saved on this device.');
 assert.equal(JSON.parse(h.saves.get('satoshi-system-save-v1')).ticks,2);
});
