"use client"; // Replaces the root layout if the layout itself fails.

import "./globals.css";

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body className="grid min-h-screen place-items-center p-6 font-sans">
        <title>Something went wrong · Discover Spain</title>
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold tracking-tight">Something went wrong</h1>
          <p className="mt-3 text-muted">Discover Spain couldn&apos;t load. Please try again in a moment.</p>
          <button onClick={() => retry()} className="btn mt-8">
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
