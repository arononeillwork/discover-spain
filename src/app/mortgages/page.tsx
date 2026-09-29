import type { Metadata } from "next";
import { LinkList, PageHeader } from "@/components/LinkList";
import { MortgageCalculator } from "@/components/MortgageCalculator";
import { getMortgageContent } from "@/lib/queries";
import type { PurchaseFee } from "@/lib/types";

export const metadata: Metadata = { title: "Mortgages & buying" };

const fmt = (f: PurchaseFee, kind: "resale" | "newBuild") => {
  if (f.fixed) return `€${f.fixed[0]}–${f.fixed[1]}`;
  const v = kind === "resale" ? f.resalePct : f.newBuildPct;
  return v ? `${v}%` : "–";
};

export default async function MortgagesPage() {
  const { fees: purchaseFees, facts: mortgageFacts, rateTypes, buyerProtections, searchSites, mortgageBrokers } = await getMortgageContent();

  return (
    <>
      <PageHeader
        eyebrow="Buying property"
        title="Mortgages, fees & where to search"
        intro="Budget roughly 10–13% on top of the price in Andalucía. Here's where every euro goes."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mortgageFacts.map((f) => (
          <div key={f.id} className="card">
            <p className="text-sm text-muted">{f.label}</p>
            <p className="mt-1 text-xl font-semibold">{f.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="mb-4 text-2xl font-semibold">Calculator</h2>
        <MortgageCalculator fees={purchaseFees} />
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-2xl font-semibold">Purchase costs</h2>
        <div className="card overflow-hidden p-0">
          {/* Phones and small tablets: one block per cost, so the notes get the full width. */}
          <ul className="divide-y divide-line md:hidden" data-testid="fees-list">
            {purchaseFees.map((f) => (
              <li key={f.id} className="px-5 py-4">
                <p className="font-medium">{f.name}</p>
                <dl className="mt-1 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <div>
                    <dt className="inline text-muted">Resale: </dt>
                    <dd className="inline font-medium">{fmt(f, "resale")}</dd>
                  </div>
                  <div>
                    <dt className="inline text-muted">New build: </dt>
                    <dd className="inline font-medium">{fmt(f, "newBuild")}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-sm text-muted">{f.note}</p>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm" data-testid="fees-table">
              <thead className="border-b border-line text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Cost</th>
                  <th className="px-5 py-3 font-medium">Resale</th>
                  <th className="px-5 py-3 font-medium">New build</th>
                  <th className="px-5 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {purchaseFees.map((f) => (
                  <tr key={f.id} className="border-b border-line align-top last:border-0">
                    <td className="px-5 py-3 font-medium">{f.name}</td>
                    <td className="whitespace-nowrap px-5 py-3">{fmt(f, "resale")}</td>
                    <td className="whitespace-nowrap px-5 py-3">{fmt(f, "newBuild")}</td>
                    <td className="px-5 py-3 text-muted">{f.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {buyerProtections && <p className="mt-3 rounded-xl bg-sea-soft p-4 text-sm">{buyerProtections}</p>}
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-3">
        {rateTypes.map((r) => (
          <div key={r.id} className="card">
            <h3 className="font-semibold">{r.name}</h3>
            <p className="mt-1 text-sm text-muted">{r.detail}</p>
          </div>
        ))}
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="text-xl font-semibold">Property search sites</h2>
          <div className="mt-4">
            <LinkList links={searchSites} />
          </div>
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold">Compare mortgages</h2>
          <div className="mt-4">
            <LinkList links={mortgageBrokers} />
          </div>
        </div>
      </section>
    </>
  );
}
