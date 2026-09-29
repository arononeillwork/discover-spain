"use client";

import { useId, useState } from "react";
import type { PurchaseFee } from "@/lib/types";

const eur = (n: number) => n.toLocaleString("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

/** The typed text as a number; NaN while the field is empty or not a number. */
const parse = (value: string) => (value.trim() === "" ? NaN : Number(value));

function Field({
  label,
  value,
  onChange,
  suffix,
  step = 1,
  max,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  step?: number;
  max?: number;
  error?: string;
}) {
  const errorId = useId();
  return (
    <label className="block">
      <span className="text-sm text-muted">{label}</span>
      <div
        className={`mt-1 flex items-center rounded-xl border bg-bg focus-within:border-accent ${error ? "border-red-500" : "border-line"}`}
      >
        {/* Keep the raw text so the field can be cleared and retyped (no stray leading 0). */}
        <input
          type="number"
          inputMode="decimal"
          value={value}
          step={step}
          min={0}
          max={max}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="w-full bg-transparent px-3 py-2.5 outline-none"
        />
        {suffix && <span className="pr-3 text-sm text-muted">{suffix}</span>}
      </div>
      {error && (
        <span id={errorId} className="mt-1 block text-sm text-red-600 dark:text-red-400">
          {error}
        </span>
      )}
    </label>
  );
}

export function MortgageCalculator({ fees: purchaseFees }: { fees: PurchaseFee[] }) {
  const [priceText, setPrice] = useState("400000");
  const [depositText, setDeposit] = useState("30");
  const [rateText, setRate] = useState("3.2");
  const [yearsText, setYears] = useState("25");
  const [newBuild, setNewBuild] = useState(false);

  const price = parse(priceText);
  const depositPct = parse(depositText);
  const rate = parse(rateText);
  const years = parse(yearsText);

  const errors = {
    price: price > 0 ? undefined : "Enter the property price.",
    deposit: depositPct >= 0 && depositPct <= 100 ? undefined : "Enter a deposit between 0 and 100%.",
    rate: rate >= 0 && rate <= 25 ? undefined : "Enter a rate between 0 and 25%.",
    years: years >= 1 && years <= 50 ? undefined : "Enter a term between 1 and 50 years.",
  };
  const priceOk = !errors.price;
  const loanOk = priceOk && !errors.deposit;
  const paymentOk = loanOk && !errors.rate && !errors.years;

  const loan = loanOk ? price * (1 - depositPct / 100) : NaN;
  const r = rate / 100 / 12;
  const n = Math.round(years * 12);
  const monthly = paymentOk ? (r === 0 ? loan / n : (loan * r) / (1 - Math.pow(1 + r, -n))) : NaN;
  const totalInterest = monthly * n - loan;

  // Use the midpoint of fixed-fee ranges for the estimate.
  const fees = priceOk
    ? purchaseFees
        .map((f) => {
          const pct = newBuild ? f.newBuildPct : f.resalePct;
          const amount = pct ? (price * pct) / 100 : f.fixed ? (f.fixed[0] + f.fixed[1]) / 2 : 0;
          return { name: f.name, amount: f.plusVat ? amount * 1.21 : amount };
        })
        .filter((f) => f.amount > 0)
    : [];
  const totalFees = fees.reduce((s, f) => s + f.amount, 0);
  const deposit = price - loan;
  const cashNeeded = deposit + totalFees;

  // Anything that can't be worked out from the current inputs shows as "–".
  const show = (value: number) => (Number.isFinite(value) ? eur(value) : "–");

  return (
    <div className="card grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="flex rounded-xl bg-bg p-1 text-sm">
          {[false, true].map((nb) => (
            <button
              key={String(nb)}
              type="button"
              onClick={() => setNewBuild(nb)}
              aria-pressed={newBuild === nb}
              className={`flex-1 rounded-lg py-2 font-medium transition ${newBuild === nb ? "bg-surface shadow-sm" : "text-muted"}`}
            >
              {nb ? "New build" : "Resale"}
            </button>
          ))}
        </div>
        <Field label="Property price" value={priceText} onChange={setPrice} suffix="€" step={5000} error={errors.price} />
        <Field label="Deposit" value={depositText} onChange={setDeposit} suffix="%" max={100} error={errors.deposit} />
        <Field label="Interest rate (TIN)" value={rateText} onChange={setRate} suffix="%" step={0.05} max={25} error={errors.rate} />
        <Field label="Term" value={yearsText} onChange={setYears} suffix="years" max={50} error={errors.years} />
      </div>

      <div>
        <div className="rounded-2xl bg-accent p-6 text-white">
          <p className="text-sm text-white/80">Monthly payment</p>
          <p className="mt-1 text-4xl font-bold">{show(monthly)}</p>
          <p className="mt-2 text-sm text-white/80">
            Loan {show(loan)} · total interest {show(totalInterest)}
          </p>
        </div>

        <div className="mt-4 rounded-2xl border border-line p-5">
          <div className="flex items-baseline justify-between">
            <p className="font-semibold">Cash needed upfront</p>
            <p className="text-xl font-bold">{show(cashNeeded)}</p>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li className="flex justify-between">
              <span className="text-muted">Deposit</span> {show(deposit)}
            </li>
            {fees.map((f) => (
              <li key={f.name} className="flex justify-between">
                <span className="text-muted">{f.name}</span> {eur(f.amount)}
              </li>
            ))}
            <li className="flex justify-between border-t border-line pt-1.5 font-medium">
              <span>Costs on top of price</span> {priceOk ? `${eur(totalFees)} (${((totalFees / price) * 100).toFixed(1)}%)` : "–"}
            </li>
          </ul>
        </div>
        <p className="mt-3 text-xs text-muted">Estimate only. Fixed fees use the midpoint of typical ranges. Ask your bank for a FEIN offer.</p>
      </div>
    </div>
  );
}
