export const DEFAULT_TABLE = Object.freeze({
  id: "classic", label: "Classic", smallBlind: 10, bigBlind: 20, startingStack: 2000
});

export const TABLE_PRESETS = Object.freeze([
  DEFAULT_TABLE,
  Object.freeze({ id: "quick", label: "Quick", smallBlind: 25, bigBlind: 50, startingStack: 1500 }),
  Object.freeze({ id: "deep", label: "Deep Stack", smallBlind: 5, bigBlind: 10, startingStack: 3000 })
]);
export const TURN_SECONDS = 45;
export const TIME_BANK_SECONDS = 20;
