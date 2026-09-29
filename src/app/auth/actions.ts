"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { hasAuthCookie } from "@/lib/supabase/config";
import { isValidEmail, safeNextPath, type LoginState } from "@/lib/auth";

/** The origin the visitor is browsing on, so the magic link returns to the same place. */
async function requestOrigin(): Promise<string | null> {
  const h = await headers();
  // Server Action POSTs carry Origin, and Next.js has already checked it against Host.
  const origin = h.get("origin");
  if (origin && /^https?:\/\/[^/\s]+$/.test(origin)) return origin;

  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return null;
  const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim() || "http";
  return `${proto}://${host}`;
}

function friendlyAuthError(error: AuthError): string {
  if (error.status === 429 || error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
    return "Too many sign-in emails were requested. Please wait a minute and try again.";
  }
  if (error.code === "email_address_invalid") return "That email address can't be used. Please try another.";
  if (error.code === "signup_disabled" || error.code === "otp_disabled") return "Sign-in by email is currently turned off.";
  if (!error.status || error.status >= 500) return "Sign-in is unavailable right now. Please try again in a moment.";
  return "We couldn't send the sign-in link. Please try again.";
}

/** Emails a magic link that lands on /auth/confirm. */
export async function requestMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const next = safeNextPath(formData.get("next"));

  if (!isValidEmail(email)) return { status: "error", email, message: "Enter a valid email address." };

  const origin = await requestOrigin();
  if (!origin) return { status: "error", email, message: "We couldn't work out where to send you back to. Please try again." };

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
        shouldCreateUser: true,
      },
    });
    if (error) {
      console.error("[auth] signInWithOtp failed", error);
      return { status: "error", email, message: friendlyAuthError(error) };
    }
  } catch (error) {
    console.error("[auth] signInWithOtp threw", error);
    return { status: "error", email, message: "Sign-in is unavailable right now. Please try again in a moment." };
  }

  return { status: "sent", email };
}

export async function signOut(formData: FormData) {
  const next = safeNextPath(formData.get("next"));

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) throw error;
  } catch (error) {
    // Supabase unreachable: still forget the session in this browser.
    console.error("[auth] signOut failed; clearing cookies locally", error);
    const cookieStore = await cookies();
    for (const { name } of cookieStore.getAll()) {
      if (hasAuthCookie([name])) cookieStore.delete(name);
    }
  }

  revalidatePath("/", "layout");
  redirect(next);
}
