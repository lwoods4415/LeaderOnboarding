// STAGING ONLY. Creates a made-up pilot shaped like the live one (old structure), to rehearse the move
// into organizations. Refuses to run against the live project.
// Run: node --env-file=.env.staging.local scripts/staging-fake-pilot.mjs [delete]
import { createClient } from "@supabase/supabase-js";

const LIVE_REF = "qjhlpvzllobovjpyonhp";
if (process.env.NEXT_PUBLIC_SUPABASE_URL.includes(LIVE_REF)) throw new Error("Refusing to run against the live database.");
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

const PEOPLE = [
  { email: "fake-admin@example.com", name: "Fake Admin", role: "admin" },
  { email: "fake-leader-1@example.com", name: "Fake Leader One", role: "leader" },
  { email: "fake-leader-2@example.com", name: "Fake Leader Two", role: "leader" },
  { email: "fake-leader-3@example.com", name: "Fake Leader Three", role: "leader", active: false },
];

const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
if (process.argv[2] === "delete") {
  for (const p of PEOPLE) { const u = list.users.find((x) => x.email === p.email); if (u) await admin.auth.admin.deleteUser(u.id); }
  await admin.from("cohorts").delete().eq("name", "Fake pilot cohort");
  console.log("deleted");
  process.exit(0);
}

let { data: cohort } = await admin.from("cohorts").select("id").eq("name", "Fake pilot cohort").maybeSingle();
if (!cohort) cohort = (await admin.from("cohorts").insert({ name: "Fake pilot cohort" }).select("id").single()).data;

for (const p of PEOPLE) {
  const id = list.users.find((u) => u.email === p.email)?.id ?? (await admin.auth.admin.createUser({ email: p.email, email_confirm: true })).data.user.id;
  await admin.from("profiles").upsert({ id, email: p.email, name: p.name, role: p.role, active: p.active ?? true, cohort_id: p.role === "leader" ? cohort.id : null });
  if (p.role !== "leader") continue;
  await admin.from("leader_private").upsert({ user_id: id, data: { notes: { m0r1: `Private reflection of ${p.name}` }, checks: { m0p1: true }, updatedAt: Date.now() } });
  await admin.from("leader_progress").upsert({ user_id: id, data: { picks: { m0: { s0: 1, s1: 0, say: "Hello", first: { say: "Hello", s0: 1, s1: 0, done: true } } }, rp: {}, growth: { self0: { 0: "3" } }, summary: { overall: 5, modules: [{ id: "m0", pct: 30 }] }, updatedAt: Date.now() } });
  await admin.from("shared_items").upsert({ user_id: id, kind: "reflection", item_id: "m0r1", content: { text: `Shared reflection of ${p.name}` } }, { onConflict: "user_id,kind,item_id" });
  await admin.from("custom_scenarios").insert({ user_id: id, title: `${p.name}'s scenario`, who: "Sam", role: "A nurse", situation: "x", goal: "y" });
  await admin.from("usage_log").insert({ user_id: id, route: "message", model: "claude-haiku-5-5", input_tokens: 500, output_tokens: 100 });
}
console.log("fake pilot created");
