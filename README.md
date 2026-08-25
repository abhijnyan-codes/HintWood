# HintWood

Real-time multiplayer movie-hint guessing game. See `Project-Spec.pdf` for full design.

## Structure

```
hintwood/
  server/   Node.js + Express + Socket.IO — game logic, room state
  client/   React + Vite + Tailwind — the UI
```

These are two separate apps that talk over the network (via Socket.IO).
They deploy separately: client to Vercel, server to Railway/Render.

## Running locally

You need **two terminals** open at once — the server and client are
separate long-running processes.

**Terminal 1 — server:**
```bash
cd server
cp .env.example .env
npm install
npm run dev
```
Runs on http://localhost:4000

**Terminal 2 — client:**
```bash
cd client
cp .env.example .env
npm install
npm run dev
```
Runs on http://localhost:5173 (Vite's default)

## What's implemented so far (Phase 1 of the build timeline)

- [x] Server boots, exposes `/health`
- [x] Socket.IO wired up (`room:create`, `room:join`, `room:state`)
- [x] In-memory room state (stand-in for Redis, matches spec's data model)
- [x] Anonymous identity (`crypto.randomUUID()` + localStorage)
- [x] Client can create/join a room and see live player list
- [ ] Movie picking + hint reveal (Phase 2)
- [ ] Guessing + scoring (Phase 3)
- [ ] Postgres persistence, analytics (Phase 4)

## Why two `package.json` files?

Each app has its own dependencies and its own deploy target — the server
never needs React, the client never needs Express. Keeping them separate
(rather than one shared `package.json`) keeps each deploy lean and avoids
version conflicts between server-only and client-only packages.
