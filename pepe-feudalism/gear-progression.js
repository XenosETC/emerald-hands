import {WEAPONS} from './campaign.js';
import {ARMOR, SHIELDS} from './equipment.js';
import {heroStats} from './hero-stats.js';

// Guaranteed regional recoveries; ownership prevents farming and never changes the loadout.
export const WEAPON_RECOVERIES = {
  elderwood: 'mace', ruins: 'dagger', jadeforest: 'spear', ashgrove: 'axe',
};

export function weaponRecovery(state, destination) {
  const id = WEAPON_RECOVERIES[destination];
  return id && !(state.weapons ?? ['sword']).includes(id) ? id : null;
}

export function awardWeapon(state, destination) {
  const id = weaponRecovery(state, destination);
  if (!id) return [];
  state.weapons ??= ['sword'];
  state.weapons.push(id);
  return [id];
}

export function compareGear(state, slot, id) {
  const catalog = {weapon: WEAPONS, armor: ARMOR, shield: SHIELDS}[slot];
  if (!catalog || (id !== null && !Object.hasOwn(catalog, id)) || (slot === 'weapon' && id === null)) return null;
  const current = heroStats(state), next = heroStats({...state, [slot]: id});
  const keys = slot === 'weapon' ? ['damage', 'range', 'attackCooldown'] : slot === 'armor' ? ['armorReduction'] : ['max'];
  return keys.map(key => ({key, value: next[key], delta: Number((next[key] - current[key]).toFixed(3)), lowerIsBetter: key === 'attackCooldown'}));
}
