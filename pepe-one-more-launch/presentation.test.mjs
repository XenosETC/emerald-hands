import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Director,climbPosition,rigPose,localToScreen,nozzles} from './presentation.mjs';

test('camera track has continuous joins, scales upward and follows descent',()=>{
  for(const a of [500,2000,5000])assert.ok(Math.abs(climbPosition(a-.0001)-climbPosition(a+.0001))<.000001);
  assert.equal(climbPosition(0),0);assert.equal(climbPosition(500),1);assert.equal(climbPosition(2000),2);assert.equal(climbPosition(5000),3);
  assert.ok(climbPosition(4900)<climbPosition(5100));assert.ok(climbPosition(100)<climbPosition(150));
});
test('flight director emits one boundary event and always completes recovery',()=>{
  for(const hz of [30,60,120]){
    const d=new Director();d.enter('countdown');let flightEvents=0;
    for(let i=0;i<hz*4;i++){d.advance(1/hz);flightEvents+=d.drain().filter(x=>x==='flight').length;}
    assert.equal(d.phase,'flight');assert.equal(flightEvents,1);d.enter('boom');const seen=[];
    for(let i=0;i<hz*10;i++){d.advance(1/hz);seen.push(...d.drain());}
    assert.equal(d.phase,'pad');assert.deepEqual(seen,['boom','return','rebuild','pad']);
  }
});
test('nozzle anchors inherit rig scale and banking',()=>{
  const pose={x:100,y:200,scale:2,tilt:Math.PI/2,squash:0};
  const p=localToScreen(pose,0,57);assert.ok(Math.abs(p.x+14)<.000001);assert.ok(Math.abs(p.y-200)<.000001);
  assert.deepEqual(nozzles(0),[0]);assert.deepEqual(nozzles(3),[-60,0,60]);
});
test('rig remains in the flight lane on narrow and wide screens',()=>{
  for(const [width,height] of [[375,700],[1280,800],[1920,1080]]){
    const p=rigPose({width,height,altitude:2500,phase:'flight',time:4,steer:1,boost:1});
    assert.ok(p.x>0&&p.x<width);assert.ok(p.y>height*.3&&p.y<height*.75);assert.ok(p.scale>0&&p.scale<=1.12);
  }
});
