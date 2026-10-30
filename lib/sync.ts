"use client";
// Saves a leader's progress to the database and loads it back.
// The state is split across two tables so the privacy rules can be enforced by the database:
//   leader_private  (only the leader): checks, reflections, planners, trust self-check, conversations…
//   leader_progress (leader + admin): module %, scenario answers, practice scores, growth numbers.
import { useSyncExternalStore } from "react";
import type { ProgramContent } from "@/content/program";
import { isCustomId } from "@/content/custom-practice";
import { modProgress, overall } from "./progress";
import { blankState, normalize, type CoreLessonState, type LeaderState, type RpState, type Turn } from "./state";
import { loadShared } from "./sharing";
import { getState, onLocalChange, replaceState, setUser } from "./store";
import { supabaseBrowser } from "./supabase/client";

export type SaveStatus = "loading" | "saved" | "saving" | "offline";

type PrivateDoc = Pick<LeaderState, "checks" | "notes" | "braving" | "planner" | "rpSel" | "updatedAt"> & {
  me: { start?: string; leader?: string };
  turns: Record<string, Turn[]>;
  /** Core lessons: written answers, sliders, sorting and cards explored. */
  coreLessons?: Record<string, Omit<CoreLessonState, "opened" | "completedAt" | "checkAnswers">>;
};
type ProgressDoc = Pick<LeaderState, "picks" | "growth" | "updatedAt"> & {
  rp: Record<string, Omit<RpState, "turns">>;
  /** Core lessons: when opened and completed, and the check answers (shown like scenario choices). */
  coreLessons?: Record<string, Pick<CoreLessonState, "opened" | "completedAt" | "checkAnswers">>;
  summary: { overall: number; modules: { id: string; pct: number }[] };
};

export function split(s: LeaderState, program: ProgramContent): { priv: PrivateDoc; prog: ProgressDoc } {
  const turns: PrivateDoc["turns"] = {};
  const rp: ProgressDoc["rp"] = {};
  for (const [id, x] of Object.entries(s.rp)) {
    if (x.turns.length) turns[id] = x.turns;
    rp[id] = { mode: x.mode, fb: x.fb, history: x.history };
  }
  const lessonsPriv: NonNullable<PrivateDoc["coreLessons"]> = {};
  const lessonsProg: NonNullable<ProgressDoc["coreLessons"]> = {};
  for (const [id, x] of Object.entries(s.coreLessons)) {
    const { opened, completedAt, checkAnswers, ...rest } = x;
    lessonsProg[id] = { opened, completedAt, checkAnswers };
    lessonsPriv[id] = rest;
  }
  return {
    priv: {
      checks: s.checks, notes: s.notes, braving: s.braving, planner: s.planner, rpSel: s.rpSel,
      me: { start: s.me.start, leader: s.me.leader }, turns, coreLessons: lessonsPriv, updatedAt: s.updatedAt,
    },
    prog: {
      picks: s.picks, growth: s.growth, rp, coreLessons: lessonsProg, updatedAt: s.updatedAt,
      summary: { overall: overall(s, program), modules: program.modules.map((m) => ({ id: m.id, pct: modProgress(s, m, program).pct })) },
    },
  };
}

export function join(priv: Partial<PrivateDoc> | null, prog: Partial<ProgressDoc> | null, program: ProgramContent): LeaderState {
  const b = blankState();
  const rp: LeaderState["rp"] = {};
  // Built-in conversations plus the leader's own scenarios (ids starting "c:").
  const ids = new Set([...program.roleplays.map((r) => r.id), ...Object.keys(prog?.rp ?? {}), ...Object.keys(priv?.turns ?? {})]);
  for (const id of ids) {
    if (!program.roleplays.some((r) => r.id === id) && !isCustomId(id)) continue;
    const p = prog?.rp?.[id], t = priv?.turns?.[id];
    if (p || t) rp[id] = { mode: p?.mode ?? "realistic", fb: p?.fb ?? null, history: p?.history ?? [], turns: t ?? [] };
  }
  const coreLessons: LeaderState["coreLessons"] = {};
  for (const id of new Set([...Object.keys(priv?.coreLessons ?? {}), ...Object.keys(prog?.coreLessons ?? {})])) {
    coreLessons[id] = { ...priv?.coreLessons?.[id], ...prog?.coreLessons?.[id] };
  }
  return normalize({
    coreLessons,
    checks: priv?.checks ?? b.checks, notes: priv?.notes ?? b.notes, braving: priv?.braving ?? b.braving,
    planner: priv?.planner ?? b.planner, rpSel: priv?.rpSel ?? b.rpSel, me: priv?.me ?? {},
    picks: prog?.picks ?? b.picks, growth: prog?.growth ?? b.growth, rp,
    updatedAt: Math.max(priv?.updatedAt ?? 0, prog?.updatedAt ?? 0),
  });
}

