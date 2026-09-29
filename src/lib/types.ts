// UI shapes. src/lib/queries.ts maps database rows (src/lib/database.types.ts) into these.

export type Link = { label: string; url: string; note?: string };

/** A checklist step. `id` is the guide_steps primary key, used to track progress. */
export type Step = { id: number; title: string; detail: string; link?: Link };

export const GUIDE_CATEGORIES = ["Paperwork", "Money", "Health", "Driving", "Home"] as const;
export type GuideCategory = (typeof GUIDE_CATEGORIES)[number];

export type Guide = {
  slug: string;
  title: string;
  summary: string;
  category: GuideCategory;
  timeEstimate: string;
  cost: string;
  reviewedOn: string; // ISO date (YYYY-MM-DD) the info was last reviewed
  documents: string[];
  steps: Step[];
  tips: string[];
  links: Link[];
};

export type GuideSummary = Pick<Guide, "slug" | "title" | "summary" | "category" | "timeEstimate" | "cost">;

/** A guide on the home page "Your path", with its step ids in order. */
export type PathGuide = Pick<Guide, "slug" | "title" | "summary"> & { stepIds: number[] };

export type RideOption = {
  id: number;
  name: string;
  kind: "Licensed taxi" | "VTC (private hire)";
  pricing: string;
  airport: string;
  booking: string;
  bestFor: string;
  pros: string[];
  cons: string[];
  url: string;
  highlighted: boolean;
};

export type AirportOption = { id: number; name: string; detail: string; url?: string };

/** Indicative buyer cost. Percentages apply to the purchase price; `fixed` is a € range. */
export type PurchaseFee = {
  id: number;
  name: string;
  resalePct: number | null;
  newBuildPct: number | null;
  fixed: [number, number] | null;
  plusVat: boolean; // 21% IVA charged on top
  note: string;
};

export type MortgageFact = { id: number; label: string; value: string };

export type RateType = { id: number; name: string; detail: string };

export type HealthSection = {
  id: string;
  title: string;
  intro: string;
  points: { id: number; title: string; detail: string }[];
  links: Link[];
};

/** Trade names come from the trade_categories table (e.g. "Electrician"). */
export type TradeCategory = string;

export type Tradesperson = {
  id: string;
  name: string;
  trade: TradeCategory;
  areas: string[];
  phone: string;
  whatsapp?: string; // international format, digits only e.g. 34600000000
  languages: string[];
  notes: string;
  verified: boolean;
  placeholder: boolean;
};

/** The signed-in visitor, as far as the UI needs to know. */
export type SessionUser = { id: string; email: string | null };
