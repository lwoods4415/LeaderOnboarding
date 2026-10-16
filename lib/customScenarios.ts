"use client";
// The signed-in leader's own practice scenarios (custom_scenarios table, owner-only).
import { useSyncExternalStore } from "react";
import { CUSTOM_LIMITS, CUSTOM_PREFIX, type CustomScenario } from "@/content/custom-practice";
import { unshareConversation } from "./sharing";
import { getState, update } from "./store";
import { supabaseBrowser } from "./supabase/client";

type Snapshot = { loaded: boolean; list: CustomScenario[] };
let snap: Snapshot = { loaded: false, list: [] };
let loading = false;
const listeners = new Set<() => void>();
const set = (next: Snapshot) => { snap = next; listeners.forEach((l) => l()); };

const COLUMNS = "id, title, who, role, situation, goal, reactions, hidden";

async function load() {
  if (loading) return;
  loading = true;
  const { data, error } = await supabaseBrowser().from("custom_scenarios").select(COLUMNS).order("created_at");
  loading = false;
  if (!error) set({ loaded: true, list: data as CustomScenario[] });
}

/** The leader's scenarios. Loads on first use. */
export function useCustomScenarios() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      if (!snap.loaded) void load();
      return () => listeners.delete(l);
    },
    () => snap,
    () => snap,
  );
}

export type ScenarioInput = Omit<CustomScenario, "id">;

/** Trims each field and checks the required ones and the length limits. Returns an error message or null. */
export function checkScenario(s: ScenarioInput): string | null {
  const need: [keyof ScenarioInput, string][] = [["title", "a title"], ["who", "a name for the other person"], ["role", "their role"], ["situation", "the situation"], ["goal", "your goal"]];
  for (const [k, label] of need) if (!s[k].trim()) return `Add ${label}.`;
  for (const k of Object.keys(CUSTOM_LIMITS) as (keyof typeof CUSTOM_LIMITS)[]) {
    if (k in s && s[k as keyof ScenarioInput].length > CUSTOM_LIMITS[k]) return "One of the fields is too long. Shorten it and try again.";
  }
  return null;
}

const clean = (s: ScenarioInput): ScenarioInput =>
  Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v.trim()])) as ScenarioInput;

export async function createScenario(input: ScenarioInput): Promise<CustomScenario> {
  const db = supabaseBrowser();
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) throw new Error("signed out");
  const { data, error } = await db.from("custom_scenarios").insert({ ...clean(input), user_id: auth.user.id }).select(COLUMNS).single();
  if (error) throw error;
  set({ loaded: true, list: [...snap.list, data as CustomScenario] });
  return data as CustomScenario;
}

export async function updateScenario(id: string, input: ScenarioInput) {
  const { data, error } = await supabaseBrowser().from("custom_scenarios").update(clean(input)).eq("id", id).select(COLUMNS).single();
  if (error) throw error;
  set({ loaded: true, list: snap.list.map((s) => (s.id === id ? (data as CustomScenario) : s)) });
}

/** Deletes the scenario, its practice history, and any shared copy of its conversation. */
export async function deleteScenario(id: string) {
  const key = CUSTOM_PREFIX + id;
  if (getState().shared.rp[key]) await unshareConversation(key);
  const { error } = await supabaseBrowser().from("custom_scenarios").delete().eq("id", id);
  if (error) throw error;
  set({ loaded: true, list: snap.list.filter((s) => s.id !== id) });
  update((d) => {
    delete d.rp[key];
    if (d.rpSel === key) d.rpSel = "rp0";
  });
}
