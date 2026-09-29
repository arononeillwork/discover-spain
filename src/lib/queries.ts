// Server-side data access. Every page loads its content from Supabase on each request, so edits
// made in Supabase Studio show up on the next refresh. Import only from Server Components.

import { cache } from "react";
import { connection } from "next/server";
import type { PostgrestError } from "@supabase/supabase-js";
import type { Json, Tables } from "@/lib/database.types";
import { createPublicClient } from "@/lib/supabase/server";
import {
  GUIDE_CATEGORIES,
  type AirportOption,
  type Guide,
  type GuideCategory,
  type GuideSummary,
  type HealthSection,
  type Link,
  type MortgageFact,
  type PathGuide,
  type PurchaseFee,
  type RateType,
  type RideOption,
  type Step,
  type Tradesperson,
} from "@/lib/types";

/** Thrown when Supabase can't be reached or rejects a query. Rendered by app/error.tsx. */
export class ContentUnavailableError extends Error {
  constructor(what: string, cause: PostgrestError) {
    super(`Could not load ${what}: ${cause.message || cause.code || "unknown error"}`, { cause });
    this.name = "ContentUnavailableError";
  }
}

type QueryResult = { data: unknown; error: PostgrestError | null };
type SuccessData<R extends QueryResult> = Extract<R, { error: null }>["data"];

function unwrap<R extends QueryResult>(what: string, result: R): SuccessData<R> {
  if (result.error) {
    console.error(`[queries] ${what}`, result.error);
    throw new ContentUnavailableError(what, result.error);
  }
  return result.data as SuccessData<R>;
}

/**
 * Opt the caller out of prerendering (no DB calls at build time, fresh data per request) and
 * return a client for public content.
 */
async function contentClient() {
  await connection();
  return createPublicClient();
}

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------

/** jsonb [{label, url, note?}] -> Link[]; malformed entries are skipped. */
function toLinks(value: Json): Link[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const { label, url, note } = item;
    if (typeof label !== "string" || typeof url !== "string") return [];
    return [typeof note === "string" && note ? { label, url, note } : { label, url }];
  });
}

const toCategory = (value: string): GuideCategory =>
  (GUIDE_CATEGORIES as readonly string[]).includes(value) ? (value as GuideCategory) : "Paperwork";

type StepRow = Pick<Tables<"guide_steps">, "id" | "position" | "title" | "detail" | "link_label" | "link_url">;

const byPosition = (a: { position: number }, b: { position: number }) => a.position - b.position;

function toStep(row: StepRow): Step {
  const step: Step = { id: row.id, title: row.title, detail: row.detail };
  if (row.link_label && row.link_url) step.link = { label: row.link_label, url: row.link_url };
  return step;
}

const toNumber = (value: number | string | null) => (value === null ? null : Number(value));

// ---------------------------------------------------------------------------
// Guides
// ---------------------------------------------------------------------------

const GUIDE_SUMMARY_COLUMNS = "slug, title, summary, category, time_estimate, cost" as const;

function toGuideSummary(row: Pick<Tables<"guides">, "slug" | "title" | "summary" | "category" | "time_estimate" | "cost">): GuideSummary {
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    category: toCategory(row.category),
    timeEstimate: row.time_estimate,
    cost: row.cost,
  };
}

export async function getGuideSummaries(): Promise<GuideSummary[]> {
  const supabase = await contentClient();
  const rows = unwrap(
    "guides",
    await supabase.from("guides").select(GUIDE_SUMMARY_COLUMNS).order("sort_order").order("slug"),
  );
  return rows.map(toGuideSummary);
}

/** One published guide with its steps, or null. Cached per request (page + metadata share it). */
export const getGuide = cache(async (slug: string): Promise<Guide | null> => {
  const supabase = await contentClient();
  const row = unwrap(
    `guide "${slug}"`,
    await supabase
      .from("guides")
      .select(
        "slug, title, summary, category, time_estimate, cost, reviewed_on, documents, tips, links, guide_steps (id, position, title, detail, link_label, link_url)",
      )
      .eq("slug", slug)
      .order("position", { referencedTable: "guide_steps" })
      .maybeSingle(),
  );
  if (!row) return null;

  return {
    ...toGuideSummary(row),
    reviewedOn: row.reviewed_on,
    documents: row.documents,
    tips: row.tips,
    links: toLinks(row.links),
    steps: [...row.guide_steps].sort(byPosition).map(toStep),
  };
});

/** Guides on the home page "Your path", in path order, with their step ids. */
export async function getPathGuides(): Promise<PathGuide[]> {
  const supabase = await contentClient();
  const rows = unwrap(
    "your path",
    await supabase
      .from("guides")
      .select("slug, title, summary, path_position, guide_steps (id, position)")
      .not("path_position", "is", null)
      .order("path_position")
      .order("position", { referencedTable: "guide_steps" }),
  );
  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    stepIds: [...row.guide_steps].sort(byPosition).map((s) => s.id),
  }));
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

