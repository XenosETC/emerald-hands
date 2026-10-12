const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function tab(saves, wallet) {
  const listeners=new Map();
  const window={
    addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},
    dispatchEvent(event){for(const fn of listeners.get(event.type)||[])fn(event);},
    EmeraldArcade:{petPurchaseLedger(){return wallet.ledger||{shoots:0,sticks:0,unlocked:[]};},purchasePetGrant(cost,grant){if(wallet.value<cost)return false;const ledger=wallet.ledger||{shoots:0,sticks:0,unlocked:[]};wallet.ledger={shoots:ledger.shoots+(grant.shoots||0),sticks:ledger.sticks+(grant.sticks||0),unlocked:[...new Set([...ledger.unlocked,...(grant.pet?[grant.pet]:[])])]};wallet.value-=cost;return true;},spendArcadeShards(cost){if(wallet.value<cost)return false;wallet.value-=cost;window.dispatchEvent({type:'emeraldarcade:wallet'});return true;}}
  };
  const context=vm.createContext({window,document:{readyState:'loading',addEventListener(){},querySelector(){return null;}},localStorage:{getItem:key=>saves.get(key)??null,setItem:(key,value)=>saves.set(key,value)},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},setTimeout(){},clearTimeout(){},setInterval(){},location:{pathname:'/etc-pets.html'}});
  const source=fs.readFileSync(require('node:path').join(__dirname,'../arcade-pet.js'),'utf8').replace(/\}\)\(\);\s*$/,'window.__testRead=expression=>eval(expression);})();');
  vm.runInContext(source,context);
  return {api:window.ArcadePet,window,read:expression=>vm.runInContext(`window.__testRead(${JSON.stringify(expression)})`,context)};
}

test('stale companion wandering cannot overwrite newer purchases or care in another tab',()=>{
  const saves=new Map(),wallet={value:60};
  const old=tab(saves,wallet),care=tab(saves,wallet);
  for(let i=0;i<3;i++)assert.equal(care.api.purchaseSupply('stick').ok,true);
  care.api.updatePet('feed');care.api.updatePet('play');care.api.updatePet('train');
  assert.equal(care.api.load().inventory.bambooSticks,3);
  const before=saves.get('emerald-arcade-pets-v1');
  old.read('companion={style:{setProperty(){}}};wander()');
  assert.equal(saves.get('emerald-arcade-pets-v1'),before,'wandering must be read-only for persisted pet state');
  assert.equal(care.api.load().inventory.bambooSticks,3);
  assert.equal(care.api.load().inventory.bambooShoots,1);
  assert.equal(wallet.value,6);
});

test('feed and play do not use sticks; training uses exactly one; failed buying preserves balance',()=>{
  const h=tab(new Map(),{value:18});
  assert.equal(h.api.purchaseSupply('stick').ok,true);
  h.api.updatePet('feed');h.api.updatePet('play');
  assert.equal(h.api.load().inventory.bambooSticks,2);
  assert.match(h.api.updatePet('train').message,/Used 1 training stick/);
  assert.equal(h.api.load().inventory.bambooSticks,1);
  assert.equal(h.api.purchaseSupply('stick').ok,false);
  assert.equal(h.api.load().inventory.bambooSticks,1);
});

test('selecting a pet reloads current inventory rather than saving a stale tab snapshot',()=>{
  const saves=new Map(),wallet={value:18};const old=tab(saves,wallet),shop=tab(saves,wallet);
  shop.api.purchaseSupply('stick');old.api.select('pepe');
  assert.equal(shop.api.load().inventory.bambooSticks,2);
});


test('persistently blocked pet storage stops purchases and unlocks before wallet spending',()=>{
  const saves=new Map(),wallet={value:100};const h=tab(saves,wallet);
  const before=saves.get('emerald-arcade-pets-v1');
  h.read('localStorage.setItem=()=>{throw new Error("blocked")};');
  assert.equal(h.api.purchaseSupply('stick').ok,false);
  assert.equal(h.api.unlock('wojak').ok,false);
  assert.equal(wallet.value,100);
  assert.equal(saves.get('emerald-arcade-pets-v1'),before);
});


test('pet training progress matches quadratic level thresholds and ten-XP sticks',()=>{
  const h=tab(new Map(),{value:0});
  assert.equal(h.api.trainingProgress(0).sticks,1);
  assert.equal(h.api.trainingProgress(10).remaining,30);
  assert.equal(h.api.trainingProgress(10).sticks,3);
  assert.equal(h.api.trainingProgress(30).sticks,1);
  assert.equal(h.api.trainingProgress(40).level,3);
  assert.equal(h.api.trainingProgress(5760).maxed,true);
});

test('maxed pet training keeps sticks instead of consuming them without a strength gain',()=>{
  const saves=new Map();const h=tab(saves,{value:0});
  const value=h.api.load();value.stats.pepe.strengthXp=5760;saves.set('emerald-arcade-pets-v1',JSON.stringify(value));
  assert.equal(h.api.updatePet('train').ok,false);
  assert.equal(h.api.load().inventory.bambooSticks,1);
});


