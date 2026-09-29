import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { authCookieOptions, getPublicSupabaseEnv } from "./config";

/**
 * Browser client (a singleton in the browser). It reads the session from the same cookie the
 * server writes, so it acts as the signed-in user for progress reads and writes.
 */
export function createClient() {
  const { url, key } = getPublicSupabaseEnv();
  return createBrowserClient<Database>(url, key, {
    cookieOptions: authCookieOptions(typeof location !== "undefined" && location.protocol === "https:"),
    // Sign-in callbacks are handled server-side by /auth/confirm.
    auth: { detectSessionInUrl: false },
  });
}
