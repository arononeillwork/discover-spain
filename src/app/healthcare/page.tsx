import type { Metadata } from "next";
import Link from "next/link";
import { LinkList, PageHeader } from "@/components/LinkList";
import { getGuideSummaries, getHealthSections } from "@/lib/queries";

export const metadata: Metadata = { title: "Healthcare" };

/** The "public" section links to this guide's step-by-step walkthrough. */
const HEALTH_CARD_GUIDE = "health-card";

export default async function HealthcarePage() {
  const [healthSections, guides] = await Promise.all([getHealthSections(), getGuideSummaries()]);
  // Only link the walkthrough while that guide is published (unpublished guides aren't returned).
  const healthCardGuide = guides.find((g) => g.slug === HEALTH_CARD_GUIDE);

  return (
    <>
      <PageHeader
        eyebrow="Healthcare"
        title="Public, private, or visiting"
        intro="How the Andalusian health system works, when private insurance makes sense, and what covers you while travelling."
      />

      <nav className="mb-8 flex flex-wrap gap-2">
        {healthSections.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium hover:border-accent">
            {s.title}
          </a>
        ))}
      </nav>

      <div className="space-y-10">
        {healthSections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <h2 className="text-2xl font-semibold">{s.title}</h2>
            <p className="mt-1 text-muted">{s.intro}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {s.points.map((p) => (
                <div key={p.id} className="card">
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="mt-1 text-sm text-muted">{p.detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm">
              <LinkList links={s.links} />
            </div>
            {s.id === "public" && healthCardGuide && (
              <Link href={`/guides/${healthCardGuide.slug}`} className="link mt-3 inline-block text-sm">
                Step-by-step: get your health card →
              </Link>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
