import { CORE_LESSONS } from "../../content/core-lessons";

const errors: string[] = [];
const ids = new Set<string>();
const need = (cond: unknown, msg: string) => { if (!cond) errors.push(msg); };
const uniq = (id: string, where: string) => { need(!ids.has(id), `Duplicate id ${id} (${where})`); ids.add(id); };

need(CORE_LESSONS.length === 7, "Expected 7 lessons");
const legacy = CORE_LESSONS.map((l) => l.legacyModuleId).join(",");
need(legacy === "m0,m1,m2,m3,m4,m5,m6", `Lessons out of order: ${legacy}`);

for (const l of CORE_LESSONS) {
  const w = l.id;
  uniq(l.id, w);
  uniq(l.makeItYours.id, w);
  need(l.makeItYours.questions.length >= 2, `${w}: make-it-yours needs 2+ questions`);
  l.makeItYours.questions.forEach((q) => { uniq(q.id, w); need(q.prompt.length > 10 && q.placeholder.length > 2, `${w}/${q.id}: prompt and placeholder required`); });
  if (l.spotlight) {
    need(l.spotlight.paragraphs.length >= 2, `${w}: spotlight needs 2+ paragraphs`);
    need(l.spotlight.sources.length >= 1, `${w}: spotlight needs a source`);
    const a = l.spotlight.activity;
    if (a) { const b = new Set(a.buckets.map((x) => x.id)); a.items.forEach((i) => { uniq(`${w}:${i.id}`, w); need(b.has(i.answer), `${w}: spotlight item ${i.id} answer not a bucket`); }); }
    l.spotlight.sources.forEach((s) => { if (s.url) need(s.url.startsWith("https://"), `${w}: spotlight url must be https`); });
  }
  need(l.bigIdea.length > 20, `${w}: bigIdea too short`);
  need(l.whyNow.length >= 1, `${w}: whyNow missing`);
  need(l.whyItWorks.paragraphs.length >= 2, `${w}: whyItWorks needs 2+ paragraphs`);
  need(l.whyItWorks.sources.length >= 1, `${w}: no sources`);
  need(l.traps.length >= 3, `${w}: needs 3+ traps`);
  need(l.check.length >= 3 && l.check.length <= 4, `${w}: needs 3 or 4 check questions`);
  for (const q of l.check) {
    uniq(q.id, w);
    need(q.options.filter((o) => o.correct).length === 1, `${w}/${q.id}: needs exactly one correct option`);
    need(q.options.every((o) => o.explain.length > 10), `${w}/${q.id}: every option needs an explanation`);
  }
  need(l.seeItInAction.weak.lines.length >= 2 && l.seeItInAction.strong.lines.length >= 2, `${w}: example too short`);
  need(l.fieldCard.lines.length >= 4, `${w}: field card too short`);
  need(l.goDeeper.length >= 3, `${w}: needs 3+ go-deeper resources`);
  for (const r of l.goDeeper) {
    if (r.kind !== "book") need(!!r.url, `${w}: ${r.title} needs a url`);
    if (r.url) need(r.url.startsWith("https://"), `${w}: ${r.title} url must be https`);
  }
  for (const s of l.whyItWorks.sources) if (s.url) need(s.url.startsWith("https://"), `${w}: source url must be https`);

  const m = l.model;
  switch (m.type) {
    case "flipcards":
      need(m.cards.length >= 3, `${w}: needs 3+ cards`);
      m.cards.forEach((c) => uniq(`${w}:${c.id}`, w));
      break;
    case "equation":
      need(m.factors.some((f) => f.role === "denominator"), `${w}: equation needs a denominator`);
      need(m.resultBands.length >= 2, `${w}: needs result bands`);
      need(m.scale.min >= 1 && m.scale.max > m.scale.min, `${w}: bad scale`);
      break;
    case "sort": {
      const b = new Set(m.buckets.map((x) => x.id));
      m.items.forEach((i) => need(b.has(i.answer), `${w}: item ${i.id} answer not a bucket`));
      need(m.items.length >= 6, `${w}: needs 6+ sort items`);
      break;
    }
    case "stages":
      need(m.stages.length >= 3, `${w}: needs 3+ stages`);
      break;
    case "matrix": {
      const pos = m.quadrants.map((q) => q.position).sort().join(",");
      need(pos === "bottomLeft,bottomRight,topLeft,topRight", `${w}: matrix needs one quadrant per position`);
      need(m.quadrants.some((q) => q.id === m.target), `${w}: target quadrant missing`);
      if (m.selfPlacement) { uniq(m.selfPlacement.id, w); m.selfPlacement.questions.forEach((q) => uniq(q.id, w)); }
      break;
    }
  }
  // Straight double quotes inside content would suggest an escaping mistake.
  const text = JSON.stringify(l);
  need(!/\\"/.test(text), `${w}: contains straight double quotes inside text; use curly quotes`);
}

if (errors.length) {
  console.error("Validation failed:\n- " + errors.join("\n- "));
  process.exit(1);
}
const words = CORE_LESSONS.map((l) => JSON.stringify(l).split(/\s+/).length);
console.log(`All 7 lessons valid. Approximate words per lesson: ${words.join(", ")}`);
