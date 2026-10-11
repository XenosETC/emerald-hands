const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
function game() {
 const nodes=new Map(), rewards=[];
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})}, {get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 function node(){const events={};return {value:'',hidden:false,textContent:'',innerHTML:'',style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},focus(){this.focused=true;},addEventListener(t,f){(events[t]||=[]).push(f);},emit(t,e={}){for(const f of events[t]||[]) f({target:this,preventDefault(){},...e});},querySelector:find,querySelectorAll:()=>[],getContext:()=>ctx};}
 function find(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);}
 const canvas=find('#rumbleCanvas');canvas.width=1280;canvas.height=720;
 find('#p1Character').value='crown';find('#p2Character').value='corrupt';
 const modes=['pvp','tournament'].map(mode=>Object.assign(node(),{dataset:{mode}}));
 const document=Object.assign(node(),{body:node(),querySelector:find,querySelectorAll:s=>s==='[data-mode]'?modes:[],createElement:node});
 const window=Object.assign(node(),{location:{search:''},EmeraldArcade:{load:()=>({badges:[]}),beginSession(){},recordAndNotify:(...args)=>{rewards.push(args);return {};}}});
 const context=vm.createContext({window,document,location:window.location,performance:{now:()=>0},URLSearchParams,Image:class{complete=false;naturalWidth=0;addEventListener(){}},requestAnimationFrame(){},setInterval(){},clearInterval(){},setTimeout(){},Math,console});
 const source=fs.readFileSync(path.join(__dirname,'..','pepe-relic-rumble.js'),'utf8');
 // The gateway exists only in this in-memory test copy of the actual controller.
 vm.runInContext(source.replace(/\}\)\(\);\s*$/,'window.__testRun=code=>eval(code);})();'),context);
 const run=code=>vm.runInContext('window.__testRun('+JSON.stringify(code)+')',context);
 return {run,window,document,nodes,modes,rewards};
}
test('equal-health timeout and double knockout draw without wins or rewards',()=>{
 for(const health of [100,0]) {const g=game();g.run('showRosterStep("pvp");launchSelectedFight();roundTime=0;fighters.forEach(f=>f.health='+health+');update(0)');assert.equal(g.run('gameState'),'round-over');assert.equal(g.run('fighters[0].wins+fighters[1].wins'),0);assert.equal(g.rewards.length,0);assert.match(g.nodes.get('#stateLabel').textContent,/Draw/);g.run('update(2.3)');assert.equal(g.run('gameState'),'playing');assert.equal(g.run('roundTime'),60);}
});
test('completed match records once and focuses replay; replay resets scores',()=>{
 const g=game();g.run('showRosterStep("pvp");launchSelectedFight()');
 for(let i=0;i<3;i++) g.run('endRound(fighters[0]);update(2.3)');
 assert.equal(g.run('gameState'),'match-over');assert.equal(g.rewards.length,1);g.run('endRound(fighters[0])');assert.equal(g.rewards.length,1);
 assert.equal(g.nodes.get('#launchButton').focused,true);g.nodes.get('#launchButton').emit('click');assert.equal(g.run('fighters[0].wins'),0);assert.equal(g.run('gameState'),'playing');
});
test('paused input, blur and setup clear held keys and buffered presses',()=>{
 const g=game();g.run('showRosterStep("pvp");launchSelectedFight()');g.window.emit('keydown',{code:'KeyF'});assert.equal(g.run('keys.size'),1);
 g.window.emit('emeraldarcade:pause');assert.equal(g.run('keys.size+pressed.size'),0);
 g.window.EmeraldArcade.isPaused=()=>true;g.window.emit('keydown',{code:'KeyF'});assert.equal(g.run('keys.size'),0);
 g.window.EmeraldArcade.isPaused=()=>false;g.window.emit('keydown',{code:'KeyD'});g.run('openSetup()');assert.equal(g.run('keys.size+pressed.size'),0);
 g.window.emit('keydown',{code:'KeyF'});assert.equal(g.run('keys.size'),0);
});
test('launch cannot replace an active match or select locked Berserk',()=>{
 const g=game();g.run('showRosterStep("pvp");p1Character.value="berserk";launchSelectedFight()');assert.equal(g.run('gameState'),'idle');
 g.run('p1Character.value="crown";launchSelectedFight();fighters[0].health=50;launchSelectedFight()');assert.equal(g.run('fighters[0].health'),50);
});
test('tournament wins advance through three bouts and completion awards one champion record',()=>{
 const g=game();g.run('showRosterStep("tournament");launchSelectedFight()');
 for(let bout=0;bout<3;bout++) {
  g.run('endRound(fighters[0]);update(2.3);endRound(fighters[0])');
  if(bout<2){g.run('update(2.9)');if(bout===1){assert.equal(g.run('gameState'),'domain-ceremony');g.nodes.get('#domainCeremonyButton').emit('click');g.run('update(3.3)');}}
 }
 assert.equal(g.run('gameState'),'match-over');assert.equal(g.rewards.length,1);assert.equal(g.rewards[0][1].tournamentWon,true);assert.equal(g.nodes.get('#domainCeremonyButton').focused,true);
});
test('unavailable domain audio does not block launch or ceremony',()=>{
 const g=game();g.window.AudioContext=class{constructor(){throw Error('blocked audio');}};g.run('showRosterStep("tournament");launchSelectedFight();activateKekDomainFinal()');assert.equal(g.run('gameState'),'domain-ceremony');
});
test('CPU tournament victory records a loss without a champion unlock',()=>{
 const g=game();g.run('showRosterStep("tournament");launchSelectedFight();endRound(fighters[1]);update(2.3);endRound(fighters[1])');
 assert.equal(g.run('gameState'),'match-over');assert.equal(g.rewards.length,1);assert.equal(g.rewards[0][1].tournamentWon,false);assert.equal(g.rewards[0][1].wins,0);
});
