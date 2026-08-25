import { useEffect, useState } from "react";
import { socket } from "./lib/socket";
import { getAnonId } from "./lib/anonId";
import LandingScreen from "./components/LandingScreen";
import LobbyScreen from "./components/LobbyScreen";
import MovieSearchScreen from "./components/MovieSearchScreen";
import GameplayScreen from "./components/GameplayScreen";
import RoundEndScreen from "./components/RoundEndScreen";
import GameOverScreen from "./components/GameOverScreen";

function App() {
  const [room, setRoom] = useState(null);
  const [myAnonId] = useState(() => getAnonId());
  const [guessError, setGuessError] = useState(null);

  useEffect(() => {
    function onRoomState(newRoom) {
      setRoom(newRoom);
    }
    function onRoomError({ message }) {
      alert(message);
    }
    function onGuessError({ message }) {
      setGuessError(message);
      setTimeout(() => setGuessError(null), 4000); // auto-dismiss
    }

    socket.on("room:state", onRoomState);
    socket.on("room:error", onRoomError);
    socket.on("guess:error", onGuessError);

    return () => {
      socket.off("room:state", onRoomState);
      socket.off("room:error", onRoomError);
      socket.off("guess:error", onGuessError);
    };
  }, []);

  function handleCreateRoom(name, settings) {
    socket.emit("room:create", { name, anonId: myAnonId, settings });
  }

  function handleJoinRoom(name, code) {
    socket.emit("room:join", { code, name, anonId: myAnonId });
  }

  function handleStartGame() {
    socket.emit("game:start", { code: room.code, anonId: myAnonId });
  }

  function handlePlayAgain() {
    socket.emit("game:playAgain", { code: room.code, anonId: myAnonId });
  }

  function handleBack() {
    setRoom(null);
  }

  function handleStartRound(payload) {
    socket.emit("game:startRound", {
      code: room.code,
      anonId: myAnonId,
      film: payload.film,
      hints: payload.hints,
    });
  }

  function handleSubmitGuess(text) {
    socket.emit("guess:submit", { code: room.code, anonId: myAnonId, text });
  }

  function handleRevealHint(hintIndex) {
    socket.emit("hint:reveal", { code: room.code, anonId: myAnonId, hintIndex });
  }

  function handleRequestBonus() {
    socket.emit("bonus:request", { code: room.code, anonId: myAnonId });
  }

  if (!room) {
    return (
      <LandingScreen onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />
    );
  }

  const isHost = room.players[0]?.anonId === myAnonId;

  if (room.phase === "lobby") {
    return (
      <LobbyScreen
        room={room}
        isHost={isHost}
        onStartGame={handleStartGame}
        onBack={handleBack}
      />
    );
  }

  if (room.phase === "picking") {
    const giver = room.players[room.giverIndex];
    const isGiver = giver?.anonId === myAnonId;

    if (isGiver) {
      return <MovieSearchScreen onStartRound={handleStartRound} />;
    }

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-on-surface">
        <span
          className="material-symbols-outlined text-primary text-6xl mb-4 animate-pulse"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          movie_filter
        </span>
        <h2 className="font-headline-md text-2xl mb-2">
          Waiting for {giver?.name || "the giver"}...
        </h2>
        <p className="text-on-surface-variant font-body-md italic">
          They are picking a movie and crafting hints.
        </p>
      </div>
    );
  }

  if (room.phase === "guessing") {
    const giver = room.players[room.giverIndex];
    const isGiver = giver?.anonId === myAnonId;

    return (
      <GameplayScreen
        role={isGiver ? "giver" : "guesser"}
        movieTitle={room.movieTitle}
        hints={room.hints}
        revealedHints={room.revealedHints}
        roundStartedAt={room.roundStartedAt}
        guesses={room.guesses}
        players={room.players}
        myAnonId={myAnonId}
        round={room.round}
        maxRounds={room.maxRounds}
        onSubmitGuess={handleSubmitGuess}
        onRevealHint={handleRevealHint}
        onRequestBonus={handleRequestBonus}
        guessError={guessError}
      />
    );
  }

  if (room.phase === "roundend") {
    return <RoundEndScreen result={room.lastRoundResult} players={room.players} />;
  }

  if (room.phase === "gameover") {
    return (
      <GameOverScreen
        players={room.players}
        isHost={isHost}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center text-on-surface">
      <p>Game phase "{room.phase}" — not built yet.</p>
    </div>
  );
}

export default App;