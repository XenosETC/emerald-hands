const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'arcade.js'), 'utf8');

// A small event/DOM fixture executes the shipped runtime, including capture and
// bubbling. Actual keyboard activation and pointer hit testing also need browser QA.
function harness(page = 'shard-rush.html') {
  let document;
  class Event {
    constructor(type, options = {}) {
      Object.assign(this, { type, key: '', code: '', bubbles: false, defaultPrevented: false }, options);
    }
    preventDefault() { this.defaultPrevented = true; }
    stopImmediatePropagation() { this.stopped = true; }
  }
  class Node {
    constructor(tagName = '') {
      this.tagName = tagName.toUpperCase();
      this.children = [];
      this.attributes = {};
      this.dataset = {};
      this.style = {};
      this.listeners = {};
      this.hidden = false;
      this.className = '';
      this.classList = {
        toggle: (name, force) => {
          const classes = new Set(this.className.split(/\s+/).filter(Boolean));
          const add = force ?? !classes.has(name);
          if (add) classes.add(name); else classes.delete(name);
          this.className = [...classes].join(' ');
        },
        add: name => this.classList.toggle(name, true),
        remove: name => this.classList.toggle(name, false),
      };
    }
    get isConnected() { return this === window || Boolean(this.parent?.isConnected); }
    addEventListener(type, callback, capture = false) {
      (this.listeners[type] ||= []).push({ callback, capture: capture === true || capture.capture === true });
    }
    removeEventListener(type, callback) {
      this.listeners[type] = (this.listeners[type] || []).filter(entry => entry.callback !== callback);
    }
    dispatchEvent(event) {
      event.target = this;
      const route = [];
      for (let node = this; node; node = node.parent) route.push(node);
      const invoke = (node, capture) => {
        for (const listener of node.listeners[event.type] || []) {
          if (listener.capture === capture && !event.stopped) listener.callback(event);
        }
      };
      [...route].reverse().forEach(node => invoke(node, true));
      (event.bubbles ? route : [this]).forEach(node => invoke(node, false));
      return !event.defaultPrevented;
    }
    append(...nodes) { nodes.forEach(node => { node.parent = this; this.children.push(node); }); }
    setAttribute(name, value) {
      this.attributes[name] = String(value);
      if (name === 'class') this.className = value;
      if (name === 'hidden') this.hidden = true;
      if (name.startsWith('data-')) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
    }
    getAttribute(name) { return this.attributes[name] ?? null; }
    matches(selector) {
      return selector.split(',').some(part => {
        const token = part.trim();
        if (token === 'dialog[open]') return this.tagName === 'DIALOG' && 'open' in this.attributes;
        if (token === '[hidden]') return this.hidden;
        if (token.startsWith('.')) return this.className.split(/\s+/).includes(token.slice(1));
        if (token.startsWith('#')) return this.id === token.slice(1);
        const attribute = token.match(/^\[([^=\]]+)(?:=['"]?([^'"\]]+)['"]?)?\]$/);
        if (attribute) return attribute[2] === undefined ? attribute[1] in this.attributes : this.attributes[attribute[1]] === attribute[2];
        return this.tagName === token.toUpperCase();
      });
    }
    closest(selector) {
      for (let node = this; node; node = node.parent) if (node.matches(selector)) return node;
      return null;
    }
    contains(node) { return node === this || this.children.some(child => child.contains(node)); }
    querySelectorAll(selector) {
      return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]);
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    focus() { document.activeElement = this; }
    getBoundingClientRect() { return { left: 0, top: 0, width: 400, height: 60 }; }
    set innerHTML(html) {
      this.children = [];
      const stack = [this];
      for (const match of html.matchAll(/<\/?([\w-]+)([^>]*)>/g)) {
        if (match[0].startsWith('</')) { stack.pop(); continue; }
        const node = new Node(match[1]);
        for (const attr of match[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g)) node.setAttribute(attr[1], attr[2] ?? '');
        stack.at(-1).append(node);
        if (!['INPUT', 'IMG', 'BR', 'HR'].includes(node.tagName)) stack.push(node);
      }
    }
  }
  const window = new Node();
  Object.assign(window, { innerWidth: 1280, innerHeight: 800, requestAnimationFrame: () => 1, setTimeout() {}, setInterval() {} });
  document = new Node();
  Object.assign(document, { readyState: 'complete', hidden: false, createElement: tag => new Node(tag) });
  window.append(document);
  document.head = new Node('head');
  document.body = new Node('body');
  document.append(document.head, document.body);
  document.activeElement = document.body;
  const saves = new Map([['emerald-arcade-v1', '{"xp":4321,"wallet":{"arcadeShards":876}}'], ['satoshi-system-save-v1', '{"ticks":99}']]);
  const storage = values => ({ getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem:key => values.delete(key), key:index => [...values.keys()][index] ?? null, get length(){return values.size;} });
  const location = { pathname: `/${page}`, search: '', reloads: 0, reload() { this.reloads += 1; } };
  vm.runInNewContext(source, {
    window, document, location, CustomEvent: Event, KeyboardEvent: Event, PointerEvent: Event, URLSearchParams,
    localStorage: storage(saves), sessionStorage: storage(new Map()), performance: { now: () => 100 },
    requestAnimationFrame: window.requestAnimationFrame,
  });
  const key = (value, options = {}, target = document.activeElement) => {
    const event = new Event('keydown', { key: value, code: value.length === 1 ? `Key${value.toUpperCase()}` : value, bubbles: true, ...options });
    target.dispatchEvent(event);
    return event;
  };
  const click = selector => {
    const node = document.querySelector(selector);
    assert.ok(node, selector);
    node.focus();
    node.dispatchEvent(new Event('click', { bubbles: true }));
    return node;
  };
  return { window, document, Event, key, click, location, saves, arcade: window.EmeraldArcade };
}

