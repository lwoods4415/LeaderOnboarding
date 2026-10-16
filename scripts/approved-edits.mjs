// Applies the owner-approved wording changes in content/leading-people/approved-edits.json to the
// reference content. Used by extract-content (to write the content files) and verify-content (so
// everything not listed there must still match the reference word for word).
import { readFileSync } from "node:fs";

const groups = JSON.parse(readFileSync(new URL("../content/leading-people/approved-edits.json", import.meta.url), "utf8"));
export const EDITS = groups.flatMap((g) => g.edits);

/** Returns a copy of `data` with every approved edit applied. Each edit must match something, so a typo
 *  can't silently do nothing (the reference holds modules twice, so matches are counted, not required to be 1). */
export function applyEdits(data) {
  const hits = new Map(EDITS.map((e) => [e.find, 0]));
  const walk = (v) => {
    if (typeof v === "string") {
      let s = v;
      for (const e of EDITS) {
        if (s.includes(e.find)) {
          hits.set(e.find, hits.get(e.find) + 1);
          s = s.split(e.find).join(e.replace);
        }
      }
      return s;
    }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  const out = walk(data);
  const bad = [...hits].filter(([, n]) => n === 0);
  if (bad.length) throw new Error("These approved edits didn't match any text:\n" + bad.map(([f, n]) => `  ${n}x  ${f}`).join("\n"));
  return out;
}
