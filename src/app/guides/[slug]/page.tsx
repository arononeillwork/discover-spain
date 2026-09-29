import type { Metadata } from "next";
import Link from "next/link";
import { notFound, unstable_rethrow } from "next/navigation";
import { ArrowLeft, Clock, Euro, FileCheck, Lightbulb } from "lucide-react";
import { getGuide } from "@/lib/queries";
import { StepChecklist } from "@/components/StepChecklist";
import { LinkList } from "@/components/LinkList";

// Rendered on every request from the database (no generateStaticParams), so new or edited
// guides appear without a rebuild.

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  try {
    const guide = await getGuide(slug);
    return guide ? { title: guide.title, description: guide.summary } : { title: "Page not found" };
  } catch (error) {
    unstable_rethrow(error);
    return {}; // The page itself shows the error.
  }
}

export default async function GuidePage({ params }: PageProps<"/guides/[slug]">) {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) notFound();

  return (
    <article>
      <Link href="/guides" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} /> All guides
      </Link>

      <header className="mt-6 max-w-3xl">
        <span className="chip">{guide.category}</span>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{guide.title}</h1>
        <p className="mt-4 text-lg text-muted">{guide.summary}</p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          {/* rounded-2xl reads as a pill on one line and still looks right when a long cost wraps. */}
          <span className="inline-flex items-start gap-1.5 rounded-2xl border border-line bg-surface px-3 py-1.5">
            <Clock size={14} className="mt-[3px] shrink-0" /> {guide.timeEstimate}
          </span>
          <span className="inline-flex items-start gap-1.5 rounded-2xl border border-line bg-surface px-3 py-1.5">
            <Euro size={14} className="mt-[3px] shrink-0" /> {guide.cost}
          </span>
        </div>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section>
          <h2 className="mb-4 text-2xl font-semibold">Steps</h2>
          <StepChecklist steps={guide.steps} />
        </section>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="card">
            <h2 className="flex items-center gap-2 font-semibold">
              <FileCheck size={18} className="text-accent" /> Documents to bring
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {guide.documents.map((d) => (
                <li key={d} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" /> {d}
                </li>
              ))}
            </ul>
          </div>

          {guide.tips.length > 0 && (
            <div className="rounded-2xl bg-sea-soft p-6">
              <h2 className="flex items-center gap-2 font-semibold text-sea">
                <Lightbulb size={18} /> Local tips
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {guide.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          {guide.links.length > 0 && (
            <div className="card">
              <h2 className="font-semibold">Official links</h2>
              <div className="mt-3 text-sm">
                <LinkList links={guide.links} />
              </div>
            </div>
          )}

          <p className="text-xs text-muted">Last reviewed {new Date(`${guide.reviewedOn}T12:00:00Z`).toLocaleDateString("en-GB", { dateStyle: "long", timeZone: "UTC" })}</p>
        </aside>
      </div>
    </article>
  );
}
