// Admin v2 — Member 360 read API.
//
// Funnels billing reads through the canonical subscription resolver
// (`subscription-resolver.server.ts`) so Member 360 stays identical to the
// Memberships, Professionals, Churn, Ops and aggregate-count surfaces.
//
// No reads from `legacy_stripe_link` or `bd_member_seed`.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  resolveSubscriptionStateForUser,
  type AdminSubscriptionState,
} from "@/lib/admin/subscription-resolver.server";

const Input = z.object({ user_id: z.string().uuid() });

const PROFESSION_LABEL: Record<string, string> = {
  'personal-trainer': 'Personal trainer',
  'fitness-instructor': 'Fitness instructor',
  'group-fitness-instructor': 'Group fitness instructor',
  'strength-coach': 'Strength & conditioning coach',
  'nutritionist': 'Nutritionist',
  'pilates-instructor': 'Pilates instructor',
  'yoga-teacher': 'Yoga teacher',
};

export type Member360Snapshot = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  profession: string | null;
  slug: string | null;
  verification: string | null;
  is_published: boolean;
  created_at: string | null;
  last_sign_in_at: string | null;
  stripe_customer_id: string | null;
  has_active_subscription: boolean;
  subscription: AdminSubscriptionState;
  account_type: string | null;
  full_name: string | null;
  professional_suspended_at: string | null;
};

export const getMember360 = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data, context }): Promise<Member360Snapshot> => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Live Stripe pull for this user (cheap: scoped to their customer(s))
    // before resolving billing state, so Member 360 always reflects Stripe
    // truth even when a webhook is delayed/missing.
    try {
      const { resyncUserFromStripe } = await import("@/lib/admin/member-stripe-sync.server");
      await resyncUserFromStripe(data.user_id, supabaseAdmin);
    } catch {
      // Non-fatal — fall back to mirror state if Stripe is unreachable.
    }

    const [authRes, profileRes, proRes, subState] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(data.user_id),
      supabaseAdmin.from("profiles").select("full_name, avatar_url").eq("id", data.user_id).maybeSingle(),
      supabaseAdmin
        .from("professionals")
        .select("slug, verification, is_published, primary_profession, account_type, suspended_at")
        .eq("id", data.user_id)
        .maybeSingle(),
      resolveSubscriptionStateForUser(data.user_id),
    ]);


    const email = authRes.data?.user?.email ?? null;
    const created_at = authRes.data?.user?.created_at ?? null;
    const last_sign_in_at = authRes.data?.user?.last_sign_in_at ?? null;
    const profile = (profileRes.data as { full_name?: string | null; avatar_url?: string | null; full_name?: string | null } | null) ?? null;
    const full_name = profile?.full_name ?? null;
    const avatar_url = profile?.avatar_url ?? null;
    const pro = (proRes.data as { slug?: string | null; verification?: string | null; is_published?: boolean | null; primary_profession?: string | null; account_type?: string | null; suspended_at?: string | null } | null) ?? null;
    const profession = pro?.primary_profession ? (PROFESSION_LABEL[pro.primary_profession] ?? pro.primary_profession) : null;

    return { user_id: data.user_id, email, full_name, avatar_url, profession, slug: pro?.slug ?? null, verification: pro?.verification ?? null, is_published: pro?.is_published ?? false, created_at, last_sign_in_at, stripe_customer_id: subState.stripe_customer_id, has_active_subscription: subState.has_active_entitlement, subscription: subState, account_type: pro?.account_type ?? null, professional_suspended_at: pro?.suspended_at ?? null,  };
  });
