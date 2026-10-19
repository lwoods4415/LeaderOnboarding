// Stores the standard program in a database as a program template (content + server-only secrets).
// Same shape as standardProgram() in content/program.ts. Safe to re-run: it updates the template.
// Run: node --env-file=.env.staging.local scripts/seed-templates.mjs   (or .env.local for live)
import { createClient } from "@supabase/supabase-js";

const load = (f) => import(new URL(`../content/leading-people/${f}`, import.meta.url));
const [mod, rp, path, growth, tool, prog, secrets] = await Promise.all(
  ["modules.ts", "roleplays.ts", "pathway.ts", "growth.ts", "toolkit.ts", "program.ts", "roleplay-secrets.ts"].map(load),
);

export const STANDARD_TEMPLATE_ID = "leading-people-healthcare-v1";
const content = {
  program: prog.PROGRAM, passages: prog.PASSAGES, modules: mod.MODULES, measures: mod.MEASURES, roleplays: rp.ROLEPLAYS, modes: rp.MODES,
  pathway: path.PATHWAY, escalate: path.ESCALATE, selfSkills: growth.SELF_SKILLS, pulseQ: growth.PULSE_Q, pulseOpen: growth.PULSE_OPEN,
  tools: tool.TOOLS, docTool: tool.DOC_TOOL, books: tool.BOOKS, braving: tool.BRAVING, sponsor: prog.SPONSOR,
};

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const t = await admin.from("program_templates").upsert({ id: STANDARD_TEMPLATE_ID, program: "leading-people", title: "Leading People (healthcare)", content });
if (t.error) throw t.error;
const s = await admin.from("program_template_secrets").upsert({ template_id: STANDARD_TEMPLATE_ID, secrets: { roleplays: secrets.ROLEPLAY_SECRETS } });
if (s.error) throw s.error;
console.log(`Template ${STANDARD_TEMPLATE_ID} saved to ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
