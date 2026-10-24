// Keeps signed-out visitors on the sign-in page and refreshes the Supabase session cookie.
// This is a convenience gate only: the real protection is row-level security in the database.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

// API routes check the session themselves and answer with a plain-language error instead of a redirect.
const PUBLIC = ["/signin", "/auth/", "/api/", "/privacy", "/start", "/purchase", "/welcome"];

export async function proxy(request: NextRequest) {
  // A deployment without its Supabase settings can't check sign-ins; say which one is missing.
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [!SUPABASE_URL && "NEXT_PUBLIC_SUPABASE_URL", !SUPABASE_PUBLISHABLE_KEY && "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"].filter(Boolean).join(" and ");
    console.error(`Missing environment variable(s) for this deployment: ${missing}`);
    return new NextResponse(`This deployment is missing ${missing}.`, { status: 500 });
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

  const { data } = await supabase.auth.getClaims();
  const path = request.nextUrl.pathname;
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
