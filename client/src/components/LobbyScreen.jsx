import { useState } from "react";

export default function LobbyScreen({ room, isHost, onStartGame, onBack }) {
  const [copied, setCopied] = useState(false);

  function handleCopyCode() {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    const shareText = `Join my HintWood game! Room code: ${room.code}`;

    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch (err) {
        // User cancelled the share sheet — not an error, just ignore it
      }
    } else {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <img
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2asA7h9As5E0Nucbsx4SdpzHzkG018VQyflv2RcFty6v0No7_lGAPGCXxmsqRm3mfn4yYas0trZFKp5O3hakQ0kT65-_xGZddEKLiJWyO5fIezHk-ZKU85uM0ZYYXrIKTqv5lpmktMKtaQtWpPV3HH_ITk_rLUccP6gwR6nfOPJsz_dAvyZVRo2Qqg_sr7iFED2WhpXqo4Mw99yYgC8w-yhYWfmaWWgTyzyZRubF-VHLUmBQOfvJL2A"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none select-none"
        style={{ objectPosition: "center 80%" }}
      />
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl opacity-50" />
      </div>

      {/* Header now has a solid background color, so the image behind it
          (with the baked-in fake nav text) never shows through here. */}
      <header
        className="relative z-10 w-full border-b border-outline-variant/50 px-6 py-4 flex items-center gap-4"
        style={{ backgroundColor: "#14140f" }}
      >
        <button
          onClick={onBack}
          aria-label="Back"
          className="text-on-surface-variant hover:text-primary transition-colors"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="font-display text-xl text-primary tracking-wide uppercase">
          HintWood
        </span>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-lg bg-surface-container-low border border-outline-variant rounded-md p-8 flex flex-col items-center gap-10" style={{ backgroundColor: "#1c1c16" }}>
          <section className="flex flex-col items-center text-center gap-4 w-full">
            <h2 className="font-body text-sm text-on-surface-variant uppercase tracking-widest">
              Share this code with friends
            </h2>
            <button
              onClick={handleCopyCode}
              className="group flex items-center justify-center gap-4 p-6 bg-surface-container border border-outline-variant rounded-md w-full hover:border-primary-container transition-colors"
            >
              <span className="font-display text-4xl text-primary tracking-widest">
                {room.code}
              </span>
              <svg
                className="text-outline group-hover:text-primary-container transition-colors"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="9" y="9" width="12" height="12" rx="2" />
                <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
              </svg>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-5 py-2 border border-outline-variant rounded-full font-body text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary hover:border-primary-container transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" />
                <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
              </svg>
              {copied ? "Copied!" : "Share"}
            </button>
          </section>

          <section className="w-full flex flex-col items-center gap-6">
            <h3 className="font-body text-sm text-on-surface-variant uppercase tracking-widest">
              Players Joined ({room.players.length})
            </h3>
            <div className="flex flex-wrap justify-center gap-4 w-full">
              {room.players.map((player) => (
                <div
                  key={player.socketId}
                  className="flex items-center gap-3 px-4 py-2 bg-surface-container-high border border-outline-variant/50 rounded-full"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-body text-sm uppercase">
                    {player.name.charAt(0)}
                  </div>
                  <span className="font-body text-sm text-on-surface">
                    {player.name}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="pt-2">
            {isHost ? (
              <button
                onClick={onStartGame}
                className="px-12 py-4 bg-primary-container text-on-primary-container font-body text-sm uppercase tracking-widest rounded-md border border-primary-container hover:bg-transparent hover:text-primary-container transition-all"
              >
                Start Game
              </button>
            ) : (
              <p className="font-body text-sm italic text-on-surface-variant">
                Waiting for host to start…
              </p>
            )}
          </div>
        </div>
      </main>

      <footer className="relative z-10 w-full border-t border-outline-variant/30 px-6 py-6 text-center">
        <p className="font-body text-xs text-outline">
          © 2026 HINTWOOD STUDIOS. ALL RIGHTS RESERVED.
        </p>
      </footer>
    </div>
  );
}