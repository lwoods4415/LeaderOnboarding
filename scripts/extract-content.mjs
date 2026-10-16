// One-time port: writes content/leading-people/*.ts from the reference page, word for word.
// Run with: node scripts/extract-content.mjs   (then: node scripts/verify-content.mjs)
import { mkdirSync, writeFileSync } from "node:fs";
import { applyEdits } from "./approved-edits.mjs";
import { loadReference } from "./load-reference.mjs";

// The reference content, plus the wording changes the program owner has approved.
const d = applyEdits(loadReference().data);
const P = d.P;
const dir = new URL("../content/leading-people/", import.meta.url);
mkdirSync(dir, { recursive: true });

const HEADER = "// Generated from reference/1-Leading-People-Protocol.html by scripts/extract-content.mjs.\n// Text is verbatim from the reference page, apart from approved-edits.json. To change wording, edit that file and re-run.\n";
const json = (v) => JSON.stringify(v, null, 2);
function emit(file, types, consts) {
  const body = consts.map(([name, type, value]) => `export const ${name}${type ? `: ${type}` : ""} = ${json(value)}${type ? "" : " as const"};\n`).join("\n");
  writeFileSync(new URL(file, dir), `${HEADER}${types.length ? `import type { ${types.join(", ")} } from "../types";\n` : ""}\n${body}`);
}

emit("modules.ts", ["Module", "Measure"], [
  ["MODULES", "Module[]", d.FT_MODULES],
  ["MEASURES", "Measure[]", d.FT_MEASURES],
]);
// Persona and hidden context go in a separate file that only server code imports,
// so leaders can't read what a character is holding back from the browser.
emit("roleplays.ts", ["Roleplay", "Difficulty"], [
  ["ROLEPLAYS", "Roleplay[]", d.ROLEPLAYS.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => k !== "persona" && k !== "hidden")))],
  ["MODES", "Record<Difficulty, string>", d.MODES],
]);
emit("roleplay-secrets.ts", ["RoleplaySecret"], [
  ["ROLEPLAY_SECRETS", "Record<string, RoleplaySecret>", Object.fromEntries(d.ROLEPLAYS.map((r) => [r.id, { persona: r.persona, hidden: r.hidden }]))],
]);
emit("pathway.ts", ["PathwayStage"], [
  ["PATHWAY", "PathwayStage[]", d.PATHWAY],
  ["ESCALATE", "string[]", d.ESCALATE],
]);
emit("growth.ts", [], [
  ["SELF_SKILLS", "string[]", d.SELF_SKILLS],
  ["PULSE_Q", "string[]", d.PULSE_Q],
  ["PULSE_OPEN", "string[]", d.PULSE_OPEN],
]);
emit("toolkit.ts", ["Tool", "PlannerTool"], [
  ["TOOLS", "Tool[]", P.tools],
  ["DOC_TOOL", "PlannerTool", P.docTool],
  ["BOOKS", "[string, string][]", P.books],
  ["BRAVING", "[string, string][]", d.BRAVING],
]);
const MOVED = ["modules", "measures", "tools", "docTool", "books", "sponsor"];
const program = Object.fromEntries(Object.entries(P).filter(([k]) => !MOVED.includes(k)));
emit("program.ts", ["Program", "Sponsor"], [
  ["PROGRAM", "Program", program],
  ["SPONSOR", "Sponsor", P.sponsor],
  ["PASSAGES", "string[]", d.PASSAGES],
]);
console.log("Wrote content/leading-people/*.ts");
