// index.js — the server's entry point.
// This is the file `node` actually runs. Everything else gets wired in here.

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
require("dotenv").config();

const registerSocketHandlers = require("./game/socketHandlers");
const moviesRouter = require("./routes/movies");

const app = express();
app.use(cors());
app.use(express.json());

// Any request to /api/movies/... gets handled by movies.js
app.use("/api/movies", moviesRouter);


// A plain HTTP route — not real-time, just a normal "ask and get an answer" request.
// Useful for things like health checks (so hosting platforms can confirm the server is alive).
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Why we need BOTH express and a raw http.Server:
// Socket.IO needs to "attach" itself to a low-level HTTP server to do its
// WebSocket handshake. Express alone doesn't expose that — so we wrap it.
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  },
});

// All the "what happens when a player does X" logic lives in socketHandlers.js
// io.on("connection", ...) fires every time a NEW browser tab connects.
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  registerSocketHandlers(io, socket);
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`HintWood server listening on port ${PORT}`);
});
