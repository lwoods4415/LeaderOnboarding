// Runs the reference page's own data code (everything before the engine starts)
// in a sandbox and returns the finished content objects, exactly as the page saw them.
import { readFileSync } from "node:fs";
import vm from "node:vm";

export const REFERENCE = new URL("../reference/1-Leading-People-Protocol.html", import.meta.url);

export function loadReference() {
  const html = readFileSync(REFERENCE, "utf8");
  const start = html.indexOf("<script>") + "<script>".length;
  const end = html.indexOf("const MODULES = P.modules;");
  if (start < 8 || end < 0) throw new Error("Reference page layout changed; update load-reference.mjs");
  const code =
    html.slice(start, end) +
    "\n;({FT_MODULES, FT_MEASURES, ROLEPLAYS, MODES, PATHWAY, ESCALATE, SELF_SKILLS, PULSE_Q, PULSE_OPEN, P, PASSAGES, BRAVING});";
  const out = vm.runInNewContext(code, {}, { filename: "reference-data.js" });
  return { html, data: JSON.parse(JSON.stringify(out, (k, v) => (k === "roleplay" ? undefined : v))) };
}
