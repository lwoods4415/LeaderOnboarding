// Keeps signed-out visitors on the sign-in page and refreshes the Supabase session cookie.
// This is a convenience gate only: the real protection is row-level security in the database.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

// API routes check the session themselves and answer with a plain-language error instead of a redirect.
const PUBLIC = ["/signin", "/auth/", "/api/", "/privacy", "/start", "/purchase", "/welcome", "/company"];

export async function proxy(request: NextRequest) {
  // A deployment without its Supabase settings can't check sign-ins; say which one is missing.
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [!SUPABASE_URL && "NEXT_PUBLIC_SUPABASE_URL", !SUPABASE_PUBLISHABLE_KEY && "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"].filter(Boolean).join(" and ");
    console.error(`Missing environment variable(s) for this deployment: ${missing}`);
    return new NextResponse(`This deployment is missing ${missing}.`, { status: 500 });
  }
  if (!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(SUPABASE_URL) || !/^sb_publishable_[\w-]+$/.test(SUPABASE_PUBLISHABLE_KEY)) {
    // Both are public values; describe the problem without printing them.
    const describe = (v: string) => `${v.length} characters, starts "${v.slice(0, 12)}", ${/\s/.test(v) ? "has spaces or line breaks" : "no spaces"}, ${/["']/.test(v) ? "has quote marks" : "no quote marks"}`;
    const problem = `NEXT_PUBLIC_SUPABASE_URL (${describe(SUPABASE_URL)}); NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (${describe(SUPABASE_PUBLISHABLE_KEY)})`;
    console.error(`Supabase settings look malformed: ${problem}`);
    return new NextResponse(`This deployment's Supabase settings look malformed: ${problem}`, { status: 500 });
  }
  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const path = request.nextUrl.pathname;
  let data: Awaited<ReturnType<typeof supabase.auth.getClaims>>["data"] = null;
  try {
    ({ data } = await supabase.auth.getClaims());
  } catch (err) {
    // Treated as signed out (public pages still work); the reason goes to the logs.
    console.error("proxy: couldn't check the sign-in", err instanceof Error ? err.message : err);
  }
  if (!data?.claims && !PUBLIC.some((p) => path.startsWith(p))) {
    const url = request.nextUrl.clone();
    // The site's address shows the public home page; anything else asks them to sign in.
    url.pathname = path === "/" ? "/welcome" : "/signin";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  // Everything except Next.js assets and files with an extension (icons, fonts).
  matcher: ["/((?!_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)"],
};
