import { randomBytes } from "node:crypto";
import { AVATARS, DEFAULT_AVATAR_ID } from "./avatar-catalog.mjs";
import { act, evaluate, handCategory, labels, livePotBreakdown, log, options, ranks, startHand } from "./holdem.mjs";
import { DEFAULT_TABLE, TABLE_PRESETS, TIME_BANK_SECONDS } from "./table-settings.mjs";
import { REACTIONS, REACTION_COOLDOWN, REACTION_DURATION } from "./reaction-catalog.mjs";

const rooms = new Map();
const id = () => randomBytes(18).toString("base64url");
const roomLifetime = 12 * 60 * 60 * 1000;
const avatarIds = new Set(AVATARS.map(avatar => avatar.id));
const reactionIds = new Set(REACTIONS.map(reaction => reaction.id));

function reply(response, status, data) {
  response.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  response.end(JSON.stringify(data));
}

async function body(request) {
  const chunks = [];
  let bytes = 0;
  for await (const part of request) {
    const chunk = Buffer.isBuffer(part) ? part : Buffer.from(part);
    bytes += chunk.length;
    if (bytes > 2048) throw new Error("Request is too large.");
    chunks.push(chunk);
  }
  const input = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  if (input === null || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid request.");
  return input;
}

function addPlayer(room, name, avatarId = DEFAULT_AVATAR_ID, bot = false) {
  if (room.players.length >= 8) throw new Error("This table is full (8 players maximum).");
  if (typeof name !== "string" || !name.trim() || name.trim().length > 20) throw new Error("Enter a name with 1–20 characters.");
  if (room.players.some(player => player.name.toLowerCase() === name.trim().toLowerCase())) throw new Error("That name is already seated.");
  if (!avatarIds.has(avatarId)) throw new Error("Choose an avatar from the gallery.");
  const token = bot ? null : id();
  const { startingStack } = room.settings;
  const player = { token, bot, name: name.trim(), avatarId, stack: startingStack, chipsBought: startingStack, cards: [], folded: true, bet: 0, total: 0 };
  room.players.push(player);
  log(room, player.name + " took a seat.");
  return token;
}

function rebuy(room, player) {
  const { startingStack } = room.settings;
  player.stack = startingStack;
  player.chipsBought += startingStack;
  log(room, player.name + " rebuys for " + startingStack + ".");
}

function advanceClock(room) {
  if (room.turn === -1) return;
  const now = Date.now();
  const player = room.players[room.turn];
  const allowed = options(room, room.turn);
  if (player.bot) {
    if (now < room.botReadyAt) return;
    const [first, second] = player.cards.map(card => card[0]);
    const pair = first === second;
    const strong = room.board.length ? handCategory(evaluate([...player.cards, ...room.board])) >= 2 :
      (pair && ranks.indexOf(first) >= 6) || (ranks.indexOf(first) >= 9 && ranks.indexOf(second) >= 9);
    const blind = room.settings.bigBlind;
    if (strong && allowed.canRaise && allowed.min - player.bet <= Math.min(4 * blind, player.stack)) {
      act(room, room.turn, "raise", allowed.min);
    } else {
      act(room, room.turn, !strong && allowed.call > (pair ? 5 : 3) * blind ? "fold" : "call");
    }
  } else {
    if (now < room.deadline) return;
    act(room, room.turn, allowed.call ? "fold" : "call");
  }
  room.botReadyAt = now + 900;
  room.revision++;
}

function state(room, index) {
  const now = Date.now();
  const viewer = room.players[index];
  const yourHand = room.turn !== -1 && room.board.length >= 3 && viewer?.cards.length === 2 && !viewer.folded
    ? labels[handCategory(evaluate([...viewer.cards, ...room.board]))]
    : null;
  return {
    id: room.id, index, maxSeats: 8, practice: room.practice, settings: room.settings, hand: room.hand, street: room.street, board: room.board, result: room.result,
    revision: room.revision, deadline: room.turn === -1 ? null : room.deadline,
    turnSeconds: room.turnSeconds,
    canExtend: index >= 0 && room.turn === index && !room.players[index].usedTimeBank,
    button: room.button, smallBlind: room.smallBlind ?? -1, bigBlind: room.bigBlind ?? -1,
    turn: room.turn, history: room.history, payouts: room.payouts ?? [], recap: room.recap ?? [],
    recentHands: room.recentHands ?? [],
    chat: index >= 0 ? room.chat : [],
    pot: room.players.reduce((sum, player) => sum + player.total, 0),
    potBreakdown: room.turn === -1 ? null : livePotBreakdown(room.players),
    players: room.players.map(({ name, avatarId, bot, stack, cards, bet, total, folded, reaction, chipsBought, handsPlayed, handsWon, sittingOut, lastAction }, seat) => ({
      name, avatarId, bot, stack, bet, folded,
      lastAction: lastAction ?? null,
      sittingOut: Boolean(sittingOut),
      stats: { played: handsPlayed ?? 0, won: handsWon ?? 0, net: stack + total - chipsBought },
      reaction: reaction?.expires > now ? reaction.id : null,
      cards: index === seat || (room.showdown && !folded) ? cards : cards.map(() => null)
    })),
    yourHand, options: options(room, index)
  };
}

export async function pokerRequest(request, response, pathname) {
  try {
    if (pathname === "/api/pepe-poker" && request.method === "POST") {
      const input = await body(request);
      for (const [key, room] of rooms) {
        if (Date.now() - room.touched > roomLifetime) rooms.delete(key);
      }
      if (rooms.size >= 500) throw new Error("The room server is full.");
      const preset = input.preset === undefined ? DEFAULT_TABLE : TABLE_PRESETS.find(table => table.id === input.preset);
      if (!preset) throw new Error("Choose a valid table format.");
      const room = {
        id: id(), practice: input.practice === true, settings: preset, players: [], board: [], history: [], turn: -1, button: -1, revision: 0,
        hand: 0, street: "Waiting for players", result: "", chat: [], touched: Date.now()
      };
      const token = addPlayer(room, input.name, input.avatarId);
      if (room.practice) {
        const botName = room.players[0].name.toLowerCase() === "kekbot" ? "River Pepe" : "Kekbot";
        addPlayer(room, botName, "mecha", true);
      }
      rooms.set(room.id, room);
      return reply(response, 201, { token, state: state(room, 0) });
    }
    const match = /^\/api\/pepe-poker\/([\w-]+)(?:\/(join|deal|act|rebuy|react|chat|presence|time-bank))?$/.exec(pathname);
    const room = match && rooms.get(match[1]);
    if (!room || Date.now() - room.touched > roomLifetime) {
      if (room) rooms.delete(room.id);
      return reply(response, 404, { error: "Room not found. Check the invite link or create a table." });
    }
    const operation = match[2];
    if (request.method !== (operation ? "POST" : "GET")) return reply(response, 405, { error: "Method not allowed." });
    const token = request.headers.authorization?.replace(/^Bearer /, "");
    const index = token ? room.players.findIndex(player => player.token === token) : -1;
    if (room.practice && (index < 0 || operation === "join")) {
      return reply(response, 403, { error: "This practice table is only for its host." });
    }
    const input = operation ? await body(request) : null;
    advanceClock(room);
    if (operation === "join") {
      const token = addPlayer(room, input.name, input.avatarId);
      room.revision++;
      room.touched = Date.now();
      return reply(response, 200, { token, state: state(room, room.players.length - 1) });
    }
    if (operation && index < 0) return reply(response, 403, { error: "Join the room to play." });
    if (operation === "presence") {
      if (room.practice) throw new Error("Use Exit practice to leave a practice table.");
      if (typeof input.sittingOut !== "boolean") throw new Error("Choose whether to sit out.");
      room.players[index].sittingOut = input.sittingOut;
      room.touched = Date.now();
      return reply(response, 200, { state: state(room, index) });
    }
    if (operation === "chat") {
      const text = typeof input.text === "string" ? input.text.trim() : "";
      if (!text || text.length > 240 || /[\u0000-\u001f\u007f]/.test(text)) {
        throw new Error("Enter a single-line message of 1–240 characters.");
      }
      const now = Date.now();
      const player = room.players[index];
      if (player.nextChatAt > now) return reply(response, 429, { error: "Wait a moment before sending another message." });
      const message = { id: (room.chat.at(-1)?.id ?? 0) + 1, name: player.name, text };
      room.chat.push(message);
      if (room.chat.length > 50) room.chat.shift();
      player.nextChatAt = now + 750;
      room.touched = now;
      return reply(response, 201, { message });
    }
    if (operation === "react") {
      if (!reactionIds.has(input.reaction)) throw new Error("Choose a table reaction.");
      const player = room.players[index];
      const now = Date.now();
      if (player.reaction?.nextAllowed > now) return reply(response, 429, { error: "Give it a moment before reacting again." });
      player.reaction = { id: input.reaction, nextAllowed: now + REACTION_COOLDOWN, expires: now + REACTION_DURATION };
      room.touched = now;
      return reply(response, 200, { state: state(room, index) });
    }
    if (operation === "deal") {
      if (index !== 0) throw new Error("Only the host can deal.");
      const bot = room.practice ? room.players[1] : null;
      if (room.turn === -1 && room.players[0].stack > 0 && bot?.stack === 0) {
        rebuy(room, bot);
      }
      startHand(room);
      room.botReadyAt = Date.now() + 900;
    } else if (operation === "time-bank") {
      if (input.revision !== room.revision || index !== room.turn) throw new Error("The table moved on. Try again.");
      const player = room.players[index];
      if (player.usedTimeBank) throw new Error("You already used your time bank this hand.");
      player.usedTimeBank = true;
      room.turnSeconds += TIME_BANK_SECONDS;
      room.deadline += TIME_BANK_SECONDS * 1000;
    } else if (operation === "act") {
      if (input.revision !== room.revision) throw new Error("The table moved on. Try again.");
      act(room, index, input.action, input.amount);
      room.botReadyAt = Date.now() + 900;
    } else if (operation === "rebuy") {
      if (room.turn !== -1 || room.players[index].stack !== 0) throw new Error("Rebuy between hands when your stack is empty.");
      rebuy(room, room.players[index]);
    }
    if (operation) room.revision++;
    if (index >= 0) room.touched = Date.now();
    return reply(response, 200, { state: state(room, index) });
  } catch (error) {
    return reply(response, 400, { error: error instanceof SyntaxError ? "Invalid request." : error.message });
  }
}
