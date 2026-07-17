// Admin v2 — UI consistency check.
//
// Compares the subscription data shown on Member 360 with the row the
// `/admin/professionals` list would render for the same user. Used by the
// Member 360 header to surface a "Matches professionals list" badge or a
// human-readable mismatch warning.
//
// Mirrors the same field derivation as `getAdminProfessionals` for a single
// user — renewal date (Stripe sub > BD seed fallback), trial state, and
// derived tier — and pairs that against the canonical
// `subscription-resolver.server.ts` output that Member 360 itself reads.
//
// Read-only. Admin-gated.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveSubscriptionStateForUser } from "@/lib/admin/subscription-resolver.server";

const Input = z.object({ user_id: z.string().uuid() });

export type MemberRowCheckField = "renewal_date" | "trial_days_left" | "is_trial" | "tier";

export interface MemberRowCheck {
  match: boolean;
  list: {
    renewal_date: string | null;
    renewal_date_source: "stripe" | "bd" | null;
    is_trial: boolean;
    trial_days_left: number | null;
    tier: string | null;
    pill_text: string;
  };
  member360: {
    renewal_date: string | null;
    is_trial: boolean;
    trial_days_left: number | null;
    tier: string | null;
    pill_text: string;
  };
  mismatches: MemberRowCheckField[];
}

const TIER_LABEL: Record<string, string> = {
  verified: "Core",
  pro: "Pro",
  studio: "Studio",
  training_provider: "Training Provider",
  free: "Free",
};

function sameDay(a: string | null, b: string | null) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  if (!Number.isFinite(da.getTime()) || !Number.isFinite(db.getTime())) return a === b;
  return da.toISOString().slice(0, 10) === db.toISOString().slice(0, 10);
}

export const verifyMemberMatchesProfessionalsRow = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data, context }): Promise<MemberRowCheck> => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // ── List-side derivation (mirrors getAdminProfessionals) ──────────────
    const [subsRes, bdRes] = await Promise.all([
      supabaseAdmin
        .from("subscriptions")
        .select("status, tier, current_period_end")
        .eq("user_id", data.user_id)
        .in("status", ["active", "trialing", "past_due"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from("bd_member_seed")
        .select("bd_next_due_date")
        .eq("claimed_user_id", data.user_id)
        .not("bd_next_due_date", "is", null)
        .maybeSingle(),
    ]);

    const subRow = subsRes.data as { status: string; tier: string | null; current_period_end: string | null } | null;
    const bdDue = (bdRes.data as { bd_next_due_date: string | null } | null)?.bd_next_due_date ?? null;

    const list_renewal_date = subRow?.current_period_end ?? bdDue ?? null;
    const list_renewal_date_source: "stripe" | "bd" | null = subRow?.current_period_end
      ? "stripe"
      : bdDue
        ? "bd"
        : null;
    const list_is_trial = subRow?.status === "trialing";
    const list_trial_days_left = list_is_trial && subRow?.current_period_end
      ? Math.max(0, Math.ceil((new Date(subRow.current_period_end).getTime() - Date.now()) / 86_400_000))
      : null;
    const list_tier = subRow?.tier ?? null;
    const list_pill_text = list_is_trial
      ? `Trial${list_trial_days_left != null ? ` · ${list_trial_days_left}d left` : ""}`
      : (TIER_LABEL[list_tier ?? "free"] ?? "Free");

    // ── Member 360 side (canonical resolver) ──────────────────────────────
    const m360 = await resolveSubscriptionStateForUser(data.user_id);
    const m360_pill_text = `${m360.display_status_label}${m360.trial_days_left != null ? ` · ${m360.trial_days_left}d left` : ""}`;

    const mismatches: MemberRowCheckField[] = [];
    if (!sameDay(list_renewal_date, m360.renewal_at)) mismatches.push("renewal_date");
    if (list_is_trial !== (m360.status === "trialing")) mismatches.push("is_trial");
    if ((list_trial_days_left ?? null) !== (m360.trial_days_left ?? null)) mismatches.push("trial_days_left");
    if ((list_tier ?? null) !== ((m360.tier as string | null) ?? null)) mismatches.push("tier");

    return {
      match: mismatches.length === 0,
      list: {
        renewal_date: list_renewal_date,
        renewal_date_source: list_renewal_date_source,
        is_trial: list_is_trial,
        trial_days_left: list_trial_days_left,
        tier: list_tier,
        pill_text: list_pill_text,
      },
      member360: {
        renewal_date: m360.renewal_at,
        is_trial: m360.status === "trialing",
        trial_days_left: m360.trial_days_left,
        tier: (m360.tier as string | null) ?? null,
        pill_text: m360_pill_text,
      },
      mismatches,
    };
  });
