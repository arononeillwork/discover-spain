import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { authCookieOptions, getServerSupabaseEnv, isHttpsRequest } from "./config";

// Content must reflect edits made in Supabase Studio on the next request, so never cache.
const noStoreFetch: typeof fetch = (input, init) => fetch(input, { ...init, cache: "no-store" });

/**
 * Request-scoped client that acts as the visitor: the signed-in user when there is a session
 * cookie, otherwise the anon role. Use it in Server Components, Server Actions and Route
 * Handlers. Create a new one per request; never share it.
 */
export async function createClient() {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const { url, key } = getServerSupabaseEnv();

  return createServerClient<Database>(url, key, {
    cookieOptions: authCookieOptions(isHttpsRequest(headerStore.get("x-forwarded-proto"))),
    global: { fetch: noStoreFetch },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot set cookies. That's fine: proxy.ts refreshes the session
          // on every request, and Server Actions / Route Handlers can set them.
        }
      },
    },
  });
}

/**
 * Cookie-less client for public content. Always runs as the anon role, so a stale or broken
 * session cookie can never stop content pages from loading.
 */
export function createPublicClient() {
  const { url, key } = getServerSupabaseEnv();
  return createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: noStoreFetch },
  });
}
