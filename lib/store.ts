"use client";
// Progress store. Pages read with useLeader() and write with update().
// Each signed-in leader has their own on-device copy, so typing never waits on the network
// and nothing is lost on a brief disconnect. lib/sync.ts saves it to the database.
import { useSyncExternalStore } from "react";
import { STORAGE_KEY } from "@/program.config";
import { blankState, normalize, type LeaderState } from "./state";

const SERVER_SNAPSHOT = blankState();
let state: LeaderState = SERVER_SNAPSHOT;
let userId: string | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let listening = false;
const listeners = new Set<() => void>();
const changeListeners = new Set<() => void>();

const keyFor = (id: string) => `${STORAGE_KEY}:${id}`;

function readCache(id: string) {
  try {
    const raw = localStorage.getItem(keyFor(id));
    return raw ? normalize(JSON.parse(raw)) : blankState();
  } catch {
    return blankState();
  }
}

function writeCache() {
  clearTimeout(timer);
  timer = undefined;
  if (!userId) return;
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(state));
  } catch {}
}

const notify = () => listeners.forEach((l) => l());

/** Switch the store to a signed-in leader and load their on-device copy. */
export function setUser(id: string) {
  if (userId === id) return;
  userId = id;
  state = readCache(id);
  notify();
  if (listening) return;
  listening = true;
  window.addEventListener("pagehide", () => timer && writeCache());
  // Keep two open tabs in step.
  window.addEventListener("storage", (e) => {
    if (!userId || e.key !== keyFor(userId)) return;
    state = readCache(userId);
    notify();
  });
}

export const getState = () => state;

/** Replace everything with a newer copy from the database. Doesn't trigger a save back. */
export function replaceState(next: LeaderState) {
  state = next;
  writeCache();
  notify();
}

/** Runs after every change a leader makes (used to save to the database). */
export function onLocalChange(fn: () => void) {
  changeListeners.add(fn);
  return () => changeListeners.delete(fn);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLeader(): LeaderState {
  return useSyncExternalStore(subscribe, getState, () => SERVER_SNAPSHOT);
}

/** Change progress. `fn` edits a copy; the store saves it shortly after. */
export function update(fn: (draft: LeaderState) => void) {
  if (!userId) return;
  const next = structuredClone(state);
  fn(next);
  next.updatedAt = Date.now();
  state = next;
  notify();
  clearTimeout(timer);
  timer = setTimeout(writeCache, 300);
  changeListeners.forEach((l) => l());
}
