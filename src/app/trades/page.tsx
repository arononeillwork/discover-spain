import type { Metadata } from "next";
import { PageHeader } from "@/components/LinkList";
import { TradesDirectory } from "@/components/TradesDirectory";
import { RecommendForm } from "@/components/RecommendForm";
import { getTradesDirectory } from "@/lib/queries";

export const metadata: Metadata = { title: "Tradespeople" };

export default async function TradesPage() {
  const { trades, categories } = await getTradesDirectory();

  return (
    <>
      <PageHeader
        eyebrow="Trusted locals"
        title="Tradespeople we'd call again"
        intro="Recommended electricians, handymen, plumbers, painters and cleaners around Marbella and San Pedro."
      />
      <TradesDirectory trades={trades} categories={categories} />
      <p className="mt-8 text-sm text-muted">
        Know someone great?{" "}
        <a href="#recommend" className="link">
          Recommend them
        </a>{" "}
        and we&apos;ll add them after a check. Always agree a written quote (presupuesto) before work starts.
      </p>

      <section id="recommend" className="mt-16 scroll-mt-24">
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">Share a contact</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Recommend a tradesperson</h2>
        <p className="mt-3 mb-6 max-w-2xl text-muted">
          Tell us about someone you&apos;ve used and would call again. We check every recommendation before it goes live, so it
          appears in the directory after review rather than straight away.
        </p>
        <RecommendForm categories={categories} />
      </section>
    </>
  );
}
