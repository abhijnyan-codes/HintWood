const {
  createRoom,
  getRoom,
  addPlayerToRoom,
  removePlayerBySocketId,
  makePlayer,
  resetRoomForNewGame,
} = require("./roomManager");

const autoRevealTimeouts = {};
const roundEndTimeouts = {};
const roundAdvanceTimeouts = {};

const ROUND_DURATION_MS = 60000;
const ROUND_DURATION_SECONDS = 60;
const AUTO_REVEAL_AT_MS = 30000;
const ROUND_END_DELAY_MS = 5000;
const BONUS_HINT_PENALTY_SECONDS = 15;
const STREAK_CHECKPOINT_EVERY = 3;
const BONUS_HINT_INDEX = 5; // the 6th hint, the "Famous Song" card

function broadcastRoomState(io, code) {
  const room = getRoom(code);
  if (!room) return;
  io.to(code).emit("room:state", room);
}

function clearAllRoomTimers(code) {
  if (autoRevealTimeouts[code]) {
    clearTimeout(autoRevealTimeouts[code]);
    delete autoRevealTimeouts[code];
  }
  if (roundEndTimeouts[code]) {
    clearTimeout(roundEndTimeouts[code]);
    delete roundEndTimeouts[code];
  }
}

function clearRoundAdvanceTimer(code) {
  if (roundAdvanceTimeouts[code]) {
    clearTimeout(roundAdvanceTimeouts[code]);
    delete roundAdvanceTimeouts[code];
  }
}

function advanceToNextRound(io, code) {
  const room = getRoom(code);
  if (!room) return;

  if (room.round >= room.maxRounds) {
    room.phase = "gameover";
    broadcastRoomState(io, code);
    return;
  }

  room.round += 1;
  room.giverIndex = (room.giverIndex + 1) % room.players.length;
  room.movieTitle = null;
  room.moviePoster = null;
  room.hints = [];
  room.revealedHints = [];
  room.roundStartedAt = null;
  room.guesses = [];
  room.lastRoundResult = null;
  room.phase = "picking";

  broadcastRoomState(io, code);
}

// UPDATED: Dynamic Scoring added to endRound!
function endRound(io, code, winnerAnonId) {
  const room = getRoom(code);
  if (!room) return;

  clearAllRoomTimers(code);

  let winnerName = null;

  if (winnerAnonId) {
    const winner = room.players.find((p) => p.anonId === winnerAnonId);
    if (winner) {
      // SCORING MATH: 100 + (remaining seconds * 2)
      const elapsedSeconds = Math.floor((Date.now() - room.roundStartedAt) / 1000);
      const remainingSeconds = Math.max(ROUND_DURATION_SECONDS - elapsedSeconds, 0);
      const timeBonus = remainingSeconds * 2; // Change this 2 to whatever multiplier you want!
      const pointsEarned = 100 + timeBonus;
      
      winner.score += pointsEarned;
      winnerName = winner.name;
    }
  } else {
    // If nobody guessed it, Giver gets 60 points
    const giver = room.players[room.giverIndex];
    if (giver) giver.score += 60;
  }

  room.players.forEach((p) => {
    p.freeBonusAvailable = false;
  });

  room.lastRoundResult = {
    movieTitle: room.movieTitle,
    moviePoster: room.moviePoster,
    winnerName,
  };
  room.phase = "roundend";

  broadcastRoomState(io, code);

  clearRoundAdvanceTimer(code);
  roundAdvanceTimeouts[code] = setTimeout(() => {
    advanceToNextRound(io, code);
  }, ROUND_END_DELAY_MS);
}

