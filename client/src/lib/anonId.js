// lib/anonId.js
//
// Implements the spec's "Identity without login" section:
// generate a random ID once, store it, reuse it forever on this browser.
// This is what lets the server recognize "same person" across games
// without ever asking for a password.

const STORAGE_KEY = "hintwood_anon_id";

export function getAnonId() {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    // crypto.randomUUID() is a built-in browser API — no library needed.
    // It generates something like "a1b2c3d4-...-....", astronomically
    // unlikely to collide with anyone else's.
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
