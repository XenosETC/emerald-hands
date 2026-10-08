const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise the real game and its registered input handlers with a fixed clock
// and RNG. No production-only test hooks or alternate scoring implementation.
function game({ reducedMotion = false, mode = "classic", storageBlocked = false, savedData = [] } = {}) {
  const nodes = new Map();
  const rendered = [];
  const sessions = [];
  const rewards = [];
  let wallTime = 0;
  let today = '2026-10-07T12:00:00Z';
  const saves = new Map([['pepe-soul-world-save-v2', 'keep-soul'], ['emerald-arcade-v3', 'keep-arcade'], ...savedData]);
  function target() {
    const listeners = new Map();
    return {
      textContent: '', hidden: false, disabled: false, innerHTML: '',
      attributes: {},
      setAttribute(name, value) { this.attributes[name] = value; },
      classList: { add() {}, remove() {} },
      addEventListener(type, listener) {
        if (!listeners.has(type)) listeners.set(type, []);
        listeners.get(type).push(listener);
      },
      emit(type, properties = {}) {
        const event = { target: this, key: '', button: 0, pointerId: 1, clientX: 640, prevented: false,
          preventDefault() { this.prevented = true; }, ...properties };
        for (const listener of listeners.get(type) || []) listener(event);
        return event;
      },
      closest() { return null; },
      focus() { this.focused = true; },
      scrollIntoView() { this.scrolled = true; },
    };
  }
  const drawing = new Proxy({}, {
    get: (object, key) => object[key] || ((...args) => rendered.push({ method: key, args })),
    set: (object, key, value) => { object[key] = value; return true; },
  });
  const canvas = Object.assign(target(), {
    width: 1280, height: 720, captured: null,
    getContext: () => drawing,
    getBoundingClientRect: () => ({ left: 0, width: 1280 }),
    setPointerCapture(id) { this.captured = id; },
    hasPointerCapture(id) { return this.captured === id; },
    releasePointerCapture() { this.captured = null; },
  });
  nodes.set('#rushCanvas', canvas);
  const document = Object.assign(target(), {
    hidden: false,
    querySelector(selector) {
      if (!nodes.has(selector)) nodes.set(selector, target());
      return nodes.get(selector);
    },
  });
  const window = Object.assign(target(), {
    location: { search: mode === 'daily' ? '?mode=daily' : '' },
    localStorage: { getItem: key => saves.get(key) ?? null, setItem(key, value) { if (storageBlocked) throw Error('storage blocked'); saves.set(key, String(value)); } },
    matchMedia: () => ({ matches: reducedMotion }),
    EmeraldArcade: { beginSession: (...args) => sessions.push(args), recordAndNotify: (...args) => rewards.push(args) },
  });
  const context = vm.createContext({
    window, document, performance: { now: () => wallTime }, requestAnimationFrame() {},
    Math: Object.assign(Object.create(Math), { random: () => 0.5 }),
    URLSearchParams,
    Date: class extends Date { constructor(...args) { super(...(args.length ? args : [today])); } },
    Image: class { complete = false; naturalWidth = 0; addEventListener() {} },
  });
  const run = source => vm.runInContext(source, context);
  run(fs.readFileSync(path.join(__dirname, '..', 'shard-rush-challenges.js'), 'utf8'));
  run(fs.readFileSync(path.join(__dirname, '..', 'shard-rush-ghost.js'), 'utf8'));
  run(fs.readFileSync(path.join(__dirname, '..', 'shard-rush.js'), 'utf8'));
  return { run, window, document, canvas, nodes, rendered, sessions, rewards, saves, setDate: value => { today = value; }, setWallTime: value => { wallTime = value; } };
}