function registerSocketHandlers(io, socket) {
  socket.on("room:create", ({ name, anonId, settings }) => {
    const hostPlayer = makePlayer({ anonId, name, socketId: socket.id });
    const room = createRoom(hostPlayer, settings);
    socket.join(room.code);
    socket.emit("room:created", { code: room.code });
    broadcastRoomState(io, room.code);
  });

  socket.on("room:join", ({ code, name, anonId }) => {
    const result = addPlayerToRoom(code, { anonId, name, socketId: socket.id });

    if (!result) {
      socket.emit("room:error", { message: "Room not found" });
      return;
    }
    if (result === "full") {
      socket.emit("room:error", { message: "This room is full" });
      return;
    }

    socket.join(code);
    broadcastRoomState(io, code);
  });

  socket.on("game:start", ({ code, anonId }) => {
    const room = getRoom(code);
    if (!room) return;
    const isHost = room.players[0]?.anonId === anonId;
    if (!isHost) return;
    room.phase = "picking";
    broadcastRoomState(io, code);
  });

  socket.on("game:playAgain", ({ code, anonId }) => {
    const room = getRoom(code);
    if (!room) return;
    const isHost = room.players[0]?.anonId === anonId;
    if (!isHost) return;

    clearAllRoomTimers(code);
    clearRoundAdvanceTimer(code);
    resetRoomForNewGame(code);
    broadcastRoomState(io, code);
  });

  socket.on("game:startRound", ({ code, anonId, film, hints }) => {
    const room = getRoom(code);
    if (!room) return;

    const giver = room.players[room.giverIndex];
    const isGiver = giver?.anonId === anonId;
    if (!isGiver) return;

    room.movieTitle = film.title;
    room.moviePoster = film.posterPath || null;
    room.hints = hints; // Supports our 6 new hints!
    room.revealedHints = hints.map(() => false);
    room.roundStartedAt = Date.now();
    room.guesses = [];
    room.phase = "guessing";

    room.players.forEach((p) => {
      p.guessDeadlineSeconds = ROUND_DURATION_SECONDS - p.pendingTimePenalty;
      p.pendingTimePenalty = 0;
    });

    if (room.round % STREAK_CHECKPOINT_EVERY === 0) {
      const leader = [...room.players].sort((a, b) => b.score - a.score)[0];
      if (leader) leader.freeBonusAvailable = true;
    }

    broadcastRoomState(io, code);
    clearAllRoomTimers(code);

    autoRevealTimeouts[code] = setTimeout(() => {
      const r = getRoom(code);
      if (!r || r.phase !== "guessing") return;
      if (r.revealedHints.length > 3) r.revealedHints[3] = true;
      if (r.revealedHints.length > 4) r.revealedHints[4] = true;
      broadcastRoomState(io, code);
    }, AUTO_REVEAL_AT_MS);

    roundEndTimeouts[code] = setTimeout(() => {
      endRound(io, code, null);
    }, ROUND_DURATION_MS);
  });

  // Hints 0/1/2 — manual, tap to reveal, free, any player.
  socket.on("hint:reveal", ({ code, anonId, hintIndex }) => {
    const room = getRoom(code);
    if (!room || room.phase !== "guessing") return;

    const player = room.players.find((p) => p.anonId === anonId);
    if (!player) return;

    if (hintIndex < 0 || hintIndex > 2) return;
    if (room.revealedHints[hintIndex]) return;

    room.revealedHints[hintIndex] = true;
    broadcastRoomState(io, code);
  });

  socket.on("bonus:request", ({ code, anonId }) => {
    const room = getRoom(code);
    if (!room || room.phase !== "guessing") return;

    const player = room.players.find((p) => p.anonId === anonId);
    if (!player) return;

    const giver = room.players[room.giverIndex];
    if (giver?.anonId === anonId) return;

    if (room.revealedHints[BONUS_HINT_INDEX]) return; 

    room.revealedHints[BONUS_HINT_INDEX] = true;

    if (player.freeBonusAvailable) {
      player.freeBonusAvailable = false;
    } else {
      player.pendingTimePenalty = BONUS_HINT_PENALTY_SECONDS;
    }

    broadcastRoomState(io, code);
  });

  socket.on("guess:submit", ({ code, anonId, text }) => {
    const room = getRoom(code);
    if (!room || room.phase !== "guessing") return;

    const player = room.players.find((p) => p.anonId === anonId);
    if (!player) return;

    const giver = room.players[room.giverIndex];
    if (giver?.anonId === anonId) return;

    const elapsedSeconds = (Date.now() - room.roundStartedAt) / 1000;
    if (elapsedSeconds > player.guessDeadlineSeconds) {
      socket.emit("guess:error", {
        message: "Your guess window closed early (bonus hint penalty).",
      });
      return;
    }

    const isCorrect = text.trim().toLowerCase() === (room.movieTitle || "").trim().toLowerCase();

    if (isCorrect) {
      room.guesses.push({ type: "correct", anonId, name: player.name });
      broadcastRoomState(io, code);
      endRound(io, code, anonId);
    } else {
      room.guesses.push({ type: "wrong", anonId, name: player.name, text });
      broadcastRoomState(io, code);
    }
  });

  socket.on("disconnect", () => {
    removePlayerBySocketId(socket.id);
    console.log(`Socket disconnected: ${socket.id}`);
  });
}

module.exports = registerSocketHandlers;