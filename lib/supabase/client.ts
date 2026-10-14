"use client";
// Browser client. Uses the signed-in leader's session; row-level security decides what it can read and write.
import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";

let client: ReturnType<typeof createBrowserClient> | undefined;

export function supabaseBrowser() {
  return (client ??= createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY));
}
