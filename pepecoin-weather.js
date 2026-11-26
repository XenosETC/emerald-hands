(function (root) {
  "use strict";
  const { start, riseEnd, fallStart, end, strikes } = root.EmeraldRoute.tempest;
  const smooth = value => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
  function reset(state) {
    Object.assign(state, { stormBlend: 0, stormGlow: 0, stormDistance: 0, stormEntered: false });
  }
  function step(state, dt, distance, calm = false) {
    const target = smooth((distance - start) / (riseEnd - start)) * (1 - smooth((distance - fallStart) / (end - fallStart)));
    state.stormBlend += (target - state.stormBlend) * Math.min(1, dt * 4);
    state.stormGlow = Math.max(0, state.stormGlow - dt * 1.5);
    const strike = strikes.some(at => state.stormDistance < at && distance >= at);
    if (strike && !calm) state.stormGlow = .65;
    if (calm) state.stormGlow = 0;
    state.stormDistance = distance;
    const entered = !state.stormEntered && distance >= start && distance < end;
    if (entered) state.stormEntered = true;
    return { strike, entered };
  }
  root.EmeraldWeather = Object.freeze({ reset, step, start, end });
})(typeof window === "undefined" ? globalThis : window);