test('replaying after a pause starts a full sprint on the shared animation clock', () => {
  const g = game();
  g.run('startGame(); loop(1000); loop(1016)');
  g.window.emit('emeraldarcade:pause', { detail: { paused: true } });
  g.setWallTime(6016);
  g.window.emit('emeraldarcade:pause', { detail: { paused: false } });
  // The shared runtime removes the five paused seconds from RAF timestamps.
  g.run('loop(1032); endGame()');
  g.nodes.get('#overlayStartButton').emit('click');
  g.run('loop(1048)');
  assert.equal(g.run('state.timeLeft'), 60);
  assert.equal(g.run('state.elapsed'), 0);
  assert.equal(g.run('drops.length'), 1, 'the first drop must not wait out prior pause time');
  assert.equal(g.run('drops[0].y'), -70);
  g.run('loop(1064)');
  assert.equal(g.run('state.elapsed'), 0.016);
  assert.equal(g.run('state.timeLeft'), 59.984);
  const y = g.run('drops[0].y');
  g.run('loop(1060)');
  assert.equal(g.run('state.elapsed'), 0.016, 'an earlier timestamp cannot rewind a sprint');
  assert.equal(g.run('drops[0].y'), y);
});

test('keyboard takes over a drag without pointer pullback, and uppercase A/D work', () => {
  const g = game();
  g.nodes.get('#overlayStartButton').emit('click');
  g.canvas.emit('pointerdown', { clientX: 1100 });
  const key = g.window.emit('keydown', { key: 'A' });
  assert.equal(key.prevented, true);
  assert.equal(g.canvas.captured, null);
  g.run('update(0.1)');
  assert.equal(g.run('state.collectorX'), 564);
  g.window.emit('keyup', { key: 'a' });
  g.canvas.emit('pointermove', { clientX: 1200 });
  g.run('update(0.1)');
  assert.equal(g.run('state.collectorX'), 564, 'old drag must not pull back after key release');
  g.canvas.emit('pointerdown', { clientX: 900 });
  g.run('update(0.1)');
  assert.equal(g.run('state.collectorX'), 900, 'a new drag can retake control');
});

test('blur, pause, hidden page, pointer cancellation and capture loss clear active input', () => {
  for (const release of ['pointerup', 'pointercancel', 'lostpointercapture', 'blur', 'hidden', 'emeraldarcade:pause']) {
    const g = game();
    g.run('startGame()');
    g.canvas.emit('pointerdown', { clientX: 1100 });
    if (release === 'blur' || release === 'emeraldarcade:pause') g.window.emit(release);
    else if (release === 'hidden') { g.document.hidden = true; g.document.emit('visibilitychange'); }
    else g.canvas.emit(release);
    g.run('update(0.1)');
    assert.equal(g.run('state.collectorX'), 640, release);
    assert.equal(g.run('pointer.active'), false, release);
  }
  const g = game();
  g.run('startGame()');
  g.window.emit('keydown', { key: 'ArrowRight' });
  g.window.emit('blur');
  g.run('update(0.1)');
  assert.equal(g.run('state.collectorX'), 640);
});

test('secondary pointers do not hijack a drag or stop its owner', () => {
  const g = game();
  g.run('startGame()');
  g.canvas.emit('pointerdown', { clientX: 900 });
  g.canvas.emit('pointerdown', { clientX: 300, pointerId: 2, isPrimary: false });
  g.canvas.emit('pointermove', { clientX: 300, pointerId: 2 });
  g.canvas.emit('pointerup', { pointerId: 2 });
  g.run('update(0.1)');
  assert.equal(g.run('state.collectorX'), 900);
  assert.equal(g.run('pointer.active'), true);
});

test('Space respects focused controls and repeat, and a running sprint cannot reset', () => {
  const g = game();
  assert.equal(g.window.emit('keydown', { key: ' ', repeat: true }).prevented, false);
  g.window.emit('keydown', { key: ' ', target: { closest: () => ({}) } });
  assert.equal(g.run('state.running'), false);
  assert.equal(g.window.emit('keydown', { key: ' ' }).prevented, true);
  assert.equal(g.run('state.running'), true);
  assert.equal(g.canvas.focused, true);
  assert.equal(g.nodes.get('.rush-game').scrolled, true);
  g.run('state.score = 123; state.elapsed = 12; startGame()');
  assert.equal(g.run('state.score'), 123);
  assert.equal(g.run('state.elapsed'), 12);
  assert.equal(g.sessions.length, 1);
});

