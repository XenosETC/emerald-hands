const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const codec = require('../emerald-hands-save.js');
const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
function game({save = null, blocked = false} = {}) {
  const nodes = new Map();
  const saves = new Map([['pepe-soul-world-v1', 'other-world'], ['emerald-arcade-v1', 'other-progress']]);
  if (save !== null) saves.set(codec.key, typeof save === 'string' ? save : JSON.stringify(save));
  let document;
  function node() {
    const listeners = {};
    return {textContent:'', value:'', hidden:false, open:false, disabled:false, style:{}, dataset:{}, children:[],
      classList:{add(){},remove(){},toggle(){}}, setAttribute(){},
      addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
      emit(type, event = {}) { for (const fn of listeners[type] || []) fn({target:this, detail:1, ...event}); },
      append(child) { this.children.push(child); }, replaceChildren() { this.children = []; },
      getBoundingClientRect() { return {left:0, top:0, width:100, height:100}; },
      showModal() { this.returnFocus = document.activeElement; this.open = true; document.activeElement = this; },
      close() { this.open = false; document.activeElement = this.returnFocus; this.emit('close'); },
      focus(){document.activeElement = this;}, select(){}, scrollIntoView(){}, remove(){},
    };
  }
  const find = selector => { if (!nodes.has(selector)) nodes.set(selector, node()); return nodes.get(selector); };
  const buttons = codec.upgradeIds.map(type => Object.assign(node(), {dataset:{buy:type}}));
  document = Object.assign(node(), {
    body:node(), activeElement:null,
    querySelector:selector => selector === 'dialog[open]' ? [...nodes.values()].find(item => item.open) || null : find(selector),
    querySelectorAll:selector => selector === '[data-buy]' ? buttons : [],
    getElementById:id => find(`#${id}`), createElement:node,
  });
  find('#buyAmount').value = '1';
  const window = Object.assign(node(), {EmeraldHandsSave:codec, EmeraldArcade:{isPaused:() => paused, record(){},recordAndNotify(){},toast(){},beginSession(){}}});
  let paused = false;
  const storage = {getItem:key => {if(blocked) throw Error('blocked'); return saves.get(key) ?? null;}, setItem(key,value){if(blocked) throw Error('blocked'); saves.set(key, value);}};
  const context = vm.createContext({window,document, localStorage:storage, performance:{now:()=>0}, requestAnimationFrame(){}, setInterval(){},setTimeout(){}, Date, navigator:{}, AudioContext:class{constructor(){throw Error('no audio')}}});
  const run = code => vm.runInContext(code, context);
  run(source);
  return {nodes,buttons,saves,run,window, click:id => find(id).emit('click'), snapshot:() => JSON.parse(run('JSON.stringify(state)')), pause:value => {paused=value;}, failStorage:value => {blocked=value;}};
}
const saved = overrides => ({...codec.fresh(1), ...overrides});