test('holding shared shortcuts performs one action per physical press', () => {
  const h = harness();
  h.key('p');
  assert.equal(h.arcade.isPaused(), true);
  h.key('p', { repeat: true });
  assert.equal(h.arcade.isPaused(), true);
  h.key('p');
  assert.equal(h.arcade.isPaused(), false);
  h.key('m');
  h.key('m', { repeat: true });
  assert.equal(h.arcade.isMuted(), true);
  h.key('r', { repeat: true });
  assert.equal(h.location.reloads, 0);
  h.key('r');
  assert.equal(h.location.reloads, 1);
});

test('browser shortcuts, composing text, inputs and editable text keep their defaults', () => {
  const h = harness();
  for (const options of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { isComposing: true }]) {
    for (const key of ['p', 'm', 'r']) assert.equal(h.key(key, options).defaultPrevented, false);
  }
  for (const tag of ['input', 'textarea', 'select', 'div']) {
    const node = h.document.createElement(tag);
    if (tag === 'div') node.isContentEditable = true;
    h.document.body.append(node);
    for (const key of ['p', 'm', 'r']) assert.equal(h.key(key, {}, node).defaultPrevented, false);
  }
  assert.equal(h.arcade.isPaused(), false);
  assert.equal(h.arcade.isMuted(), false);
  assert.equal(h.location.reloads, 0);
});

test('pause releases held movement and stops new gameplay input until resumed', () => {
  const h = harness();
  const held = new Set();
  h.window.addEventListener('keydown', event => held.add(event.code));
  h.window.addEventListener('keyup', event => held.delete(event.code));
  h.key('ArrowRight');
  assert.deepEqual([...held], ['ArrowRight']);
  h.key('p');
  assert.equal(held.size, 0);
  h.key('ArrowLeft');
  assert.equal(held.size, 0);
  h.click('.arcade-runtime-resume');
  assert.equal(h.arcade.isPaused(), false);
  h.key('ArrowLeft', {}, h.document.body);
  assert.deepEqual([...held], ['ArrowLeft']);
});

test('keyboard activation of a shared menu button does not trigger game actions', () => {
  const h = harness();
  const received = [];
  h.window.addEventListener('keydown', event => received.push(event.key));
  const controls = h.document.querySelector('[data-arcade-command="controls"]');
  assert.equal(h.key(' ', {}, controls).defaultPrevented, false);
  assert.equal(h.key('Enter', {}, controls).defaultPrevented, false);
  assert.deepEqual(received, []);
  h.key('p');
  assert.equal(h.key('p', { ctrlKey: true }).defaultPrevented, false);
  assert.deepEqual(received, []);
});

test('resuming from the dock or Controls returns keyboard focus to the playfield', () => {
  const h = harness();
  const canvas = h.document.createElement('canvas');
  h.document.body.append(canvas);
  const received = [];
  h.window.addEventListener('keydown', event => received.push(event.key));
  h.click('[data-arcade-command="pause"]');
  h.key('p');
  assert.equal(h.document.activeElement, canvas);
  h.key('ArrowRight');
  assert.deepEqual(received, ['ArrowRight']);
  h.click('[data-arcade-command="controls"]');
  h.key('Escape');
  assert.equal(h.document.activeElement, canvas);
  h.key('ArrowLeft');
  assert.deepEqual(received, ['ArrowRight', 'ArrowLeft']);
});

test('pause ends a captured gameplay drag so the overlay can receive the pointer', () => {
  const h = harness('emerald-galactic-heroes.html');
  const canvas = h.document.createElement('canvas');
  h.document.body.append(canvas);
  let captured = false;
  let dragging = false;
  canvas.hasPointerCapture = () => captured;
  canvas.releasePointerCapture = id => { assert.equal(id, 7); captured = false; };
  canvas.addEventListener('pointerdown', () => { captured = true; dragging = true; });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  canvas.dispatchEvent(new h.Event('pointerdown', { pointerId: 7, pointerType: 'touch', bubbles: true }));
  assert.equal(dragging, true);
  h.key('p');
  assert.equal(dragging, false);
  assert.equal(captured, false);
});

