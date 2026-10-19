"use client";
// Sharing a reflection or practice conversation with the program leader.
// A shared item is a copy in the shared_items table, which the admin can read; "Stop sharing"
// deletes that copy. The leader's own reflection or conversation stays in their private data.
import type { LeaderState, Turn } from "./state";
import { getState, replaceState } from "./store";
import { supabaseBrowser } from "./supabase/client";

type Kind = "reflection" | "conversation";
const today = () => new Date().toISOString().slice(0, 10);

function setShared(fn: (shared: LeaderState["shared"]) => void) {
  const next = structuredClone(getState());
  fn(next.shared);
  replaceState(next);
}

let enrollment: string | null = null;

/** Load what this leader currently shares in this program, so the buttons show the right state on every device. */
export async function loadShared(enrollmentId: string) {
  enrollment = enrollmentId;
  const { data, error } = await supabaseBrowser()
    .from("shared_items")
    .select("kind, item_id, content, shared_at")
    .eq("enrollment_id", enrollmentId);
  if (error) return;
  setShared((s) => {
    s.refl = {};
    s.rp = {};
    for (const row of data as { kind: Kind; item_id: string; content: { text?: string; turns?: Turn[] }; shared_at: string }[]) {
      const at = row.shared_at.slice(0, 10);
      if (row.kind === "reflection") s.refl[row.item_id] = { text: row.content.text ?? "", at };
      else s.rp[row.item_id] = { turns: row.content.turns ?? [], at };
    }
  });
}

async function upsert(kind: Kind, itemId: string, content: object) {
  const db = supabaseBrowser();
  const { data: auth } = await db.auth.getUser();
  if (!auth.user || !enrollment) throw new Error("signed out");
  const { error } = await db
    .from("shared_items")
    .upsert({ user_id: auth.user.id, enrollment_id: enrollment, kind, item_id: itemId, content, shared_at: new Date().toISOString() }, { onConflict: "enrollment_id,kind,item_id" });
  if (error) throw error;
}

async function remove(kind: Kind, itemId: string) {
  const db = supabaseBrowser();
  const { data: auth } = await db.auth.getUser();
  if (!auth.user || !enrollment) throw new Error("signed out");
  const { error } = await db.from("shared_items").delete().eq("enrollment_id", enrollment).eq("kind", kind).eq("item_id", itemId);
  if (error) throw error;
}

export async function shareReflection(id: string, text: string) {
  await upsert("reflection", id, { text });
  setShared((s) => { s.refl[id] = { text, at: today() }; });
}

export async function unshareReflection(id: string) {
  await remove("reflection", id);
  setShared((s) => { delete s.refl[id]; });
}

/** Shares the last 30 turns, as the reference page does. */
export async function shareConversation(rpId: string, turns: Turn[]) {
  const recent = turns.slice(-30);
  await upsert("conversation", rpId, { turns: recent });
  setShared((s) => { s.rp[rpId] = { turns: recent, at: today() }; });
}

export async function unshareConversation(rpId: string) {
  await remove("conversation", rpId);
  setShared((s) => { delete s.rp[rpId]; });
}