test('legacy saves migrate without losing OG progress or inventing cycle history', () => {
  const result = codec.decode(JSON.stringify({shards:15,totalEarned:1000,levels:{click:2,infra:1},ogPoints:7,lifetimePrestiges:4}));
  assert.equal(result.status,'saved');
  assert.equal(result.state.ogPoints,7);
  assert.equal(result.state.levels.market,0);
  assert.deepEqual(result.state.history,[]);
  assert.equal(codec.decode(JSON.stringify(result.state)).status,'saved');
});
test('unsupported and malformed saves are rejected, not coerced into playable balances', () => {
  for(const value of ['oops','null','[]',JSON.stringify(saved({version:99})), JSON.stringify(saved({shards:2,totalEarned:1})), JSON.stringify(saved({ogPoints:-1})), JSON.stringify(saved({levels:{click:'4'}})), '{"shards":1e999,"totalEarned":1e999,"levels":{}}', ' '.repeat(100001)]) {
    assert.equal(codec.decode(value).status,'unavailable');
  }
  assert.equal(codec.decode(null).status,'new');
});
test('new player can earn, buy the first upgrade, save, and reload the actual game', () => {
  const h = game();
  for(let i=0;i<15;i++) h.click('#shardButton');
  h.run('buy("click")');
  assert.equal(h.snapshot().levels.click,1);
  assert.equal(h.snapshot().shards,0);
  assert.equal(h.run('perClick()'),2);
  const reloaded = game({save:h.saves.get(codec.key)});
  assert.equal(reloaded.snapshot().levels.click,1);
  assert.match(reloaded.nodes.get('#journeyTitle').textContent,/passive/);
});
test('bulk ten costs exactly ten individual upgrades and max stops before overspending', () => {
  const bulk = game({save:saved({shards:100000,totalEarned:100000})});
  const singles = game({save:saved({shards:100000,totalEarned:100000})});
  bulk.nodes.get('#buyAmount').value='10'; bulk.run('buy("click")');
  for(let i=0;i<10;i++) singles.run('buy("click")');
  assert.deepEqual(bulk.snapshot().levels,singles.snapshot().levels);
  assert.equal(bulk.snapshot().shards,singles.snapshot().shards);
  bulk.nodes.get('#buyAmount').value='max'; bulk.run('buy("infra")');
  assert.ok(bulk.snapshot().shards >= 0);
  assert.ok(bulk.snapshot().shards < bulk.run('costFor("infra")'));
});
test('corrupt original data is preserved through autosave and restart is unavailable', () => {
  const h=game({save:'unreadable-original'});
  h.run('earn(50); saveState()'); h.click('#resetButton');
  assert.equal(h.saves.get(codec.key),'unreadable-original');
  assert.equal(h.nodes.get('#confirmModal').open,false);
  h.click('#saveVaultButton');
  assert.equal(h.nodes.get('#saveCode').value,'unreadable-original');
});
test('storage failure and unavailable audio do not break collecting or purchasing', () => {
  const h=game({blocked:true});
  h.run('earn(100); buy("infra")');
  assert.equal(h.snapshot().levels.infra,1);
  assert.match(h.nodes.get('#saveStatus').textContent,/Could not save/);
  h.click('#saveVaultButton');
  assert.equal(codec.decode(h.nodes.get('#saveCode').value).state.levels.infra,1);
});
test('paused games and open dialogs freeze production and block gameplay input', () => {
  const h=game({save:saved({shards:100,totalEarned:100,levels:{infra:1}})});
  h.pause(true); h.run('loop(1000)'); h.click('#shardButton'); h.run('buy("click")');
  assert.equal(h.snapshot().shards,100);
  h.pause(false); h.click('#saveVaultButton'); h.run('loop(2000)'); h.click('#shardButton');
  assert.equal(h.snapshot().shards,100);
  h.click('#closeSave'); h.run('loop(3000)');
  assert.ok(h.snapshot().shards>100);
});
test('a frame timestamp before initialization cannot activate events or subtract shards', () => {
  const h=game({save:saved({shards:100,totalEarned:100,levels:{infra:1}})});
  h.run('lastTick=100; eventCooldown=10; loop(90)');
  assert.equal(h.snapshot().shards,100);
  assert.equal(h.run('rageTimer+flushTimer+choiceTimer+corruptionTimer'),0);
});
test('restart review can be canceled and accepted restart keeps permanent progression', () => {
  const h=game({save:saved({shards:500,totalEarned:900,ogPoints:7,lifetimePrestiges:5,levels:{infra:3}})});
  h.click('#resetButton'); h.click('#cancelAction');
  assert.equal(h.snapshot().shards,500);
  h.run('rageTimer=20; flushTimer=20; choiceTimer=20; corruptionTimer=20');
  h.click('#resetButton'); h.click('#confirmAction');
  assert.equal(h.snapshot().shards,0);
  assert.equal(h.snapshot().ogPoints,7);
  assert.equal(h.snapshot().lifetimePrestiges,5);
  assert.equal(h.run('rageTimer+flushTimer+choiceTimer+corruptionTimer'),0);
  assert.equal(h.saves.get('pepe-soul-world-v1'),'other-world');
  assert.equal(h.saves.get('emerald-arcade-v1'),'other-progress');
});
test('first prestige review gives one OG, archives the run, and cannot double reward', () => {
  const h=game({save:saved({shards:8000,totalEarned:400000,levels:{vault:6}})});
  h.click('#prestigeButton');
  assert.equal(h.snapshot().ogPoints,0);
  assert.match(h.nodes.get('#confirmBody').textContent,/\+12%/);
  h.click('#confirmAction'); h.click('#confirmAction');
  assert.equal(h.snapshot().ogPoints,1);
  assert.equal(h.snapshot().history.length,1);
  assert.equal(h.snapshot().history[0].totalEarned,400000);
  assert.equal(h.snapshot().shards,0);
  assert.equal(h.run('perClick()'),1.12);
  assert.equal(h.nodes.get('#perClick').textContent,'1.12');
});
test('later prestige keeps the established vault bonus and top rank unlocks endless play', () => {
  const h=game({save:saved({shards:100,totalEarned:1600000,ogPoints:56,lifetimePrestiges:20,levels:{vault:6}})});
  assert.equal(h.run('prestigeReward()'),4);
  h.click('#prestigeButton'); h.click('#confirmAction');
  assert.equal(h.snapshot().ogPoints,60);
  assert.match(h.nodes.get('#prestigeModalTitle').textContent,/Journey Complete/);
  assert.match(h.nodes.get('#journeyLabel').textContent,/Endless/);
  assert.equal(game({save:h.saves.get(codec.key)}).snapshot().ogPoints,60);
});
test('backup review, edit invalidation, restore, and recovery preserve only this game', () => {
  const h=game({save:saved({shards:100,totalEarned:200,ogPoints:2})});
  h.click('#saveVaultButton'); h.nodes.get('#saveCode').value=JSON.stringify(saved({shards:400,totalEarned:500,ogPoints:8}));
  h.click('#previewSave'); h.nodes.get('#saveCode').emit('input'); h.click('#restoreSave');
  assert.equal(h.snapshot().ogPoints,2);
  h.click('#previewSave'); h.click('#restoreSave');
  assert.equal(h.snapshot().ogPoints,8);
  h.click('#saveVaultButton'); h.click('#previousSave'); h.click('#restoreSave');
  assert.equal(h.snapshot().ogPoints,2);
  assert.equal(h.saves.get('pepe-soul-world-v1'),'other-world');
  assert.equal(h.saves.get('emerald-arcade-v1'),'other-progress');
});
test('failed restore leaves the current run and save intact', () => {
  const h=game({save:saved({shards:50,totalEarned:50})});
  const old=h.saves.get(codec.key);
  h.click('#saveVaultButton'); h.nodes.get('#saveCode').value=JSON.stringify(saved({shards:600,totalEarned:600})); h.click('#previewSave'); h.failStorage(true); h.click('#restoreSave');
  assert.equal(h.snapshot().shards,50);
  assert.equal(h.saves.get(codec.key),old);
  assert.match(h.nodes.get('#savePreview').textContent,/unchanged/);
});
test('confirmed arcade erase cannot be undone by Hands exit autosave', () => {
  const h=game({save:saved({shards:100,totalEarned:100})});
  h.window.emit('emeraldarcade:reset'); h.saves.delete(codec.key);
  h.window.emit('pagehide'); h.window.emit('beforeunload');
  assert.equal(h.saves.has(codec.key),false);
});
test('scroll offers pay at most once and can be skipped', () => {
  const h=game({save:saved({shards:3000,totalEarned:3000})});
  h.run('openScrollChoice(); chooseScroll("safe")');
  const total=h.snapshot().shards;
  h.run('chooseScroll("safe")');
  assert.equal(h.snapshot().shards,total);
  h.run('openScrollChoice()'); h.click('#skipScroll');
  assert.equal(h.run('scrollChoiceOpen'),false);
  assert.equal(h.snapshot().shards,total);
});
test('Rage art owns the scene while active, pauses, then restores the latest purchased business', () => {
  const h=game({save:saved({shards:100000,totalEarned:100000,featuredUpgrade:'research',levels:{research:1}})});
  h.run('triggerSageOfRage(); render()');
  assert.match(h.nodes.get('#empireArt').style.backgroundImage,/sage-of-rage\.png/);
  assert.match(h.nodes.get('#eventArtLabel').textContent,/30s/);
  h.run('buy("business")');
  assert.equal(h.snapshot().featuredUpgrade,'business');
  assert.match(h.nodes.get('#empireArt').style.backgroundImage,/sage-of-rage\.png/);
  h.pause(true); h.run('loop(10000)');
  assert.equal(h.run('rageTimer'),30);
  h.pause(false); h.run('eventCooldown=999; for(let i=1;i<=30;i++) loop(10000+i*1000)');
  assert.equal(h.nodes.get('#empireArt').style.backgroundImage,'url("assets/business-district.png")');
  assert.equal(h.nodes.get('#eventArtLabel').hidden,true);
});
test('Corruption and Flush use their own art for exactly their existing event timers', () => {
  for(const [trigger,file,seconds] of [['triggerCorruptedShards','corrupted-shards',30],['triggerEmeraldFlush','emerald-flush',45]]) {
    const h=game({save:saved({shards:10000,totalEarned:10000,featuredUpgrade:'vault',levels:{vault:1}})});
    h.run(`${trigger}(); render(); eventCooldown=999`);
    assert.match(h.nodes.get('#empireArt').style.backgroundImage,new RegExp(file+'\\.png'));
    h.run(`for(let i=1;i<${seconds};i++) loop(i*1000)`);
    assert.match(h.nodes.get('#empireArt').style.backgroundImage,new RegExp(file+'\\.png'));
    h.run(`loop(${seconds}*1000)`);
    assert.equal(h.nodes.get('#empireArt').style.backgroundImage,'url("assets/og-vault.png")');
    assert.equal(h.snapshot().featuredUpgrade,'vault');
  }
});
test('scroll modal artwork continues in the scene for the chosen boost and resets with the cycle', () => {
  for(const choice of ['risk','safe']) {
    const h=game({save:saved({shards:10000,totalEarned:10000})});
    h.run(`openScrollChoice(); chooseScroll('${choice}'); render()`);
    assert.equal(h.nodes.get('#scrollModal').open,false);
    assert.match(h.nodes.get('#empireArt').style.backgroundImage,/scroll-choice-sage\.png/);
    assert.ok(h.run('choiceTimer')>0);
    h.click('#resetButton'); h.click('#confirmAction');
    assert.equal(h.nodes.get('#eventArtLabel').hidden,true);
    assert.equal(h.nodes.get('#empireArt').style.backgroundImage,'url("assets/infra-core.png")');
  }
});
test('instant event art lasts six active seconds without changing the featured business', () => {
  const h=game({save:saved({shards:500,totalEarned:500,featuredUpgrade:'business',levels:{business:1}})});
  h.run('maybeEvent(0); render(); eventCooldown=999');
  assert.equal(h.run('signalTimer'),6);
  assert.equal(h.nodes.get('#eventArtLabel').hidden,false);
  h.run('for(let i=1;i<=6;i++) loop(i*1000)');
  assert.equal(h.nodes.get('#eventArtLabel').hidden,true);
  assert.equal(h.nodes.get('#empireArt').style.backgroundImage,'url("assets/business-district.png")');
  const paths=h.run('[...Object.values(eventArt).map(x=>x.src),...events.map(x=>x.art)]');
  for(const imagePath of paths) assert.ok(fs.existsSync(path.join(__dirname,'..',imagePath)),imagePath);
});
test('event scheduler draws only from currently owned businesses for every ownership combination', () => {
  const prerequisites = {panic:'vault',infra:'infra',business:'business',relic:'vault',ip:'media',deal:'acquisition'};
  const kinds = [...new Set(Object.values(prerequisites))];
  for (let mask=0; mask<2**kinds.length; mask++) {
    const levels=Object.fromEntries(kinds.map((kind,i)=>[kind,(mask>>i)&1]));
    // High rank and permanent OG must not stand in for owning a business.
    const h=game({save:saved({shards:500000,totalEarned:500000,ogPoints:100,levels})});
    const expected=['candle',...Object.entries(prerequisites).filter(([,kind])=>levels[kind]).map(([id])=>id)].sort();
    const actual=h.run(`(() => {
      const seen=new Set();
      for(let step=0;step<100;step++) {
        resetEvents(); rageCooldown=corruptionCooldown=flushCooldown=choiceCooldown=999;
        Math.random=()=>step/100; maybeEvent(0);
        seen.add(events.find(event=>event.label===signalArt.label).id);
      }
      return [...seen].sort();
    })()`);
    assert.deepEqual(Array.from(actual),expected,JSON.stringify(levels));
  }
});

