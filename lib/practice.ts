import "server-only";
// Shared server logic for the practice partner routes: who's calling, what they sent,
// daily limits and usage logging. The Anthropic API key is only ever read here.
import Anthropic from "@anthropic-ai/sdk";
import type { Difficulty, RoleplaySecret } from "@/content";
import { CUSTOM_PREFIX, isCustomId, STANDARD_SKILLS } from "@/content/custom-practice";
import { customFeedbackPrompt, customRolePrompt, feedbackPrompt, rolePrompt } from "@/content/leading-people/prompts";
import type { ProgramContent } from "@/content/program";
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
/** A checked practice request, with the character's instructions already built on the server. */
export type PracticeRequest = {
  orgId: string;
  enrollmentId: string;
  who: string;
  skills: string[];
  mode: Difficulty;
  turns: Turn[];
  system: string;
  feedbackPrompt: (transcript: string) => string;
};

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

const NOT_FOUND = "That practice conversation wasn't found. Refresh the page and try again.";

/**
 * Checks the body. Only ids, the difficulty and conversation text are accepted, never prompt text.
 * The enrollment must be the caller's own active one (checked as the caller, under row-level security).
 * Built-in conversations come from their organization's copy of the program, with the backstories read
 * by the server; a leader's own scenario is loaded as that leader, so it can only be theirs.
 */
export async function parseRequest(body: unknown, userId: string): Promise<PracticeRequest | string> {
  const b = body as { enrollmentId?: unknown; roleplayId?: unknown; difficulty?: unknown; turns?: unknown };
  if (typeof b?.roleplayId !== "string" || typeof b.enrollmentId !== "string") return NOT_FOUND;
  const supabase = await supabaseServer();

  const { data: e } = await supabase.from("enrollments").select("id, org_id, org_program_id").eq("id", b.enrollmentId).eq("user_id", userId).eq("status", "active").maybeSingle();
  const { data: active } = await supabase.rpc("owns_active_enrollment", { eid: b.enrollmentId });
  if (!e || !active) return "Your access to this program isn't active. Refresh the page, or contact your program leader.";
  const { data: op } = await supabase.from("org_programs").select("content").eq("id", e.org_program_id).maybeSingle();
  if (!op) return NOT_FOUND;
  const program = op.content as ProgramContent;

  if (typeof b.difficulty !== "string" || !(b.difficulty in program.modes)) return "Choose a difficulty and try again.";
  const mode = b.difficulty as Difficulty;

  let character: Omit<PracticeRequest, "mode" | "turns" | "orgId" | "enrollmentId">;
  if (isCustomId(b.roleplayId)) {
    const { data: c } = await supabase
      .from("custom_scenarios")
      .select("who, role, situation, goal, reactions, hidden")
      .eq("id", b.roleplayId.slice(CUSTOM_PREFIX.length))
      .eq("enrollment_id", e.id)
      .maybeSingle();
    if (!c) return NOT_FOUND;
    character = {
      who: c.who, skills: STANDARD_SKILLS,
      system: customRolePrompt(c, mode, program.modes),
      feedbackPrompt: (transcript) => customFeedbackPrompt(c, STANDARD_SKILLS, mode, transcript),
    };
  } else {
    const base = program.roleplays.find((r) => r.id === b.roleplayId);
    // Backstories live in a table only the server can read.
    const { data: s } = await supabaseAdmin().from("org_program_secrets").select("secrets").eq("org_program_id", e.org_program_id).maybeSingle();
    const secret = base && (s?.secrets as { roleplays?: Record<string, RoleplaySecret> } | undefined)?.roleplays?.[base.id];
    if (!base || !secret) return NOT_FOUND;
    const rp = { ...base, ...secret };
    character = {
      who: rp.who, skills: rp.skills,
      system: rolePrompt(rp, mode, program.modes),
      feedbackPrompt: (transcript) => feedbackPrompt(rp, mode, transcript),
    };
  }
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
  return { ...character, orgId: e.org_id, enrollmentId: e.id, mode, turns };
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

export async function logUsage(
  who: { userId: string; orgId: string; enrollmentId: string },
  route: "message" | "feedback", model: string, input: number, output: number,
) {
  const { error } = await supabaseAdmin().from("usage_log").insert({
    user_id: who.userId, org_id: who.orgId, enrollment_id: who.enrollmentId, route, model, input_tokens: input, output_tokens: output,
  });
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
