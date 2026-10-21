"use server";
// The public intake form. Anyone can submit it, so it's checked and rate limited here, and it can only
// add a request: it never reads anything back. A company request starts its draft straight away, up to
// a daily cap that keeps Claude costs bounded; beyond that the platform owner starts it from the queue.
import { createHash } from "node:crypto";
import { after } from "next/server";
import { headers } from "next/headers";
import { runDraft } from "@/lib/drafts";
import { MAX_ANSWER, questionsFor, type IntakeKind } from "@/lib/intake";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type IntakeInput = {
  kind: IntakeKind;
  orgName: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  answers: Record<string, string>;
  website: string; // hidden from people; bots fill it in
};
export type IntakeResult = { ok: true } | { ok: false; message: string };

const PER_ADDRESS_PER_DAY = 3;
const ALL_PER_DAY = 40;
const AUTO_DRAFTS_PER_DAY = Number(process.env.AUTO_DRAFTS_PER_DAY) || 5;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export async function submitIntake(input: IntakeInput): Promise<IntakeResult> {
  if (input?.website) return { ok: true }; // a bot: pretend it worked
  const kind: IntakeKind = input?.kind === "individual" ? "individual" : "company";
  const contactName = clip(input.contactName, 120), contactEmail = clip(input.contactEmail, 254).toLowerCase();
  const orgName = clip(input.orgName, 120), contactRole = clip(input.contactRole, 120);
  if (!contactName || !EMAIL.test(contactEmail)) return { ok: false, message: "Enter your name and a valid email address." };
  if (kind === "company" && !orgName) return { ok: false, message: "Enter your company's name." };

  const answers: Record<string, string> = {};
  for (const q of questionsFor(kind)) {
    const v = clip(input.answers?.[q.key], MAX_ANSWER);
    if (q.required && !v) return { ok: false, message: "Answer the questions marked as required." };
    if (q.type === "select" && v && !q.options?.includes(v)) return { ok: false, message: "Choose an option from the list." };
    if (v) answers[q.key] = v;
  }
  if (contactRole) answers.contactRole = contactRole;

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const ipHash = createHash("sha256").update(`${ip}|${process.env.SUPABASE_SECRET_KEY ?? ""}`).digest("hex").slice(0, 32);
  const db = supabaseAdmin();
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const [mine, everyone, drafts] = await Promise.all([
    db.from("intake_requests").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", since),
    db.from("intake_requests").select("id", { count: "exact", head: true }).gte("created_at", since),
    db.from("intake_requests").select("id", { count: "exact", head: true }).eq("kind", "company").neq("status", "new").gte("created_at", since),
  ]);
  if ((mine.count ?? 0) >= PER_ADDRESS_PER_DAY || (everyone.count ?? 0) >= ALL_PER_DAY) {
    return { ok: false, message: "We've received a lot of requests today. Please try again tomorrow." };
  }

  const draftNow = kind === "company" && (drafts.count ?? 0) < AUTO_DRAFTS_PER_DAY;
  const { data, error } = await db.from("intake_requests").insert({
    kind, org_name: kind === "company" ? orgName : null, contact_name: contactName, contact_email: contactEmail,
    answers, status: draftNow ? "drafting" : "new", ip_hash: ipHash,
  }).select("id").single();
  if (error || !data) return { ok: false, message: "Something went wrong sending your answers. Please try again." };
  if (draftNow) after(() => runDraft(data.id));
  return { ok: true };
}
