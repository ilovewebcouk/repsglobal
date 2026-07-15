// Admin QA helper — flip a professional's plan to Training Provider without
// going through Stripe. Used to preview the training-provider dashboard
// end-to-end before the public pricing/checkout flow ships.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin" as never,
  });
  if (!isAdmin) throw new Error("Forbidden");
}

export const setTrainingProviderPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { professional_id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Verify target is a real professional.
    const { data: target } = await supabaseAdmin
      .from("professionals")
      .select("id")
      .eq("id", data.professional_id)
      .maybeSingle();
    if (!target) throw new Error("Professional not found");

    // Mark the professional record as an organisation account.
    const { error: profErr } = await supabaseAdmin
      .from("professionals")
      .update({ account_type: "training_provider" as any } as never)
      .eq("id", data.professional_id);
    if (profErr) throw new Error(profErr.message);

    // Upsert an active subscription row with tier=training_provider. This is
    // a QA-only manual entry — no Stripe subscription ID.
    const now = new Date().toISOString();
    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("user_id", data.professional_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabaseAdmin
        .from("subscriptions")
        .update({
          tier: "training_provider" as any,
          status: "active" as any,
          canceled_at: null,
          updated_at: now,
        } as never)
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("subscriptions")
        .insert({
          user_id: data.professional_id,
          tier: "training_provider",
          status: "active",
          billing_period: "annual",
          created_at: now,
          updated_at: now,
        } as never);
      if (error) throw new Error(error.message);
    }

    try {
      await context.supabase.rpc("log_admin_action", {
        _actor_id: context.userId,
        _action: "qa.set_training_provider_plan",
        _target_table: "subscriptions",
        _target_id: data.professional_id,
      });
    } catch {
      /* best-effort */
    }

    return { ok: true };
  });
