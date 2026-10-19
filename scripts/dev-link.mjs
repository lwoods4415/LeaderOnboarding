// Dev/staging only: print a one-time localhost sign-in callback link for an existing account (no email sent).
// Run: node --env-file=.env.staging.local scripts/dev-link.mjs someone@example.com 3001
import { createClient } from "@supabase/supabase-js";

const [email, port = "3000"] = process.argv.slice(2);
if (process.env.NEXT_PUBLIC_SUPABASE_URL.includes("qjhlpvzllobovjpyonhp")) throw new Error("Not for the live database.");
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email, options: { redirectTo: `http://localhost:${port}/auth/callback` } });
if (error) throw error;
const res = await fetch(data.properties.action_link, { redirect: "manual" });
console.log(res.headers.get("location"));
