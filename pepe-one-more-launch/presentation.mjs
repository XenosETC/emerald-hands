import {realmTrack} from './realms.mjs';
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const smooth = x => { const t = clamp(x); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;

// A continuous camera track. At each threshold the next environment fills the view.
// This is a presentation coordinate, never authoritative altitude or a reward input.
export function climbPosition(altitude) { return realmTrack(altitude).position; }

export function rigPose({width, height, drift = 0, steer = 0, boost = 0, time = 0, altitude = 0, phase = 'pad', age = 0}) {
  const flying = phase === 'flight';
  const lift = smooth(altitude / 350);
  const scale = Math.min(1.12, Math.max(.68, height / 770), width / 420);
  const x = width * .5 + drift;
  const y = height * lerp(.69, .53, lift) + (flying ? Math.sin(time * 3.5) * 3 : Math.sin(time * 2) * 1.2);
  const tilt = flying ? steer * .14 + Math.sin(time * 14) * .008 * (1 + boost) : Math.sin(time * 2) * .008;
  const squash = phase === 'countdown' ? Math.sin(age * 22) * .016 * smooth(age / 2) : boost * Math.sin(time * 34) * .012;
  return {x, y, scale, tilt, squash};
}

export function localToScreen(pose, x, y) {
  const sx = x * pose.scale * (1 + pose.squash), sy = y * pose.scale * (1 - pose.squash);
  return {x: pose.x + sx * Math.cos(pose.tilt) - sy * Math.sin(pose.tilt), y: pose.y + sx * Math.sin(pose.tilt) + sy * Math.cos(pose.tilt)};
}

export const nozzles = engine => engine >= 3 ? [-60, 0, 60] : [0];

// One event per phase boundary; effects can observe this without owning the flight.
export class Director {
  constructor() { this.phase = 'pad'; this.age = 0; this.events = []; }
  enter(phase) { this.phase = phase; this.age = 0; this.events.push(phase); }
  advance(dt) {
    this.age += Math.max(0, Math.min(dt, .1));
    if (this.phase === 'countdown' && this.age >= 2.4) this.enter('flight');
    else if (this.phase === 'boom' && this.age >= 3.8) this.enter('return');
    else if (this.phase === 'return' && this.age >= 3.2) this.enter('rebuild');
    else if (this.phase === 'rebuild' && this.age >= 2) this.enter('pad');
  }
  drain() { return this.events.splice(0); }
}
