"use client";
// Browser client. Uses the signed-in leader's session; row-level security decides what it can read and write.
import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";

let client: ReturnType<typeof createBrowserClient> | undefined;

export function supabaseBrowser() {
  // Sign-in links are handled explicitly by /auth/callback, so don't read the URL automatically.
  return (client ??= createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { detectSessionInUrl: false } }));
}
