// What each plan includes (docs/pricing.md, approved 2026-10-19), shared by the app and the server.
// The server enforces these: locked modules never reach the browser, and practice limits are checked
// in the practice routes. The app uses the same rules to show locks and upgrade prompts.
import type { ProgramContent } from "@/content/program";

export type Plan = "free" | "essentials" | "complete" | "cohort" | "company";
export type PaidPlan = "essentials" | "complete" | "cohort";

export const PLAN_NAMES: Record<Plan, string> = {
  free: "Free preview", essentials: "Essentials", complete: "Complete", cohort: "Cohort", company: "Company",
};

/** Prices in US cents. Complete has a launch price for the first LAUNCH_SEATS buyers. */
export const PRICES: Record<PaidPlan, number> = { essentials: 4900, complete: 14900, cohort: 39900 };
export const LAUNCH_PRICE = 9900;
export const LAUNCH_SEATS = 100;
export const ACCESS_DAYS = 365;

const RANK: Record<Plan, number> = { free: 0, essentials: 1, complete: 2, cohort: 3, company: 3 };
export const rank = (p: Plan) => RANK[p];

/** Individual plans can be upgraded in the app; company leaders are covered by their organization. */
export const isIndividual = (p: Plan) => p !== "company";

/** The plan that applies now: paid individual access lasts 12 months, then falls back to the free preview. */
export function effectivePlan(plan: Plan, expiresAt: string | null): Plan {
  if (plan === "free" || plan === "company" || !expiresAt) return plan;
  return new Date(expiresAt).getTime() < Date.now() ? "free" : plan;
}

export const FREE_MODULES = ["m0"];
export const moduleOpen = (plan: Plan, moduleId: string) => plan !== "free" || FREE_MODULES.includes(moduleId);
export const toolkitOpen = (plan: Plan) => plan !== "free";
/** Scored practice conversations included, or null for unlimited (within the daily limits). */
export const practiceLimit = (plan: Plan): number | null => (plan === "free" ? 1 : plan === "essentials" ? 7 : null);
export const customOpen = (plan: Plan) => rank(plan) >= rank("complete");

export const PLAN_FEATURES: Record<PaidPlan, string[]> = {
  essentials: [
    "The full 12-week program: all 7 modules",
    "Every scenario, the toolkit and growth tracking",
    "7 practice conversations with the AI partner, with scored feedback",
  ],
  complete: [
    "Everything in Essentials",
    "Unlimited practice conversations (within daily limits)",
    "“Create your own” practice scenarios",
  ],
  cohort: [
    "Everything in Complete",
    "6 live 1-hour Leader Labs with Lauren and other new leaders, every two weeks",
  ],
};

// Keys whose text stays visible in a locked module or tool, so menus and progress still work.
const KEEP = new Set(["id", "type", "key", "prefix", "weeks", "short", "eyebrow", "title", "sub", "r", "mod"]);
function blank(v: unknown, key?: string): unknown {
  if (typeof v === "string") return key && KEEP.has(key) ? v : "";
  if (Array.isArray(v)) return v.map((x) => blank(x, key));
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blank(x, k)]));
  return v;
}

/**
 * The program as this plan may see it. Locked modules and tools keep their ids, structure and titles
 * (so menus, progress and saving keep working) but none of their text.
 */
export function contentFor(content: ProgramContent, plan: Plan): ProgramContent {
  if (plan !== "free") return content;
  return {
    ...content,
    modules: content.modules.map((m) => (moduleOpen(plan, m.id) ? m : { ...(blank(m) as typeof m), locked: true })),
    tools: content.tools.map((t) => blank(t) as typeof t),
  };
}
