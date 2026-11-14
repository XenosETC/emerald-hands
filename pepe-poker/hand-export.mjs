export function formatHandExport(hand) {
  const lines = [
    "Pepe Poker — Hand #" + hand.number,
    "Board: " + (hand.board.join(" ") || "No community cards dealt"),
    "",
    "Result"
  ];
  for (const { name, hand: rank, amount, cards } of hand.players) {
    const details = [];
    if (cards.length) details.push(cards.join(" "));
    if (rank) details.push(rank);
    if (amount) details.push("+" + amount + " chips");
    lines.push(name + (details.length ? " — " + details.join(" · ") : ""));
  }
  if (hand.actions?.length) {
    lines.push("", "Hand action");
    if (hand.actionsOmitted) lines.push(hand.actionsOmitted + " earlier actions omitted.");
    lines.push(...hand.actions);
  }
  const pots = potBreakdownLines(hand);
  if (pots.length) lines.push("", "Pot breakdown", ...pots);
  return lines.join("\n") + "\n";
}
export function potBreakdownLines(hand, format = String) {
  const lines = (hand.pots ?? []).map(({ amount, awards }, index) => {
    const label = index ? "Side pot " + index : "Main pot";
    const winners = awards.map(winner => winner.name + " +" + format(winner.amount)).join(", ");
    return label + " · " + format(amount) + " chips · " + winners;
  });
  for (const { name, amount } of hand.returned ?? []) {
    lines.push(name + " · " + format(amount) + " uncalled chips returned");
  }
  return lines;
}
