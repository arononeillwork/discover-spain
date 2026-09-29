"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";
import { CloudOff, RotateCw } from "lucide-react";

/** Shown when a page can't load, most often because the content database is unreachable. */
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl py-10 text-center" data-testid="error-page">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-accent">
        <CloudOff size={28} />
      </span>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">We couldn&apos;t load this page</h1>
      <p className="mt-3 text-muted">
        Our guides live in a database that isn&apos;t answering right now. It&apos;s usually back within a moment, so please try again.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={() => retry()} className="btn">
          <RotateCw size={16} /> Try again
        </button>
        <Link href="/" className="rounded-full border border-line px-6 py-3 font-semibold hover:border-accent">
          Go home
        </Link>
      </div>
      {error.digest && <p className="mt-6 text-xs text-muted">Reference: {error.digest}</p>}
    </div>
  );
}