test('IP Run-Up cannot pay before buying Media Studio and unlocks on the actual purchase', () => {
  const h=game({save:saved({shards:20000,totalEarned:20000})});
  assert.equal(h.run('triggerStandardEvent(events.find(event=>event.id==="ip"))'),false);
  assert.equal(h.snapshot().shards,20000);
  assert.equal(h.run('signalTimer'),0);
  h.buttons.find(button=>button.dataset.buy==='media').emit('click');
  assert.equal(h.snapshot().levels.media,1);
  const balance=h.snapshot().shards;
  assert.equal(h.run('triggerStandardEvent(events.find(event=>event.id==="ip")); render(); signalArt.label'),'IP Run-Up');
  assert.ok(h.snapshot().shards>balance);
  assert.match(h.nodes.get('#empireArt').style.backgroundImage,/media-studio\.png/);
  const reloaded=game({save:h.saves.get(codec.key)});
  assert.equal(reloaded.run('eligibleStandardEvents().some(event=>event.id==="ip")'),true);
});

test('restart, prestige and restoring a no-business save relock business events', () => {
  for(const action of ['restart','prestige','restore']) {
    const h=game({save:saved({shards:400000,totalEarned:400000,ogPoints:10,levels:{vault:1,infra:1,business:1,media:1,acquisition:1}})});
    assert.equal(h.run('eligibleStandardEvents().length'),7);
    if(action==='restart') { h.click('#resetButton'); h.click('#confirmAction'); }
    if(action==='prestige') { h.click('#prestigeButton'); h.click('#confirmAction'); }
    if(action==='restore') {
      h.click('#saveVaultButton'); h.nodes.get('#saveCode').value=JSON.stringify(saved({shards:500000,totalEarned:500000,ogPoints:10}));
      h.click('#previewSave'); h.click('#restoreSave');
    }
    assert.deepEqual(Array.from(h.run('eligibleStandardEvents().map(event=>event.id)')),['candle'],action);
  }
});

