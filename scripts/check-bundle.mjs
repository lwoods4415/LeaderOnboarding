// After `npm run build`: confirm nothing secret reached the code sent to browsers.
// Checks for the Anthropic and Supabase secret keys (by value and by name) and for the
// role-play backstories, which must stay on the server. (The bare "sb_secret_" prefix isn't
// checked: supabase-js itself contains it to tell key types apart.) Run: node --env-file=.env.local scripts/check-bundle.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { ROLEPLAY_SECRETS } from "../content/leading-people/roleplay-secrets.ts";

const files = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(js|html|json|txt|css)$/.test(f)) files.push(p);
  }
})(".next/static");

const needles = [
  ["ANTHROPIC_API_KEY value", process.env.ANTHROPIC_API_KEY],
  ["SUPABASE_SECRET_KEY value", process.env.SUPABASE_SECRET_KEY],
  ["the name ANTHROPIC_API_KEY", "ANTHROPIC_API_KEY"],
  ["the name SUPABASE_SECRET_KEY", "SUPABASE_SECRET_KEY"],
  ["an sk-ant- key", "sk-ant-"],
  ...Object.entries(ROLEPLAY_SECRETS).map(([id, s]) => [`${id} hidden context`, s.hidden.slice(0, 60)]),
  // Core lessons reach the browser only from /api/program, trimmed to the leader's plan.
  ...readdirSync("content/core-lessons").filter((f) => /^m\d/.test(f)).map((f) => {
    const m = readFileSync(`content/core-lessons/${f}`, "utf8").match(/bigIdea:\s*"([^"]{20,60})/);
    return [`core lesson text (${f})`, m?.[1]];
  }),
].filter(([, v]) => v);

let found = 0;
for (const f of files) {
  const text = readFileSync(f, "utf8");
  for (const [label, v] of needles) if (text.includes(v)) { found++; console.log(`FOUND ${label} in ${f}`); }
}
console.log(found ? `\n${found} problem(s) found.` : `Checked ${files.length} browser files for ${needles.length} secrets: none found.`);
process.exit(found ? 1 : 0);
