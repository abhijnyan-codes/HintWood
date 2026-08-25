import { useState, useEffect, useMemo } from "react";

const ROUND_DURATION_SECONDS = 60;
const AUTO_REVEAL_AT_SECONDS = 30;
const LETTER_REVEAL_AFTER_HINTS = 2;

function splitIntoWords(title) {
  return (title || "").split(" ").map((word) => word.split(""));
}

function getLetterRevealCount(title) {
  const letterCount = (title || "").replace(/ /g, "").length;
  if (letterCount <= 1) return 0;
  if (letterCount <= 5) return 1;
  if (letterCount <= 10) return 2;
  if (letterCount <= 20) return 3;
  return 4;
}

function useRandomRevealPositions(title) {
  return useMemo(() => {
    const words = splitIntoWords(title);
    const flatPositions = [];
    words.forEach((word, wordIdx) => {
      word.forEach((_, letterIdx) => {
        flatPositions.push(`${wordIdx}-${letterIdx}`);
      });
    });

    for (let i = flatPositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [flatPositions[i], flatPositions[j]] = [flatPositions[j], flatPositions[i]];
    }

    const count = getLetterRevealCount(title);
    return new Set(flatPositions.slice(0, count));
  }, [title]);
}

function getBoxSizeClasses(title) {
  const letterCount = (title || "").replace(/ /g, "").length;
  if (letterCount <= 12) return { box: "w-8 h-10 md:w-9 md:h-11 text-xl", gap: "gap-1.5" };
  if (letterCount <= 22) return { box: "w-6 h-8 md:w-7 md:h-9 text-base", gap: "gap-1" };
  return { box: "w-5 h-7 text-sm", gap: "gap-0.5" };
}

