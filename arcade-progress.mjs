import {SAVE_KEY as soulKey, readSave, createState, WORLDS, levelFor} from './pepe-soul-world/core.js';
import {questGuidance} from './pepe-soul-world/quest-guidance.js';
import {SAVE_KEY as campaignKey, migrateSave} from './pepe-feudalism/campaign.js';
import {hydrateAdventure, QUESTS} from './pepe-feudalism/adventure.js';
import {NODES} from './pepe-feudalism/world-data.js';

export const keys = Object.freeze({soulWorld: soulKey, feudalism: campaignKey, templeRun: 'pepe-temple-run-v1'});
const unavailable = () => ({status: 'unavailable', label: 'Save unavailable', summary: 'Saved progress could not be read.', goal: 'Open the game to check its local save.', action: 'Open game'});
const fresh = () => ({status: 'empty', label: 'A new journey', summary: 'No saved progress on this device.', goal: 'Open the game to begin.', action: 'Start playing'});
const town = id => NODES.find(node => node.id === id)?.name || 'Crownhaven';

export function summarize(id, value) {
  if (id === 'soulWorld') {
    if (!readSave(value)) return unavailable();
    // Reuse the game's restore rules and quest guidance. This is an in-memory
    // projection of the saved checkpoint, never a running game or a save write.
    const state = createState(value);
    return {status: 'saved', label: 'Saved checkpoint',
      summary: `Level ${levelFor(state.xp).level} · ${WORLDS.find(world => world.id === state.world).name} · ${state.seals.length}/3 seals`,
      goal: questGuidance(state).text, action: 'Continue journey'};
  }
  if (id === 'feudalism') {
    const restored = migrateSave(value);
    if (!restored) return unavailable();
    const state = hydrateAdventure(restored);
    const ready = QUESTS.find(quest => state.quests[quest.id] === 'ready');
    const active = QUESTS.find(quest => state.quests[quest.id] === 'active');
    return {status: 'saved', label: 'Saved campaign',
      summary: `Level ${state.level} · ${town(state.location)} · ${state.army.length} ${state.army.length === 1 ? 'soldier' : 'soldiers'}`,
      goal: ready ? `Claim ${ready.name} in ${town(ready.board)}.` : active ? `${active.name} · Head to ${town(active.target)}.` : 'Review town contracts and prepare your warband.',
      action: 'Continue campaign'};
  }
  if (id === 'templeRun') {
    if (!value || !Number.isSafeInteger(value.best) || value.best < 0) return unavailable();
    return {status: 'saved', label: 'Saved distance record', summary: `Best ${value.best.toLocaleString()} m`,
      goal: 'Start a new run and chase your best distance.', action: 'Run again'};
  }
  return null;
}

export function read(storage) {
  return Object.fromEntries(Object.entries(keys).map(([id, key]) => {
    try {
      const raw = storage.getItem(key);
      if (raw === null) return [id, fresh()];
      if (typeof raw !== 'string' || raw.length > 250_000) return [id, unavailable()];
      return [id, summarize(id, JSON.parse(raw))];
    } catch { return [id, unavailable()]; }
  }));
}

if (typeof window !== 'undefined') {
  window.ArcadeProgress = Object.freeze({keys, read});
  window.dispatchEvent(new Event('arcade:progress-ready'));
}
