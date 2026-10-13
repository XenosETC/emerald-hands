import test from 'node:test';import assert from 'node:assert/strict';import {Sound} from '../audio.js';
function context(){
 const counts={connections:0,notes:0,closed:0};let failNote=false;
 const param={value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){}};
 const ctx={state:'suspended',currentTime:0,destination:{},async resume(){this.state='running';},async close(){counts.closed++;this.state='closed';},createGain(){return {gain:{...param},connect(){counts.connections++;},disconnect(){}};},createOscillator(){if(failNote)throw Error('closed context');counts.notes++;return {frequency:{...param},connect(){},disconnect(){},start(){},stop(){}};}};
 return {ctx,counts,breakPlayback(){failNote=true;}};
}
test('sound stays opt-in, reuses one master connection and ignores unknown events',async()=>{
 const f=context();let created=0;const sound=new Sound(()=>{created++;return f.ctx;});assert.equal(sound.play('hit'),false);assert.equal(created,0);
 assert.equal(await sound.enable(true),true);assert.equal(sound.play('hit'),true);assert.equal(sound.play('save'),false);
 await sound.enable(false);assert.equal(sound.play('hit'),false);await sound.enable(true);
 assert.equal(created,1);assert.equal(f.counts.connections,2);assert.equal(f.counts.notes,1);
});
test('constructor, resume and suspended-state failures stay silent and retryable',async()=>{
 for(const create of [()=>{throw Error('blocked');},()=>({...context().ctx,resume:()=>Promise.reject(Error('denied'))}),()=>({...context().ctx,resume:async()=>{}})]){
  const sound=new Sound(create);assert.equal(await sound.enable(true),false);assert.equal(sound.enabled,false);assert.equal(sound.failed,true);assert.equal(sound.play('hit'),false);
  const good=context();sound.createContext=()=>good.ctx;assert.equal(await sound.enable(true),true);assert.equal(sound.failed,false);
 }
});
test('a playback failure cannot escape the frame and disables optional audio',async()=>{
 const f=context(),sound=new Sound(()=>f.ctx);await sound.enable(true);f.breakPlayback();
 assert.doesNotThrow(()=>assert.equal(sound.play('hit'),false));assert.equal(sound.enabled,false);assert.equal(sound.failed,true);assert.equal(f.counts.closed,1);assert.equal(sound.play('swing'),false);
});
test('a delayed resume cannot turn sound back on after the player turns it off',async()=>{
 const f=context();let resolve;f.ctx.resume=()=>new Promise(done=>{resolve=done;});const sound=new Sound(()=>f.ctx);
 const enabling=sound.enable(true);await sound.enable(false);f.ctx.state='running';resolve();assert.equal(await enabling,false);assert.equal(sound.enabled,false);
});