test('catch and hazard feedback preserves combo scoring, score floor and reward shape', () => {
  const g = game();
  g.run('startGame(); for (let i = 0; i < 6; i += 1) collect({ type: "shard", x: 640 })');
  assert.equal(g.run('state.score'), 720);
  assert.equal(g.run('state.combo'), 2);
  assert.equal(g.run('feedback.at(-1).detail'), 'COMBO x2');
  g.run('collect({ type: "candle", x: 640 })');
  assert.equal(g.run('state.score'), 1760);
  assert.equal(g.run('state.combo'), 3);
  assert.equal(g.run('feedback.at(-1).text'), '+1040');
  g.run('collect({ type: "bot", x: 640 })');
  assert.equal(g.run('state.score'), 860);
  assert.equal(g.run('state.combo'), 1);
  assert.equal(g.run('state.streak'), 0);
  assert.equal(g.run('feedback.at(-1).text'), 'BOT HIT −900');
  g.run('collect({ type: "bot", x: 640 })');
  assert.equal(g.run('state.score'), 0);
  assert.equal(g.run('feedback.at(-1).text'), 'BOT HIT −860');
  g.run('endGame(); endGame()');
  assert.equal(g.rewards.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(g.rewards[0])), ['rush', { score: 0, rank: 'Unranked', combo: 3, played: true }]);
  assert.equal(g.nodes.get('#overlayStartButton').textContent, 'Play again');
  assert.equal(g.nodes.get('#startButton').disabled, false);
  g.nodes.get('#overlayStartButton').emit('click');
  assert.equal(g.run('feedback.length'), 0);
  assert.equal(g.run('state.elapsed'), 0);
  assert.equal(g.sessions.length, 2);
});

test('missed catches reset combo with one bounded notice; missed hazards do not', () => {
  const g = game();
  g.run('startGame(); state.combo = 3; state.spawnTimer = 10; drops.push({ type: "fud", x: 50, y: 820, speed: 0, spin: 0 }); update(0.01)');
  assert.equal(g.run('state.combo'), 3);
  assert.equal(g.run('feedback.length'), 0);
  g.run('drops.push({ type: "shard", x: 50, y: 820, speed: 0, spin: 0 }); update(0.01)');
  assert.equal(g.run('state.combo'), 1);
  assert.equal(g.run('feedback.at(-1).text'), 'MISSED · COMBO RESET');
  g.run('for (let i = 0; i < 30; i += 1) collect({ type: "shard", x: 640 })');
  assert.equal(g.run('feedback.length'), 12);
  g.run('updateFeedback(1.2)');
  assert.equal(g.run('feedback.length'), 0);
});

test('reduced motion keeps feedback stationary and omits impact rings', () => {
  const g = game({ reducedMotion: true });
  g.run('startGame(); collect({ type: "shard", x: 640 }); drawFeedback(); updateFeedback(0.2); drawFeedback()');
  const labels = g.rendered.filter(call => call.method === 'fillText' && call.args[0] === '+120');
  assert.equal(labels.length, 2);
  assert.equal(labels[0].args[2], labels[1].args[2]);
  assert.equal(g.rendered.some(call => call.method === 'arc'), false);
});

test('rank target follows catches, hazards and top-rank thresholds without changing rewards', () => {
  const g = game();
  assert.equal(g.nodes.get('#rankTarget').textContent, '3,000 to Retail Sprinter');
  g.run('startGame(); state.score = 2950; collect({ type: "shard", x: 640 }); updateHud()');
  assert.equal(g.nodes.get('#rankLabel').textContent, 'Retail Sprinter');
  assert.equal(g.nodes.get('#rankTarget').textContent, '5,930 to Shard Stacker');
  assert.equal(g.nodes.get('#rankProgress').value, 3070);
  assert.equal(g.nodes.get('#rankProgress').max, 9000);
  g.run('collect({ type: "bot", x: 640 }); updateHud()');
  assert.equal(g.nodes.get('#rankLabel').textContent, 'Unranked');
  assert.equal(g.nodes.get('#rankTarget').textContent, '830 to Retail Sprinter');
  g.run('state.score = 45000; updateHud()');
  assert.equal(g.nodes.get('#rankLabel').textContent, 'Emerald Storm');
  assert.equal(g.nodes.get('#rankProgress').value, 45000);
  assert.equal(g.nodes.get('#rankTarget').textContent, 'Top rank reached · Emerald Storm');
  assert.equal(g.rewards.length, 0, 'the progress meter must not award anything');
  g.run('endGame(); startGame()');
  assert.equal(g.nodes.get('#rankProgress').value, 0);
  assert.equal(g.nodes.get('#rankProgress').max, 3000);
});

