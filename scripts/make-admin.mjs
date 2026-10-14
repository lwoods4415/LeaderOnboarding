// One-time setup: make an account the program admin.
// Run: node --env-file=.env.local scripts/make-admin.mjs you@example.com "Your Name"
// Creates the account if needed (no email is sent), then sets the admin role. Sign in afterwards from /signin.
import { createClient } from "@supabase/supabase-js";

const [email, name] = [process.argv[2]?.trim().toLowerCase(), process.argv[3]?.trim()];
if (!email || !name) throw new Error('Usage: node --env-file=.env.local scripts/make-admin.mjs you@example.com "Your Name"');
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

let id;
const created = await admin.auth.admin.createUser({ email, email_confirm: true });
if (created.data?.user) id = created.data.user.id;
else {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  id = data.users.find((u) => u.email?.toLowerCase() === email)?.id;
  if (!id) throw created.error ?? new Error("Couldn't create or find that account");
}
const { error } = await admin.from("profiles").upsert({ id, email, name, role: "admin", active: true });
if (error) throw error;
console.log(`${email} is now the admin. Sign in at /signin with that address.`);
