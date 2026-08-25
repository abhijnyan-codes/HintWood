import { useState, useEffect } from "react";

const ROUND_END_DELAY_SECONDS = 5;

export default function RoundEndScreen({ result, players }) {
  const [secondsLeft, setSecondsLeft] = useState(ROUND_END_DELAY_SECONDS);

  // Purely visual countdown — the SERVER is what actually advances the
  // round after its own 5-second timer. This just shows the same number
  // ticking down so it doesn't feel like a frozen screen.
  useEffect(() => {
    setSecondsLeft(ROUND_END_DELAY_SECONDS);
    const tick = setInterval(() => {
      setSecondsLeft((s) => Math.max(s - 1, 0));
    }, 1000);
    return () => clearInterval(tick);
  }, [result]);

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-background text-on-surface flex items-center justify-center px-5">
      <div
        className="w-full max-w-md border border-primary-container rounded-md p-8 text-center"
        style={{ backgroundColor: "#1c1c16" }}
      >
        <h1 className="font-display text-3xl text-primary mb-6">Round Complete!</h1>

        {result?.moviePoster && (
          <img
            src={result.moviePoster}
            alt=""
            className="w-28 mx-auto rounded-md border border-outline-variant mb-4"
          />
        )}

        <p className="font-body text-lg text-on-surface mb-1">
          The movie was: <span className="text-primary font-medium">{result?.movieTitle}</span>
        </p>
        <p className="font-body text-sm text-on-surface-variant italic mb-8">
          {result?.winnerName ? `${result.winnerName} got it right! 🎉` : "Nobody guessed in time."}
        </p>

        <div className="border-t border-outline-variant/30 pt-6">
          <h2 className="font-caption text-xs uppercase tracking-widest text-on-surface-variant mb-3">
            Leaderboard
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

        <p className="text-xs text-outline mt-8 italic">
          Next round starting in {secondsLeft}s…
        </p>
      </div>
    </div>
  );
}