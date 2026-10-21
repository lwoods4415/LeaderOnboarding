// Row-level security tests for the platform (organizations, programs, enrollments), after migration 0006.
// Builds two throwaway organizations, each with an org admin and two leaders, plus a super admin,
// signs in as each, checks what they can and can't read or write, then deletes everything.
// Run: npm run test:rls:staging
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLISHABLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SECRET = process.env.SUPABASE_SECRET_KEY;
if (!URL || !PUBLISHABLE || !SECRET) throw new Error("Set the Supabase URL, publishable key and secret key.");

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const service = createClient(URL, SECRET, opts);
const run = Math.random().toString(36).slice(2, 8);
const must = (r) => { assert.equal(r.error, null, r.error?.message); return r.data; };
const rows = must;

const orgs = {};   // a, b -> { id, program, draft }
const people = {}; // label -> { id, db, enrollment, org }

async function signIn(email) {
  const link = await service.auth.admin.generateLink({ type: "magiclink", email });
  if (link.error) throw link.error;
  const client = createClient(URL, PUBLISHABLE, opts);
  const v = await client.auth.verifyOtp({ type: "email", token_hash: link.data.properties.hashed_token });
  if (v.error) throw v.error;
  return client;
}

async function makeOrg(key) {
  const org = must(await service.from("organizations").insert({ name: `Test org ${key} ${run}`, slug: `t-${key}-${run}`, kind: "company" }).select("id").single());
  const program = must(await service.from("org_programs").insert({ org_id: org.id, program: "leading-people", status: "live", content: { test: true } }).select("id").single());
  must(await service.from("org_program_secrets").insert({ org_program_id: program.id, secrets: { roleplays: { rp0: { persona: "SECRET-PERSONA", hidden: "SECRET" } } } }));
  const draft = must(await service.from("org_programs").insert({ org_id: org.id, program: "leading-leaders", status: "pending_review", content: { draft: true } }).select("id").single());
  orgs[key] = { id: org.id, program: program.id, draft: draft.id };
}

async function makePerson(label, orgKey, { orgAdmin = false, superAdmin = false } = {}) {
  const email = `rls-${run}-${label}@example.com`;
  const { data, error } = await service.auth.admin.createUser({ email, email_confirm: true });
  if (error) throw error;
  const id = data.user.id;
  must(await service.from("profiles").insert({ id, email, name: label, role: "leader", is_super_admin: superAdmin }));
  let enrollment = null;
  if (orgKey) {
    const org = orgs[orgKey];
    must(await service.from("memberships").insert({ user_id: id, org_id: org.id, role: orgAdmin ? "org_admin" : "leader" }));
    enrollment = must(await service.from("enrollments").insert({ user_id: id, org_id: org.id, org_program_id: org.program, plan: "company" }).select("id").single()).id;
  }
  people[label] = { id, enrollment, org: orgKey, db: await signIn(email) };
}

before(async () => {
  await makeOrg("a");
  await makeOrg("b");
  await makePerson("adminA", "a", { orgAdmin: true });
  await makePerson("leaderA1", "a");
  await makePerson("leaderA2", "a");
  await makePerson("adminB", "b", { orgAdmin: true });
  await makePerson("leaderB1", "b");
  await makePerson("super", null, { superAdmin: true });

  // Each leader saves private data, progress, a shared reflection, a custom scenario; usage is logged.
  for (const label of ["leaderA1", "leaderA2", "leaderB1"]) {
    const p = people[label];
    must(await p.db.from("leader_private").upsert({ user_id: p.id, enrollment_id: p.enrollment, data: { note: `PRIVATE-${label}` } }));
    must(await p.db.from("leader_progress").upsert({ user_id: p.id, enrollment_id: p.enrollment, data: { picks: {} } }));
    must(await p.db.from("shared_items").insert({ user_id: p.id, enrollment_id: p.enrollment, kind: "reflection", item_id: "r1", content: { text: "shared" } }));
    must(await p.db.from("custom_scenarios").insert({ user_id: p.id, enrollment_id: p.enrollment, title: "t", who: "Sam", role: "r", situation: `SCENARIO-${label}`, goal: "g" }));
    must(await service.from("usage_log").insert({ user_id: p.id, enrollment_id: p.enrollment, org_id: orgs[p.org].id, route: "message", model: "rls-test" }));
  }
});

after(async () => {
  for (const p of Object.values(people)) await service.auth.admin.deleteUser(p.id);
  for (const o of Object.values(orgs)) await service.from("organizations").delete().eq("id", o.id);
  await service.from("usage_log").delete().eq("model", "rls-test");
});

