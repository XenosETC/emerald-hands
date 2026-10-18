import test from 'node:test';
import assert from 'node:assert/strict';
import {renderQuality,createRenderGate} from './render-quality.js';
test('balanced and smooth reduce rendering cost, while high retains the original cap and shadows',()=>{
 assert.deepEqual(renderQuality('balanced',2),{ratio:1.25,shadows:false});
 assert.deepEqual(renderQuality('smooth',3),{ratio:1,shadows:false});
 assert.deepEqual(renderQuality('high',3),{ratio:2,shadows:true});
 assert.equal(renderQuality('balanced',1).ratio,1);
 for(const dpr of [NaN,Infinity,0,-1])assert.equal(renderQuality('unknown',dpr).ratio,1);
 assert.ok(renderQuality('balanced',2).ratio**2/2**2<.4,'High-DPI fragment allocation was not reduced');
});
test('paused rendering sleeps until resize, density, shadow change or resume',()=>{
 const gate=createRenderGate();
 assert.equal(gate('paused',390,844,1.25,false),true);
 for(let i=0;i<120;i++)assert.equal(gate('paused',390,844,1.25,false),false);
 for(const view of [[400,844,1.25,false],[400,900,1.25,false],[400,900,1,false],[400,900,1,true]]){
  assert.equal(gate('paused',...view),true);assert.equal(gate('paused',...view),false);
 }
 assert.equal(gate('running',400,900,1,true),true);assert.equal(gate('running',400,900,1,true),true);
 assert.equal(gate('paused',400,900,1,true),true);
});
