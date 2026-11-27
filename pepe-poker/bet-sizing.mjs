export function potRaiseTo(pot, committed, { call, min, max }, fraction) {
  // The pot includes current bets. Complete the call before sizing the raise.
  const raiseTo = committed + call + Math.round((pot + call) * fraction);
  return Math.max(min, Math.min(max, raiseTo));
}

export function headsUpCallOdds(pot, committed, opponentBet, call) {
  const uncalled = Math.max(0, opponentBet - committed - call);
  const potAfterCall = pot - uncalled + call;
  return { potAfterCall, uncalled, breakEvenShare: call / potAfterCall };
}

export function raiseCommitment(value, committed, stack, allowed) {
  if (!allowed?.canRaise || String(value).trim() === "") return null;
  const total = Number(value);
  const added = total - committed;
  if (!Number.isSafeInteger(total) || total < allowed.min || total > allowed.max || added < 0 || added > stack) return null;
  return { total, added, behind: stack - added, allIn: added === stack };
}
