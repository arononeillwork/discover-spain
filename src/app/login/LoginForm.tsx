"use client";

import { useActionState, useEffect } from "react";
import { MailCheck } from "lucide-react";
import { requestMagicLink } from "@/app/auth/actions";
import type { LoginState } from "@/lib/auth";

const initialState: LoginState = { status: "idle" };

export function LoginForm({ next, linkError }: { next: string; linkError?: string }) {
  const [state, formAction, pending] = useActionState(requestMagicLink, initialState);
  const error = state.status === "error" ? state.message : state.status === "idle" ? linkError : undefined;

  // A failed link arrives with Supabase's "#error=…&error_code=…" fragment; the message above
  // already explains it, so tidy the address bar.
  useEffect(() => {
    const { hash, pathname, search } = window.location;
    if (/[#&]error(_code)?=/.test(hash)) window.history.replaceState(null, "", `${pathname}${search}`);
  }, []);

  return (
    <div className="card">
      {state.status === "sent" && (
        <div role="status" className="mb-5 flex gap-3 rounded-xl bg-sea-soft p-4 text-sm">
          <MailCheck size={20} className="mt-0.5 shrink-0 text-sea" />
          <div>
            <p className="font-semibold">Check your email</p>
            <p className="mt-1">
              We sent a sign-in link to <strong>{state.email}</strong>. Open it in this browser to finish signing in. No email after a minute?
              Check your spam folder or send it again.
            </p>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mb-5 rounded-xl bg-accent-soft p-4 text-sm text-ink">
          {error}
        </p>
      )}

      <form action={formAction} noValidate>
        <input type="hidden" name="next" value={next} />
        <label className="block">
          <span className="text-sm text-muted">Email address</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            defaultValue={state.email ?? ""}
            aria-invalid={state.status === "error" || undefined}
            className="input"
          />
        </label>
        <button type="submit" disabled={pending} className="btn mt-5 w-full">
          {pending ? "Sending…" : state.status === "sent" ? "Send the link again" : "Email me a sign-in link"}
        </button>
      </form>
    </div>
  );
}