const ids = (r) => rows(r).map((x) => x.user_id ?? x.id);

describe("a leader", () => {
  test("reads only their own private data, progress, shared items and custom scenarios", async () => {
    const { leaderA1, leaderA2, leaderB1 } = people;
    for (const t of ["leader_private", "leader_progress", "shared_items", "custom_scenarios"]) {
      const seen = ids(await leaderA1.db.from(t).select("user_id"));
      assert.ok(seen.every((id) => id === leaderA1.id), `${t}: saw someone else's rows`);
      assert.ok(!seen.includes(leaderA2.id) && !seen.includes(leaderB1.id));
    }
  });

  test("can't write into someone else's enrollment, even with their own user id", async () => {
    const { leaderA1, leaderA2 } = people;
    const r1 = await leaderA1.db.from("leader_progress").upsert({ user_id: leaderA1.id, enrollment_id: leaderA2.enrollment, data: { hacked: true } });
    assert.ok(r1.error, "own user id + someone else's enrollment should be refused");
    const r2 = await leaderA1.db.from("leader_private").insert({ user_id: leaderA2.id, enrollment_id: leaderA2.enrollment, data: {} });
    assert.ok(r2.error);
    const upd = await leaderA1.db.from("leader_progress").update({ data: { hacked: true } }).eq("enrollment_id", leaderA2.enrollment).select();
    assert.deepEqual(upd.data ?? [], []);
  });

  test("sees only their own profile, membership and enrollment; can't promote themselves", async () => {
    const { leaderA1 } = people;
    assert.deepEqual(ids(await leaderA1.db.from("profiles").select("id")), [leaderA1.id]);
    assert.deepEqual(ids(await leaderA1.db.from("memberships").select("user_id")), [leaderA1.id]);
    assert.deepEqual(ids(await leaderA1.db.from("enrollments").select("user_id")), [leaderA1.id]);
    const up = await leaderA1.db.from("profiles").update({ is_super_admin: true }).eq("id", leaderA1.id).select();
    assert.ok(up.error || (up.data ?? []).length === 0);
    const m = await leaderA1.db.from("memberships").update({ role: "org_admin" }).eq("user_id", leaderA1.id).select();
    assert.ok(m.error || (m.data ?? []).length === 0);
    const check = await service.from("memberships").select("role").eq("user_id", leaderA1.id).single();
    assert.equal(check.data.role, "leader");
  });

  test("sees their organization's live program, not drafts, and never another organization", async () => {
    const { leaderA1 } = people;
    const progs = rows(await leaderA1.db.from("org_programs").select("id"));
    assert.deepEqual(progs.map((p) => p.id), [orgs.a.program]);
    assert.deepEqual(rows(await leaderA1.db.from("organizations").select("id")).map((o) => o.id), [orgs.a.id]);
  });

  test("can't read character backstories (secrets tables)", async () => {
    const r1 = await people.leaderA1.db.from("org_program_secrets").select("*");
    assert.ok(r1.error || r1.data.length === 0);
    const r2 = await people.leaderA1.db.from("program_template_secrets").select("*");
    assert.ok(r2.error || r2.data.length === 0);
  });
});

describe("an org admin", () => {
  test("reads their own organization's progress and shared items, and not another organization's", async () => {
    const { adminA, leaderA1, leaderA2, leaderB1 } = people;
    for (const t of ["leader_progress", "shared_items"]) {
      const seen = ids(await adminA.db.from(t).select("user_id"));
      assert.ok(seen.includes(leaderA1.id) && seen.includes(leaderA2.id), `${t}: should see own org`);
      assert.ok(!seen.includes(leaderB1.id), `${t}: must not see other org`);
    }
    const profiles = ids(await adminA.db.from("profiles").select("id"));
    assert.ok(profiles.includes(leaderA1.id) && !profiles.includes(leaderB1.id));
    const usage = ids(await adminA.db.from("usage_log").select("user_id"));
    assert.ok(usage.includes(leaderA1.id) && !usage.includes(leaderB1.id));
  });

  test("never reads leaders' private data or custom scenarios", async () => {
    const { adminA } = people;
    assert.deepEqual(ids(await adminA.db.from("leader_private").select("user_id")).filter((id) => id !== adminA.id), []);
    assert.deepEqual(ids(await adminA.db.from("custom_scenarios").select("user_id")).filter((id) => id !== adminA.id), []);
  });

  test("sees their organization's draft programs but not another organization's", async () => {
    const progs = rows(await people.adminA.db.from("org_programs").select("id")).map((p) => p.id);
    assert.ok(progs.includes(orgs.a.draft) && !progs.includes(orgs.b.program) && !progs.includes(orgs.b.draft));
  });

  test("can't edit leaders' progress or change memberships directly", async () => {
    const { adminA, leaderA1 } = people;
    const upd = await adminA.db.from("leader_progress").update({ data: {} }).eq("user_id", leaderA1.id).select();
    assert.deepEqual(upd.data ?? [], []);
    const m = await adminA.db.from("memberships").update({ role: "org_admin" }).eq("user_id", leaderA1.id).select();
    assert.ok(m.error || (m.data ?? []).length === 0);
  });
});

