const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Execute the full shared runtime with DOM mounting deferred. The native frame
// queue is controlled so cancellation races and paused requeues are observable.
function clock() {
  let now = 0;
  let nativeId = 100;
  const pending = new Map();
  const deliveries = new Map();
  const cancelled = [];
  const window = {
    requestAnimationFrame(callback) {
      const id = ++nativeId;
      pending.set(id, callback);
      deliveries.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id) { pending.delete(id); cancelled.push(id); },
    dispatchEvent() {},
  };
  const document = {
    readyState: 'loading', addEventListener() {},
    body: { classList: { toggle() {} } },
    querySelector: () => null, querySelectorAll: () => [],
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'arcade.js'), 'utf8'), {
    window, document, location: { pathname: '/pepe-wars.html' },
    performance: { now: () => now }, localStorage: { getItem: () => null },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
  });
  return {
    window, cancelled,
    ids: () => [...pending.keys()],
    pause(value, timestamp) { now = timestamp; window.EmeraldArcade.setPaused(value); },
    frame(timestamp) {
      now = timestamp;
      for (const id of [...pending.keys()]) {
        const callback = pending.get(id);
        if (!callback) continue;
        pending.delete(id);
        callback(timestamp);
      }
    },
    stale(id, timestamp) { deliveries.get(id)(timestamp); },
  };
}

test('ordinary animation requests deliver once and completed handles cannot repeat', () => {
  const h = clock();
  const received = [];
  const id = h.window.requestAnimationFrame(time => received.push(time));
  const native = h.ids()[0];
  h.frame(16);
  h.frame(32);
  h.stale(native, 48);
  h.window.cancelAnimationFrame(id);
  assert.deepEqual(received, [16]);
  assert.deepEqual(h.ids(), []);
  assert.deepEqual(h.cancelled, []);
});

test('cancelling after paused requeues cancels the latest native frame and blocks stale delivery', () => {
  const h = clock();
  let calls = 0;
  const id = h.window.requestAnimationFrame(() => { calls += 1; });
  const original = h.ids()[0];
  h.pause(true, 0);
  h.frame(16);
  h.frame(32);
  const latest = h.ids()[0];
  assert.notEqual(original, latest);
  h.window.cancelAnimationFrame(id);
  assert.deepEqual(h.cancelled, [latest]);
  assert.deepEqual(h.ids(), []);
  h.pause(false, 40);
  h.stale(original, 48);
  h.stale(latest, 48);
  h.frame(48);
  assert.equal(calls, 0);
});

test('restarting a self-scheduling loop while paused resumes exactly one chain', () => {
  const h = clock();
  const received = [];
  let id;
  function loop(time) {
    received.push(time);
    id = h.window.requestAnimationFrame(loop);
  }
  id = h.window.requestAnimationFrame(loop);
  h.frame(16);
  h.pause(true, 20);
  h.frame(32);
  const abandoned = h.ids()[0];
  h.window.cancelAnimationFrame(id);
  id = h.window.requestAnimationFrame(loop);
  h.frame(48);
  assert.equal(h.ids().length, 1);
  h.pause(false, 100);
  h.stale(abandoned, 116);
  h.frame(116);
  assert.deepEqual(received, [16, 36]);
  assert.equal(h.ids().length, 1);
  h.frame(132);
  assert.deepEqual(received, [16, 36, 52]);
  h.window.cancelAnimationFrame(id);
  h.frame(148);
  assert.equal(received.length, 3);
  assert.deepEqual(h.ids(), []);
});

test('cancelled requests stay cancelled and unknown handles leave other requests alone', () => {
  const h = clock();
  const received = [];
  const cancelled = h.window.requestAnimationFrame(() => received.push('cancelled'));
  const stale = h.ids()[0];
  h.window.cancelAnimationFrame(cancelled);
  h.window.cancelAnimationFrame(cancelled);
  h.window.cancelAnimationFrame(-100);
  h.window.requestAnimationFrame(() => received.push('active'));
  h.stale(stale, 16);
  h.frame(16);
  assert.deepEqual(received, ['active']);
  assert.deepEqual(h.cancelled, [stale]);
});

test('delivered timestamps exclude all paused wall time across multiple pauses', () => {
  const h = clock();
  const received = [];
  const request = () => h.window.requestAnimationFrame(time => received.push(time));
  request();
  h.frame(10);
  h.pause(true, 20);
  request();
  h.frame(120);
  assert.deepEqual(received, [10]);
  h.pause(false, 220);
  h.frame(236);
  assert.deepEqual(received, [10, 36]);
  h.pause(true, 240);
  request();
  h.frame(280);
  h.pause(false, 340);
  h.frame(356);
  assert.deepEqual(received, [10, 36, 56]);
});
