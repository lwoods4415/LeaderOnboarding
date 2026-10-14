"use server";
// Sends the sign-in email from the server so the link carries the session itself.
// That way it works even when a leader opens the email on a different device from the one they asked on.
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

export type LinkResult = "sent" | "busy" | "failed";

export async function requestSignInLink(email: string): Promise<LinkResult> {
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return "failed";
  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { error } = await supabase.auth.signInWithOtp({
    email: clean,
    options: { shouldCreateUser: false, emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error?.status === 429) return "busy";
  // Uninvited addresses get "sent" too, so the page never reveals who is in the program.
  if (error && error.status !== 400 && error.status !== 422) return "failed";
  return "sent";
}