test('lost focus and hidden tabs pause with released movement and explicit resume', () => {
  const h = harness();
  const releases = [];
  h.window.addEventListener('keyup', event => releases.push(event.code));
  h.key('w');
  h.window.dispatchEvent(new h.Event('blur'));
  assert.equal(h.arcade.isPaused(), true);
  assert.deepEqual(releases, ['KeyW']);
  h.window.dispatchEvent(new h.Event('focus'));
  assert.equal(h.arcade.isPaused(), true);
  h.key('p');
  h.document.hidden = true;
  h.document.dispatchEvent(new h.Event('visibilitychange'));
  assert.equal(h.arcade.isPaused(), true);
  h.document.hidden = false;
  h.document.dispatchEvent(new h.Event('visibilitychange'));
  assert.equal(h.arcade.isPaused(), true);
});

test('Controls supports Tab, Shift+Tab, native button activation and Escape focus return', () => {
  const h = harness();
  const opener = h.click('[data-arcade-command="controls"]');
  assert.equal(h.arcade.isPaused(), true);
  const close = h.document.querySelector('.arcade-runtime-close');
  const sound = h.document.querySelector('[data-arcade-setting="sound"]');
  const reset = h.document.querySelector('[data-arcade-setting="reset"]');
  assert.equal(h.document.activeElement, close);
  h.key('Tab');
  assert.equal(h.document.activeElement, sound);
  assert.equal(h.key('Enter').defaultPrevented, false);
  assert.equal(h.key(' ').defaultPrevented, false);
  h.key('Tab');
  assert.equal(h.document.activeElement, reset);
  h.key('Tab');
  assert.equal(h.document.activeElement, close);
  h.key('Tab', { shiftKey: true });
  assert.equal(h.document.activeElement, reset);
  h.key('Escape');
  assert.equal(h.arcade.isPaused(), false);
  assert.equal(h.document.activeElement, opener);
  assert.equal(h.document.querySelector('.arcade-runtime-modal').hidden, true);
});

test('closing Controls preserves an existing pause or a pause caused by focus loss', () => {
  for (const blurDuringModal of [false, true]) {
    const h = harness();
    if (!blurDuringModal) h.key('p');
    h.click('[data-arcade-command="controls"]');
    if (blurDuringModal) h.window.dispatchEvent(new h.Event('blur'));
    h.key('Escape');
    assert.equal(h.arcade.isPaused(), true);
  }
});

test('shared controls preserve game records and independent saves', () => {
  const h = harness();
  const before = new Map(h.saves);
  h.key('p');
  h.key('m');
  h.click('[data-arcade-command="controls"]');
  h.key('Escape');
  for (const [key, value] of before) assert.equal(h.saves.get(key), value);
});

test('hub never pauses and leaves P and R to the page', () => {
  const h = harness('index.html');
  assert.equal(h.key('p').defaultPrevented, false);
  assert.equal(h.key('r').defaultPrevented, false);
  h.window.dispatchEvent(new h.Event('blur'));
  h.document.hidden = true;
  h.document.dispatchEvent(new h.Event('visibilitychange'));
  h.click('[data-arcade-command="controls"]');
  h.key('Escape');
  assert.equal(h.arcade.isPaused(), false);
  assert.equal(h.location.reloads, 0);
});

test('native game dialogs keep keyboard ownership even after the game loses focus', () => {
  const h = harness('emerald-hands.html');
  const dialog = h.document.createElement('dialog');
  dialog.setAttribute('open', '');
  const button = h.document.createElement('button');
  dialog.append(button); h.document.body.append(dialog); button.focus();
  assert.equal(h.key('r').defaultPrevented, false);
  assert.equal(h.location.reloads, 0);
  assert.equal(h.key('p').defaultPrevented, false);
  assert.equal(h.arcade.isPaused(), false);
  h.window.dispatchEvent(new h.Event('blur'));
  assert.equal(h.arcade.isPaused(), true);
  assert.equal(h.key('Enter').defaultPrevented, false);
  assert.equal(h.key('Escape').defaultPrevented, false);
});

test('confirmed arcade reset announces the erase and removes Hands recovery while preserving independent saves', () => {
  const h = harness('emerald-hands.html');
  h.saves.set('emerald-hands-v1', 'current-hands');
  h.saves.set('emerald-hands-v1-previous', 'previous-hands');
  h.saves.set('pepe-soul-world-v1', 'independent-soul');
  let announced=false;
  h.window.addEventListener('emeraldarcade:reset', () => { announced = h.saves.has('emerald-hands-v1'); });
  h.click('[data-arcade-command="controls"]');
  h.click('[data-arcade-setting="reset"]');
  h.click('[data-arcade-setting="confirm-reset"]');
  assert.equal(announced,true);
  assert.equal(h.saves.has('emerald-hands-v1'),false);
  assert.equal(h.saves.has('emerald-hands-v1-previous'),false);
  assert.equal(h.saves.get('pepe-soul-world-v1'),'independent-soul');
  assert.equal(h.saves.get('satoshi-system-save-v1'),'{"ticks":99}');
});
