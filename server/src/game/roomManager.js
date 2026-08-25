const { customAlphabet } = require("nanoid");

const generateCode = customAlphabet("ABCDEFGHJKMNPQRSTUVWXYZ23456789", 6);

const rooms = {};

function createRoom(hostPlayer, settings = {}) {
  let code = generateCode();
  while (rooms[code]) {
    code = generateCode();
  }

  rooms[code] = {
    code,
    phase: "lobby",
    players: [hostPlayer],
    giverIndex: 0,
    round: 1,
    maxRounds: settings.maxRounds || 6,
    maxPlayers: settings.maxPlayers || 8,
    movieTitle: null,
    moviePoster: null,
    industry: null,
    hints: [],
    revealedHints: [],
    roundStartedAt: null,
    guesses: [],
    bonusUsedThisRound: false,
  };

  return rooms[code];
}

function getRoom(code) {
  return rooms[code];
}

// Every player now also tracks:
// - pendingTimePenalty: seconds to dock from their guess window NEXT round
//   (from using a bonus hint without a free pass)
// - freeBonusAvailable: true if they're the streak-leader reward recipient
//   for the current round
// - guessDeadlineSeconds: computed at the start of each round they play as
//   guesser — how many seconds into the round their guesses stop counting
function makePlayer({ anonId, name, socketId }) {
  return {
    anonId,
    name,
    socketId,
    score: 0,
    pendingTimePenalty: 0,
    freeBonusAvailable: false,
    guessDeadlineSeconds: 60,
  };
}

function addPlayerToRoom(code, newPlayerInfo) {
  const room = rooms[code];
  if (!room) return null;

  const existingIndex = room.players.findIndex(
    (p) => p.anonId === newPlayerInfo.anonId
  );

  if (existingIndex !== -1) {
    room.players[existingIndex] = {
      ...room.players[existingIndex],
      name: newPlayerInfo.name,
      socketId: newPlayerInfo.socketId,
    };
    return room;
  }

  if (room.players.length >= room.maxPlayers) {
    return "full";
  }

  room.players.push(makePlayer(newPlayerInfo));
  return room;
}

function removePlayerBySocketId(socketId) {
  for (const code of Object.keys(rooms)) {
    const room = rooms[code];
    room.players = room.players.filter((p) => p.socketId !== socketId);
    if (room.players.length === 0) {
      delete rooms[code];
    }
  }
}

// Resets a finished room back into a fresh game: same room code, same
// players, everyone's score and per-round state cleared, phase back to
// "lobby" so the existing App.jsx phase-routing handles the rest for free.
function resetRoomForNewGame(code) {
  const room = rooms[code];
  if (!room) return null;

  room.phase = "lobby";
  room.round = 1;
  room.giverIndex = 0;
  room.movieTitle = null;
  room.moviePoster = null;
  room.industry = null;
  room.hints = [];
  room.revealedHints = [];
  room.roundStartedAt = null;
  room.guesses = [];
  room.bonusUsedThisRound = false;
  room.lastRoundResult = null;

  room.players.forEach((p) => {
    p.score = 0;
    p.pendingTimePenalty = 0;
    p.freeBonusAvailable = false;
    p.guessDeadlineSeconds = 60;
  });

  return room;
}

module.exports = {
  createRoom,
  getRoom,
  addPlayerToRoom,
  removePlayerBySocketId,
  makePlayer,
  resetRoomForNewGame,
};