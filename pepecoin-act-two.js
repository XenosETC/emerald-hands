(function (root) {
  "use strict";
  const map = root.EmeraldRoute.actTwo;
  const railSeconds = 8, landingSeconds = .8;
  const slingshotSeconds = 3.6;
  function reset(state) {
    Object.assign(state, { actTwoDistance: 0, railTriggered: false, eclipseTriggered: false,
      railTime: 0, railLanding: 0, railAge: 0, railLift: 0, railEntryLift: 0, railVault: 0, railWarned: false, railRuns: 0,
      eclipseTime: 0, starrailBlend: 0, lunarBlend: 0, cathedralBlend: 0, moonJump: false,
      railKind: "comet", bellsRung: 0, slingshots: 0,
      bells: map.bells.map(x => ({ x, lift: 135, collected: false, missed: false, ringTime: 0 })) });
  }
  function active(state) { return state.railTime > 0 || state.railLanding > 0; }
  function isLunar(worldX) { return worldX >= map.lunar && worldX < map.eclipse; }
  function hazardGap(worldX) {
    // Reserve takeoff and landing space across both low-gravity boundaries.
    return worldX >= map.lunar - 800 && worldX < map.eclipse + 800 ? 780 : 550;
  }
  function vault(state) {
    if (!active(state)) return false;
    if (state.railVault < .3) state.railVault = .75;
    return true;
  }
  function ringBell(state, bell, entryLift) {
    if (!state.bells.includes(bell) || bell.collected || bell.missed) return false;
    bell.collected = true; bell.ringTime = .8; state.bellsRung += 1;
    if (state.bellsRung === map.bells.length) {
      state.railKind = "slingshot"; state.railTime = slingshotSeconds; state.railLanding = 0;
      state.railAge = 0; state.railVault = 0; state.railWarned = false;
      state.railEntryLift = Math.max(0, entryLift); state.railLift = state.railEntryLift;
      state.slingshots += 1;
    }
    return true;
  }
  function step(state, dt, worldX, calm = false) {
    const wasActive = active(state);
    const flightStep = Math.min(dt, state.railTime);
    state.railTime = Math.max(0, state.railTime - dt);
    if (flightStep > 0 && !state.railTime) state.railLanding = landingSeconds;
    if (!state.railTime) state.railLanding = Math.max(0, state.railLanding - (dt - flightStep));
    state.eclipseTime = Math.max(0, state.eclipseTime - dt);
    const crossed = at => state.actTwoDistance < at && worldX >= at && worldX < at + 1000;
    const launch = !state.railTriggered && crossed(map.rail);
    if (launch) {
      state.railKind = "comet";
      state.railTriggered = true; state.railTime = railSeconds; state.railLanding = 0;
      state.railAge = 0; state.railEntryLift = 0; state.railVault = 0; state.railWarned = false; state.railRuns += 1;
    }
    const eclipse = !state.eclipseTriggered && crossed(map.eclipseEvent);
    if (eclipse) { state.eclipseTriggered = true; state.eclipseTime = 7; }
    state.actTwoDistance = worldX;
    for (const bell of state.bells) {
      bell.ringTime = Math.max(0, bell.ringTime - dt);
      if (!bell.collected && worldX > bell.x + 80) bell.missed = true;
    }
    if (active(state)) state.railAge += dt;
    state.railVault = Math.max(0, state.railVault - dt);
    const rise = Math.min(1, state.railAge / .5);
    const envelope = state.railTime > 0 ? 1 : state.railLanding / landingSeconds;
    const sling = state.railKind === "slingshot";
    const hover = sling ? 125 + Math.sin(Math.PI * Math.min(1, state.railAge / slingshotSeconds)) * 70 : 85;
    const wave = calm ? 0 : Math.sin(state.railAge * 4) * (sling ? 16 : 34);
    const kick = state.railVault > 0 ? Math.sin(Math.PI * (1 - state.railVault / .75)) * (sling ? 90 : 110) : 0;
    state.railLift = active(state) ? (state.railEntryLift * (1 - rise) + (hover + wave + kick) * rise) * envelope : 0;
    const warn = state.railTime > 0 && state.railTime <= 2 && !state.railWarned;
    if (warn) state.railWarned = true;
    const targets = [worldX >= map.start && worldX < map.lunar, isLunar(worldX), worldX >= map.eclipse];
    ["starrailBlend", "lunarBlend", "cathedralBlend"].forEach((key, i) => {
      state[key] += ((targets[i] ? 1 : 0) - state[key]) * Math.min(1, dt * 3);
    });
    return { launch, eclipse, warn, landed: wasActive && !active(state) };
  }
  function speedMultiplier(state) {
    return state.railTime > 0 ? 1.2 : 1 + .2 * state.railLanding / landingSeconds;
  }
  function rideSeconds(state) { return state.railKind === "slingshot" ? slingshotSeconds : railSeconds; }
  root.EmeraldActTwo = Object.freeze({ reset, active, isLunar, hazardGap, vault, ringBell, step, speedMultiplier, rideSeconds, railSeconds, landingSeconds, slingshotSeconds });
})(typeof window === "undefined" ? globalThis : window);
