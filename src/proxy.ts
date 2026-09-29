import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { authCookieOptions, hasAuthCookie, isHttpsRequest } from "@/lib/supabase/config";

/**
 * Keeps the Supabase session fresh: when the access token has expired, the refreshed cookies are
 * written to both the request (so this render sees them) and the response (so the browser keeps
 * them). Server Components can't set cookies, which is why this runs here.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  // Visitors without a session (most of them) need no Supabase round trip at all.
  if (!url || !key || !hasAuthCookie(request.cookies.getAll().map((c) => c.name))) return response;

  const supabase = createServerClient(url, key, {
    cookieOptions: authCookieOptions(isHttpsRequest(request.headers.get("x-forwarded-proto")) || request.nextUrl.protocol === "https:"),
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        // Responses that set auth cookies must never be cached by a CDN / proxy.
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  try {
    // Don't put code between createServerClient and this call: it triggers the refresh.
    await supabase.auth.getClaims();
  } catch (error) {
    // Supabase unreachable: carry on signed-out-ish; pages show their own friendly errors.
    console.error("proxy: session refresh failed", error);
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except Next internals and static files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|woff2?)$).*)",
  ],
};