export async function getTransport(): Promise<{ rides: RideOption[]; airport: AirportOption[] }> {
  const supabase = await contentClient();
  const [ridesResult, airportResult] = await Promise.all([
    supabase.from("ride_options").select("*").order("sort_order").order("id"),
    supabase.from("airport_options").select("*").order("sort_order").order("id"),
  ]);

  const rides = unwrap("ride options", ridesResult).map(
    (r): RideOption => ({
      id: r.id,
      name: r.name,
      kind: r.kind === "Licensed taxi" ? "Licensed taxi" : "VTC (private hire)",
      pricing: r.pricing,
      airport: r.airport,
      booking: r.booking,
      bestFor: r.best_for,
      pros: r.pros,
      cons: r.cons,
      url: r.url,
      highlighted: r.highlighted,
    }),
  );
  const airport = unwrap("airport options", airportResult).map(
    (a): AirportOption => (a.url ? { id: a.id, name: a.name, detail: a.detail, url: a.url } : { id: a.id, name: a.name, detail: a.detail }),
  );
  return { rides, airport };
}

// ---------------------------------------------------------------------------
// Mortgages / buying
// ---------------------------------------------------------------------------

export type MortgageContent = {
  fees: PurchaseFee[];
  facts: MortgageFact[];
  rateTypes: RateType[];
  buyerProtections: string | null;
  searchSites: Link[];
  mortgageBrokers: Link[];
};

function toFee(f: Tables<"purchase_fees">): PurchaseFee {
  const min = toNumber(f.fixed_min);
  const max = toNumber(f.fixed_max);
  return {
    id: f.id,
    name: f.name,
    resalePct: toNumber(f.resale_pct),
    newBuildPct: toNumber(f.new_build_pct),
    fixed: min !== null && max !== null ? [min, max] : null,
    plusVat: f.plus_vat,
    note: f.note,
  };
}

export async function getMortgageContent(): Promise<MortgageContent> {
  const supabase = await contentClient();
  const [fees, facts, rates, block, links] = await Promise.all([
    supabase.from("purchase_fees").select("*").order("sort_order").order("id"),
    supabase.from("mortgage_facts").select("id, label, value").order("sort_order").order("id"),
    supabase.from("rate_types").select("id, name, detail").order("sort_order").order("id"),
    supabase.from("content_blocks").select("body").eq("key", "mortgages.buyer_protections").maybeSingle(),
    supabase.from("resource_links").select("section, label, url, note").order("sort_order").order("id"),
  ]);

  const toLink = (l: { label: string; url: string; note: string | null }): Link =>
    l.note ? { label: l.label, url: l.url, note: l.note } : { label: l.label, url: l.url };
  const allLinks = unwrap("resource links", links);

  return {
    fees: unwrap("purchase fees", fees).map(toFee),
    facts: unwrap("mortgage facts", facts),
    rateTypes: unwrap("rate types", rates),
    buyerProtections: unwrap("buyer protections", block)?.body ?? null,
    searchSites: allLinks.filter((l) => l.section === "property_search").map(toLink),
    mortgageBrokers: allLinks.filter((l) => l.section === "mortgage_compare").map(toLink),
  };
}

// ---------------------------------------------------------------------------
// Healthcare
// ---------------------------------------------------------------------------

export async function getHealthSections(): Promise<HealthSection[]> {
  const supabase = await contentClient();
  const rows = unwrap(
    "healthcare",
    await supabase
      .from("health_sections")
      .select("id, title, intro, links, health_points (id, title, detail, sort_order)")
      .order("sort_order")
      .order("id")
      .order("sort_order", { referencedTable: "health_points" }),
  );
  return rows.map((s) => ({
    id: s.id,
    title: s.title,
    intro: s.intro,
    links: toLinks(s.links),
    points: [...s.health_points]
      .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
      .map(({ id, title, detail }) => ({ id, title, detail })),
  }));
}

// ---------------------------------------------------------------------------
// Tradespeople
// ---------------------------------------------------------------------------

export async function getTradesDirectory(): Promise<{ trades: Tradesperson[]; categories: string[] }> {
  const supabase = await contentClient();
  const [people, categories] = await Promise.all([
    supabase
      .from("tradespeople")
      .select("id, name, trade, areas, phone, whatsapp, languages, notes, verified, is_placeholder")
      // RLS already limits visitors to approved rows; be explicit anyway.
      .eq("status", "approved")
      // Real contacts before placeholders, then oldest first.
      .order("is_placeholder")
      .order("created_at"),
    supabase.from("trade_categories").select("name").order("sort_order").order("name"),
  ]);

  return {
    trades: unwrap("tradespeople", people).map((t) => ({
      id: t.id,
      name: t.name,
      trade: t.trade,
      areas: t.areas,
      phone: t.phone,
      ...(t.whatsapp ? { whatsapp: t.whatsapp } : {}),
      languages: t.languages,
      notes: t.notes,
      verified: t.verified,
      placeholder: t.is_placeholder,
    })),
    categories: unwrap("trade categories", categories).map((c) => c.name),
  };
}
