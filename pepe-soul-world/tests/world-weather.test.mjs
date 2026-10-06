import test from 'node:test';import assert from 'node:assert/strict';import {WorldWeather,snowFlake} from '../world-weather.js';import {createState} from '../core.js';
import {WEATHER,realmParticle} from '../world-weather.js';
test('Void wisps stay above the surface and Crimson ash falls against rising embers',()=>{
 for(let i=0;i<60;i++)for(const time of [0,10,1000]){const p=realmParticle('void',i,time,960,450,0,true);assert.ok(p.y<=432&&p.y>322);}
 const ashA=realmParticle('crimson',0,1,960,450,0),ashB=realmParticle('crimson',0,2,960,450,0);
 const emberA=realmParticle('crimson',1,1,960,450,0),emberB=realmParticle('crimson',1,2,960,450,0);
 assert.ok(ashB.y>ashA.y);assert.ok(emberB.y<emberA.y);
});
test('all realms render both weather layers and clear old reactions immediately on crossing',()=>{
 const ctx=new Proxy({}, {get:()=>()=>{}}),s=createState(),w=new WorldWeather();
 for(const world of Object.keys(WEATHER)){
 s.world=world;w.react({type:'world'},s);assert.equal(w.puffs.length,0);
 w.react({type:'warp',from:300,y:590},s);assert.equal(w.puffs.length,18);
 for(const reduced of [false,true])for(const front of [false,true]){w.draw(ctx,s,100,450,960,front,reduced);for(let i=0;i<95;i++){const p=realmParticle(world,i,5000,960,450,100,front);assert.ok(Object.values(p).every(Number.isFinite));}}
 s.player.domain={elapsed:1};w.draw(ctx,s,100,450,960,true,false);s.player.domain.elapsed=1.5;w.draw(ctx,s,100,450,960,true,false);s.player.domain=null;
 }
});
test('layered snow is reproducible and finite across camera sizes and long sessions',()=>{for(const width of [640,1280])for(const time of [0,20,10000])for(let i=0;i<95;i++){const f=snowFlake(i,time,width,540,1800,i%2===0);assert.deepEqual(f,snowFlake(i,time,width,540,1800,i%2===0));assert.ok(f.x>=-40&&f.x<width+40);assert.ok(f.y>=-20&&f.y<550);assert.ok(Number.isFinite(f.radius));}});
test('snow reactions are bounded, expire, respect reduced effects and clear on world changes',()=>{const w=new WorldWeather(),s=createState();s.world='frozen';w.update(0,s,false);w.react({type:'domainPulse',x:500},s);assert.equal(w.puffs.length,40);for(let i=0;i<10;i++)w.react({type:'domainPulse',x:500},s);assert.equal(w.puffs.length,100);w.update(1,s,false);assert.equal(w.puffs.length,0);w.react({type:'domainPulse',x:500},s,true);assert.equal(w.puffs.length,8);s.world='academy';w.update(0,s,false);assert.equal(w.puffs.length,0);});
test('foot snow requires grounded running and does not change gameplay state',()=>{const w=new WorldWeather(),s=createState();s.world='frozen';s.player.mode='run';const before=structuredClone(s);w.update(.016,s,false);assert.equal(w.puffs.length,7);assert.deepEqual(s,before);s.player.y=500;w.update(.016,s,false);assert.equal(w.puffs.length,7);});
