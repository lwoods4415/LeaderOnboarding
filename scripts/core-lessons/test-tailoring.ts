import { CORE_LESSONS, extractTailorable, validateTailored, applyTailored, buildTailoringRequest } from "../../content/core-lessons";

let ok = true;
const ctx = { organizationDescription: "A regional chain of veterinary clinics", leaderRole: "Front desk team lead", teamDescription: "Six client service coordinators who book appointments and handle billing", workSetting: "in person", keyMetrics: ["call answer rate", "same-day booking rate"], harmContext: "a sick pet not getting seen in time" };
for (const l of CORE_LESSONS) {
  const t = extractTailorable(l);
  const errs = validateTailored(l, t);
  if (errs.length) { ok = false; console.log(l.id, "identity should pass:", errs); }
  const applied = applyTailored(l, t);
  if (JSON.stringify(applied) !== JSON.stringify(l)) { ok = false; console.log(l.id, "identity apply changed content"); }
  // broken: drop a line, change an id, empty string
  const bad = JSON.parse(JSON.stringify(t));
  bad.seeItInAction.weak.lines.pop();
  bad.check[0].id = "nope";
  bad.traps[0].trap = "";
  const be = validateTailored(l, bad);
  if (be.length < 3) { ok = false; console.log(l.id, "broken version not caught:", be); }
  const req = buildTailoringRequest(l, ctx);
  if (!req.includes("EXAMPLE_LAYER_TO_REWRITE")) ok = false;
}
// correct flags must survive even if a tailored version lies about them
const l4 = CORE_LESSONS[4];
const t4: any = extractTailorable(l4);
t4.check[0].options[0].correct = true;
const a4 = applyTailored(l4, t4);
if (a4.check[0].options.findIndex(o => o.correct) !== l4.check[0].options.findIndex(o => o.correct)) { ok = false; console.log("correct flag leaked"); }
console.log(ok ? "Tailoring tests passed." : "Tailoring tests FAILED.");
if (!ok) process.exit(1);
