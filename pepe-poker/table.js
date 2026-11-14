import { AVATARS, DEFAULT_AVATAR_ID } from "./avatar-catalog.mjs?v=1";
import { DEFAULT_TABLE, TABLE_PRESETS, TURN_SECONDS, TIME_BANK_SECONDS } from "./table-settings.mjs?v=3";
import { headsUpCallEquity, potRaiseTo } from "./bet-sizing.mjs?v=2";
import { formatHandExport, potBreakdownLines } from "./hand-export.mjs?v=2";
import { REACTIONS, REACTION_COOLDOWN } from "./reaction-catalog.mjs?v=1";

const $ = id => document.getElementById(id);
const api = "/api/pepe-poker";
const avatarsById = new Map(AVATARS.map(avatar => [avatar.id, avatar]));
const defaultAvatar = avatarsById.get(DEFAULT_AVATAR_ID);
const profileKey = "pepe-poker:table-profile";
const rankNames = { T: "10", J: "Jack", Q: "Queen", K: "King", A: "Ace" };
const suitNames = { s: "spades", h: "hearts", d: "diamonds", c: "clubs" };
const format = new Intl.NumberFormat();
const percent = new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 1 });
const reactionsById = new Map(REACTIONS.map(reaction => [reaction.id, reaction]));
let room = new URL(location.href).searchParams.get("room");
let token;
try {
  token = room && sessionStorage.getItem("pepe-poker:" + room);
} catch { /* The table remains playable when browser storage is blocked. */ }
let state;
let busy = false;
let polling = false;
let missingRoom = false;
let pollError = "";
let reacting = false;
let sendingChat = false;
let recapOptionsKey = "";
let replayStep = null;
let autoDealAt = null;
const pageTitle = document.title;
const soundKey = "pepe-poker:turn-sound";
let turnSound = false;
let audioContext;
let hadTurn = false;
try {
  turnSound = localStorage.getItem(soundKey) === "on";
} catch { /* The preference can still be used in this tab. */ }

async function enableAudio() {
  if (!turnSound || !window.AudioContext) return;
  try {
    audioContext ??= new AudioContext();
    if (audioContext.state !== "running") await audioContext.resume();
  } catch { /* The visual cue remains available. */ }
}

function playTurnSound() {
  if (!turnSound || audioContext?.state !== "running") return;
  const now = audioContext.currentTime;
  for (const [frequency, delay] of [[587, 0], [880, .11]]) {
    const tone = audioContext.createOscillator();
    const volume = audioContext.createGain();
    const start = now + delay;
    tone.frequency.value = frequency;
    volume.gain.setValueAtTime(0, start);
    volume.gain.linearRampToValueAtTime(.12, start + .02);
    volume.gain.exponentialRampToValueAtTime(.001, start + .17);
    tone.connect(volume).connect(audioContext.destination);
    tone.start(start);
    tone.stop(start + .18);
  }
}

function updateTurnCue(active) {
  const title = active && document.hidden ? "Your turn · " + pageTitle : pageTitle;
  if (document.title !== title) document.title = title;
  if (active === hadTurn) return;
  hadTurn = active;
  $("turn-announcement").textContent = active ? "Your turn at the poker table." : "";
  if (active) playTurnSound();
}

function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}

function portrait(avatarId, className) {
  const image = element("img", className);
  image.alt = "";
  image.src = (avatarsById.get(avatarId) ?? defaultAvatar).src;
  image.decoding = "async";
  return image;
}

function previewAvatar(avatar) {
  $("avatar-preview").src = avatar.src;
  $("avatar-selection").textContent = avatar.label;
}

function buildAvatarPicker() {
  let profile;
  try {
    profile = JSON.parse(localStorage.getItem(profileKey) || "null");
  } catch { /* The default works when storage is unavailable. */ }
  if (typeof profile?.name === "string") $("name").value = profile.name.slice(0, 20);
  const selected = avatarsById.get(profile?.avatarId) ?? defaultAvatar;
  previewAvatar(selected);
  $("avatar-options").replaceChildren(...AVATARS.map(avatar => {
    const label = element("label", "avatar-option");
    const radio = element("input");
    radio.type = "radio";
    radio.name = "avatar";
    radio.value = avatar.id;
    radio.checked = avatar === selected;
    radio.addEventListener("change", () => {
      if (radio.checked) previewAvatar(avatar);
    });
    const image = portrait(avatar.id);
    image.width = image.height = 48;
    image.loading = "lazy";
    label.append(radio, image, element("span", "", avatar.label));
    return label;
  }));
}