describe("the super admin", () => {
  test("sees the platform overview: all organizations, programs, memberships, enrollments, people and usage", async () => {
    const { super: sa, leaderA1, leaderB1 } = people;
    const o = rows(await sa.db.from("organizations").select("id")).map((x) => x.id);
    assert.ok(o.includes(orgs.a.id) && o.includes(orgs.b.id));
    const p = rows(await sa.db.from("org_programs").select("id")).map((x) => x.id);
    assert.ok(p.includes(orgs.a.draft) && p.includes(orgs.b.program));
    const e = ids(await sa.db.from("enrollments").select("user_id"));
    assert.ok(e.includes(leaderA1.id) && e.includes(leaderB1.id));
    const u = ids(await sa.db.from("usage_log").select("user_id"));
    assert.ok(u.includes(leaderA1.id) && u.includes(leaderB1.id));
  });

  test("does not see leaders' progress, private data, shared items or custom scenarios", async () => {
    const { super: sa } = people;
    for (const t of ["leader_progress", "leader_private", "shared_items", "custom_scenarios"]) {
      assert.deepEqual(rows(await sa.db.from(t).select("user_id")), [], `${t} should be empty for the super admin`);
    }
  });
});

describe("intake requests", () => {
  test("are server only: no one signed in (not even the super admin) or signed out can read or add them", async () => {
    const anon = createClient(URL, PUBLISHABLE, opts);
    for (const db of [anon, people.super.db, people.adminA.db, people.leaderA1.db]) {
      const r = await db.from("intake_requests").select("*");
      assert.ok(r.error || r.data.length === 0, "intake_requests should be denied");
      assert.ok((await db.from("intake_requests").insert({ kind: "company", answers: {} })).error, "insert should be denied");
    }
  });
});

describe("sharing", () => {
  test("stop sharing deletes the shared copy, and the org admin no longer sees it", async () => {
    const { leaderA2, adminA } = people;
    rows(await leaderA2.db.from("shared_items").delete().eq("enrollment_id", leaderA2.enrollment).eq("item_id", "r1"));
    assert.ok(!ids(await adminA.db.from("shared_items").select("user_id")).includes(leaderA2.id));
  });
});

describe("removed access", () => {
  test("a leader whose membership or enrollment is inactive can't save", async () => {
    const { leaderB1 } = people;
    await service.from("memberships").update({ active: false }).eq("user_id", leaderB1.id);
    assert.ok((await leaderB1.db.from("leader_progress").upsert({ user_id: leaderB1.id, enrollment_id: leaderB1.enrollment, data: { x: 1 } })).error);
    await service.from("memberships").update({ active: true }).eq("user_id", leaderB1.id);
    await service.from("enrollments").update({ status: "expired" }).eq("id", leaderB1.enrollment);
    assert.ok((await leaderB1.db.from("leader_progress").upsert({ user_id: leaderB1.id, enrollment_id: leaderB1.enrollment, data: { x: 1 } })).error);
    await service.from("enrollments").update({ status: "active" }).eq("id", leaderB1.enrollment);
  });
});

describe("signed-out visitors", () => {
  test("can't read anything", async () => {
    const anon = createClient(URL, PUBLISHABLE, opts);
    for (const t of ["profiles", "cohorts", "leader_private", "leader_progress", "shared_items", "custom_scenarios", "usage_log",
      "organizations", "org_programs", "org_program_secrets", "program_templates", "program_template_secrets", "memberships", "enrollments", "intake_requests"]) {
      const r = await anon.from(t).select("*");
      assert.ok(r.error || r.data.length === 0, `${t} should be empty or denied`);
    }
  });
});
