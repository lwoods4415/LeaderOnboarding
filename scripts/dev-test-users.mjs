// Dev only: create throwaway test accounts and print one-time sign-in links for local testing
// (no email is sent). Usage: node --env-file=.env.local scripts/dev-test-users.mjs create|links|delete
import { createClient } from "@supabase/supabase-js";

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const PEOPLE = [
  { email: "dev-test-leader-a@example.com", name: "Test Leader A", role: "leader" },
  { email: "dev-test-leader-b@example.com", name: "Test Leader B", role: "leader" },
  { email: "dev-test-admin@example.com", name: "Test Admin", role: "admin" },
];
const cmd = process.argv[2];
const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
const find = (email) => list.users.find((u) => u.email === email);

if (cmd === "create") {
  let { data: cohort } = await admin.from("cohorts").select("id").eq("name", "Dev test cohort").maybeSingle();
  if (!cohort) cohort = (await admin.from("cohorts").insert({ name: "Dev test cohort" }).select("id").single()).data;
  for (const p of PEOPLE) {
    const id = find(p.email)?.id ?? (await admin.auth.admin.createUser({ email: p.email, email_confirm: true })).data.user.id;
    await admin.from("profiles").upsert({ id, email: p.email, name: p.name, role: p.role, cohort_id: cohort.id, active: true });
  }
  console.log("created");
} else if (cmd === "links") {
  for (const p of PEOPLE) {
    const { data } = await admin.auth.admin.generateLink({ type: "magiclink", email: p.email, options: { redirectTo: "http://localhost:3000/auth/callback" } });
    console.log(p.name + ": " + data.properties.action_link);
  }
} else if (cmd === "delete") {
  for (const p of PEOPLE) { const u = find(p.email); if (u) await admin.auth.admin.deleteUser(u.id); }
  await admin.from("cohorts").delete().eq("name", "Dev test cohort");
  console.log("deleted");
}