function chip(className = "") {
  const node = element("span", "chip " + className);
  node.setAttribute("aria-hidden", "true");
  const stamp = element("img");
  stamp.alt = "";
  stamp.src = "./cards/chip-stamp.webp";
  node.append(stamp);
  return node;
}

function card(value) {
  const node = element("div", "card");
  if (value === undefined) {
    node.classList.add("empty");
    node.setAttribute("aria-hidden", "true");
    return node;
  }

  const image = element("img");
  image.alt = "";
  image.src = "./cards/" + (value ?? "back") + ".webp";
  node.setAttribute("role", "img");
  if (value === null) {
    node.setAttribute("aria-label", "Face-down card");
  } else {
    const [rank, suit] = value;
    node.setAttribute("aria-label", (rankNames[rank] || rank) + " of " + suitNames[suit]);
  }
  node.append(image);
  return node;
}

function reactionImage(reaction, className, alt) {
  const image = element("img", className);
  image.alt = alt;
  image.src = "./reactions/" + reaction.id + ".webp";
  return image;
}

function seat(player, index) {
  if (!player) return element("div", "seat open", "Open seat");
  const node = element("div", "seat");
  node.classList.toggle("your-seat", index === state.index);
  node.classList.toggle("winner", state.payouts?.some(payout => payout.seat === index) ?? false);
  node.classList.toggle("active", index === state.turn);
  if (index === state.turn) node.append(element("span", "seat-turn-marker", "To act"));
  node.classList.toggle("folded", player.folded && state.turn !== -1 && player.cards.length > 0);
  const stack = element("div", "stack");
  stack.append(chip(), " " + format.format(player.stack));
  if (player.bet) stack.append(" · " + format.format(player.bet) + " in");
  node.append(portrait(player.avatarId, "avatar"),
    element("span", "seat-name", player.name + (player.bot ? " · Bot" : index === state.index ? " (you)" : "")), stack);
  if (state.turn !== -1 && player.cards.length) {
    const action = player.lastAction;
    const allIn = !player.folded && player.stack === 0;
    if (action || allIn) {
      const labels = { fold: "Folded", check: "Check", call: "Call", bet: "Bet", raise: "Raise to" };
      const text = allIn ? "All-in" : labels[action.kind] + (action.amount ? " " + format.format(action.amount) : "");
      const badge = element("span", "seat-action", text);
      badge.classList.toggle("all-in", allIn);
      if (action) badge.title = action.street;
      node.append(badge);
    }
  }
  if (player.sittingOut) {
    node.append(element("span", "seat-presence", state.turn !== -1 && player.cards.length ? "Out next hand" : "Sitting out"));
  }
  const reaction = reactionsById.get(player.reaction);
  if (reaction) node.append(reactionImage(reaction, "seat-reaction", reaction.label));
  if (index === state.smallBlind || index === state.bigBlind) {
    const small = index === state.smallBlind;
    const blind = element("span", "blind-badge", small ? "SB" : "BB");
    blind.title = small ? "Small blind" : "Big blind";
    stack.append(" ", blind);
  }
  if (index === state.button) {
    const dealer = element("span", "dealer", "D");
    dealer.title = "Dealer button";
    node.append(dealer);
  }
  if (player.cards.length) {
    const cards = element("div", "cards");
    cards.append(...player.cards.map(card));
    node.append(cards);
    if (index === state.index && state.yourHand) node.append(element("span", "seat-hand-rank", state.yourHand));
  }
  return node;
}

function renderChat(seated) {
  $("table-chat").hidden = !seated;
  const list = $("chat-messages");
  const messages = seated ? state.chat ?? [] : [];
  $("chat-empty").hidden = messages.length > 0;
  if (!messages.length) {
    list.replaceChildren();
    return;
  }
  const follow = list.scrollHeight - list.scrollTop - list.clientHeight < 24;
  while (list.firstElementChild && Number(list.firstElementChild.dataset.id) < messages[0].id) {
    list.firstElementChild.remove();
  }
  const latest = Number(list.lastElementChild?.dataset.id ?? 0);
  for (const { id, name, text } of messages) {
    if (id <= latest) continue;
    const row = element("p", "chat-message");
    row.dataset.id = id;
    row.append(element("strong", "", name), " ", element("span", "", text));
    list.append(row);
  }
  if (follow) list.scrollTop = list.scrollHeight;
}

