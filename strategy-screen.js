(function () {
  'use strict';
  const page = location.pathname.split('/').pop();
  const kind = ({'emerald-hands.html':'hands','satoshi-system.html':'satoshi','pepe-tower-defense.html':'tower','pepe-wars.html':'wars','etc-rocket-simulator.html':'rocket'})[page];
  if (!kind) return;
  document.body.dataset.strategyScreen = kind;
  document.body.dataset.noArcadePet = 'true';
  document.querySelectorAll('a[href="index.html"]').forEach(link => { link.textContent = 'Hub'; link.setAttribute('aria-label','Arcade Hub'); });
  const header = document.querySelector(kind === 'hands' ? '.topbar' : kind === 'satoshi' ? '.system-header' : kind === 'rocket' ? '.sim-topbar' : '.topbar');
  if (!header.querySelector('[data-arcade-inline-menu]')) {
    const menu = document.createElement('span'); menu.dataset.arcadeInlineMenu = ''; header.append(menu);
  }
  const tools = document.createElement('nav'); tools.className = 'strategy-screen-tools'; tools.setAttribute('aria-label','Game panels');
  header.after(tools);
  const compact = matchMedia('(max-height:480px) and (min-width:601px)');
  const placeTools = () => { if (compact.matches) header.append(tools); else header.after(tools); };
  compact.addEventListener('change',placeTools); placeTools();
  const dialog = document.createElement('dialog'); dialog.className = 'strategy-details'; dialog.setAttribute('aria-labelledby','strategyPanelTitle');
  dialog.innerHTML = '<header><h2 id="strategyPanelTitle">Game details</h2><button type="button" data-strategy-close>Done</button></header><nav class="strategy-panel-tabs" aria-label="Game details"></nav><div class="strategy-panel-content"></div>';
  document.body.append(dialog);
  let origin, wasPaused;
  const pauseSimulation = !['hands','satoshi'].includes(kind);
  const content = dialog.querySelector('.strategy-panel-content');
  const tabs = dialog.querySelector('.strategy-panel-tabs');
  function open(name) {
    content.querySelectorAll('[data-strategy-view]').forEach(node => { node.hidden = node.dataset.strategyView !== name; });
    tabs.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.strategyOpen === name)));
    dialog.querySelector('h2').textContent = name;
    content.scrollTop = 0;
    if (!dialog.open) {
      origin = document.activeElement; wasPaused = Boolean(window.EmeraldArcade?.isPaused?.());
      if (pauseSimulation) window.EmeraldArcade?.setPaused?.(true); dialog.showModal();
    }
  }
  function panel(name, selectors) {
    const section = document.createElement('section'); section.dataset.strategyView = name; section.hidden = true;
    for (const selector of selectors) document.querySelectorAll(selector).forEach(node => section.append(node));
    content.append(section);
    for (const parent of [tools,tabs]) {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.strategyOpen = name; button.textContent = name;
      button.addEventListener('click',() => open(name)); parent.append(button);
    }
    return section;
  }
  dialog.querySelector('[data-strategy-close]').addEventListener('click',() => dialog.close());
  dialog.addEventListener('close',() => { if (pauseSimulation && !wasPaused) window.EmeraldArcade?.setPaused?.(false); origin?.focus({preventScroll:true}); });
  if (kind === 'hands') {
    panel('Upgrades',['.hands-shop-heading','.shop']);
    const progress = panel('Progress',['.hands-journey','.hands-journal']);
    const management = document.createElement('div'); management.className = 'strategy-management-actions';
    management.append(document.querySelector('#saveVaultButton'),document.querySelector('#resetButton')); progress.prepend(management);
    panel('How to play',['.game-guide']);
  }
  if (kind === 'satoshi') {
    panel('Build',['.build-panel']);
    panel('System',['#resetButton','.epoch-progress','.market-oracle','.goal-row','.system-notebook','.save-recovery']);
    panel('How to play',['.boundary-notice','.flight-guide','.system-footer']);
    dialog.querySelectorAll('a[href="#build-title"],a[href="#cosmos-title"]').forEach(link => link.addEventListener('click',event => {
      event.preventDefault(); if (link.hash === '#build-title') open('Build'); else dialog.close();
    }));
  }
  if (kind === 'rocket') {
    panel('Hangar',['.upgrade-list','.sector-journal','.rocket-recovery','.forgiving-note']);
    panel('Flight info',['.mission-card','.sector-goal','.game-guide']);
    const summary = document.createElement('p'); summary.className = 'strategy-mission-summary'; summary.setAttribute('role','status');
    document.querySelector('.flight-stage').append(summary);
    const summarize = () => {
      const reward = document.querySelector('#missionReward');
      summary.textContent = document.querySelector('#missionTitle').textContent + (reward.hidden ? '' : ' · '+reward.textContent.trim().replace(/\s+/g,' '));
    };
    new MutationObserver(summarize).observe(document.querySelector('.mission-card'),{subtree:true,childList:true,characterData:true,attributes:true}); summarize();
  }
  if (kind === 'wars') {
    panel('Battle info',['#threatReport','#miningReport','.status-pill','.game-guide']);
    const units = document.createElement('div'); units.className = 'strategy-units';
    const command = document.querySelector('.command-panel');
    command.querySelector('.unit-card').before(units); command.querySelectorAll('.unit-card').forEach(button => units.append(button));
  }
  if (kind === 'tower') {
    panel('How to play',['.in-game-manual']);
    const footer = document.querySelector('.command-footer');
    const action = document.createElement('div'); action.className = 'strategy-wave-action';
    action.append(document.querySelector('#nextWaveHint'),document.querySelector('#waveButton'));
    footer.after(action);
  }
  // Keep canvas geometry and pointer mapping together: the element's visible box
  // retains its authored ratio, with letterboxing outside that box.
  document.querySelectorAll('main canvas').forEach(canvas => {
    const slot = document.createElement('div'); slot.className = 'strategy-canvas-slot'; canvas.before(slot); slot.append(canvas);
    if (kind === 'wars') {
      const field = document.createElement('div'); field.className = 'strategy-war-field'; slot.before(field);
      field.append(document.querySelector('.hud'),slot,document.querySelector('#gameOverlay'));
    }
    const fit = () => {
      const ratio = canvas.width / canvas.height;
      const width = Math.max(1,Math.min(slot.clientWidth,slot.clientHeight * ratio));
      canvas.style.setProperty('width',width+'px','important'); canvas.style.setProperty('height',width/ratio+'px','important');
    };
    new ResizeObserver(fit).observe(slot); fit();
  });
  // The companion assist remains active mechanically; its explanatory badge belongs
  // with flight details rather than covering the viewport-fitted playfield.
  if (kind === 'rocket') document.addEventListener('DOMContentLoaded',() => queueMicrotask(() => {
    const badge = document.querySelector('.arcade-pet-assist');
    if (badge) content.querySelector('[data-strategy-view="Flight info"]').append(badge);
  }));
})();
