import {WEAPONS} from './campaign.js';
import {ARMOR, SHIELDS} from './equipment.js';
import {compareGear, WEAPON_RECOVERIES} from './gear-progression.js';
import {WEAPON_TECHNIQUES} from './weapon-techniques.js';
import {drawArmor, drawShield, drawWeaponIcon} from './art.js';
import {NODES} from './world.js';

const LABELS = {damage: 'Attack', range: 'Reach', attackCooldown: 'Recovery', armorReduction: 'Protection / hit', max: 'Total health'};
const format = (key, value) => key === 'attackCooldown' ? value.toFixed(2) + 's' : String(value);

export function renderGearTabs(parent, selected, select, includeLoot = false) {
  const tabs = document.createElement('div');
  tabs.className = 'gear-tabs'; tabs.setAttribute('role', 'group'); tabs.setAttribute('aria-label', 'Equipment categories');
  for (const [id, label] of Object.entries({weapon: 'Weapons', armor: 'Armor', shield: 'Shields', ...(includeLoot ? {loot: 'Battle loot'} : {})})) {
    const button = document.createElement('button'); button.textContent = label;
    button.setAttribute('aria-pressed', String(selected === id)); button.onclick = () => select(id);
    tabs.append(button);
  }
  parent.append(tabs);
}

export function renderGearCards({parent, state, slot, forge, locked, button, equip, track}) {
  const catalog = {weapon: WEAPONS, armor: ARMOR, shield: SHIELDS}[slot];
  if (!catalog) return;
  const owned = state[{weapon: 'weapons', armor: 'armors', shield: 'shields'}[slot]] ?? [];
  const entries = Object.entries(catalog).filter(([id]) => forge || owned.includes(id));
  if (!entries.length) {
    const empty = document.createElement('p'); empty.textContent = `No ${slot === 'armor' ? 'armor' : slot + 's'} collected yet. Recover equipment in battle or visit a settlement forge.`; parent.append(empty);
  }
  for (const [id, item] of entries) {
    const row = document.createElement('article'), icon = document.createElement('canvas'), content = document.createElement('div');
    row.className = 'card gear-item'; row.dataset.gear = `${slot}-${id}`;
    icon.width = 100; icon.height = 130; icon.setAttribute('aria-hidden', 'true');
    const g = icon.getContext('2d');
    if (slot === 'weapon') drawWeaponIcon(g, id, 50, 65, 110);
    else if (slot === 'armor') drawArmor(g, id, 50, 65, 95, 115);
    else drawShield(g, id, 50, 65, id === 'holy' ? 1.35 : 1.8);
    const heading = document.createElement('strong'); heading.textContent = item.name; content.append(heading);
    const tag = document.createElement('small'); tag.className = 'gear-status';
    tag.textContent = state[slot] === id ? 'EQUIPPED' : owned.includes(id) ? 'OWNED' : `${item.cost} GOLD`; content.append(tag);
    const stats = document.createElement('div'); stats.className = 'gear-comparison';
    for (const stat of compareGear(state, slot, id)) {
      const cell = document.createElement('div'), label = document.createElement('span'), value = document.createElement('b'), change = document.createElement('small');
      label.textContent = LABELS[stat.key]; value.textContent = format(stat.key, stat.value);
      change.textContent = stat.delta === 0 ? 'No change' : `${stat.delta > 0 ? '+' : '−'}${format(stat.key, Math.abs(stat.delta))}`;
      if (stat.delta) change.className = (stat.lowerIsBetter ? stat.delta < 0 : stat.delta > 0) ? 'gear-gain' : 'gear-loss';
      cell.append(label, value, change); stats.append(cell);
    }
    content.append(stats);
    const copy = document.createElement('p'); copy.className = 'gear-trait';
    copy.textContent = slot === 'weapon' ? `${WEAPON_TECHNIQUES[id].name} · ${WEAPON_TECHNIQUES[id].description}` : slot === 'armor' ? 'Reduces each incoming hit. Damage cannot fall below 1.' : `Adds ${item.health} maximum health when the next battle begins.`;
    content.append(copy);
    const equipped = state[slot] === id, unowned = !owned.includes(id);
    const label = equipped ? slot === 'weapon' ? 'Equipped' : `${slot === 'armor' ? 'Armor' : 'Shield'} equipped` : unowned ? `Buy ${item.name} / ${item.cost} gold` : `Equip ${item.name}`;
    button(content, label, () => equip(id), locked || equipped || unowned && state.gold < item.cost);
    if (unowned && state.gold < item.cost) {const hint = document.createElement('small'); hint.textContent = `Need ${item.cost - state.gold} more gold`; content.append(hint);}
    if (slot === 'weapon' && unowned) {
      const destination = Object.keys(WEAPON_RECOVERIES).find(key => WEAPON_RECOVERIES[key] === id);
      if (destination) {
        const node = NODES.find(node => node.id === destination), note = document.createElement('small');
        note.textContent = `Or recover on victory at ${node.name}.`; content.append(note);
        const map = button(content, `Find ${node.name}`, () => track(destination), locked); map.className = 'quiet gear-find';
      }
    }
    row.append(icon, content); parent.append(row);
  }
}