test('every ordinary event pairs its reward, label and reviewed subject artwork', () => {
  const expected={
    candle:'assets/emerald-hands-events/green-candle.png', panic:'assets/og-vault.png',
    infra:'assets/infra-core.png', business:'assets/business-district.png',
    relic:'assets/emerald-hands-events/ancient-relic.png', ip:'assets/media-studio.png', deal:'assets/acquisition-desk.png',
  };
  const h=game({save:saved({shards:100000,totalEarned:100000,levels:{vault:1,infra:1,business:1,media:1,acquisition:1}})});
  for(const [id,art] of Object.entries(expected)) {
    const before=h.snapshot();
    h.run(`resetEvents(); triggerStandardEvent(events.find(event=>event.id==='${id}')); render()`);
    const label=h.run('signalArt.label');
    assert.equal(h.nodes.get('#empireArt').style.backgroundImage.split(', ')[0],`url("${art}")`,id);
    assert.equal(h.nodes.get('#eventArtLabel').textContent,`${label} · 6s`);
    assert.ok(h.nodes.get('#eventCard').innerHTML.startsWith(`<span>${label}</span>`));
    assert.ok(h.snapshot().shards>before.shards);
    assert.deepEqual(h.snapshot().levels,before.levels,'a narrative bonus does not grant a business level');
    assert.ok(fs.existsSync(path.join(__dirname,'..',art)),art);
  }
});