function selectedHand(hands) {
  return hands.find(hand => String(hand.number) === $("recap-select").value) ?? hands.at(-1);
}

function renderRecap() {
  const hands = state?.recentHands ?? [];
  $("hand-recap").hidden = !hands.length;
  if (!hands.length) {
    recapOptionsKey = "";
    replayStep = null;
    return;
  }
  const latest = hands.at(-1);
  const selector = $("recap-select");
  const key = `${state.id}:${hands[0].number}:${latest.number}`;
  if (recapOptionsKey !== key) {
    const selected = recapOptionsKey.startsWith(state.id + ":") ? selector.value : "";
    const recent = element("option", "", `Latest · Hand #${latest.number}`);
    recent.value = "";
    selector.replaceChildren(recent, ...[...hands].reverse().map(hand => {
      const option = element("option", "", "Hand #" + hand.number);
      option.value = hand.number;
      return option;
    }));
    selector.value = hands.some(hand => String(hand.number) === selected) ? selected : "";
    if (!selector.value) replayStep = null;
    recapOptionsKey = key;
  }
  const review = selectedHand(hands);
  const actions = review.actions ?? [];
  const canReplay = actions.length > 0 && review.actionBoardCounts?.length === actions.length;
  const replaying = canReplay && replayStep !== null;
  $("replay-start").hidden = !canReplay || replaying;
  $("download-hand").hidden = replaying;
  $("replay-controls").hidden = !replaying;
  $("recap-players").hidden = replaying && replayStep < actions.length - 1;
  const pots = potBreakdownLines(review, amount => format.format(amount));
  $("recap-pots").hidden = !pots.length || $("recap-players").hidden;
  $("recap-pot-lines").replaceChildren(...pots.map(line => element("li", "", line)));
  $("recap-action").hidden = !actions.length || replaying;
  if (replaying) {
    const action = `${replayStep + 1}/${actions.length} · ${actions[replayStep]}`;
    if ($("replay-action").textContent !== action) $("replay-action").textContent = action;
    $("replay-prev").disabled = replayStep === 0;
    $("replay-next").disabled = replayStep === actions.length - 1;
  }
  $("recap-omitted").hidden = !review.actionsOmitted;
  $("recap-omitted").textContent = review.actionsOmitted
    ? format.format(review.actionsOmitted) + " earlier actions omitted." : "";
  $("recap-actions").replaceChildren(...actions.map(action => element("li", "", action)));
  const board = $("recap-board");
  const revealed = replaying ? review.actionBoardCounts[replayStep] : review.board.length;
  board.hidden = !replaying && !revealed;
  board.replaceChildren(...Array.from({ length: replaying ? 5 : revealed }, (_, index) =>
    card(index < revealed ? review.board[index] : undefined)));
  $("recap-players").replaceChildren(...review.players.map(({ name, hand, amount, cards, bestFive }) => {
    const item = element("li", amount ? "recap-winner" : "");
    const detail = element("div", "recap-detail");
    detail.append(element("strong", "", name));
    if (hand) detail.append(element("span", "", hand));
    if (amount) detail.append(element("span", "recap-award", "+" + format.format(amount) + " chips"));
    item.append(detail);
    if (cards.length) {
      const holeCards = element("div", "cards recap-cards");
      holeCards.append(...cards.map(card));
      item.append(holeCards);
    }
    if (bestFive?.length) {
      const best = element("div", "recap-best");
      const usesBoard = bestFive.every(value => review.board.includes(value));
      best.append(element("span", "", usesBoard ? "Plays the board" : "Best five"));
      const strip = element("div", "cards recap-cards");
      strip.append(...bestFive.map(value => {
        const tile = card(value);
        if (cards.includes(value)) tile.classList.add("best-hole");
        return tile;
      }));
      best.append(strip);
      item.append(best);
    }
    return item;
  }));
}

