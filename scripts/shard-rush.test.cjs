const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise the real game and its registered input handlers with a fixed clock
// and RNG. No production-only test hooks or alternate scoring implementation.
function game({ reducedMotion = false } = {}) {
  const nodes = new Map();
  const rendered = [];
  const sessions = [];
  const rewards = [];
  let wallTime = 0;
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
    matchMedia: () => ({ matches: reducedMotion }),
    EmeraldArcade: { beginSession: (...args) => sessions.push(args), recordAndNotify: (...args) => rewards.push(args) },
  });
  const context = vm.createContext({
    window, document, performance: { now: () => wallTime }, requestAnimationFrame() {},
    Math: Object.assign(Object.create(Math), { random: () => 0.5 }),
    Image: class { complete = false; naturalWidth = 0; addEventListener() {} },
  });
  const run = source => vm.runInContext(source, context);
  run(fs.readFileSync(path.join(__dirname, '..', 'shard-rush.js'), 'utf8'));
  return { run, window, document, canvas, nodes, rendered, sessions, rewards, setWallTime: value => { wallTime = value; } };
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