test('daily run uses fixed course and collector without touching classic sessions or rewards', () => {
  const g = game({ mode: 'daily' });
  let petCalls = 0;
  g.window.ArcadePet = { activeBonus() { petCalls++; return {magnetRadius: 200}; }, showAssist() { petCalls++; } };
  assert.equal(g.nodes.get('#dailyMode').attributes['aria-pressed'], 'true');
  g.nodes.get('#overlayStartButton').emit('click');
  assert.equal(g.run('state.petMagnet'), 0);
  assert.equal(petCalls, 0);
  assert.equal(g.run('drops[0].tick'), 0);
  g.run('selectMode("classic"); endGame()');
  assert.equal(g.run('state.mode'), 'daily');
  assert.equal(g.run('state.running'), true, 'an early end cannot submit a daily result');
  assert.equal(g.saves.has('shard-rush-daily-v1'), false);
  g.run('update(60); endGame()');
  assert.equal(g.run('state.running'), false);
  assert.equal(g.run('state.dailyTick'), 7200);
  assert.equal(g.sessions.length, 0);
  assert.equal(g.rewards.length, 0);
  assert.equal(JSON.parse(g.saves.get('shard-rush-daily-v1')).records[0].attempts, 1);
  assert.equal(g.saves.get('pepe-soul-world-save-v2'), 'keep-soul');
  assert.equal(g.saves.get('emerald-arcade-v3'), 'keep-arcade');
  assert.match(g.nodes.get('#dailyResult').textContent, /Saved on this device/);
});

test('daily simulation is identical at 30, 60 and 144 FPS and same-day retries reset the route', () => {
  const results = [];
  for (const fps of [30, 60, 144]) {
    const g = game({mode: 'daily'});
    g.run(`startGame(); loop(0); for(let i=1;i<=${fps * 12};i++) loop(i*1000/${fps})`);
    results.push(g.run('JSON.stringify({score:state.score,combo:state.combo,catches:state.cleanCatches,hazards:state.hazardsHit,tick:state.dailyTick,drops})'));
    g.run('update(48); startGame()');
    assert.equal(g.run('state.timeLeft'), 60);
    assert.equal(g.run('state.score'), 0);
    assert.equal(g.run('state.dailyTick'), 0);
    assert.equal(g.run('state.nextDrop'), 1);
  }
  assert.equal(results[0], results[1]);
  assert.equal(results[1], results[2]);
});

test('midnight preserves an in-progress course date and starts the next course on retry', () => {
  const g = game({mode: 'daily'});
  g.run('startGame(); update(30)');
  const course = g.run('JSON.stringify(state.course)');
  g.setDate('2026-10-08T00:01:00Z');
  g.run('update(30)');
  assert.equal(JSON.parse(g.saves.get('shard-rush-daily-v1')).records[0].day, '2026-10-07');
  assert.match(g.nodes.get('#dailyResult').textContent, /2026-10-07/);
  g.run('startGame()');
  assert.equal(g.run('state.course.day'), '2026-10-08');
  assert.notEqual(g.run('JSON.stringify(state.course)'), course);
  assert.match(g.nodes.get('#dailyRecord').textContent, /No completed runs/);
});

test('daily storage failure is visible and changing back to classic restores the usual rewards', () => {
  const g = game({mode: 'daily', storageBlocked: true});
  g.run('startGame(); update(60)');
  assert.match(g.nodes.get('#dailyResult').textContent, /Not saved/);
  g.nodes.get('#classicMode').emit('click');
  assert.equal(g.nodes.get('#dailyRecord').hidden, true);
  assert.equal(g.nodes.get('#dailyResult').hidden, true);
  assert.equal(g.nodes.get('#rankKind').textContent, 'rank');
  g.run('startGame(); endGame()');
  assert.equal(g.sessions.length, 1);
  assert.equal(g.rewards.length, 1);
});

