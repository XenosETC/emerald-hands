const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function tab(saves, wallet) {
  const listeners=new Map();
  const window={
    addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},
    dispatchEvent(event){for(const fn of listeners.get(event.type)||[])fn(event);},
    EmeraldArcade:{spendArcadeShards(cost){if(wallet.value<cost)return false;wallet.value-=cost;window.dispatchEvent({type:'emeraldarcade:wallet'});return true;}}
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