test('active special events prevent hidden ordinary payouts or mismatched event scenes', () => {
  for(const trigger of ['triggerSageOfRage()','triggerCorruptedShards()','triggerEmeraldFlush()','openScrollChoice(); chooseScroll("safe")']) {
    const h=game({save:saved({shards:10000,totalEarned:10000})});
    h.run(`${trigger}; render()`);
    const balance=h.snapshot().shards;
    const art=h.nodes.get('#empireArt').style.backgroundImage;
    h.run('eventCooldown=0; Math.random=()=>0; maybeEvent(0); render()');
    assert.equal(h.snapshot().shards,balance,trigger);
    assert.equal(h.run('signalTimer'),0);
    assert.equal(h.nodes.get('#empireArt').style.backgroundImage,art);
  }
});

test('instant event message matches its artwork across a rank up and clears on expiry', () => {
  const h=game({save:saved({shards:118,totalEarned:118})});
  h.run('triggerStandardEvent(events.find(event=>event.id==="candle")); render(); eventCooldown=999');
  assert.equal(h.run('currentRank().name'),'Bag Holder');
  assert.match(h.nodes.get('#eventCard').innerHTML,/Green Candle Blessing/);
  assert.match(h.nodes.get('#empireArt').style.backgroundImage,/green-candle\.png/);
  h.run('for(let i=1;i<=6;i++) loop(i*1000)');
  assert.match(h.nodes.get('#eventCard').innerHTML,/Steady production/);
  assert.equal(h.nodes.get('#eventArtLabel').hidden,true);
});