function renderScoreboard() {
  const players = state?.players.filter(player => player.stats) ?? [];
  $("scoreboard").hidden = !players.length;
  $("scoreboard-players").replaceChildren(...players.sort((a, b) => b.stats.net - a.stats.net).map(player => {
    const row = element("tr");
    const name = element("th", "", player.name);
    name.scope = "row";
    const { played, won, net } = player.stats;
    const chipChange = element("td", net > 0 ? "net-positive" : net < 0 ? "net-negative" : "",
      (net > 0 ? "+" : "") + format.format(net));
    row.append(name, element("td", "", format.format(played)), element("td", "", format.format(won)), chipChange);
    return row;
  }));
}

function render() {
  const seated = state?.index >= 0;
  $("turn-sound").hidden = !seated || !window.AudioContext;
  renderChat(seated && !state.practice);
  renderRecap();
  renderScoreboard();
  $("join").hidden = seated;
  $("actions").hidden = !seated;
  $("jump-to-actions").hidden = !seated;
  $("auto-deal-label").hidden = !state?.practice;
  $("reaction-tray").hidden = !seated;
  $("invite").hidden = !room || missingRoom || Boolean(state?.practice);
  $("exit-practice").hidden = !state?.practice;
  $("new-table").hidden = !missingRoom;
  $("enter").disabled = missingRoom;
  $("enter").textContent = room ? "Join table" : "Create table";
  $("preset-label").hidden = Boolean(room);
  $("practice").hidden = Boolean(room);
  const preview = room ? undefined : TABLE_PRESETS.find(table => table.id === $("preset").value);
  const table = state?.settings ?? preview ?? DEFAULT_TABLE;
  $("stakes").textContent = `${format.format(table.smallBlind)} / ${format.format(table.bigBlind)}`;
  $("rebuy").textContent = "Rebuy · " + format.format(table.startingStack);
  const seatsTaken = state?.practice ? "Heads-up practice" : `${state?.players.length ?? 0} of 6 seats taken`;
  $("room-status").textContent = missingRoom ? "Table unavailable" :
    state?.hand ? `Hand #${state.hand} · ${seatsTaken}` :
      state?.practice ? seatsTaken : `Private table · ${seatsTaken}`;
  const first = seated ? state.index : 0;
  $("seats").classList.toggle("practice-seats", Boolean(state?.practice));
  $("seats").replaceChildren(...Array.from({ length: 6 }, (_, offset) => {
    const index = state?.practice ? (offset === 3 ? 1 : offset === 0 ? 0 : -1) : (first + offset) % 6;
    return seat(state?.players[index], index);
  }));
  $("board").replaceChildren(...Array.from({ length: 5 }, (_, i) => card(state?.board[i])));
  const awarded = state?.payouts?.reduce((total, payout) => total + payout.amount, 0) || 0;
  const pot = awarded || state?.pot || 0;
  const pile = element("span", "chip-pile");
  if (pot >= 20) pile.append(chip("moss"));
  if (pot >= 100) pile.append(chip("ivory"));
  pile.append(chip());
  $("pot").replaceChildren(pile, (awarded ? "Awarded " : "Pot ") + format.format(pot));
  const streets = $("streets");
  const round = ["Preflop", "Flop", "Turn", "River"].indexOf(state?.street);
  streets.hidden = !state?.hand;
  const reached = round === -1 ? Math.max(0, (state?.board.length ?? 0) - 2) : round;
  for (const [index, item] of Array.from(streets.children).entries()) {
    item.classList.toggle("played", index < reached || (round === -1 && index === reached));
    if (index === round) item.setAttribute("aria-current", "step");
    else item.removeAttribute("aria-current");
  }
  $("street").hidden = !state?.result;
  if ($("street").textContent !== (state?.result ?? "")) $("street").textContent = state?.result ?? "";
  $("history").replaceChildren(...(state?.history.length ? [...state.history].reverse() : ["Hands will appear here."])
    .map(line => element("li", "", line)));
  if (!seated) {
    updateTurnCue(false);
    return;
  }
  const betweenHands = state.turn === -1;
  const ready = state.players.filter(player => !player.sittingOut && (player.stack > 0 || player.bot)).length >= 2;
  $("deal").hidden = !(betweenHands && ready && state.index === 0);
  $("review-last").hidden = !(betweenHands && state.recentHands?.length);
  $("back-to-table").hidden = !state.recentHands?.length;
  $("rebuy").hidden = !(betweenHands && state.players[state.index].stack === 0);
  const allowed = state.options;
  $("betting").hidden = !allowed;
  $("raise").hidden = $("raise-sizing").hidden = !allowed?.canRaise;
  const player = state.players[state.index];
  $("presence").hidden = Boolean(state.practice);
  $("presence").textContent = player.sittingOut ? "Return to play" : betweenHands ? "Sit out" : "Sit out next hand";
  $("call").textContent = allowed?.call ? (allowed.call === player.stack ? "Call all-in " : "Call ") + format.format(allowed.call) : "Check";
  if (allowed?.canRaise) {
    const amount = $("amount");
    amount.min = allowed.min;
    amount.max = allowed.max;
    if (!amount.value || Number(amount.value) < allowed.min || Number(amount.value) > allowed.max) amount.value = allowed.min;
    for (const preset of ["min", "half", "pot"]) $("raise-" + preset).hidden = allowed.min === allowed.max;
  } else $("amount").value = "";
  const decision = $("practice-read");
  decision.hidden = !state.practice || !allowed;
  if (!decision.hidden) {
    if (allowed.call) {
      const opponent = state.players.find(other => other.bot);
      const target = percent.format(headsUpCallEquity(state.pot, player.bet, opponent.bet, allowed.call));
      $("practice-read-value").textContent = target + " to break even";
      $("practice-read-explanation").textContent =
        "If there is no further betting, your share of the contestable pot needs to average " + target +
        " to cover the " + format.format(allowed.call) + "-chip call.";
    } else {
      $("practice-read-value").textContent = "Free check";
      $("practice-read-explanation").textContent = "Checking passes the action without committing more chips.";
    }
  }
  updateRaiseLabel();
  updateClock();
}

