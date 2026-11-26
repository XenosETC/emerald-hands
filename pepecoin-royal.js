(function (root) {
  "use strict";
  const seconds = 6;
  const landingSeconds = .8;
  function reset(state) {
    Object.assign(state, { rideTime: 0, rideLanding: 0, rideAge: 0, rideLift: 0, rideFlap: 0, rideBlend: 0, rideWarned: false, crownsCaught: 0,
      rideBank: 0, rideTrail: [], rideTrailClock: 0, rideGates: [], rideGateChain: 0, skyGates: 0 });
  }
  function active(state) { return state.rideTime > 0 || state.rideLanding > 0; }
  function collect(state) {
    if (!active(state)) { state.rideAge = 0; state.rideFlap = 0; }
    state.rideTime = seconds;
    state.rideLanding = 0;
    state.rideWarned = false;
    state.crownsCaught += 1;
  }
  function soar(state) {
    if (!active(state)) return false;
    state.rideFlap = .65;
    return true;
  }
  function step(state, dt, calm = false) {
    const wasActive = active(state);
    const flightStep = Math.min(dt, state.rideTime);
    state.rideTime = Math.max(0, state.rideTime - dt);
    if (flightStep > 0 && state.rideTime === 0) state.rideLanding = landingSeconds;
    if (!state.rideTime) state.rideLanding = Math.max(0, state.rideLanding - (dt - flightStep));
    const isActive = active(state);
    if (wasActive) state.rideAge += dt;
    state.rideFlap = Math.max(0, state.rideFlap - dt);
    const envelope = Math.min(1, state.rideAge / .45) * (state.rideTime > 0 ? 1 : state.rideLanding / landingSeconds);
    const bob = calm ? 0 : Math.sin(state.rideAge * 3) * 42;
    const flap = state.rideFlap > 0 ? Math.sin(Math.PI * (1 - state.rideFlap / .65)) * 72 : 0;
    state.rideLift = isActive ? (110 + bob + flap) * envelope : 0;
    state.rideBank = calm || !isActive ? 0 : Math.cos(state.rideAge * 3) * .16 * envelope;
    state.rideBlend += ((isActive ? 1 : 0) - state.rideBlend) * Math.min(1, dt * 4);
    const warn = state.rideTime > 0 && state.rideTime <= 2 && !state.rideWarned;
    if (warn) state.rideWarned = true;
    return { landed: wasActive && !isActive, warn };
  }
  root.EmeraldRoyal = Object.freeze({ reset, active, collect, soar, step, seconds, landingSeconds });
})(typeof window === "undefined" ? globalThis : window);
