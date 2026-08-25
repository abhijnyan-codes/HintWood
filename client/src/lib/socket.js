// lib/socket.js
//
// Why this file exists as its own module:
// You only want ONE WebSocket connection open per browser tab, shared across
// the whole app. If every component created its own `io()` connection,
// you'd get duplicate connections and duplicate event listeners.
// By creating it once here and importing this file elsewhere, everyone
// shares the same connection.

import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

export const socket = io(SERVER_URL, {
  autoConnect: true,
});
