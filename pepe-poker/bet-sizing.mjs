export function potRaiseTo(pot, committed, { call, min, max }, fraction) {
  // The pot includes current bets. Complete the call before sizing the raise.
  const raiseTo = committed + call + Math.round((pot + call) * fraction);
  return Math.max(min, Math.min(max, raiseTo));
}

export function headsUpCallEquity(pot, committed, opponentBet, call) {
  const uncalled = Math.max(0, opponentBet - committed - call);
  return call / (pot - uncalled + call);
}
