// Shared by the server client, the browser client and the proxy.

/**
 * Cookie name (and auth storage key) for the Supabase session.
 *
 * By default @supabase/ssr derives it from the Supabase URL's hostname. The browser and the
 * server can reach Supabase through different URLs (e.g. 127.0.0.1 vs host.docker.internal
 * when the app runs in Docker), so both clients pin the same explicit name.
 */
export const AUTH_COOKIE_NAME = "sb-discover-spain-auth-token";

/**
 * Options for the session cookies. They are marked Secure when the site is served over HTTPS, so
 * the session (it includes the refresh token) is never sent over plain HTTP. Local http:// dev
 * and Docker keep working because they are not HTTPS.
 */
export function authCookieOptions(secure: boolean) {
  return { name: AUTH_COOKIE_NAME, secure };
}

/**
 * True when the visitor reached the app over HTTPS. Next.js sets x-forwarded-proto on every
 * request (keeping the value from a TLS-terminating proxy in front of it, if there is one).
 */
export function isHttpsRequest(forwardedProto: string | null | undefined) {
  return forwardedProto?.split(",")[0]?.trim().toLowerCase() === "https";
}

/** URL + publishable key the browser uses. NEXT_PUBLIC_ values are inlined at build time. */
export function getPublicSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (copy .env.example to .env.local).",
    );
  }
  return { url, key };
}

/**
 * URL + key for server-side code. SUPABASE_URL (server-only, read at runtime) overrides the public
 * URL when the server must reach Supabase on a different address than the browser.
 */
export function getServerSupabaseEnv() {
  const { url, key } = getPublicSupabaseEnv();
  return { url: process.env.SUPABASE_URL || url, key };
}

/** True when a request carries a Supabase session cookie (possibly split into .0, .1 chunks). */
export function hasAuthCookie(names: Iterable<string>) {
  for (const name of names) {
    if (name === AUTH_COOKIE_NAME || name.startsWith(`${AUTH_COOKIE_NAME}.`)) return true;
  }
  return false;
}
