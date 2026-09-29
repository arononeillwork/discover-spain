"use server";

import { createClient } from "@/lib/supabase/server";
import { parseRecommendation, type RecommendState } from "@/lib/recommendation";

const UNAVAILABLE = "We couldn't send your recommendation right now. Please try again in a moment.";

/**
 * Saves a visitor's suggestion with the publishable key. Row Level Security and the column grants
 * make every suggestion 'pending' / unverified / not a placeholder; an admin approves it in Studio.
 */
export async function recommendTradesperson(_prev: RecommendState, formData: FormData): Promise<RecommendState> {
  // Honeypot: real people never see or fill the "website" field.
  if (String(formData.get("website") ?? "").trim()) return { status: "success", submissionId: crypto.randomUUID() };

  const parsed = parseRecommendation(formData);
  if (!parsed.ok) {
    return { status: "error", message: "Please check the highlighted fields.", errors: parsed.errors, values: parsed.values };
  }

  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getClaims();
    const submittedBy = typeof auth?.claims.sub === "string" ? auth.claims.sub : null;

    // Plain insert with no .select(): visitors can't read pending rows back. Never send status /
    // verified / is_placeholder: the database defaults them and refuses them from visitors.
    let { error } = await supabase.from("tradespeople").insert({ ...parsed.data, ...(submittedBy ? { submitted_by: submittedBy } : {}) });

    if (error?.code === "23503" && submittedBy && error.message.includes("submitted_by")) {
      // Session belongs to a user that no longer exists: submit anonymously instead.
      ({ error } = await supabase.from("tradespeople").insert(parsed.data));
    }

    if (error) {
      console.error("[trades] suggestion insert failed", error);
      if (error.code === "23503") {
        return { status: "error", message: "Please check the highlighted fields.", errors: { trade: "Choose a trade from the list." }, values: parsed.values };
      }
      if (error.code === "23514") {
        return { status: "error", message: "Some details didn't pass our checks. Please review them and try again.", values: parsed.values };
      }
      return { status: "error", message: UNAVAILABLE, values: parsed.values };
    }
  } catch (error) {
    console.error("[trades] suggestion insert threw", error);
    return { status: "error", message: UNAVAILABLE, values: parsed.values };
  }

  return { status: "success", submissionId: crypto.randomUUID() };
}