// ---------- save status, for the header ----------
let status: SaveStatus = "loading";
const statusListeners = new Set<() => void>();
function setStatus(next: SaveStatus) {
  if (next === status) return;
  status = next;
  statusListeners.forEach((l) => l());
}
export function useSaveStatus() {
  return useSyncExternalStore(
    (l) => (statusListeners.add(l), () => statusListeners.delete(l)),
    () => status,
    () => "loading" as SaveStatus,
  );
}

// ---------- saving ----------
const SAVE_DELAY = 1200; // same short debounce as the reference page
// The signed-in leader's enrollment (their place in one program) and that program.
let session: { userId: string; enrollmentId: string; program: ProgramContent } | null = null;
/** The enrollment the signed-in leader is working in (used by sharing, custom scenarios and practice). */
export const currentEnrollmentId = () => session?.enrollmentId ?? null;
let lastSent = { priv: "", prog: "" };
let timer: ReturnType<typeof setTimeout> | undefined;
let writing = false, pending = false, retryMs = 5000;

function schedule(ms = SAVE_DELAY) {
  clearTimeout(timer);
  timer = setTimeout(flush, ms);
}

async function flush() {
  if (!session) return;
  const { userId, enrollmentId, program } = session;
  if (writing) { pending = true; return; }
  const { priv, prog } = split(getState(), program);
  const body = { priv: JSON.stringify(priv), prog: JSON.stringify(prog) };
  if (body.priv === lastSent.priv && body.prog === lastSent.prog) { setStatus("saved"); return; }
  writing = true;
  setStatus("saving");
  const db = supabaseBrowser();
  try {
    const save = async (key: "priv" | "prog", table: string, data: object) => {
      if (body[key] === lastSent[key]) return;
      const { error } = await db.from(table).upsert({ user_id: userId, enrollment_id: enrollmentId, data }, { onConflict: "enrollment_id" });
      if (error) throw error;
      lastSent[key] = body[key];
    };
    await Promise.all([save("priv", "leader_private", priv), save("prog", "leader_progress", prog)]);
    retryMs = 5000;
    setStatus("saved");
    touch();
  } catch {
    // Kept on the device; try again shortly, backing off up to a minute.
    setStatus("offline");
    schedule(retryMs);
    retryMs = Math.min(retryMs * 2, 60000);
  } finally {
    writing = false;
    if (pending) { pending = false; schedule(0); }
  }
}

/** Save anything pending right away (before signing out). True if everything reached the database. */
export async function flushNow() {
  clearTimeout(timer);
  for (let i = 0; i < 40 && writing; i++) await new Promise((r) => setTimeout(r, 150));
  await flush();
  return status === "saved";
}

/** Stop saving for this leader (after signing out). */
export function stopSync() {
  clearTimeout(timer);
  session = null;
}

let lastTouch = 0;
function touch() {
  if (Date.now() - lastTouch < 10 * 60 * 1000) return;
  lastTouch = Date.now();
  // A query only runs once awaited or then-ed.
  supabaseBrowser().rpc("touch_last_active").then(() => {}, () => {});
}

let wired = false;
/** Load a signed-in leader's progress in one program (enrollment) and keep it saved from then on. */
export async function startSync(userId: string, enrollmentId: string, program: ProgramContent) {
  session = { userId, enrollmentId, program };
  setUser(enrollmentId);
  if (!wired) {
    wired = true;
    onLocalChange(() => { setStatus("saving"); schedule(); });
    window.addEventListener("online", () => schedule(0));
  }
  const db = supabaseBrowser();
  const [priv, prog] = await Promise.all([
    db.from("leader_private").select("data").eq("enrollment_id", enrollmentId).maybeSingle(),
    db.from("leader_progress").select("data").eq("enrollment_id", enrollmentId).maybeSingle(),
  ]);
  if (priv.error || prog.error) { setStatus("offline"); schedule(retryMs); return; }
  const remote = join(priv.data?.data ?? null, prog.data?.data ?? null, program);
  lastSent = { priv: priv.data ? JSON.stringify(priv.data.data) : "", prog: prog.data ? JSON.stringify(prog.data.data) : "" };
  // Newest copy wins, as on the reference page.
  if (remote.updatedAt > getState().updatedAt) replaceState(remote);
  await loadShared(enrollmentId);
  touch();
  setStatus("saved");
  schedule(0);
}
