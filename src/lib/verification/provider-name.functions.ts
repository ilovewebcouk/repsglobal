/**
 * Provider name change approval queue.
 *
 * Training providers submit their public display name via
 * `submitProviderNameChange`. It lands in `provider_name_requests` as
 * pending and is NOT reflected in `profiles.business_name` until an admin
 * approves it via `reviewProviderNameRequest`.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ProviderNameRequest = {
  id: string;
  user_id: string;
  requested_name: string;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type ProviderNameRequestWithProfile = ProviderNameRequest & {
  current_approved_name: string | null;
  contact_email: string | null;
};

/* ------------------------------------------------------------------ */
/* Provider-facing                                                      */
/* ------------------------------------------------------------------ */

export const getMyProviderNameStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(
    async ({
      context,
    }): Promise<{
      approved_name: string | null;
      pending: { id: string; requested_name: string; created_at: string } | null;
    }> => {
      const { supabase, userId } = context;
      const sb = supabase as any;

      const [{ data: profile }, { data: pending }] = await Promise.all([
        sb
          .from("profiles")
          .select("business_name")
          .eq("id", userId)
          .maybeSingle(),
        sb
          .from("provider_name_requests")
          .select("id, requested_name, created_at")
          .eq("user_id", userId)
          .eq("status", "pending")
          .maybeSingle(),
      ]);

      return {
        approved_name: (profile?.business_name as string | null) ?? null,
        pending: pending
          ? {
              id: String(pending.id),
              requested_name: String(pending.requested_name),
              created_at: String(pending.created_at),
            }
          : null,
      };
    },
  );

const SubmitInput = z.object({
  requested_name: z.string().trim().min(1, "Name is required").max(120),
});

export const submitProviderNameChange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => SubmitInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const sb = supabase as any;
    const requested = data.requested_name.trim();

    const { data: profile } = await sb
      .from("profiles")
      .select("business_name")
      .eq("id", userId)
      .maybeSingle();
    const current: string | null =
      (profile?.business_name as string | null) ?? null;
    if (current && current.trim().toLowerCase() === requested.toLowerCase()) {
      return { ok: true, unchanged: true as const };
    }

    const { data: existing } = await sb
      .from("provider_name_requests")
      .select("id, requested_name")
      .eq("user_id", userId)
      .eq("status", "pending")
      .maybeSingle();
    if (existing) {
      throw new Error(
        `You already have a name change awaiting approval ("${String(existing.requested_name)}"). Please wait for it to be reviewed.`,
      );
    }

    const { error } = await sb
      .from("provider_name_requests")
      .insert({ user_id: userId, requested_name: requested });
    if (error) throw error;

    return { ok: true, submitted: true as const };
  });

/* ------------------------------------------------------------------ */
/* Admin-facing                                                         */
/* ------------------------------------------------------------------ */

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

/**
 * Regenerate `professionals.slug` from an approved provider name and write it
 * back. Ensures uniqueness by suffixing (-2, -3, …) when a clash exists.
 * No-op when the derived base is empty.
 */
export async function regenerateProviderSlug(sa: any, userId: string, name: string) {
  const base = slugify(name);
  if (!base) return null;
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const { data: clash } = await sa
      .from("professionals")
      .select("id")
      .eq("slug", slug)
      .neq("id", userId)
      .maybeSingle();
    if (!clash) break;
    slug = `${base}-${i}`;
  }
  const { error } = await sa
    .from("professionals")
    .update({ slug })
    .eq("id", userId);
  if (error) {
    console.error("[provider-name.regenerateSlug] update failed", error.message);
    return null;
  }
  return slug;
}

async function assertAdmin(supabase: any, userId: string): Promise<void> {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw error;
  if (!data) throw new Error("Forbidden");
}

const ListInput = z.object({
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
});

export const listProviderNameRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListInput.parse(d ?? { status: "pending" }))
  .handler(
    async ({ data, context }): Promise<ProviderNameRequestWithProfile[]> => {
      const { supabase, userId } = context;
      await assertAdmin(supabase, userId);

      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const sa = supabaseAdmin as any;

      const { data: rows, error } = await sa
        .from("provider_name_requests")
        .select("*")
        .eq("status", data.status)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;

      const list = (rows ?? []) as ProviderNameRequest[];
      if (list.length === 0) return [];

      const ids = Array.from(new Set(list.map((r) => r.user_id)));
      const { data: profiles } = await sa
        .from("profiles")
        .select("id, business_name")
        .in("id", ids);
      const profileMap = new Map<string, string | null>(
        ((profiles ?? []) as { id: string; business_name: string | null }[]).map(
          (p) => [p.id, p.business_name],
        ),
      );

      const { data: users } = await sa.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      const emailMap = new Map<string, string | null>();
      for (const u of (users?.users ?? []) as {
        id: string;
        email?: string | null;
      }[]) {
        emailMap.set(u.id, u.email ?? null);
      }

      return list.map((r) => ({
        ...r,
        current_approved_name: profileMap.get(r.user_id) ?? null,
        contact_email: emailMap.get(r.user_id) ?? null,
      }));
    },
  );

const ReviewInput = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  admin_note: z.string().trim().max(500).nullable().optional(),
});

export const reviewProviderNameRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ReviewInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    if (data.decision === "rejected" && !data.admin_note?.trim()) {
      throw new Error("A note is required when rejecting a name change.");
    }

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const sa = supabaseAdmin as any;

    const { data: row, error: readErr } = await sa
      .from("provider_name_requests")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (readErr) throw readErr;
    if (!row) throw new Error("Request not found.");
    const req = row as ProviderNameRequest;
    if (req.status !== "pending") {
      throw new Error(`Request already ${req.status}.`);
    }

    if (data.decision === "approved") {
      const { error: pErr } = await sa
        .from("profiles")
        .update({ business_name: req.requested_name })
        .eq("id", req.user_id);
      if (pErr) throw pErr;
    }

    const { error: uErr } = await sa
      .from("provider_name_requests")
      .update({
        status: data.decision,
        admin_note: data.admin_note?.trim() || null,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (uErr) throw uErr;

    return { ok: true };
  });

export const countPendingProviderNameRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ count: number }> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const sa = supabaseAdmin as any;
    const { count, error } = await sa
      .from("provider_name_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    if (error) throw error;
    return { count: (count as number | null) ?? 0 };
  });
