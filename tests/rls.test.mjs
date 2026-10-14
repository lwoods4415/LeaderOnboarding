// Row-level security tests: run against the real Supabase project with `npm run test:rls`.
// Creates two throwaway leaders and a throwaway admin, signs in as each, checks what they can and
// can't read or write, then deletes them. Needs .env.local with the URL, publishable key and secret key.
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLISHABLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SECRET = process.env.SUPABASE_SECRET_KEY;
if (!URL || !PUBLISHABLE || !SECRET) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET_KEY in .env.local");

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const service = createClient(URL, SECRET, opts);
const run = Math.random().toString(36).slice(2, 8);
const users = {};
let cohortId;

async function makeUser(label, role) {
  const email = `rls-test-${run}-${label}@example.com`;
  const { data, error } = await service.auth.admin.createUser({ email, email_confirm: true });
  if (error) throw error;
  const id = data.user.id;
  const p = await service.from("profiles").insert({ id, email, name: `Test ${label}`, role, cohort_id: cohortId });
  if (p.error) throw p.error;
  // Sign in without sending email: generate a magic-link token and verify it directly.
  const link = await service.auth.admin.generateLink({ type: "magiclink", email });
  if (link.error) throw link.error;
  const client = createClient(URL, PUBLISHABLE, opts);
  const v = await client.auth.verifyOtp({ type: "email", token_hash: link.data.properties.hashed_token });
  if (v.error) throw v.error;
  users[label] = { id, email, db: client };
}

const rows = (r) => { assert.equal(r.error, null, r.error?.message); return r.data; };

before(async () => {
  const c = await service.from("cohorts").insert({ name: `rls-test-${run}` }).select("id").single();
  if (c.error) throw c.error;
  cohortId = c.data.id;
  await makeUser("a", "leader");
  await makeUser("b", "leader");
  await makeUser("admin", "admin");
  // Leader A saves private and progress data and shares one reflection.
  const { a } = users;
  rows(await a.db.from("leader_private").upsert({ user_id: a.id, data: { notes: { r1: "private reflection" } } }));
  rows(await a.db.from("leader_progress").upsert({ user_id: a.id, data: { picks: { m0: { s0: 1 } } } }));
  rows(await a.db.from("shared_items").insert({ user_id: a.id, kind: "reflection", item_id: "r1", content: { text: "shared reflection" } }));
});

after(async () => {
  for (const u of Object.values(users)) await service.auth.admin.deleteUser(u.id);
  if (cohortId) await service.from("cohorts").delete().eq("id", cohortId);
});

describe("a leader", () => {
  test("reads their own private and progress data", async () => {
    const { a } = users;
    assert.equal(rows(await a.db.from("leader_private").select("data").eq("user_id", a.id)).length, 1);
    assert.equal(rows(await a.db.from("leader_progress").select("data").eq("user_id", a.id)).length, 1);
  });

  test("can't read another leader's private, progress or shared data", async () => {
    const { a, b } = users;
    assert.deepEqual(rows(await b.db.from("leader_private").select("*").eq("user_id", a.id)), []);
    assert.deepEqual(rows(await b.db.from("leader_progress").select("*").eq("user_id", a.id)), []);
    assert.deepEqual(rows(await b.db.from("shared_items").select("*").eq("user_id", a.id)), []);
    assert.deepEqual(rows(await b.db.from("leader_private").select("user_id")).map((r) => r.user_id).filter((id) => id !== b.id), []);
  });

  test("can't write another leader's data", async () => {
    const { a, b } = users;
    const insert = await b.db.from("leader_private").insert({ user_id: a.id, data: { hacked: true } });
    assert.ok(insert.error, "insert for someone else should fail");
    const upd = await b.db.from("leader_progress").update({ data: { hacked: true } }).eq("user_id", a.id).select();
    assert.deepEqual(upd.data ?? [], []);
    const del = await b.db.from("shared_items").delete().eq("user_id", a.id).select();
    assert.deepEqual(del.data ?? [], []);
    const check = await service.from("leader_progress").select("data").eq("user_id", a.id).single();
    assert.equal(check.data.data.hacked, undefined);
  });

  test("sees only their own profile and can't change it (no self-promotion to admin)", async () => {
    const { a, b } = users;
    const profiles = rows(await b.db.from("profiles").select("id"));
    assert.deepEqual(profiles.map((p) => p.id), [b.id]);
    const upd = await b.db.from("profiles").update({ role: "admin" }).eq("id", b.id).select();
    assert.ok(upd.error || (upd.data ?? []).length === 0);
    const role = await service.from("profiles").select("role").eq("id", b.id).single();
    assert.equal(role.data.role, "leader");
    assert.equal(rows(await b.db.from("profiles").select("id").eq("id", a.id)).length, 0);
  });

  test("can't create cohorts", async () => {
    const r = await users.b.db.from("cohorts").insert({ name: `rls-test-${run}-x` });
    assert.ok(r.error);
  });
});

describe("the admin", () => {
  test("can't read leaders' private data", async () => {
    const { a, admin } = users;
    assert.deepEqual(rows(await admin.db.from("leader_private").select("*").eq("user_id", a.id)), []);
  });

  test("reads leaders' progress and shared items, and all profiles", async () => {
    const { a, b, admin } = users;
    assert.equal(rows(await admin.db.from("leader_progress").select("*").eq("user_id", a.id)).length, 1);
    assert.equal(rows(await admin.db.from("shared_items").select("*").eq("user_id", a.id)).length, 1);
    const ids = rows(await admin.db.from("profiles").select("id")).map((p) => p.id);
    assert.ok(ids.includes(a.id) && ids.includes(b.id));
  });

  test("can't edit a leader's progress or shared items", async () => {
    const { a, admin } = users;
    const upd = await admin.db.from("leader_progress").update({ data: {} }).eq("user_id", a.id).select();
    assert.deepEqual(upd.data ?? [], []);
    const del = await admin.db.from("shared_items").delete().eq("user_id", a.id).select();
    assert.deepEqual(del.data ?? [], []);
  });
});

describe("sharing", () => {
  test("stop sharing deletes the shared copy, and the admin no longer sees it", async () => {
    const { a, admin } = users;
    rows(await a.db.from("shared_items").delete().eq("user_id", a.id).eq("item_id", "r1"));
    assert.deepEqual(rows(await admin.db.from("shared_items").select("*").eq("user_id", a.id)), []);
  });
});

describe("removed access", () => {
  test("a deactivated leader can't save", async () => {
    const { b } = users;
    await service.from("profiles").update({ active: false }).eq("id", b.id);
    const r = await b.db.from("leader_progress").upsert({ user_id: b.id, data: { x: 1 } });
    assert.ok(r.error);
    await service.from("profiles").update({ active: true }).eq("id", b.id);
  });
});

describe("signed-out visitors", () => {
  test("can't read anything", async () => {
    const anon = createClient(URL, PUBLISHABLE, opts);
    for (const t of ["profiles", "cohorts", "leader_private", "leader_progress", "shared_items"]) {
      const r = await anon.from(t).select("*");
      assert.ok(r.error || r.data.length === 0, `${t} should be empty or denied`);
    }
  });
});
