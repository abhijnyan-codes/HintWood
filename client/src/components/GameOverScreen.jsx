export default function GameOverScreen({ players, isHost, onPlayAgain }) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  return (
    <div className="min-h-screen bg-background text-on-surface flex items-center justify-center px-5">
      <div
        className="w-full max-w-md border border-primary-container rounded-md p-8 text-center"
        style={{ backgroundColor: "#1c1c16" }}
      >
        <h1 className="font-display text-4xl text-primary mb-2">Game Over!</h1>
        {winner && (
          <p className="font-body text-lg text-on-surface-variant mb-8">
            🏆 <span className="text-primary font-medium">{winner.name}</span> wins with{" "}
            {winner.score} points!
          </p>
        )}

        <div className="border-t border-outline-variant/30 pt-6">
          <h2 className="font-caption text-xs uppercase tracking-widest text-on-surface-variant mb-3">
            Final Standings
          </h2>
          <div className="space-y-2">
            {sortedPlayers.map((p, i) => (
              <div key={p.socketId} className="flex justify-between text-sm px-2">
                <span className={i === 0 ? "text-primary font-medium" : ""}>
                  {i + 1}. {p.name}
                </span>
                <span className={i === 0 ? "text-primary font-medium" : "text-on-surface-variant"}>
                  {p.score} pts
                </span>
              </div>
            ))}
          </div>
        </div>

        {isHost ? (
          <button
            onClick={onPlayAgain}
            className="mt-8 px-6 py-3 bg-primary text-on-primary rounded-md font-label-md uppercase tracking-wider hover:bg-primary-container transition-colors"
          >
            Play Again
          </button>
        ) : (
          <p className="text-xs text-outline mt-8 italic">
            Waiting for the host to start a new game…
          </p>
        )}
      </div>
    </div>
  );
}