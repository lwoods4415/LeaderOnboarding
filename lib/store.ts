"use client";
// On-device progress store (Phase 1). Pages read with useLeader() and write with update().
// Phase 2 keeps this API and adds a debounced save to the database behind it.
import { useSyncExternalStore } from "react";
import { STORAGE_KEY } from "@/program.config";
import { blankState, normalize, type LeaderState } from "./state";

const SERVER_SNAPSHOT = blankState();
let state: LeaderState = SERVER_SNAPSHOT;
let loaded = false;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalize(JSON.parse(raw)) : blankState();
  } catch {
    return blankState();
  }
}

function writeStorage() {
  clearTimeout(timer);
  timer = undefined;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  state = readStorage();
  window.addEventListener("pagehide", () => timer && writeStorage());
  // Keep two open tabs in step.
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    state = readStorage();
    listeners.forEach((l) => l());
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLeader(): LeaderState {
  return useSyncExternalStore(
    subscribe,
    () => (ensureLoaded(), state),
    () => SERVER_SNAPSHOT,
  );
}

/** Change progress. `fn` edits a copy; the store saves it shortly after. */
export function update(fn: (draft: LeaderState) => void) {
  ensureLoaded();
  const next = structuredClone(state);
  fn(next);
  next.updatedAt = Date.now();
  state = next;
  listeners.forEach((l) => l());
  clearTimeout(timer);
  timer = setTimeout(writeStorage, 300);
}