function updateRaiseLabel() {
  const allowed = state?.options;
  const amount = $("amount");
  const openingBet = state?.street !== "Preflop" && state?.players.every(player => player.bet === 0);
  const verb = openingBet ? "Bet" : "Raise to";
  $("raise-verb").textContent = verb;
  $("raise").textContent = !allowed?.canRaise || !amount.validity.valid ? (openingBet ? "Bet" : "Raise") :
    Number(amount.value) === allowed.max ? "Go all-in" : verb + " " + format.format(Number(amount.value));
}

function updateClock() {
  if (!(state?.index >= 0)) return;
  const seconds = Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000));
  updateTurnCue(Boolean(state.options && seconds > 0));
  const clock = $("turn-clock");
  $("turn-time").hidden = state.turn === -1 || Boolean(state.players[state.turn]?.bot);
  clock.max = state.turnSeconds ?? TURN_SECONDS;
  clock.value = seconds;
  $("turn-time").classList.toggle("urgent", seconds <= 10);
  $("turn-seconds").textContent = seconds + "s";
  $("time-bank").hidden = !state.canExtend || seconds <= 0;
  $("actions").classList.toggle("your-turn", Boolean(state.options));
  $("waiting").textContent = state.options ? "Your turn" :
    state.turn !== -1 ? state.players[state.turn].bot ? state.players[state.turn].name + " is thinking…" :
      state.players[state.turn].name + " to act" :
    state.practice ? state.players[state.index].stack === 0 ? "Rebuy to keep practicing" : "" :
    state.players.filter(player => player.stack > 0 && !player.sittingOut).length < 2 ? "Waiting for two active players with chips" :
    state.index === 0 ? "" : "Waiting for host to deal";
  $("turn-indicator").hidden = !$("waiting").textContent;
}

async function request(path, input) {
  const headers = token ? { authorization: "Bearer " + token } : {};
  if (input) headers["content-type"] = "application/json";
  let response;
  try {
    response = await fetch(api + path, {
      method: input ? "POST" : "GET", headers, body: input && JSON.stringify(input),
      signal: AbortSignal.timeout(8000)
    });
  } catch {
    throw new Error("Couldn’t reach the table. Check your connection and try again.");
  }
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new Error("This table needs the Pepe Poker server. Start the arcade with npm run dev.");
  }
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.error), { status: response.status });
  return result;
}

function resetAutoDeal() {
  autoDealAt = null;
  $("auto-deal-countdown").hidden = true;
}

async function updateAutoDeal() {
  if (!state?.practice || !$("auto-deal").checked || $("deal").hidden ||
      document.hidden || replayStep !== null || busy || pollError) {
    resetAutoDeal();
    return;
  }
  const now = Date.now();
  autoDealAt ??= now + 5000;
  const seconds = Math.ceil((autoDealAt - now) / 1000);
  if (seconds > 0) {
    $("auto-deal-countdown").textContent = "Next hand in " + seconds + "s";
    $("auto-deal-countdown").hidden = false;
    return;
  }
  resetAutoDeal();
  if (!await submit("/" + room + "/deal", {})) $("auto-deal").checked = false;
}