test('the unchanged economy can reach Sovereign through purchases and repeated cycles', t => {
  const h=game();
  // A deterministic play policy: four taps per active second, buy the best
  // affordable production increase per shard, seal as soon as eligible.
  const result=h.run(`(() => {
    let seconds=0, firstCycle=0;
    while(state.ogPoints < 60 && seconds < 100000) {
      earn(perClick()*4 + perSecond()); seconds++;
      let best=null, ratio=0;
      for(const type of Object.keys(upgrades)) {
        const cost=costFor(type); if(cost>state.shards) continue;
        const before=perClick()*4+perSecond(); state.levels[type]++;
        const gain=perClick()*4+perSecond()-before; state.levels[type]--;
        if(gain/cost>ratio) {best=type;ratio=gain/cost;}
      }
      if(best) buy(best);
      if(prestigeReward()>0) { if(!firstCycle) firstCycle=seconds; sealCycle(); closePrestigeModal(); }
    }
    return {seconds,firstCycle,points:state.ogPoints,cycles:state.lifetimePrestiges,history:state.history.length};
  })()`);
  assert.ok(result.points>=60,JSON.stringify(result));
  assert.equal(result.history,10);
  assert.ok(result.cycles>1);
  t.diagnostic(`Automated policy only: first cycle ${result.firstCycle}s; Sovereign ${result.seconds}s; ${result.cycles} cycles. Human balance is a separate check.`);
});
