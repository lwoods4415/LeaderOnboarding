// STAGING ONLY: a second organization (admin + leader, with progress) to check organizations stay apart.
import { createClient } from "@supabase/supabase-js";

if (process.env.NEXT_PUBLIC_SUPABASE_URL.includes("qjhlpvzllobovjpyonhp")) throw new Error("Not for the live database.");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const must = (r) => { if (r.error) throw r.error; return r.data; };
const tpl = must(await db.from("program_templates").select("content").eq("id", "leading-people-healthcare-v1").single());
const sec = must(await db.from("program_template_secrets").select("secrets").eq("template_id", "leading-people-healthcare-v1").single());
let org = must(await db.from("organizations").select("id").eq("slug", "second-org").maybeSingle());
if (!org) org = must(await db.from("organizations").insert({ name: "Second Test Org", slug: "second-org", kind: "company" }).select("id").single());
let op = must(await db.from("org_programs").select("id").eq("org_id", org.id).maybeSingle());
if (!op) {
  op = must(await db.from("org_programs").insert({ org_id: org.id, program: "leading-people", status: "live", content: tpl.content }).select("id").single());
  must(await db.from("org_program_secrets").insert({ org_program_id: op.id, secrets: sec.secrets }));
}
const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 });
for (const [email, name, role] of [["second-admin@example.com", "Second Admin", "org_admin"], ["second-leader@example.com", "Second Leader", "leader"]]) {
  const id = list.users.find((u) => u.email === email)?.id ?? must(await db.auth.admin.createUser({ email, email_confirm: true })).user.id;
  must(await db.from("profiles").upsert({ id, email, name }));
  must(await db.from("memberships").upsert({ user_id: id, org_id: org.id, role }, { onConflict: "user_id,org_id" }));
  let e = must(await db.from("enrollments").select("id").eq("user_id", id).eq("org_program_id", op.id).maybeSingle());
  if (!e) e = must(await db.from("enrollments").insert({ user_id: id, org_id: org.id, org_program_id: op.id, plan: "company" }).select("id").single());
  if (role === "leader") must(await db.from("leader_progress").upsert({ user_id: id, enrollment_id: e.id, data: { picks: {}, summary: { overall: 42, modules: [] }, updatedAt: Date.now() } }, { onConflict: "enrollment_id" }));
}
console.log("second org ready");