async function poll() {
  updateClock();
  if (!room || busy || polling || missingRoom) return;
  polling = true;
  try {
    const { state: update } = await request("/" + room);
    if (!busy && (!state || update.revision >= state.revision)) {
      if (pollError && $("notice").textContent === pollError) $("notice").textContent = "";
      pollError = "";
      if (JSON.stringify(update) !== JSON.stringify(state)) {
        state = update;
        render();
      }
    }
  } catch (error) {
    if (!busy) {
      pollError = error.message;
      if ($("notice").textContent !== pollError) $("notice").textContent = pollError;
      if (error.status === 404 || error.status === 403) {
        missingRoom = true;
        state = undefined;
        render();
      }
    }
  } finally {
    polling = false;
    void updateAutoDeal();
  }
}

async function submit(path, input) {
  if (busy) return;
  busy = true;
  resetAutoDeal();
  for (const button of document.querySelectorAll(".controls button")) button.disabled = true;
  try {
    const result = await request(path, input);
    state = result.state;
    if (result.token) {
      room = state.id;
      token = result.token;
      try {
        sessionStorage.setItem("pepe-poker:" + room, token);
      } catch { /* The in-memory token still keeps this seat active. */ }
      try {
        const player = state.players[state.index];
        localStorage.setItem(profileKey, JSON.stringify({ name: player.name, avatarId: input.avatarId }));
      } catch { /* A stored profile is optional. */ }
      const url = new URL(location.href);
      url.searchParams.set("room", room);
      history.replaceState(null, "", url);
    }
    $("notice").textContent = "";
    render();
    return true;
  } catch (error) {
    $("notice").textContent = error.message;
    return false;
  } finally {
    busy = false;
    for (const button of document.querySelectorAll(".controls button")) button.disabled = false;
    $("enter").disabled = missingRoom;
  }
}

