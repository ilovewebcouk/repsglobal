/**
 * Server functions for the earned-titles system.
 *
 * - myUnlockedTitles      → dashboard "Titles unlocked" panel
 * - setPrimaryTitle       → pro picks which earned title is their headline
 * - previewSubmissionTitle → admin queue: "approving this will unlock X"
 *
 * The actual grant of pro_titles rows happens inside `reviewVerification`
 * in `src/lib/verification/verification.functions.ts` when admin clicks
 * Approve, so we keep grant logic in one place. Helpers shared via this
 * file are intentionally pure / read-only.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";
import { TITLES, isTitleSlug, type TitleSlug } from "./titles-catalog";
import { deriveTitlesForSubmission, type RulesOutput } from "./title-rules";

/* -------------------------------------------------------------------------- */
/* My unlocked titles + locked roadmap                                         */
/* -------------------------------------------------------------------------- */

export type UnlockedTitle = {
  title_slug: TitleSlug;
  label: string;
  tier: 1 | 2 | 3;
  is_primary: boolean;
  source_submission_id: string | null;
  granted_at: string;
};

export type UnlockedTitlesResult = {
  unlocked: UnlockedTitle[];
  /** Catalog titles the pro has NOT earned yet — for the roadmap. */
  locked: Array<{ title_slug: TitleSlug; label: string; tier: 1 | 2 | 3; earnedBy: string }>;
  primary_title_slug: TitleSlug | null;
};

export const myUnlockedTitles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }): Promise<UnlockedTitlesResult> => {
    const { supabase, userId } = context;

    const [{ data: rows }, { data: proRow }] = await Promise.all([
      supabase
        .from("pro_titles")
        .select("title_slug, is_primary, source_submission_id, granted_at")
        .eq("professional_id", userId)
        .order("granted_at", { ascending: false }),
      supabase
        .from("professionals")
        .select("primary_title_slug")
        .eq("id", userId)
        .maybeSingle(),
    ]);

    const list = (rows ?? []) as Array<{
      title_slug: string;
      is_primary: boolean | null;
      source_submission_id: string | null;
      granted_at: string;
    }>;

    const unlocked: UnlockedTitle[] = [];
    const seen = new Set<string>();
    for (const r of list) {
      if (seen.has(r.title_slug)) continue;
      const entry = TITLES.find((t) => t.slug === r.title_slug);
      if (!entry) continue;
      seen.add(r.title_slug);
      unlocked.push({
        title_slug: entry.slug,
        label: entry.label,
        tier: entry.tier,
        is_primary: !!r.is_primary,
        source_submission_id: r.source_submission_id,
        granted_at: r.granted_at,
      });
    }
    // Tier ascending (1 = highest authority first)
    unlocked.sort((a, b) => a.tier - b.tier);

    const locked = TITLES.filter((t) => !seen.has(t.slug)).map((t) => ({
      title_slug: t.slug,
      label: t.label,
      tier: t.tier,
      earnedBy: t.earnedBy,
    }));

    const proPrimary =
      (proRow as { primary_title_slug?: string | null } | null)?.primary_title_slug ?? null;

    return {
      unlocked,
      locked,
      primary_title_slug: isTitleSlug(proPrimary) ? (proPrimary as TitleSlug) : null,
    };
  });

/* -------------------------------------------------------------------------- */
/* Set primary title (pro chooses headline title from their earned set)        */
/* -------------------------------------------------------------------------- */

const setPrimaryInput = z.object({
  title_slug: z.string().min(2).max(60),
});

export const setPrimaryTitle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => setPrimaryInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!isTitleSlug(data.title_slug)) {
      throw new Error("Unknown title");
    }

    // Verify the pro actually earned this title
    const { data: ownership } = await supabase
      .from("pro_titles")
      .select("id")
      .eq("professional_id", userId)
      .eq("title_slug", data.title_slug)
      .limit(1)
      .maybeSingle();
    if (!ownership) {
      throw new Error(
        "You haven't earned this title yet. Upload the relevant qualification first.",
      );
    }

    // Clear is_primary on all of this pro's title rows, then set on the chosen one
    await supabase
      .from("pro_titles")
      .update({ is_primary: false } as never)
      .eq("professional_id", userId);
    await supabase
      .from("pro_titles")
      .update({ is_primary: true } as never)
      .eq("professional_id", userId)
      .eq("title_slug", data.title_slug);

    // Mirror onto professionals.primary_title_slug + back-compat primary_profession
    const titleEntry = TITLES.find((t) => t.slug === data.title_slug)!;
    await supabase
      .from("professionals")
      .update({
        primary_title_slug: data.title_slug,
        primary_profession: titleEntry.professionSlug,
      } as never)
      .eq("id", userId);

    return { ok: true, primary_title_slug: data.title_slug };
  });

/* -------------------------------------------------------------------------- */
/* Admin preview: "Approving this submission will unlock X"                    */
/* -------------------------------------------------------------------------- */

const previewInput = z.object({
  qualification: z.string().min(2).max(200),
  awarding_body: z.string().min(2).max(160),
  awarding_body_slug: z.string().max(60).nullable().optional(),
  ofqualVerified: z.boolean().optional(),
});

export const previewSubmissionTitle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => previewInput.parse(d))
  .handler(async ({ data, context }): Promise<RulesOutput> => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    return deriveTitlesForSubmission(data);
  });
