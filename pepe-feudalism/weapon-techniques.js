// Normal attacks only. Sweep uses its own damage and never triggers these traits.
export const WEAPON_TECHNIQUES = {
  sword: {name: 'Balanced blade', description: 'Reliable single-target strikes with quick recovery.'},
  spear: {name: 'Piercing thrust', description: 'Pierces one foe behind your target for 60% damage within spear reach.'},
  axe: {name: 'Cleave', description: 'Clips up to two foes beside your target for 45% damage within axe reach.'},
  mace: {name: 'Stagger', description: 'Stops the target moving and attacking for 0.45s. Captains resist: 0.20s.'},
  dagger: {name: 'Rapid strikes', description: 'The fastest recovery, but you must close to dagger reach.'},
};

export function secondaryStrikes(hero, target, units) {
  if (!['spear', 'axe'].includes(hero.weapon)) return [];
  const dx = target.x - hero.x, dy = target.y - hero.y;
  const length = Math.hypot(dx, dy);
  if (!length) return [];
  const forwardX = dx / length, forwardY = dy / length;
  const candidates = units.filter(unit => {
    if (unit === target || unit.team === hero.team || unit.hp <= 0) return false;
    const x = unit.x - hero.x, y = unit.y - hero.y, distance = Math.hypot(x, y);
    if (distance > hero.range) return false;
    const forward = x * forwardX + y * forwardY;
    if (hero.weapon === 'spear') {
      return forward > length && Math.abs(x * forwardY - y * forwardX) <= 24;
    }
    return forward > 0 && forward >= distance * .5 && Math.hypot(unit.x - target.x, unit.y - target.y) <= 60;
  });
  candidates.sort((a, b) => Math.hypot(a.x - hero.x, a.y - hero.y) - Math.hypot(b.x - hero.x, b.y - hero.y) || a.id - b.id);
  return candidates.slice(0, hero.weapon === 'spear' ? 1 : 2).map(target => ({
    target, damage: Math.max(1, Math.round(hero.damage * (hero.weapon === 'spear' ? .6 : .45))),
  }));
}

export function staggerDuration(target) { return target.captain || target.lord ? .2 : .45; }
