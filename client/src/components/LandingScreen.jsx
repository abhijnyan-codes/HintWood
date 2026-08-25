import { useState } from "react";

const PLAYER_OPTIONS = [8, 15, 50, 100];
const ROUND_OPTIONS = [6, 8, 12];

export default function LandingScreen({ onCreateRoom, onJoinRoom }) {
  const [mode, setMode] = useState("create");
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [maxRounds, setMaxRounds] = useState(6);

  function handleSubmit() {
    if (!nickname.trim()) return;

    if (mode === "create") {
      onCreateRoom(nickname.trim(), { maxPlayers, maxRounds });
    } else {
      if (!roomCode.trim()) return;
      onJoinRoom(nickname.trim(), roomCode.trim().toUpperCase());
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 relative overflow-hidden">
      <img
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2asA7h9As5E0Nucbsx4SdpzHzkG018VQyflv2RcFty6v0No7_lGAPGCXxmsqRm3mfn4yYas0trZFKp5O3hakQ0kT65-_xGZddEKLiJWyO5fIezHk-ZKU85uM0ZYYXrIKTqv5lpmktMKtaQtWpPV3HH_ITk_rLUccP6gwR6nfOPJsz_dAvyZVRo2Qqg_sr7iFED2WhpXqo4Mw99yYgC8w-yhYWfmaWWgTyzyZRubF-VHLUmBQOfvJL2A"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none select-none z-0"
        style={{ objectPosition: "center 80%" }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(201,162,39,0.15) 0%, transparent 60%)",
        }}
      />

      <main className="w-full max-w-[480px] z-10 flex flex-col items-center">
        <div
          className="w-full border border-outline-variant p-6 rounded-md shadow-2xl"
          style={{ backgroundColor: "#1c1c16" }}
        >
          <header className="text-center mb-8 flex flex-col items-center">
            <div className="flex items-center gap-3 mb-4">
              <svg
                className="text-primary"
                width="34"
                height="34"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M3 8.5L4.5 4h2l-1 4.5M8 8.5l1-4.5h2l-1 4.5M13 8.5l1-4.5h2l-1 4.5M18 8.5l.7-3.2A1 1 0 0 1 19.7 4H21v4.5" />
                <rect x="3" y="8.5" width="18" height="11.5" rx="1" />
              </svg>
              <h1 className="font-display text-4xl text-primary tracking-wider uppercase">
                HINTWOOD
              </h1>
            </div>
            <p className="font-body text-lg text-on-surface-variant italic">
              Dumb charades, minus the acting.
            </p>
          </header>

          <div className="flex flex-col gap-6">
            <div className="flex p-1 bg-surface-container-high rounded-full border border-outline-variant/50">
              <button
                onClick={() => setMode("create")}
                className={`flex-1 py-2 rounded-full font-body text-sm uppercase tracking-widest transition-colors ${
                  mode === "create"
                    ? "bg-primary-container text-on-primary-container"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Create Room
              </button>
              <button
                onClick={() => setMode("join")}
                className={`flex-1 py-2 rounded-full font-body text-sm uppercase tracking-widest transition-colors ${
                  mode === "join"
                    ? "bg-primary-container text-on-primary-container"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Join Room
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label
                className="font-body text-sm text-on-surface uppercase tracking-widest"
                htmlFor="nickname"
              >
                Nickname
              </label>
              <input
                id="nickname"
                type="text"
                placeholder="Enter your nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-3 rounded-md bg-transparent border border-outline-variant text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors"
              />
            </div>

            {mode === "create" && (
              <>
                <div className="flex flex-col gap-2">
                  <label className="font-body text-sm text-on-surface uppercase tracking-widest">
                    Max Players
                  </label>
                  <div className="flex gap-2">
                    {PLAYER_OPTIONS.map((n) => (
                      <button
                        key={n}
                        onClick={() => setMaxPlayers(n)}
                        className={`flex-1 py-2 rounded-md border text-sm font-body transition-colors ${
                          maxPlayers === n
                            ? "border-primary-container bg-primary-container text-on-primary-container"
                            : "border-outline-variant text-on-surface-variant hover:border-primary-container"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-body text-sm text-on-surface uppercase tracking-widest">
                    Rounds
                  </label>
                  <div className="flex gap-2">
                    {ROUND_OPTIONS.map((n) => (
                      <button
                        key={n}
                        onClick={() => setMaxRounds(n)}
                        className={`flex-1 py-2 rounded-md border text-sm font-body transition-colors ${
                          maxRounds === n
                            ? "border-primary-container bg-primary-container text-on-primary-container"
                            : "border-outline-variant text-on-surface-variant hover:border-primary-container"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {mode === "join" && (
              <div className="flex flex-col gap-2 animate-[fadeIn_0.3s_ease-out]">
                <label
                  className="font-body text-sm text-on-surface uppercase tracking-widest"
                  htmlFor="roomcode"
                >
                  Room Code
                </label>
                <input
                  id="roomcode"
                  type="text"
                  maxLength={6}
                  placeholder="XXXXXX"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-md bg-transparent border border-outline-variant text-on-surface text-center tracking-[0.2em] uppercase placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors"
                />
              </div>
            )}

            <button
              onClick={handleSubmit}
              className="w-full py-4 rounded-md font-body text-sm uppercase tracking-widest mt-2 border border-primary-container text-primary-container transition-all hover:bg-primary-container hover:text-on-primary-container"
            >
              {mode === "create" ? "Create Room" : "Join Session"}
            </button>
          </div>
        </div>

        <footer className="mt-12 text-center">
          <p className="font-body text-xs text-outline">
            © 2026 HINTWOOD STUDIOS. ALL RIGHTS RESERVED.
          </p>
        </footer>
      </main>
    </div>
  );
}