test('only a completed daily run creates a full ghost that survives reload and resets on retry', () => {
  const g = game({mode: 'daily'});
  g.run('startGame(); update(20); endGame()');
  assert.equal(g.saves.has('shard-rush-ghost-v1'), false);
  g.run('update(40)');
  const replay = JSON.parse(g.saves.get('shard-rush-ghost-v1'));
  assert.equal(replay.samples.length, 1201);
  assert.equal(replay.score, g.run('state.score'));
  assert.equal(replay.samples.at(-1)[1], replay.score);
  const reloaded = game({mode: 'daily', savedData: [...g.saves]});
  assert.match(reloaded.nodes.get('#ghostPace').textContent, /Best ghost ready/);
  reloaded.run('startGame()');
  assert.equal(reloaded.run('state.dailyTick'), 0);
  assert.equal(reloaded.run('state.recording.length'), 1);
  assert.equal(reloaded.run('ghosts.at(state.ghost, state.dailyTick).score'), 0);
  reloaded.run('update(60)');
  assert.equal(reloaded.saves.get('shard-rush-ghost-v1'), g.saves.get('shard-rush-ghost-v1'), 'a tied run preserves the first matching ghost');
});

test('weaker runs keep the best ghost and a new best replaces it', () => {
  const g = game({mode: 'daily'});
  // The route finishes dropping before the last second. Set final scores here
  // to exercise replacement decisions independently of route balance.
  const finish = score => g.run(`startGame(); update(59); state.score=${score}; update(1)`);
  finish(9000);
  const first = g.saves.get('shard-rush-ghost-v1');
  finish(3000);
  assert.equal(g.saves.get('shard-rush-ghost-v1'), first);
  finish(12000);
  assert.equal(JSON.parse(g.saves.get('shard-rush-ghost-v1')).score, 12000);
  assert.match(g.nodes.get('#dailyResult').textContent, /New daily best/);
});

test('legacy records and a newer best from another tab never show an unrelated replay', () => {
  const g = game({mode: 'daily'});
  g.run('startGame(); update(60)');
  const old = g.saves.get('shard-rush-ghost-v1');
  const book = {version: 1, records: [{day: '2026-10-07', score: 18000, attempts: 2}]};
  g.saves.set('shard-rush-daily-v1', JSON.stringify(book));
  g.run('startGame()');
  assert.equal(g.run('state.ghost'), null);
  assert.match(g.nodes.get('#ghostPace').textContent, /Match or beat 18,000/);
  g.run('update(59); state.score=18000; update(1)');
  assert.notEqual(g.saves.get('shard-rush-ghost-v1'), old, 'matching an older best can fill in its missing replay');
  g.run('startGame()');
  assert.equal(g.run('state.ghost.score'), 18000);
  book.records[0].score = 20000;
  g.saves.set('shard-rush-daily-v1', JSON.stringify(book));
  g.run('update(59); state.score=19000; update(1)');
  assert.equal(JSON.parse(g.saves.get('shard-rush-ghost-v1')).score, 18000, 'a lower finish cannot overwrite the newer daily best');
  assert.equal(g.run('state.ghost'), null);
});

test('ghost toggles and playback never alter collector movement, collisions, score, rewards or other saves', () => {
  const seed = game({mode: 'daily'});
  seed.run('startGame(); update(60)');
  const results = [];
  for (const hidden of [false, true]) {
    const g = game({mode: 'daily', savedData: [...seed.saves]});
    g.run('startGame()');
    if (hidden) g.nodes.get('#ghostToggle').emit('click');
    g.window.emit('keydown', {key: 'ArrowRight'});
    g.run('update(0.5); draw()');
    g.window.emit('keyup', {key: 'ArrowRight'});
    g.run('update(20)');
    results.push(g.run('JSON.stringify({x:state.collectorX,score:state.score,catches:state.cleanCatches,hits:state.hazardsHit,tick:state.dailyTick,drops})'));
    assert.equal(g.rendered.some(call => call.method === 'fillText' && call.args[0] === 'BEST'), !hidden);
    assert.equal(g.rewards.length, 0);
    assert.equal(g.saves.get('pepe-soul-world-save-v2'), 'keep-soul');
    assert.equal(g.saves.get('emerald-arcade-v3'), 'keep-arcade');
  }
  assert.equal(results[0], results[1]);
});

