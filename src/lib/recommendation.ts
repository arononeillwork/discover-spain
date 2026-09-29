// "Recommend a tradesperson": form state + server-side validation. The limits mirror the
// CHECK constraints on public.tradespeople so visitors get a clear message instead of a DB error.

export const RECOMMEND_FIELDS = ["name", "trade", "areas", "phone", "whatsapp", "languages", "notes", "recommendedBy"] as const;
export type RecommendField = (typeof RECOMMEND_FIELDS)[number];

export type RecommendState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<RecommendField, string>>;
  /** What the visitor typed, echoed back so the form keeps it after an error. */
  values?: Partial<Record<RecommendField, string>>;
  /** Changes on every successful submission. */
  submissionId?: string;
};

/** Columns a visitor may insert (see the column grants in the migration). */
export type Recommendation = {
  name: string;
  trade: string;
  areas: string[];
  phone: string;
  whatsapp: string | null;
  languages: string[];
  notes: string;
  recommended_by: string | null;
};

export const LIMITS = {
  name: { min: 2, max: 100 },
  trade: { max: 60 },
  phone: { min: 6, max: 30 },
  areas: { items: 10, chars: 500 },
  languages: { items: 10, chars: 200 },
  notes: { max: 1000 },
  recommendedBy: { max: 200 },
} as const;

const oneLine = (value: string) => value.replace(/\s+/g, " ").trim();

/** "San Pedro, Marbella; Estepona" -> ["San Pedro", "Marbella", "Estepona"] (deduplicated). */
export function splitList(value: string): string[] {
  const seen = new Set<string>();
  const items: string[] = [];
  for (const part of value.split(/[,;\n]/)) {
    const item = oneLine(part);
    if (!item || seen.has(item.toLowerCase())) continue;
    seen.add(item.toLowerCase());
    items.push(item);
  }
  return items;
}

// Same length rule as the DB: array_to_string(list, '|').
const joinedLength = (list: string[]) => list.join("|").length;

export function parseRecommendation(
  formData: FormData,
): { ok: true; data: Recommendation; values: RecommendState["values"] } | { ok: false; errors: NonNullable<RecommendState["errors"]>; values: RecommendState["values"] } {
  const raw = (key: RecommendField) => {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
  };
  const values = Object.fromEntries(RECOMMEND_FIELDS.map((f) => [f, raw(f)])) as Record<RecommendField, string>;
  const errors: NonNullable<RecommendState["errors"]> = {};

  const name = oneLine(values.name);
  if (name.length < LIMITS.name.min || name.length > LIMITS.name.max) {
    errors.name = `Enter their name or business name (${LIMITS.name.min}–${LIMITS.name.max} characters).`;
  }

  const trade = oneLine(values.trade);
  if (!trade || trade.length > LIMITS.trade.max) errors.trade = "Choose a trade.";

  const areas = splitList(values.areas);
  if (areas.length === 0) errors.areas = "Add at least one area they cover, e.g. San Pedro.";
  else if (areas.length > LIMITS.areas.items) errors.areas = `Up to ${LIMITS.areas.items} areas, please.`;
  else if (joinedLength(areas) > LIMITS.areas.chars) errors.areas = "That list of areas is too long.";

  const phone = oneLine(values.phone);
  const phoneDigits = phone.replace(/\D/g, "").length;
  if (phone.length < LIMITS.phone.min || phone.length > LIMITS.phone.max || !/^\+?[0-9][0-9 ().-]*$/.test(phone) || phoneDigits < 6) {
    errors.phone = "Enter a phone number using digits, spaces or dashes, e.g. +34 600 000 000.";
  }

  let whatsapp: string | null = null;
  if (values.whatsapp) {
    const digits = values.whatsapp.replace(/[\s().+-]/g, "");
    if (/^\d{8,15}$/.test(digits)) whatsapp = digits;
    else errors.whatsapp = "Use the full number with country code, e.g. 34 600 000 000 (or leave it empty).";
  }

  const languages = splitList(values.languages);
  if (languages.length === 0) errors.languages = "Add at least one language they speak.";
  else if (languages.length > LIMITS.languages.items) errors.languages = `Up to ${LIMITS.languages.items} languages, please.`;
  else if (joinedLength(languages) > LIMITS.languages.chars) errors.languages = "That list of languages is too long.";

  const notes = oneLine(values.notes);
  if (notes.length > LIMITS.notes.max) errors.notes = `Please keep notes under ${LIMITS.notes.max.toLocaleString("en-GB")} characters.`;

  const recommendedBy = oneLine(values.recommendedBy);
  if (recommendedBy.length > LIMITS.recommendedBy.max) errors.recommendedBy = `Please keep this under ${LIMITS.recommendedBy.max} characters.`;

  if (Object.keys(errors).length) return { ok: false, errors, values };

  return {
    ok: true,
    values,
    data: { name, trade, areas, phone, whatsapp, languages, notes, recommended_by: recommendedBy || null },
  };
}
