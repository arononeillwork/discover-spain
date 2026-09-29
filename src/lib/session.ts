import { cache } from "react";
import { cookies } from "next/headers";
import type { SessionUser } from "@/lib/types";
import { hasAuthCookie } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type SessionState = {
  user: SessionUser | null;
  /** Completed step ids for the signed-in user; null when they couldn't be loaded. */
  doneStepIds: number[] | null;
};

const SIGNED_OUT: SessionState = { user: null, doneStepIds: [] };

/**
 * Who is visiting, plus their saved checklist progress. Never throws: if Supabase is unreachable
 * the site simply renders as signed out.
 */
export const getSessionState = cache(async (): Promise<SessionState> => {
  // Request-time API: keep it outside try/catch so Next can opt the route out of prerendering.
  const cookieStore = await cookies();
  if (!hasAuthCookie(cookieStore.getAll().map((c) => c.name))) return SIGNED_OUT;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims.sub) return SIGNED_OUT;

    const user: SessionUser = {
      id: data.claims.sub,
      email: typeof data.claims.email === "string" ? data.claims.email : null,
    };
    const progress = await supabase.from("user_progress").select("step_id");
    if (progress.error) console.error("[session] could not load progress", progress.error);
    return { user, doneStepIds: progress.error ? null : progress.data.map((r) => r.step_id) };
  } catch (error) {
    console.error("[session] could not read session", error);
    return SIGNED_OUT;
  }
});

export async function getCurrentUser(): Promise<SessionUser | null> {
  return (await getSessionState()).user;
}
