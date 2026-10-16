// Checks that content/leading-people/*.ts matches the reference page exactly:
// rebuilds the reference's data objects from the ported files and deep-compares them.
// Run with: node scripts/verify-content.mjs
import { isDeepStrictEqual } from "node:util";
import { applyEdits, EDITS } from "./approved-edits.mjs";
import { loadReference } from "./load-reference.mjs";

// Compare against the reference with the owner-approved wording changes applied; anything else must match exactly.
const ref = applyEdits(loadReference().data);
const load = (f) => import(new URL(`../content/leading-people/${f}`, import.meta.url));
const [mod, rp, path, growth, tool, prog, secrets] = await Promise.all(
  ["modules.ts", "roleplays.ts", "pathway.ts", "growth.ts", "toolkit.ts", "program.ts", "roleplay-secrets.ts"].map(load),
);

const ported = {
  FT_MODULES: mod.MODULES,
  FT_MEASURES: mod.MEASURES,
  ROLEPLAYS: rp.ROLEPLAYS.map((r) => ({ ...r, ...secrets.ROLEPLAY_SECRETS[r.id] })),
  MODES: rp.MODES,
  PATHWAY: path.PATHWAY,
  ESCALATE: path.ESCALATE,
  SELF_SKILLS: growth.SELF_SKILLS,
  PULSE_Q: growth.PULSE_Q,
  PULSE_OPEN: growth.PULSE_OPEN,
  P: { ...prog.PROGRAM, measures: mod.MEASURES, modules: mod.MODULES, tools: tool.TOOLS, docTool: tool.DOC_TOOL, books: tool.BOOKS, sponsor: prog.SPONSOR },
  PASSAGES: prog.PASSAGES,
  BRAVING: tool.BRAVING,
};

let failed = 0, strings = 0;
const count = (v) => (typeof v === "string" ? strings++ : v && typeof v === "object" && Object.values(v).forEach(count));
for (const key of Object.keys(ref)) {
  const ok = isDeepStrictEqual(ref[key], JSON.parse(JSON.stringify(ported[key])));
  if (!ok) failed++;
  console.log(`${ok ? "OK  " : "FAIL"} ${key}`);
}
count(ref);
console.log(failed ? `\n${failed} section(s) differ from the reference.` : `\nAll content matches the reference (${strings} text values checked, ${EDITS.length} approved wording edits).`);
process.exit(failed ? 1 : 0);
