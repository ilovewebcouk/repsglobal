// Admin — batch cleanup of expired BD-legacy accounts.
//
// Scope (option 1 of the agreed cleanup plan): hard-delete every confirmed
// professional account that has NO live Stripe subscription
// (active/trialing/past_due) AND is not in the "still inside their honoured
// BD window" keep-list, AND is not an admin, AND is not a demo.
//
// Mirrors `cancelAndDeleteMember`'s post-Stripe steps (archive contact,
// audit log, auth delete) but skips the customer confirmation email — these
// accounts never converted to paid and would not recognise a "your
// subscription was cancelled" message.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Updated 2026-06-29: founder decision — delete ALL remaining BD-legacy
// accounts that haven't converted to a live Stripe subscription, including
// those still inside their honoured BD window. "Free" is no longer a plan
// REPs supports; every member must be on a paid Stripe sub.
const KEEP_USER_IDS = new Set<string>([]);

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin" as never,
  });
  if (!isAdmin) throw new Error("Forbidden");
}

async function resolveTargetIds(): Promise<string[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // 1) All non-demo professionals.
  const { data: pros, error: e1 } = await supabaseAdmin
    .from("professionals")
    .select("id, is_demo");
  if (e1) throw new Error(e1.message);
  const proIds = (pros ?? []).filter((p: any) => p.is_demo !== true).map((p: any) => p.id as string);

  // 2) Drop anyone with a live Stripe sub.
  const { data: liveSubs, error: e2 } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id, status")
    .in("status", ["active", "trialing", "past_due"]);
  if (e2) throw new Error(e2.message);
  const withSub = new Set<string>((liveSubs ?? []).map((s: any) => s.user_id as string));

  // 3) Drop admins.
  const { data: admins, error: e3 } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");
  if (e3) throw new Error(e3.message);
  const adminIds = new Set<string>((admins ?? []).map((r: any) => r.user_id as string));

  const candidates = proIds.filter(
    (id) => !withSub.has(id) && !adminIds.has(id) && !KEEP_USER_IDS.has(id),
  );

  // 4) Keep only confirmed (filters out unconfirmed test signups).
  const { data: confirmedRows, error: e4 } = await supabaseAdmin.rpc(
    "get_confirmed_professional_ids",
    { _ids: candidates },
  );
  if (e4) throw new Error(e4.message);
  return (confirmedRows ?? []).map((r: any) => (typeof r === "string" ? r : r.id ?? r));
}

export const previewExpiredBdCleanup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const ids = await resolveTargetIds();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const rows: Array<{ user_id: string; email: string | null; full_name: string | null; bd_next_due_date: string | null }> = [];
    for (const uid of ids) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(uid);
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("full_name, display_name")
        .eq("id", uid)
        .maybeSingle();
      const { data: bd } = await supabaseAdmin
        .from("bd_member_seed")
        .select("bd_next_due_date")
        .eq("claimed_user_id", uid)
        .maybeSingle();
      rows.push({
        user_id: uid,
        email: authUser?.user?.email ?? null,
        full_name: (profile as any)?.full_name ?? (profile as any)?.display_name ?? null,
        bd_next_due_date: (bd as any)?.bd_next_due_date ?? null,
      });
    }
    return { count: rows.length, rows };
  });

export const executeExpiredBdCleanup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { confirm: string }) => {
    if (d?.confirm !== "DELETE") throw new Error("Type DELETE to confirm");
    return { confirm: d.confirm };
  })
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const ids = await resolveTargetIds();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const deleted: string[] = [];
    const failed: Array<{ user_id: string; error: string }> = [];

    for (const uid of ids) {
      try {
        // Snapshot for archive.
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(uid);
        const email = (authUser?.user?.email ?? "").toLowerCase().trim();

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("full_name, display_name")
          .eq("id", uid)
          .maybeSingle();
        const { data: professional } = await supabaseAdmin
          .from("professionals")
          .select("primary_profession, city")
          .eq("id", uid)
          .maybeSingle();

        const fullName =
          (profile as any)?.full_name ?? (profile as any)?.display_name ?? null;

        // Archive contact (best-effort, only if we have an email).
        if (email) {
          try {
            await supabaseAdmin
              .from("mailing_list_contacts")
              .upsert(
                {
                  email,
                  full_name: fullName,
                  profession: (professional as any)?.primary_profession ?? null,
                  city: (professional as any)?.city ?? null,
                  former_user_id: uid,
                  last_tier: null,
                  deletion_reason: "admin_delete",
                  deletion_notes: "Batch cleanup — expired BD legacy account, never converted",
                  marketing_opt_in: false,
                  source: "bd_legacy_cleanup",
                  deleted_at: new Date().toISOString(),
                } as never,
                { onConflict: "email" },
              );
          } catch (e) {
            console.warn("[batchCleanup] archive failed", uid, e);
          }
        }

        // Delete auth user (cascades).
        const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(uid);
        if (delErr) throw delErr;

        // Audit log (best-effort).
        try {
          await supabaseAdmin.rpc("log_admin_action", {
            _actor_id: context.userId,
            _action: "member.bd_legacy_batch_delete",
            _target_table: "auth.users",
            _target_id: uid,
            _before_state: { email, full_name: fullName },
            _reason: "BD legacy expired — option 1 batch cleanup",
          });
        } catch (e) {
          console.warn("[batchCleanup] audit log failed", uid, e);
        }

        deleted.push(uid);
        // Gentle throttle to avoid hammering auth admin API.
        await new Promise((r) => setTimeout(r, 150));
      } catch (e: any) {
        failed.push({ user_id: uid, error: e?.message ?? String(e) });
      }
    }

    return { ok: true, attempted: ids.length, deleted: deleted.length, failed };
  });
