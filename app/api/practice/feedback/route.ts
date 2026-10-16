// Scores a finished practice conversation against the role-play's skills.
// Same rubric prompt and JSON shape as the reference page's rpFeedback(), checked here:
// scores kept to 1-3, exactly one score per skill, and one retry if the reply doesn't fit.
import Anthropic from "@anthropic-ai/sdk";
import { anthropic, CONFIG, currentLeader, explain, fail, logUsage, parseRequest, underDailyLimit, type PracticeRequest } from "@/lib/practice";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["overall", "scores", "strongest", "try_this", "hidden", "next"],
  properties: {
    overall: { type: "string" },
    scores: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["skill", "score", "evidence", "tip"],
        properties: { skill: { type: "string" }, score: { type: "integer" }, evidence: { type: "string" }, tip: { type: "string" } },
      },
    },
    strongest: { type: "string" },
    try_this: { type: "string" },
    hidden: { type: "string" },
    next: { type: "string" },
  },
};

// Server-side fallback re-runs a wrongly declined request on another model. Only send it to
// models that accept the "default" form; a model set by environment variable may not.
const FALLBACK_MODELS = new Set(["claude-sonnet-5-5", "claude-opus-5-5", "claude-opus-5", "claude-fable-5-1"]);

type Feedback = { overall: string; scores: { skill: string; score: number; evidence: string; tip: string }[]; strongest: string; try_this: string; hidden: string; next: string };

/** The feedback, or null if it isn't usable (bad JSON, wrong number of scores). */
function validate(text: string, skills: string[]): Feedback | null {
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  } catch {
    return null;
  }
  if (!raw || !Array.isArray(raw.scores) || raw.scores.length !== skills.length) return null;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    overall: str(raw.overall),
    scores: (raw.scores as Record<string, unknown>[]).map((s, i) => ({
      skill: skills[i], // the role-play's own skill names, so scores line up across leaders
      score: Math.max(1, Math.min(3, Math.round(Number(s?.score)) || 1)),
      evidence: str(s?.evidence),
      tip: str(s?.tip),
    })),
    strongest: str(raw.strongest),
    try_this: str(raw.try_this),
    hidden: str(raw.hidden),
    next: str(raw.next),
  };
}

async function ask(prompt: string, userId: string) {
  const model = CONFIG.feedbackModel;
  const fallback = FALLBACK_MODELS.has(model);
  const response = await anthropic().beta.messages.create({
    model,
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
    ...(fallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
  });
  await logUsage(userId, "feedback", response.model, response.usage.input_tokens, response.usage.output_tokens);
  if (response.stop_reason === "refusal") return { refused: true as const };
  const text = response.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  return { text };
}

export async function POST(request: Request) {
  const userId = await currentLeader();
  if (!userId) return fail(401, "Your sign-in has expired. Sign in again, then try again.");

  const parsed = await parseRequest(await request.json().catch(() => null));
  if (typeof parsed === "string") return fail(400, parsed);
  const { who, skills, turns, feedbackPrompt }: PracticeRequest = parsed;
  if (turns.filter((t) => t.role === "leader").length < 2) return fail(400, "Send at least two messages before asking for feedback.");

  if (!(await underDailyLimit(userId, "feedback"))) {
    return fail(429, `You've reached today's limit of ${CONFIG.feedbackPerDay} feedback requests. It resets tomorrow.`);
  }

  const transcript = turns.map((t) => (t.role === "leader" ? "LEADER: " : who.toUpperCase() + ": ") + t.text).join("\n");
  const prompt = feedbackPrompt(transcript);
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await ask(prompt, userId);
      if ("refused" in result) return fail(422, "The coach couldn't review this conversation. Try starting over and rephrasing.");
      const fb = validate(result.text, skills);
      if (fb) return Response.json({ feedback: fb });
    }
    return fail(502, "The feedback didn't come back in a readable form. Try again.");
  } catch (err) {
    console.error("practice feedback failed", err);
    if (err instanceof Anthropic.APIError || err instanceof Anthropic.APIConnectionError) return fail(502, explain(err));
    return fail(500, "Something went wrong getting your feedback. Try again.");
  }
}
