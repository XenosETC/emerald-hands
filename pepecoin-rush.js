(function (root) {
  "use strict";
  const seconds = 7, magnetRadius = 260;
  function reset(state) { Object.assign(state, { rushTime: 0, rushAge: 0, rushCaught: 0, rushWarned: false }); }
  function collect(state) {
    if (!state.rushTime) state.rushAge = 0;
    state.rushTime = seconds;
    state.rushCaught += 1;
    state.rushWarned = false;
  }
  function step(state, dt) {
    if (state.rushTime > 0) state.rushAge += Math.min(dt, state.rushTime);
    state.rushTime = Math.max(0, state.rushTime - dt);
    const warn = state.rushTime > 0 && state.rushTime <= 2 && !state.rushWarned;
    if (warn) state.rushWarned = true;
    return warn;
  }
  root.EmeraldRush = Object.freeze({ reset, collect, step, seconds, magnetRadius });
})(typeof window === "undefined" ? globalThis : window);
