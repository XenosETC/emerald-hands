import { randomInt } from "node:crypto";
import { DEFAULT_TABLE, TURN_SECONDS } from "./table-settings.mjs";

export const ranks = "23456789TJQKA";
export const suits = "shdc";
export const labels = ["High card", "Pair", "Two pair", "Three of a kind", "Straight", "Flush", "Full house", "Four of a kind", "Straight flush"];

function shuffledDeck() {
  const deck = [...ranks].flatMap(rank => [...suits].map(suit => rank + suit));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function scoreFive(cards) {
  const values = cards.map(card => ranks.indexOf(card[0]) + 2).sort((a, b) => b - a);
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  const groups = [...counts].sort(([a, n], [b, m]) => m - n || b - a);
  const ordered = groups.map(([value]) => value);
  const flush = cards.every(card => card[1] === cards[0][1]);
  const straight = groups.length === 5 && (values[0] - values[4] === 4 ? values[0] : values.join() === "14,5,4,3,2" ? 5 : 0);
  let result;
  if (straight && flush) result = [8, straight];
  else if (groups[0][1] === 4) result = [7, ...ordered];
  else if (groups[0][1] === 3 && groups[1][1] === 2) result = [6, ...ordered];
  else if (flush) result = [5, ...values];
  else if (straight) result = [4, straight];
  else if (groups[0][1] === 3) result = [3, ...ordered];
  else if (groups[1][1] === 2) result = [2, ...ordered];
  else if (groups[0][1] === 2) result = [1, ...ordered];
  else result = [0, ...values];
  return result.reduce((score, value, i) => score + value * 15 ** (5 - i), 0);
}

export function evaluateBest(cards) {
  let best = { score: 0, cards: [] };
  for (let a = 0; a < cards.length - 4; a++)
    for (let b = a + 1; b < cards.length - 3; b++)
      for (let c = b + 1; c < cards.length - 2; c++)
        for (let d = c + 1; d < cards.length - 1; d++)
          for (let e = d + 1; e < cards.length; e++) {
            const five = [cards[a], cards[b], cards[c], cards[d], cards[e]];
            const score = scoreFive(five);
            if (score > best.score) best = { score, cards: five };
          }
  return best;
}

export function evaluate(cards) {
  return evaluateBest(cards).score;
}

export function handCategory(score) {
  return Math.floor(score / 15 ** 5);
}

export const BIG_BLIND = DEFAULT_TABLE.bigBlind;
export const STARTING_STACK = DEFAULT_TABLE.startingStack;

function next(room, after, filter) {
  for (let offset = 1; offset <= room.players.length; offset++) {
    const index = (after + offset) % room.players.length;
    if (filter(room.players[index])) return index;
  }
  return -1;
}

export function log(room, message) {
  room.history.push(message);
  if (room.history.length > 80) room.history.shift();
}

function logHand(room, message) {
  log(room, message);
  room.handActions.push(message);
  room.actionBoardCounts.push(room.board.length);
  if (room.handActions.length > 120) {
    room.handActions.shift();
    room.actionBoardCounts.shift();
    room.actionsOmitted++;
  }
}

function pay(player, amount) {
  player.stack -= amount;
  player.bet += amount;
  player.total += amount;
}

export function startHand(room) {
  if (room.turn !== -1) throw new Error("Finish the current hand first.");
  const eligible = player => player.stack > 0 && !player.sittingOut;
  const funded = room.players.filter(eligible);
  if (funded.length < 2) throw new Error("At least two active players with chips are needed.");
  room.hand++;
  room.deck = shuffledDeck();
  room.board = [];
  room.result = "";
  room.payouts = [];
  room.recap = [];
  room.handActions = [];
  room.actionBoardCounts = [];
  room.actionsOmitted = 0;
  room.showdown = false;
  room.street = "Preflop";
  room.button = next(room, room.button, eligible);
  // When play becomes heads-up, the previous big blind must not post it again.
  if (funded.length === 2 && next(room, room.button, eligible) === room.bigBlind) {
    room.button = room.bigBlind;
  }
  for (const player of room.players) {
    player.cards = [];
    player.bet = player.total = 0;
    player.folded = !eligible(player);
    player.actedAt = null;
    player.usedTimeBank = false;
    player.lastAction = null;
  }
  let seat = room.button;
  for (let card = 0; card < 2 * funded.length; card++) {
    seat = next(room, seat, eligible);
    room.players[seat].cards.push(room.deck.pop());
  }
  const small = funded.length === 2 ? room.button : next(room, room.button, eligible);
  const big = next(room, small, eligible);
  room.smallBlind = small;
  room.bigBlind = big;
  const { smallBlind, bigBlind } = room.settings ?? DEFAULT_TABLE;
  pay(room.players[small], Math.min(smallBlind, room.players[small].stack));
  pay(room.players[big], Math.min(bigBlind, room.players[big].stack));
  room.price = room.raise = bigBlind;
  logHand(room, "Hand #" + room.hand + " · " + room.players[room.button].name + " deals.");
  logHand(room, room.players[small].name + " posts " + room.players[small].bet + " small blind.");
  logHand(room, room.players[big].name + " posts " + room.players[big].bet + " big blind.");
  advance(room, big);
}

function settle(room, live) {
  room.showdown = live.length > 1;
  room.street = room.showdown ? "Showdown" : "Hand complete";
  room.turn = -1;
  const hands = new Map(room.showdown ? live.map(player => [player, evaluateBest([...room.board, ...player.cards])]) : []);
  const payouts = new Map();
  const pots = new Map();
  const returned = [];
  let previous = 0;
  const levels = [...new Set(room.players.map(player => player.total))].sort((a, b) => a - b);
  for (const level of levels) {
    const contributors = room.players.filter(player => player.total >= level);
    const pot = (level - previous) * contributors.length;
    previous = level;
    if (!pot) continue;
    if (contributors.length === 1) {
      contributors[0].stack += pot;
      returned.push({ name: contributors[0].name, amount: pot });
      logHand(room, contributors[0].name + " gets " + pot + " uncalled chips back.");
      continue;
    }
    const eligible = live.length === 1 ? live : live.filter(player => player.total >= level);
    const key = eligible.map(player => room.players.indexOf(player)).join(",");
    if (!pots.has(key)) pots.set(key, { amount: 0, awards: new Map() });
    const breakdown = pots.get(key);
    breakdown.amount += pot;
    const best = Math.max(...eligible.map(player => hands.get(player)?.score ?? 0));
    const winners = eligible.filter(player => (hands.get(player)?.score ?? 0) === best);
    let odd = pot % winners.length;
    for (let offset = 1; offset <= room.players.length; offset++) {
      const player = room.players[(room.button + offset) % room.players.length];
      if (!winners.includes(player)) continue;
      const payout = Math.floor(pot / winners.length) + (odd > 0 ? 1 : 0);
      odd--;
      player.stack += payout;
      payouts.set(player, (payouts.get(player) || 0) + payout);
      if (payout > 0) breakdown.awards.set(player.name, (breakdown.awards.get(player.name) ?? 0) + payout);
    }
  }
  room.result = [...payouts].map(([player, amount]) => player.name + " wins " + amount +
    (room.showdown ? " · " + labels[handCategory(hands.get(player).score)] : "")).join(" / ");
  room.payouts = [...payouts].map(([player, amount]) => ({ seat: room.players.indexOf(player), amount }));
  room.recap = live.map(player => ({
    seat: room.players.indexOf(player),
    hand: room.showdown ? labels[handCategory(hands.get(player).score)] : null,
    amount: payouts.get(player) ?? 0
  })).sort((a, b) => b.amount - a.amount);
  room.recentHands ??= [];
  if (room.result) logHand(room, room.result);
  room.recentHands.push({
    number: room.hand,
    board: [...room.board],
    actions: [...room.handActions],
    actionBoardCounts: [...room.actionBoardCounts],
    actionsOmitted: room.actionsOmitted,
    pots: [...pots.values()].map(({ amount, awards }) => ({
      amount, awards: [...awards].map(([name, amount]) => ({ name, amount }))
    })),
    returned,
    players: room.recap.map(({ seat, hand, amount }) => {
      const player = room.players[seat];
      const bestFive = hands.get(player)?.cards;
      return { name: player.name, hand, amount, cards: bestFive ? [...player.cards] : [], ...(bestFive && { bestFive }) };
    })
  });
  if (room.recentHands.length > 20) room.recentHands.shift();
  for (const player of room.players) {
    if (player.cards.length) player.handsPlayed = (player.handsPlayed ?? 0) + 1;
    if (payouts.has(player) && payouts.get(player) > 0) player.handsWon = (player.handsWon ?? 0) + 1;
    player.bet = player.total = 0;
  }
}

function advance(room, after) {
  const live = room.players.filter(player => !player.folded);
  if (live.length === 1) return settle(room, live);
  const withChips = live.filter(player => player.stack > 0);
  const actionablePrice = withChips.length === 1 ? Math.max(...live.map(player => player.bet)) : room.price;
  room.turn = next(room, after, player => !player.folded && player.stack > 0 &&
    (player.bet < actionablePrice || (withChips.length > 1 && player.actedAt === null)));
  if (room.turn !== -1) {
    room.turnSeconds = TURN_SECONDS;
    room.deadline = Date.now() + room.turnSeconds * 1000;
    return;
  }
  if (room.board.length === 5) return settle(room, live);
  room.deck.pop();
  const count = room.board.length === 0 ? 3 : 1;
  for (let i = 0; i < count; i++) room.board.push(room.deck.pop());
  room.street = { 3: "Flop", 4: "Turn", 5: "River" }[room.board.length];
  logHand(room, room.street + " · " + room.board.join(" "));
  for (const player of room.players) {
    player.bet = 0;
    player.actedAt = null;
  }
  room.price = 0;
  room.raise = (room.settings ?? DEFAULT_TABLE).bigBlind;
  advance(room, room.button);
}

export function options(room, index) {
  if (index < 0 || room.turn !== index) return null;
  const player = room.players[index];
  const canContest = room.players.some(other => other !== player && !other.folded && other.stack > 0);
  const price = canContest ? room.price : Math.max(...room.players.filter(other => !other.folded).map(other => other.bet));
  const call = Math.min(player.stack, price - player.bet);
  const max = player.bet + player.stack;
  const canRaise = canContest && max > price &&
    (player.actedAt === null || price - player.actedAt >= room.raise);
  return { call, max, min: Math.min(max, price + room.raise), canRaise };
}

export function act(room, index, action, amount) {
  const allowed = options(room, index);
  if (!allowed) throw new Error("Wait for your turn.");
  const player = room.players[index];
  const opened = room.price === 0;
  if (action === "fold") player.folded = true;
  else if (action === "call") pay(player, allowed.call);
  else if (action === "raise") {
    if (!allowed.canRaise || !Number.isSafeInteger(amount) || amount < allowed.min || amount > allowed.max) {
      throw new Error("Choose a legal raise amount.");
    }
    const increase = amount - room.price;
    if (increase >= room.raise) room.raise = increase;
    room.price = amount;
    pay(player, amount - player.bet);
  } else throw new Error("Unknown action.");
  player.actedAt = room.price;
  player.lastAction = {
    kind: action === "raise" && opened ? "bet" : action === "call" && !allowed.call ? "check" : action,
    amount: action === "raise" ? amount : action === "call" ? allowed.call : 0,
    street: room.street
  };
  const detail = action === "fold" ? "folds" : action === "raise" ? (opened ? "bets " : "raises to ") + amount :
    allowed.call ? "calls " + allowed.call : "checks";
  logHand(room, player.name + " " + detail + ".");
  advance(room, index);
}
