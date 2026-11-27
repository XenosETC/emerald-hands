(function (root) {
  "use strict";
  function attach(container, { canUse, press, release }) {
    const held = new Map();
    let suppressClickUntil = 0;
    const buttons = [...container.querySelectorAll('[data-rumble-key]')];
    function up(id) {
      const item = held.get(id);
      if (!item) return;
      held.delete(id);
      if (![...held.values()].some(other => other.code === item.code)) {
        release(item.code); item.button.classList.remove('is-held');
        item.button.setAttribute('aria-pressed', 'false');
      }
      if (typeof id === 'number') {
        try { if (item.button.hasPointerCapture?.(id)) item.button.releasePointerCapture(id); } catch {}
      }
    }
    function down(id, button) {
      if (!canUse() || held.has(id)) return;
      const code = button.dataset.rumbleKey;
      if (![...held.values()].some(item => item.code === code)) press(code);
      held.set(id, { code, button });
      button.classList.add('is-held'); button.setAttribute('aria-pressed', 'true');
    }
    function releaseAll() { for (const id of [...held.keys()]) up(id); }
    for (const button of buttons) {
      button.addEventListener('pointerdown', event => {
        if (event.button !== 0 || !canUse()) return;
        event.preventDefault(); suppressClickUntil = performance.now() + 500;
        down(event.pointerId, button);
        try { button.setPointerCapture?.(event.pointerId); } catch {}
      });
      for (const name of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(name, event => {
        suppressClickUntil = performance.now() + 500; up(event.pointerId);
      });
      button.addEventListener('keydown', event => {
        if (!['Enter',' '].includes(event.key)) return;
        event.preventDefault(); suppressClickUntil = performance.now() + 500;
        down('key:' + button.dataset.rumbleKey, button);
      });
      button.addEventListener('keyup', event => {
        if (!['Enter',' '].includes(event.key)) return;
        event.preventDefault(); suppressClickUntil = performance.now() + 500;
        up('key:' + button.dataset.rumbleKey);
      });
      button.addEventListener('blur', () => up('key:' + button.dataset.rumbleKey));
      button.addEventListener('click', () => {
        if (performance.now() < suppressClickUntil || !canUse()) return;
        const id = 'click:' + button.dataset.rumbleKey;
        down(id, button); up(id);
      });
    }
    return { releaseAll, sync(visible, enabled, charged = false, inRange = false) {
      if (!visible || !enabled) releaseAll();
      container.hidden = !visible;
      for (const button of buttons) button.disabled = !enabled;
      const burst = buttons.find(button => button.dataset.rumbleKey === 'KeyH');
      if (burst) {
        burst.textContent = charged ? inRange ? 'Relic Burst!' : 'Shield · close for Burst' : 'Shield / Special';
        burst.classList.toggle('is-ready', charged && inRange);
      }
    } };
  }
  root.RelicRumbleTouch = Object.freeze({ attach });
})(typeof window === 'undefined' ? globalThis : window);
