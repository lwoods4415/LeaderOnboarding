import "server-only";
// Secret-key client. Bypasses row-level security, so only use it after checking the caller is the admin.
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

export function supabaseAdmin() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY is not set");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
