// Where the links in sign-in and invite emails land. Works on any device, because the
// email carries a one-time token rather than relying on the browser that asked for it.
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const token_hash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const to = request.nextUrl.clone();
  to.search = "";

  if (token_hash && type) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      to.pathname = "/";
      return NextResponse.redirect(to);
    }
  }
  to.pathname = "/signin";
  to.searchParams.set("error", "link");
  return NextResponse.redirect(to);
}
