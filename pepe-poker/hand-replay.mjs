export const REPLAY_STREETS = [
  { cards: 0, label: "Preflop" },
  { cards: 3, label: "Flop" },
  { cards: 4, label: "Turn" },
  { cards: 5, label: "River" },
];

// Jump to the first retained entry for each street, including runout board reveals.
export function replayStreetStarts(actionBoardCounts) {
  return REPLAY_STREETS.map(({ cards }) => actionBoardCounts.indexOf(cards));
}