$("join").addEventListener("submit", event => {
  event.preventDefault();
  if (missingRoom) return;
  const selected = $("avatar-options").querySelector("input:checked");
  const input = {
    name: $("name").value,
    avatarId: selected?.value ?? DEFAULT_AVATAR_ID
  };
  if (!room) {
    input.preset = $("preset").value;
    input.practice = event.submitter === $("practice");
  }
  void submit(room ? "/" + room + "/join" : "", input);
});
$("new-table").onclick = () => {
  room = token = null;
  missingRoom = false;
  pollError = "";
  const url = new URL(location.href);
  url.searchParams.delete("room");
  history.replaceState(null, "", url);
  $("notice").textContent = "";
  $("chat-text").value = "";
  $("chat-notice").textContent = "";
  render();
  $("name").focus();
};
$("amount").addEventListener("input", updateRaiseLabel);
for (const preset of ["min", "half", "pot", "max"]) {
  $("raise-" + preset).onclick = () => {
    const allowed = state?.options;
    if (!allowed?.canRaise) return;
    const committed = state.players[state.index].bet;
    $("amount").value = preset === "half" || preset === "pot"
      ? potRaiseTo(state.pot, committed, allowed, preset === "half" ? .5 : 1)
      : allowed[preset];
    updateRaiseLabel();
  };
}
for (const id of ["deal", "rebuy"]) $(id).onclick = () => submit("/" + room + "/" + id, {});
$("time-bank").textContent = "Time bank +" + TIME_BANK_SECONDS + "s";
$("time-bank").onclick = () => submit("/" + room + "/time-bank", { revision: state.revision });
$("presence").onclick = () => submit("/" + room + "/presence", {
  sittingOut: !state.players[state.index].sittingOut
});
for (const action of ["fold", "call", "raise"]) {
  $(action).onclick = () => {
    if (action === "raise" && !$("amount").reportValidity()) return;
    return submit("/" + room + "/act", { action, revision: state.revision, amount: Number($("amount").value) });
  };
}
$("invite").onclick = () => {
  const url = new URL(location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("room", room);
  $("invite-link").value = url.href;
  $("invite-status").textContent = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
    ? "This local link works on this device." : "";
  $("invite-dialog").showModal();
  $("invite-link").select();
};
$("copy-invite").onclick = async () => {
  try {
    await navigator.clipboard.writeText($("invite-link").value);
    $("invite-status").textContent = "Link copied.";
  } catch {
    $("invite-link").focus();
    $("invite-link").select();
    $("invite-status").textContent = "Copy the selected link.";
  }
};

async function sendReaction(reaction) {
  if (!(state?.index >= 0) || reacting) return;
  reacting = true;
  const buttons = $("reaction-options").querySelectorAll("button");
  for (const button of buttons) button.disabled = true;
  try {
    await request("/" + room + "/react", { reaction: reaction.id });
    void poll();
    setTimeout(() => {
      reacting = false;
      for (const button of buttons) button.disabled = false;
    }, REACTION_COOLDOWN);
  } catch (error) {
    reacting = false;
    for (const button of buttons) button.disabled = false;
    $("notice").textContent = error.message;
  }
}

$("chat-form").addEventListener("submit", async event => {
  event.preventDefault();
  if (sendingChat || !(state?.index >= 0)) return;
  const input = $("chat-text");
  const draft = input.value;
  if (!draft.trim()) return;
  sendingChat = true;
  $("chat-send").disabled = true;
  try {
    await request("/" + room + "/chat", { text: draft });
    if (input.value === draft) input.value = "";
    $("chat-notice").textContent = "";
    void poll();
  } catch (error) {
    $("chat-notice").textContent = error.message;
  } finally {
    sendingChat = false;
    $("chat-send").disabled = false;
  }
});

for (const reaction of REACTIONS) {
  const button = element("button", "reaction-button");
  button.type = "button";
  button.append(reactionImage(reaction, "", ""), element("span", "", reaction.label));
  button.onclick = () => sendReaction(reaction);
  $("reaction-options").append(button);
}

for (const table of TABLE_PRESETS) {
  const choice = element("option", "", `${table.label} · ${table.smallBlind}/${table.bigBlind} · ${format.format(table.startingStack)} chips`);
  choice.value = table.id;
  $("preset").append(choice);
}
$("preset").addEventListener("change", render);
$("review-last").onclick = () => {
  const latest = state?.recentHands?.at(-1);
  if (!latest) return;
  $("recap-select").value = latest.number;
  replayStep = null;
  if (state.practice) {
    $("auto-deal").checked = false;
    resetAutoDeal();
  }
  renderRecap();
  $("recap-title").focus();
};
$("back-to-table").onclick = () => {
  const next = ["call", "deal", "review-last"].map($).find(button => button.checkVisibility());
  (next ?? $("actions")).focus();
};
$("recap-select").addEventListener("change", () => {
  replayStep = null;
  renderRecap();
});
$("replay-start").onclick = () => {
  const selector = $("recap-select");
  if (!selector.value) selector.value = state.recentHands.at(-1).number;
  replayStep = 0;
  resetAutoDeal();
  renderRecap();
  $("replay-next").focus();
};
$("replay-prev").onclick = () => { replayStep--; renderRecap(); };
$("replay-next").onclick = () => { replayStep++; renderRecap(); };
$("replay-end").onclick = () => {
  replayStep = null;
  renderRecap();
  $("replay-start").focus();
};
$("download-hand").onclick = () => {
  const hand = selectedHand(state?.recentHands ?? []);
  if (!hand) return;
  const file = new Blob([formatHandExport(hand)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(file);
  const link = element("a");
  link.href = url;
  link.download = "pepe-poker-hand-" + hand.number + ".txt";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$("turn-sound").setAttribute("aria-pressed", String(turnSound));
$("turn-sound").onclick = async () => {
  turnSound = !turnSound;
  $("turn-sound").setAttribute("aria-pressed", String(turnSound));
  try {
    localStorage.setItem(soundKey, turnSound ? "on" : "off");
  } catch { /* The toggle still applies to this tab. */ }
  if (turnSound) {
    await enableAudio();
    playTurnSound();
  }
};
document.addEventListener("pointerdown", enableAudio);
document.addEventListener("keydown", enableAudio);
document.addEventListener("visibilitychange", updateClock);
document.addEventListener("visibilitychange", resetAutoDeal);
$("auto-deal").addEventListener("change", resetAutoDeal);
$("raise-sizing").open = matchMedia("(min-width: 651px)").matches;
buildAvatarPicker();
render();
void poll();
setInterval(poll, 1000);