test('pet unlocks charge once and selection keeps individual strength and shared supplies',()=>{
  const saves=new Map(),wallet={value:500};const h=tab(saves,wallet);
  h.api.updatePet('train');
  assert.equal(h.api.unlock('wojak').ok,true);
  assert.equal(wallet.value,410);
  assert.equal(h.api.unlock('wojak').ok,true);
  assert.equal(wallet.value,410);
  assert.equal(h.api.load().stats.wojak.strength,1);
  h.api.select('pepe');
  assert.equal(h.api.load().stats.pepe.strength,2);
  assert.equal(h.api.load().inventory.bambooSticks,0);
  h.api.purchaseSupply('stick');h.api.select('wojak');h.api.updatePet('train');
  assert.equal(h.api.load().stats.wojak.strength,2);
  assert.equal(h.api.load().stats.pepe.strength,2);
  assert.equal(h.api.load().inventory.bambooSticks,0);
  assert.equal(tab(saves,wallet).api.load().selected,'wojak');
});

test('unknown care actions and companions cannot add aura or charge shards',()=>{
  const saves=new Map(),wallet={value:500};const h=tab(saves,wallet);
  const before=saves.get('emerald-arcade-pets-v1');
  assert.equal(h.api.updatePet('other').ok,false);
  assert.equal(h.api.unlock('other').ok,false);
  assert.equal(wallet.value,500);
  assert.equal(saves.get('emerald-arcade-pets-v1'),before);
});


test('pet care restores existing assist strength without changing supplies or game caps',()=>{
  const saves=new Map(),h=tab(saves,{value:0});
  const value=h.api.load();value.stats.pepe.strengthXp=160;value.stats.pepe.hunger=10;value.stats.pepe.joy=10;
  saves.set('emerald-arcade-pets-v1',JSON.stringify(value));
  assert.equal(h.api.activeBonus('rush').magnetRadius,4);
  assert.equal(h.api.activeBonus('paradox').collectibleRadius,4);
  h.api.updatePet('feed');h.api.updatePet('play');
  assert.equal(h.api.activeBonus('rush').magnetRadius,8);
  assert.equal(h.api.activeBonus('rocketSimulator').salvageMultiplier,1.04);
  assert.equal(h.api.load().inventory.bambooSticks,1);
  const max=h.api.load();max.stats.pepe.strengthXp=5760;saves.set('emerald-arcade-pets-v1',JSON.stringify(max));
  assert.equal(h.api.activeBonus('rush').magnetRadius,24);
  assert.equal(h.api.activeBonus('rocketSimulator').salvageMultiplier,1.15);
});


test('failed care writes preserve supplies and stats and a retry applies exactly once',()=>{
  for(const action of ['feed','play','train']) {
    const saves=new Map();const h=tab(saves,{value:60});
    const before=saves.get('emerald-arcade-pets-v1');
    h.read('window.originalPetWrite=localStorage.setItem;localStorage.setItem=()=>{throw new Error("quota")};');
    const result=h.api.updatePet(action);
    assert.equal(result.ok,false);
    assert.match(result.message,/Care was not saved/);
    assert.equal(saves.get('emerald-arcade-pets-v1'),before);
    assert.equal(h.read('data.inventory.bambooSticks'),1);
    assert.equal(result.stats.strength,1);
    h.read('localStorage.setItem=window.originalPetWrite');
    assert.equal(h.api.updatePet(action).ok,true);
    const after=h.api.load();
    assert.equal(after.inventory.bambooSticks,action==='train'?0:1);
    assert.equal(after.inventory.bambooShoots,action==='feed'?1:2);
    assert.equal(after.stats.pepe.aura,action==='train'?8:4);
  }
});


test('charged supply and unlock grants recover after the pet write fails without redelivery',()=>{
  for(const kind of ['stick','wojak']) {
    const saves=new Map(),wallet={value:100};const h=tab(saves,wallet);
    h.read('window.originalPetWrite=localStorage.setItem;window.writeCount=0;localStorage.setItem=(key,value)=>{if(++window.writeCount>1)throw new Error("quota");window.originalPetWrite(key,value)}');
    assert.equal((kind==='stick'?h.api.purchaseSupply(kind):h.api.unlock(kind)).ok,true);
    assert.equal(wallet.value,kind==='stick'?82:10);
    const recovered=tab(saves,wallet);
    assert.equal(recovered.api.load().inventory.bambooSticks,kind==='stick'?2:1);
    assert.equal(recovered.api.load().unlocked.includes('wojak'),kind==='wojak');
    recovered.api.updatePet('play');
    const reopened=tab(saves,wallet);
    assert.equal(reopened.api.load().inventory.bambooSticks,kind==='stick'?2:1);
    assert.equal(wallet.value,kind==='stick'?82:10);
  }
});