function TitleBoxes({ title, revealedCount }) {
  const words = splitIntoWords(title);
  const showLetters = revealedCount >= LETTER_REVEAL_AFTER_HINTS;
  const { box, gap } = getBoxSizeClasses(title);
  const revealedPositions = useRandomRevealPositions(title);

  return (
    <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 py-4 max-w-full">
      {words.map((letters, wordIdx) => (
        <div key={wordIdx} className={`flex ${gap} flex-wrap`}>
          {letters.map((letter, i) => {
            const isRevealed = showLetters && revealedPositions.has(`${wordIdx}-${i}`);
            return (
              <div
                key={i}
                className={`${box} flex items-center justify-center border-b-2 border-outline-variant font-display text-primary uppercase shrink-0`}
              >
                {isRevealed ? letter : ""}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function SafeImage({ src, alt, className }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`${className} flex items-center justify-center bg-surface-container-high text-on-surface-variant text-xs italic`}>
        unavailable
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

function CardCorners() {
  const cornerBase = "absolute w-3 h-3 border-primary-container/60";
  return (
    <>
      <div className={`${cornerBase} top-2 left-2 border-t border-l`} />
      <div className={`${cornerBase} top-2 right-2 border-t border-r`} />
      <div className={`${cornerBase} bottom-2 left-2 border-b border-l`} />
      <div className={`${cornerBase} bottom-2 right-2 border-b border-r`} />
    </>
  );
}

function HintCard({ hint, isRevealed, isManual, clickable, onClick, onExpandHint, autoRevealCountdown }) {
  const isImageHint = hint.type === "image" || hint.type === "actor";
  const isAudioHint = hint.type === "audio"; 

  return (
    <div className="relative w-full aspect-[3/4]">
      <div className="absolute inset-0 [perspective:1200px]">
        <div
          className="relative w-full h-full transition-transform duration-700"
          style={{
            transformStyle: "preserve-3d",
            transform: isRevealed ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* FRONT OF CARD (Unrevealed) */}
          <div
            onClick={clickable ? onClick : undefined}
            className={`absolute inset-0 border-2 border-outline-variant rounded-md p-2 md:p-3 flex flex-col items-center justify-center ${
              clickable ? "cursor-pointer hover:border-primary-container" : ""
            }`}
            style={{ backgroundColor: "#181712", backfaceVisibility: "hidden" }}
          >
            <CardCorners />
            {/* Reduced box size on mobile to prevent overflow, centered properly */}
            <div className="border border-dashed border-outline-variant/50 rounded-md w-8 h-8 md:w-10 md:h-10 flex items-center justify-center mb-1 shrink-0">
              <span className="material-symbols-outlined text-primary-container text-base md:text-xl">
                movie
              </span>
            </div>
            <span className="font-caption text-caption text-on-surface-variant italic text-center px-1 text-[9px] md:text-xs">
              {clickable
                ? "Tap to reveal"
                : isManual
                ? "Not revealed yet"
                : `Reveals in ${autoRevealCountdown}s`}
            </span>
            {/* mt-auto ensures the text always anchors to bottom, saving space above */}
            <div className="w-full border-t border-outline-variant/30 mt-auto pt-1 md:pt-2 text-center shrink-0">
              <span className="font-display text-[8px] md:text-[9px] tracking-[0.25em] text-outline uppercase">
                Hintwood
              </span>
            </div>
          </div>

          {/* BACK OF CARD (Revealed) */}
          <div
            onClick={() => isRevealed && onExpandHint(hint)}
            className="absolute inset-0 border-2 border-primary-container rounded-md p-2 md:p-3 flex flex-col cursor-pointer hover:border-primary transition-colors group"
            style={{
              backgroundColor: "#241f0f",
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              boxShadow: "0 0 20px rgba(201,162,39,0.15)",
            }}
          >
            <CardCorners />
            <div className="flex items-center justify-center gap-1 mb-1 shrink-0">
              <span className="material-symbols-outlined text-primary text-[14px] md:text-base">
                {hint.icon || "auto_awesome"}
              </span>
              <span className="font-caption text-[8px] md:text-[10px] uppercase tracking-widest text-primary text-center">
                {hint.label}
              </span>
            </div>

            <div className="flex-grow flex items-center justify-center text-center px-1 overflow-hidden relative">
              {isImageHint ? (
                <SafeImage
                  src={hint.imageUrl}
                  alt=""
                  className="w-full h-full object-cover rounded border border-outline-variant"
                />
              ) : isAudioHint ? (
                <div className="flex flex-col items-center justify-center gap-1 w-full">
                  <span className={`text-[10px] md:text-sm line-clamp-2 md:line-clamp-3 ${!hint.audioUrl ? "text-on-surface-variant italic" : "text-on-surface"}`}>
                    {hint.text}
                  </span>
                  {hint.audioUrl && (
                    <audio controls src={hint.audioUrl} controlsList="nodownload" className="h-6 md:h-8 w-full rounded-full" />
                  )}
                </div>
              ) : (
                <p className="font-body-md text-[11px] md:text-sm text-on-surface line-clamp-4 md:line-clamp-5">{hint.text}</p>
              )}
            </div>

            <div className="w-full border-t border-primary-container/30 mt-1 md:mt-2 pt-1 flex justify-center shrink-0">
              <span className="text-primary-container text-[10px] md:text-xs">✦</span>
            </div>

            {/* Magnifying Glass Icon for click-to-expand context */}
            <div className="absolute bottom-1 right-1 bg-black/60 rounded-full p-0.5 md:p-1 text-white opacity-70 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-[10px] md:text-sm block">zoom_in</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BonusHintCard({ hint, isRevealed, clickable, hasFreePass, onClick, onExpandHint }) {
  return (
    <div className="relative w-full aspect-[3/4]">
      <div className="absolute inset-0 [perspective:1200px]">
        <div
          className="relative w-full h-full transition-transform duration-700"
          style={{
            transformStyle: "preserve-3d",
            transform: isRevealed ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* FRONT OF BONUS CARD (Unrevealed) */}
          <div
            onClick={clickable ? onClick : undefined}
            className={`absolute inset-0 border-2 rounded-md p-2 md:p-3 flex flex-col items-center justify-center ${
              clickable
                ? "cursor-pointer border-primary-container hover:border-primary"
                : "border-outline-variant"
            }`}
            style={{
              backgroundColor: hasFreePass && clickable ? "#2a2410" : "#181712",
              backfaceVisibility: "hidden",
            }}
          >
            <CardCorners />
            {/* Reduced box size on mobile to prevent overflow, centered properly */}
            <div className="border border-dashed border-primary-container/60 rounded-md w-8 h-8 md:w-10 md:h-10 flex items-center justify-center mb-1 shrink-0">
              <span className="material-symbols-outlined text-primary text-base md:text-xl">bolt</span>
            </div>
            <span className="font-caption text-primary text-center px-1 text-[9px] md:text-xs mb-0.5 shrink-0">
              Bonus Hint
            </span>
            <span className="font-caption text-on-surface-variant italic text-center px-1 text-[8px] md:text-[10px] leading-tight shrink-0">
              {!clickable
                ? "Not available"
                : hasFreePass
                ? "Free — tap to use"
                : "Costs 15s next round"}
            </span>
            {/* mt-auto ensures the text always anchors to bottom, saving space above */}
            <div className="w-full border-t border-outline-variant/30 mt-auto pt-1 md:pt-2 text-center shrink-0">
              <span className="font-display text-[8px] md:text-[9px] tracking-[0.25em] text-outline uppercase">
                Hintwood
              </span>
            </div>
          </div>

          {/* BACK OF BONUS CARD (Revealed) */}
          <div
            onClick={() => isRevealed && onExpandHint(hint)}
            className="absolute inset-0 border-2 border-primary-container rounded-md p-2 md:p-3 flex flex-col cursor-pointer hover:border-primary transition-colors group"
            style={{
              backgroundColor: "#241f0f",
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              boxShadow: "0 0 20px rgba(201,162,39,0.15)",
            }}
          >
            <CardCorners />
            <div className="flex items-center justify-center gap-1 mb-1 shrink-0">
              <span className="material-symbols-outlined text-primary text-[14px] md:text-base">
                {hint?.icon || "music_note"}
              </span>
              <span className="font-caption text-[8px] md:text-[10px] uppercase tracking-widest text-primary text-center">
                {hint?.label || "Famous Song"}
              </span>
            </div>
            <div className="flex-grow flex items-center justify-center text-center px-1 overflow-hidden relative">
              {hint?.type === "audio" ? (
                <div className="flex flex-col items-center justify-center gap-1 w-full">
                  <span className={`text-[10px] md:text-sm line-clamp-2 md:line-clamp-3 ${!hint.audioUrl ? "text-on-surface-variant italic" : "text-on-surface"}`}>
                    {hint.text}
                  </span>
                  {hint.audioUrl && (
                    <audio controls src={hint.audioUrl} controlsList="nodownload" className="h-6 md:h-8 w-full rounded-full" />
                  )}
                </div>
              ) : (
                <p className="font-body-md text-[11px] md:text-sm text-on-surface line-clamp-4 md:line-clamp-5">{hint?.text}</p>
              )}
            </div>
            <div className="w-full border-t border-primary-container/30 mt-1 md:mt-2 pt-1 flex justify-center shrink-0">
              <span className="text-primary-container text-[10px] md:text-xs">✦</span>
            </div>

            {/* Magnifying Glass Icon for click-to-expand context */}
            <div className="absolute bottom-1 right-1 bg-black/60 rounded-full p-0.5 md:p-1 text-white opacity-70 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-[10px] md:text-sm block">zoom_in</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// NEW: Universal Lightbox for fully expanding ANY hint (text, image, or audio)
function HintLightbox({ hint, onClose }) {
  if (!hint) return null;
  const isImage = hint.type === "image" || hint.type === "actor";
  const isAudio = hint.type === "audio";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 px-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm md:max-w-md rounded-lg border border-primary-container p-6 md:p-8 relative flex flex-col items-center text-center shadow-2xl"
        style={{ backgroundColor: "#1c1c16" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-on-surface-variant hover:text-error transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="flex items-center gap-2 mb-4 md:mb-6 text-primary">
          <span className="material-symbols-outlined text-xl">{hint.icon || "auto_awesome"}</span>
          <span className="font-caption uppercase tracking-widest text-sm md:text-base">{hint.label}</span>
        </div>

        {isImage && (
          <img 
            src={hint.imageUrl} 
            alt={hint.label} 
            className="w-full rounded-md border border-outline-variant object-contain max-h-[50vh]" 
          />
        )}

        {isAudio && (
          <div className="flex flex-col items-center gap-5 w-full">
            <p className="font-body-lg text-lg md:text-xl text-on-surface">{hint.text}</p>
            {hint.audioUrl && (
              <audio controls src={hint.audioUrl} className="w-full" />
            )}
          </div>
        )}

        {!isImage && !isAudio && (
          <p className="font-body-lg text-lg md:text-xl text-on-surface leading-relaxed whitespace-pre-wrap">{hint.text}</p>
        )}
      </div>
      <p className="text-on-surface-variant text-sm mt-5 italic tracking-wide">tap anywhere to close</p>
    </div>
  );
}

function RulesModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-md border border-primary-container p-6"
        style={{ backgroundColor: "#1c1c16" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-2xl text-primary mb-4">Rules &amp; Scoring</h2>
        <ul className="space-y-3 text-sm text-on-surface font-body">
          <li>🎬 Each round has 6 hints: Industry, Core Concept, Actor, Plot, Movie Scene, and Famous Song.</li>
          <li>🖱️ Guessers can reveal the first 3 hints by tapping them, in any order, any time.</li>
          <li>⏱️ Hints 4 and 5 reveal automatically together at the 30-second mark.</li>
          <li>⚡ The 6th hint reveals when tapped, but costs 15 seconds off your guessing time next round.</li>
          <li>🏅 Every 3rd round, the current leader gets that 6th hint for free, no penalty.</li>
          <li>⏳ Each round lasts 60 seconds total.</li>
          <li>🏆 Fast guesses earn more! Base 100 points + bonus for remaining time.</li>
          <li>🎭 If nobody guesses in time, the giver earns 60 points instead.</li>
          <li>🔤 A few random letters reveal once 2 hints are shown — longer titles reveal more.</li>
        </ul>
        <button
          onClick={onClose}
          className="mt-6 w-full py-2 rounded-md border border-primary-container text-primary-container hover:bg-primary-container hover:text-on-primary-container transition-colors text-sm uppercase tracking-wide"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function GameplayScreen({
  role,
  movieTitle,
  hints,
  revealedHints,
  roundStartedAt,
  guesses,
  players,
  myAnonId,
  round,
  maxRounds,
  onSubmitGuess,
  onRevealHint,
  onRequestBonus,
  guessError,
}) {
  const [secondsLeft, setSecondsLeft] = useState(ROUND_DURATION_SECONDS);
  const [guessText, setGuessText] = useState("");
  const [showRules, setShowRules] = useState(false);
  const [expandedHint, setExpandedHint] = useState(null); // Tracks the full hint object to display

  useEffect(() => {
    function computeRemaining() {
      const elapsed = Math.floor((Date.now() - (roundStartedAt || Date.now())) / 1000);
      return Math.max(ROUND_DURATION_SECONDS - elapsed, 0);
    }
    setSecondsLeft(computeRemaining());
    const tick = setInterval(() => setSecondsLeft(computeRemaining()), 1000);
    return () => clearInterval(tick);
  }, [roundStartedAt]);

  function handleSubmit() {
    if (!guessText.trim()) return;
    onSubmitGuess(guessText.trim());
    setGuessText("");
  }

  const mainHints = hints.slice(0, 5);
  const bonusHint = hints[5];

  const revealedCount = revealedHints.filter(Boolean).length;
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const myPlayer = players.find((p) => p.anonId === myAnonId);

  const bonusRevealed = !!revealedHints[5];
  const bonusClickable = role === "guesser" && !bonusRevealed;

  const elapsedSeconds = ROUND_DURATION_SECONDS - secondsLeft;
  const autoRevealCountdown = Math.max(AUTO_REVEAL_AT_SECONDS - elapsedSeconds, 0);

  return (
    <div className="min-h-screen bg-background text-on-surface font-body">
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      
      {/* Universal Lightbox renders if expandedHint is set */}
      {expandedHint && (
        <HintLightbox
          hint={expandedHint}
          onClose={() => setExpandedHint(null)}
        />
      )}

      <header
        className="w-full border-b border-outline-variant px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: "#14140f" }}
      >
        <span className="font-display text-xl text-primary tracking-wide uppercase">Hintwood</span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowRules(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant rounded-full text-xs uppercase tracking-wide text-on-surface-variant hover:text-primary hover:border-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-sm">menu_book</span>
            Rules
          </button>
          <span className="font-body text-sm text-on-surface-variant">
            Round {round} of {maxRounds}
          </span>
          <div className="w-10 h-10 rounded-full border-2 border-primary-container flex items-center justify-center font-display text-primary">
            {secondsLeft}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col md:flex-row gap-6 md:justify-center">
        <div className="w-full md:w-56 shrink-0 order-3 md:order-1">
          <div className="border border-outline-variant rounded-md p-4" style={{ backgroundColor: "#1c1c16" }}>
            <h3 className="font-display text-lg text-primary mb-3">Leaderboard</h3>
            <div className="space-y-2">
              {sortedPlayers.map((p, i) => (
                <div key={p.socketId} className="flex justify-between text-sm">
                  <span>{i + 1}. {p.name}</span>
                  <span className="text-primary">{p.score} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center order-1 md:order-2 w-full md:max-w-xl">
          {role === "giver" ? (
            <div className="mb-4 text-center">
              <h1 className="font-display text-3xl text-on-surface mb-1">{movieTitle}</h1>
              <p className="text-on-surface-variant text-sm">
                The guessers will tap to reveal the first 3 cards. The last 2 auto-reveal at 0:30.
              </p>
            </div>
          ) : (
            <>
              <TitleBoxes title={movieTitle} revealedCount={revealedCount} />
              {myPlayer?.freeBonusAvailable && !bonusRevealed && (
                <div className="mb-2 text-xs text-primary bg-primary-container/20 border border-primary-container/50 rounded-md px-3 py-1.5 text-center">
                  🏅 You're leading! Your Bonus Hint is free this round.
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-3 gap-2 md:gap-4 mt-2 md:mt-4 w-full">
            {mainHints.map((hint, i) => {
              const isManual = i < 3;
              const isRevealed = revealedHints[i];
              const clickable = role === "guesser" && isManual && !isRevealed;
              return (
                <HintCard
                  key={hint.id}
                  hint={hint}
                  isRevealed={isRevealed}
                  isManual={isManual}
                  clickable={clickable}
                  onClick={() => onRevealHint(i)}
                  onExpandHint={(h) => setExpandedHint(h)}
                  autoRevealCountdown={autoRevealCountdown}
                />
              );
            })}

            <BonusHintCard
              hint={bonusHint}
              isRevealed={bonusRevealed}
              clickable={bonusClickable}
              hasFreePass={!!myPlayer?.freeBonusAvailable}
              onClick={onRequestBonus}
              onExpandHint={(h) => setExpandedHint(h)}
            />
          </div>
        </div>

        <div className="w-full md:w-80 shrink-0 order-2 md:order-3">
          <div className="border border-outline-variant rounded-md p-4 flex flex-col" style={{ backgroundColor: "#1c1c16" }}>
            <h3 className="font-display text-lg text-primary mb-3">Live Guesses</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
              {guesses.length === 0 && <p className="text-xs text-outline italic">No guesses yet…</p>}
              {guesses.map((g, i) =>
                g.type === "correct" ? (
                  <div key={i} className="bg-primary-container text-on-primary-container rounded-md px-3 py-2 text-sm font-medium">
                    🎉 {g.name} got it!
                  </div>
                ) : (
                  <div
                    key={i}
                    className={`border rounded-md px-3 py-2 ${
                      g.anonId === myAnonId ? "border-primary-container" : "border-outline-variant/50"
                    }`}
                  >
                    <span className="text-xs text-on-surface-variant block">{g.name}</span>
                    <span className="text-sm">{g.text}</span>
                  </div>
                )
              )}
            </div>

            {role === "guesser" && (
              <div className="flex gap-2 mt-auto pt-2 border-t border-outline-variant/30">
                <input
                  type="text"
                  value={guessText}
                  onChange={(e) => setGuessText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="Type your guess…"
                  className="flex-1 bg-transparent border border-outline-variant rounded-md px-3 py-2 text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary"
                />
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-primary-container text-on-primary-container rounded-md text-xs uppercase tracking-wide"
                >
                  Guess
                </button>
              </div>
            )}
            {guessError && (
              <p className="text-xs text-error mt-2 text-center">{guessError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}