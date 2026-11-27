const {test}=require('node:test');const assert=require('node:assert/strict');
require('./paradox-campaign.js');const api=globalThis.ParadoxCampaign;
test('campaign has eight authored trails, two bases, and ten honest planned nodes',()=>{
  assert.equal(api.stages.filter(s=>!s.planned&&!s.base).length,8);assert.equal(api.stages.filter(s=>!s.planned&&s.base).length,2);assert.equal(api.stages.filter(s=>s.planned).length,10);
  for(const stage of api.stages.filter(s=>!s.planned&&s.index>0&&!s.base)){const world=api.layout(stage,{}),ground=world.platforms.filter(p=>!p.moving);assert.equal(ground.length,6);assert.equal(world.shards.length,12);for(let i=1;i<ground.length;i++)assert.ok(ground[i].x-ground[i-1].x-ground[i-1].w<=140);assert.ok(ground.at(-1).x+ground.at(-1).w>=5400);}
});
test('replaying a stage awards only improvement and camp gear never overspends',()=>{
  let state=api.complete(api.fresh(),api.stages[0],8).state;assert.equal(state.shards,8);state=api.complete(state,api.stages[0],8).state;assert.equal(state.shards,8);state=api.complete(state,api.stages[0],10).state;assert.equal(state.shards,10);
  state=api.purchase(state,'dash',1);assert.equal(state.shards,2);assert.deepEqual(state.owned,['dash']);assert.equal(api.purchase(state,'dash',1),null);assert.equal(api.purchase(state,'ward',1),null);assert.equal(api.purchase({...state,shards:100},'leap',1),null);
});
test('legacy completion migrates without minting journey money and broken saves recover',()=>{
  const storage={getItem:()=>null};const state=api.load(storage,{best:{paradox:{stage:2}}});assert.equal(state.current,'1-2');assert.equal(state.shards,0);assert.ok(state.legacyImported);
  assert.equal(api.load({getItem:()=>'{bad'}).current,'1-1');assert.equal(api.save({setItem(){throw Error('full');}},state),false);
  assert.equal(api.normalize({version:1,current:'3-1',owned:['bad'],shards:-1}).current,'1-1');
});
