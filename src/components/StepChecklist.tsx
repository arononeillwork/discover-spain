"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ExternalLink, X } from "lucide-react";
import type { Step } from "@/lib/types";
import { useProgress } from "@/components/ProgressProvider";

export function StepChecklist({ steps }: { steps: Step[] }) {
  const pathname = usePathname();
  const { done: completed, setStepDone, source, error, dismissError } = useProgress();
  const doneCount = steps.filter((s) => completed.has(s.id)).length;
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-sm font-medium text-muted" data-testid="steps-done">
          {doneCount}/{steps.length} done
        </span>
      </div>
      <p className="mb-5 text-xs text-muted" data-testid="progress-source">
        {source === "account" ? (
          "Progress is saved to your account."
        ) : (
          <>
            Progress is saved in this browser.{" "}
            <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="link">
              Sign in
            </Link>{" "}
            to keep it on every device.
          </>
        )}
      </p>

      {error && (
        <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-xl bg-accent-soft p-3 text-sm">
          <span>{error}</span>
          <button onClick={dismissError} aria-label="Dismiss" className="shrink-0 text-muted hover:text-ink">
            <X size={16} />
          </button>
        </div>
      )}

      <ol className="space-y-3">
        {steps.map((step, i) => {
          const isDone = completed.has(step.id);
          return (
            <li key={step.id} className={`card flex gap-4 transition-opacity ${isDone ? "opacity-60" : ""}`}>
              <button
                onClick={() => setStepDone(step.id, !isDone)}
                aria-label={isDone ? "Mark as not done" : "Mark as done"}
                aria-pressed={isDone}
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-sm font-semibold transition-colors ${
                  isDone ? "border-accent bg-accent text-white" : "border-line text-muted hover:border-accent"
                }`}
              >
                {isDone ? <Check size={16} /> : i + 1}
              </button>
              <div>
                <h3 className={`font-semibold ${isDone ? "line-through" : ""}`}>{step.title}</h3>
                <p className="mt-1 text-muted">{step.detail}</p>
                {step.link && (
                  <a href={step.link.url} target="_blank" rel="noreferrer" className="link mt-2 inline-flex items-center gap-1 text-sm">
                    {step.link.label} <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
