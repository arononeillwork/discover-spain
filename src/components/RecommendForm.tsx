"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { recommendTradesperson } from "@/app/trades/actions";
import { LIMITS, type RecommendField, type RecommendState } from "@/lib/recommendation";

const initialState: RecommendState = { status: "idle" };

function Field({
  name,
  label,
  error,
  hint,
  optional,
  className,
  children,
}: {
  name: RecommendField;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
  children: (props: { id: string; name: string; "aria-invalid"?: true; "aria-describedby"?: string }) => ReactNode;
}) {
  const id = `recommend-${name}`;
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm text-muted">
        {label}
        {optional && <span className="text-muted/80"> (optional)</span>}
      </label>
      {children({ id, name, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export function RecommendForm({ categories }: { categories: string[] }) {
  const [state, formAction, pending] = useActionState(recommendTradesperson, initialState);
  const [dismissed, setDismissed] = useState<string | undefined>();
  const formRef = useRef<HTMLFormElement>(null);

  // After a failed submit, move focus (and scroll) to the first invalid field, or to the message
  // when no single field is to blame, so keyboard, screen-reader and phone users see what's wrong.
  useEffect(() => {
    if (state.status !== "error") return;
    const form = formRef.current;
    const target = form?.querySelector<HTMLElement>('[aria-invalid="true"]') ?? form?.querySelector<HTMLElement>('[role="alert"]');
    target?.focus();
  }, [state]);

  if (state.status === "success" && state.submissionId !== dismissed) {
    return (
      <div role="status" className="card flex flex-col items-start gap-3" data-testid="recommend-success">
        <CheckCircle2 className="text-accent" />
        <h3 className="text-lg font-semibold">Thanks, we&apos;ve got it!</h3>
        <p className="text-muted">
          We&apos;ll check the details and add them to the directory once they&apos;re reviewed, so they won&apos;t appear straight away.
        </p>
        <button type="button" onClick={() => setDismissed(state.submissionId)} className="link text-sm">
          Recommend someone else
        </button>
      </div>
    );
  }

  const values = state.status === "error" ? (state.values ?? {}) : {};
  const errors = state.status === "error" ? (state.errors ?? {}) : {};

  return (
    <form ref={formRef} action={formAction} noValidate className="card grid gap-5 sm:grid-cols-2" data-testid="recommend-form">
      {state.status === "error" && state.message && (
        <p role="alert" tabIndex={-1} className="rounded-xl bg-accent-soft p-3 text-sm outline-none sm:col-span-2">
          {state.message}
        </p>
      )}

      <Field name="name" label="Name or business" error={errors.name}>
        {(p) => <input {...p} type="text" required maxLength={LIMITS.name.max} autoComplete="off" defaultValue={values.name} className="input" />}
      </Field>

      <Field name="trade" label="Trade" error={errors.trade}>
        {(p) => (
          // React doesn't re-apply a changed defaultValue to a <select>, and forms reset after an
          // action, so remount it with the submitted value to keep the choice after an error.
          <select key={values.trade ?? ""} {...p} required defaultValue={values.trade ?? ""} className="input">
            <option value="" disabled>
              Choose a trade…
            </option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field name="phone" label="Phone" error={errors.phone}>
        {(p) => <input {...p} type="tel" required maxLength={LIMITS.phone.max} placeholder="+34 600 000 000" defaultValue={values.phone} className="input" />}
      </Field>

      <Field name="whatsapp" label="WhatsApp" optional error={errors.whatsapp} hint="Full number with country code.">
        {(p) => <input {...p} type="tel" maxLength={20} placeholder="34 600 000 000" defaultValue={values.whatsapp} className="input" />}
      </Field>

      <Field name="areas" label="Areas they cover" error={errors.areas} hint="Separate with commas.">
        {(p) => <input {...p} type="text" required placeholder="San Pedro, Marbella" defaultValue={values.areas} className="input" />}
      </Field>

      <Field name="languages" label="Languages they speak" error={errors.languages} hint="Separate with commas.">
        {(p) => <input {...p} type="text" required placeholder="English, Spanish" defaultValue={values.languages} className="input" />}
      </Field>

      <Field name="notes" label="Why do you recommend them?" optional error={errors.notes} className="sm:col-span-2">
        {(p) => (
          <textarea
            {...p}
            rows={3}
            maxLength={LIMITS.notes.max}
            placeholder="What did they do for you? Fair price, on time, would you call them again?"
            defaultValue={values.notes}
            className="input"
          />
        )}
      </Field>

      <Field
        name="recommendedBy"
        label="Your name and email or phone"
        optional
        error={errors.recommendedBy}
        hint="Only used if we need to check something. Never shown on the site."
        className="sm:col-span-2"
      >
        {(p) => <input {...p} type="text" maxLength={LIMITS.recommendedBy.max} autoComplete="name" defaultValue={values.recommendedBy} className="input" />}
      </Field>

      {/* Honeypot for bots: hidden from people and assistive tech. */}
      <div className="hidden" aria-hidden>
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button type="submit" disabled={pending} className="btn">
          <Send size={16} /> {pending ? "Sending…" : "Send recommendation"}
        </button>
        <p className="text-sm text-muted">New recommendations appear in the directory after a quick review.</p>
      </div>
    </form>
  );
}
