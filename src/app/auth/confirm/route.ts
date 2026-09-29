import type { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth";

/**
 * Magic-link landing route (PKCE). The emailed link lands here with ?code=…, which is exchanged
 * for a session using the code-verifier cookie set when this browser requested the link. So the
 * link only works in the browser that asked for it, and nobody can sign a visitor into another
 * account by sending them a link. (There is deliberately no ?token_hash= branch: that would accept
 * a token from anyone's email, in any browser.) Session cookies are written to the redirect.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeNextPath(params.get("next"));
  const code = params.get("code");

  // GoTrue reports both expired and already-used links as otp_expired.
  let reason = params.get("error_code") === "otp_expired" ? "expired" : "link";

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) reason = "";
      else {
        console.error("[auth/confirm] sign-in failed", error);
        if (error.code === "otp_expired" || error.code === "flow_state_expired") reason = "expired";
      }
    } catch (error) {
      console.error("[auth/confirm] sign-in threw", error);
    }
  }

  // redirect() throws, so it stays outside the try/catch.
  if (!reason) redirect(next);
  redirect(`/login?error=${reason}${next !== "/" ? `&next=${encodeURIComponent(next)}` : ""}`);
}
