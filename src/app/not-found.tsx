import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-10 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-accent">
        <Compass size={28} />
      </span>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-3 text-muted">That page doesn&apos;t exist, or the guide has been moved or unpublished.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/guides" className="btn">
          Browse the guides
        </Link>
        <Link href="/" className="rounded-full border border-line px-6 py-3 font-semibold hover:border-accent">
          Go home
        </Link>
      </div>
    </div>
  );
}
