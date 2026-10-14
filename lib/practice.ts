import "server-only";
// Shared server logic for the practice partner routes: who's calling, what they sent,
// daily limits and usage logging. The Anthropic API key is only ever read here.
import Anthropic from "@anthropic-ai/sdk";
import { MODES, ROLEPLAYS, type Difficulty } from "@/content";
import { ROLEPLAY_SECRETS } from "@/content/leading-people/roleplay-secrets";
import { supabaseAdmin } from "./supabase/admin";
import { supabaseServer } from "./supabase/server";

export const CONFIG = {
  messageModel: process.env.PRACTICE_MESSAGE_MODEL || "claude-haiku-5-5",
  feedbackModel: process.env.PRACTICE_FEEDBACK_MODEL || "claude-sonnet-5-5",
  messagesPerDay: Number(process.env.PRACTICE_MESSAGES_PER_DAY) || 150,
  feedbackPerDay: Number(process.env.PRACTICE_FEEDBACK_PER_DAY) || 15,
  maxLeaderTurns: 30,
  maxChars: 2000,
};

let client: Anthropic | undefined;
export const anthropic = () => (client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }));

export type Turn = { role: "leader" | "them"; text: string };
export type PracticeRequest = { roleplay: (typeof ROLEPLAYS)[number] & (typeof ROLEPLAY_SECRETS)[string]; mode: Difficulty; turns: Turn[] };

/** A plain-language JSON error the Studio shows to the leader. */
export const fail = (status: number, message: string) => Response.json({ error: message }, { status });

/** The signed-in, active leader making this request, or null. */
export async function currentLeader() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase.from("profiles").select("id, active").eq("id", data.user.id).maybeSingle();
  return profile?.active ? data.user.id : null;
}

/** Checks the body. Only ids, the difficulty and conversation text are accepted, never prompt text. */
export function parseRequest(body: unknown): PracticeRequest | string {
  const b = body as { roleplayId?: unknown; difficulty?: unknown; turns?: unknown };
  const base = ROLEPLAYS.find((r) => r.id === b?.roleplayId);
  const secret = base && ROLEPLAY_SECRETS[base.id];
  if (!base || !secret) return "That practice conversation wasn't found. Refresh the page and try again.";
  if (typeof b.difficulty !== "string" || !(b.difficulty in MODES)) return "Choose a difficulty and try again.";
  if (!Array.isArray(b.turns)) return "The conversation couldn't be read. Refresh the page and try again.";
  const turns: Turn[] = [];
  for (const t of b.turns) {
    if (!t || (t.role !== "leader" && t.role !== "them") || typeof t.text !== "string") return "The conversation couldn't be read. Refresh the page and try again.";
    if (t.text.length > CONFIG.maxChars) return `Each message can be up to ${CONFIG.maxChars.toLocaleString()} characters. Shorten it and send again.`;
    turns.push({ role: t.role, text: t.text });
  }
  if (turns.filter((t) => t.role === "leader").length > CONFIG.maxLeaderTurns) {
    return `A conversation can have up to ${CONFIG.maxLeaderTurns} of your messages. Select "End and get feedback", or "Start over".`;
  }
  return { roleplay: { ...base, ...secret }, mode: b.difficulty as Difficulty, turns };
}

/** Conversation text only, as Claude messages. Starts with the leader, like the reference page. */
export function toMessages(turns: Turn[]): Anthropic.MessageParam[] {
  const start = turns.findIndex((t) => t.role === "leader");
  return start < 0 ? [] : turns.slice(start).map((t) => ({ role: t.role === "leader" ? "user" : "assistant", content: t.text }));
}

/** True when the leader still has calls left today (UTC) for this route. */
export async function underDailyLimit(userId: string, route: "message" | "feedback") {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { count, error } = await supabaseAdmin()
    .from("usage_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("route", route)
    .gte("created_at", since.toISOString());
  if (error) throw error;
  return (count ?? 0) < (route === "message" ? CONFIG.messagesPerDay : CONFIG.feedbackPerDay);
}

export async function logUsage(userId: string, route: "message" | "feedback", model: string, input: number, output: number) {
  const { error } = await supabaseAdmin().from("usage_log").insert({ user_id: userId, route, model, input_tokens: input, output_tokens: output });
  if (error) console.error("usage_log insert failed", error.message);
}

/** Turns an Anthropic error into words a leader can act on. */
export function explain(err: unknown) {
  if (err instanceof Anthropic.RateLimitError) return "The practice partner is busy right now. Wait a minute and try again.";
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return "The practice partner isn't set up correctly. Let your program leader know.";
  }
  // e.g. no credit left or the monthly spend limit reached
  if (err instanceof Anthropic.BadRequestError) return "The practice partner is unavailable right now. Let your program leader know.";
  return "Something interrupted the reply. Try sending again.";
}