test('reduced motion defaults the optional ghost off and classic hides its controls', () => {
  const seed = game({mode: 'daily'});
  seed.run('startGame(); update(60)');
  const g = game({mode: 'daily', reducedMotion: true, savedData: [...seed.saves]});
  assert.equal(g.nodes.get('#ghostToggle').attributes['aria-pressed'], 'false');
  assert.equal(g.nodes.get('#ghostToggle').textContent, 'Ghost off');
  g.nodes.get('#ghostToggle').emit('click');
  assert.equal(g.nodes.get('#ghostToggle').attributes['aria-pressed'], 'true');
  g.run('selectMode("classic")');
  assert.equal(g.nodes.get('#ghostToggle').hidden, true);
  assert.equal(g.nodes.get('#ghostPace').hidden, true);
  assert.equal(g.run('state.ghost'), null);
});

test('ghost uses the paused simulation clock, remains pinned during the run, and expires on the next UTC date', () => {
  const g = game({mode: 'daily'});
  g.run('startGame(); update(60); startGame(); loop(0); loop(100)');
  const tick = g.run('state.dailyTick');
  const sample = g.run('JSON.stringify(ghosts.at(state.ghost,state.dailyTick))');
  g.window.emit('emeraldarcade:pause', {detail: {paused: true}});
  g.setWallTime(10000);
  g.window.emit('emeraldarcade:pause', {detail: {paused: false}});
  // The shared runtime supplies an unchanged RAF clock across the pause.
  g.run('loop(100)');
  assert.equal(g.run('state.dailyTick'), tick);
  assert.equal(g.run('JSON.stringify(ghosts.at(state.ghost,state.dailyTick))'), sample);
  g.saves.delete('shard-rush-ghost-v1');
  g.setDate('2026-10-08T00:01:00Z');
  g.run('update(1)');
  assert.equal(g.run('state.ghost.day'), '2026-10-07');
  g.run('update(60); startGame()');
  assert.equal(g.run('state.ghost'), null);
  assert.equal(g.run('state.recording.length'), 1);
});

test('blocked storage retains a playable ghost in this tab and reports its unsaved status', () => {
  const g = game({mode: 'daily', storageBlocked: true});
  g.run('startGame(); update(60)');
  assert.match(g.nodes.get('#dailyResult').textContent, /ghost kept in this tab only/);
  assert.equal(g.saves.has('shard-rush-ghost-v1'), false);
  g.run('startGame()');
  assert.ok(g.run('state.ghost'));
  assert.equal(g.nodes.get('#ghostToggle').disabled, false);
});

test('live pace shows ahead, behind and level at the current ghost tick', () => {
  const g = game({mode: 'daily'});
  g.run('startGame(); update(59); state.score=9000; update(1); startGame(); update(59.5); state.score=10000; updateHud()');
  assert.equal(g.nodes.get('#ghostPace').textContent, '1,000 ahead of best ghost');
  g.run('state.score=8000; updateHud()');
  assert.equal(g.nodes.get('#ghostPace').textContent, '1,000 behind best ghost');
  g.run('state.score=9000; updateHud()');
  assert.equal(g.nodes.get('#ghostPace').textContent, 'Level with best ghost');
});

test('replay-only storage failure keeps the score saved and retries persistence on a tied finish', () => {
  const g = game({mode: 'daily'});
  const setItem = g.window.localStorage.setItem;
  g.window.localStorage.setItem = (key, value) => {
    if (key === 'shard-rush-ghost-v1') throw Error('replay quota');
    setItem(key, value);
  };
  g.run('startGame(); update(60)');
  assert.ok(g.saves.has('shard-rush-daily-v1'));
  assert.match(g.nodes.get('#dailyResult').textContent, /Saved on this device.*ghost kept in this tab only/);
  const original = g.run('JSON.stringify(memoryGhost)');
  g.window.localStorage.setItem = setItem;
  g.run('startGame(); update(60)');
  assert.equal(g.saves.get('shard-rush-ghost-v1'), original);
  assert.match(g.nodes.get('#dailyResult').textContent, /ghost is ready/);
});
