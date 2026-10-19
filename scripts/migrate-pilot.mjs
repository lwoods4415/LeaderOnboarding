// Moves the original single-organization pilot into the platform structure (after migration 0005):
//   - creates organization #1 with its own live copy of the standard program (content + secrets)
//   - gives every existing person a membership (the old admin becomes org admin and super admin)
//   - enrolls every leader on the "company" plan, keeping their cohort
//   - links existing progress, private data, shared items, custom scenarios and usage to the enrollment
// Safe to re-run: it reuses what already exists and only fills in missing links.
// Run: node --env-file=.env.staging.local scripts/migrate-pilot.mjs "Organization name"
//      add --live to run against the live database (asks nothing; be sure).
import { createClient } from "@supabase/supabase-js";

const LIVE_REF = "qjhlpvzllobovjpyonhp";
const isLive = process.env.NEXT_PUBLIC_SUPABASE_URL.includes(LIVE_REF);
if (isLive && !process.argv.includes("--live")) throw new Error("This is the live database. Re-run with --live if you mean it.");
const orgName = process.argv.slice(2).find((a) => !a.startsWith("--")) || "Pilot";
const TEMPLATE_ID = "leading-people-healthcare-v1";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const must = (r, what) => { if (r.error) throw new Error(`${what}: ${r.error.message}`); return r.data; };

// 1. Organization #1
let org = must(await db.from("organizations").select("id, name").eq("slug", "pilot").maybeSingle(), "find org");
if (!org) org = must(await db.from("organizations").insert({ name: orgName, slug: "pilot", kind: "company" }).select("id, name").single(), "create org");
console.log(`Organization: ${org.name} (${org.id})`);

// 2. Its own live copy of the standard program
const tpl = must(await db.from("program_templates").select("content").eq("id", TEMPLATE_ID).single(), "load template");
const tplSecrets = must(await db.from("program_template_secrets").select("secrets").eq("template_id", TEMPLATE_ID).single(), "load template secrets");
let op = must(await db.from("org_programs").select("id").eq("org_id", org.id).eq("program", "leading-people").maybeSingle(), "find org program");
if (!op) {
  op = must(await db.from("org_programs").insert({
    org_id: org.id, program: "leading-people", template_id: TEMPLATE_ID, status: "live", content: tpl.content, approved_at: new Date().toISOString(),
  }).select("id").single(), "create org program");
  must(await db.from("org_program_secrets").insert({ org_program_id: op.id, secrets: tplSecrets.secrets }), "copy secrets");
}
console.log(`Program copy: ${op.id}`);

// 3. Cohorts belong to the organization
must(await db.from("cohorts").update({ org_id: org.id }).is("org_id", null), "link cohorts");

// 4. Memberships and enrollments for everyone
const people = must(await db.from("profiles").select("id, role, active, cohort_id"), "load profiles");
const enrollmentOf = new Map();
for (const p of people) {
  must(await db.from("memberships").upsert({ user_id: p.id, org_id: org.id, role: p.role === "admin" ? "org_admin" : "leader", active: p.active }, { onConflict: "user_id,org_id" }), "membership");
  if (p.role === "admin") must(await db.from("profiles").update({ is_super_admin: true }).eq("id", p.id), "super admin");
  // Everyone (admins included, so they can use the program too) gets an enrollment.
  let e = must(await db.from("enrollments").select("id").eq("user_id", p.id).eq("org_program_id", op.id).maybeSingle(), "find enrollment");
  if (!e) e = must(await db.from("enrollments").insert({ user_id: p.id, org_id: org.id, org_program_id: op.id, plan: "company", cohort_id: p.cohort_id }).select("id").single(), "enrollment");
  enrollmentOf.set(p.id, e.id);
}
console.log(`People: ${people.length} (memberships and enrollments in place)`);

// 5. Link existing data to each person's enrollment
for (const table of ["leader_private", "leader_progress", "shared_items", "custom_scenarios", "usage_log"]) {
  let n = 0;
  for (const [userId, enrollmentId] of enrollmentOf) {
    const patch = table === "usage_log" ? { enrollment_id: enrollmentId, org_id: org.id } : { enrollment_id: enrollmentId };
    const r = must(await db.from(table).update(patch).eq("user_id", userId).is("enrollment_id", null).select("user_id"), `link ${table}`);
    n += r.length;
  }
  const left = must(await db.from(table).select("user_id", { count: "exact", head: false }).is("enrollment_id", null), `check ${table}`);
  console.log(`${table}: linked ${n}, still unlinked ${left.length}`);
}
console.log("Done.");
