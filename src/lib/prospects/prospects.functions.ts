// Prospects: CSV-imported cold contacts (non-members) for outreach campaigns.
// Kept separate from newsletter_subscribers (public opt-ins) and members.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

type Status = "active" | "converted" | "unsubscribed" | "bounced";

// ─────────────────────────────────────────────────────────────────────────────
// List
// ─────────────────────────────────────────────────────────────────────────────
export const listProspects = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: Status; listTag?: string; limit?: number }) =>
    z
      .object({
        status: z.enum(["active", "converted", "unsubscribed", "bounced"]).optional(),
        listTag: z.string().max(120).optional(),
        limit: z.number().int().min(1).max(2000).optional().default(500),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let q = supabaseAdmin
      .from("prospect_contacts")
      .select(
        "id, email, full_name, list_tag, source_note, status, converted_user_id, imported_at, unsubscribed_at, created_at",
        { count: "exact" },
      )
      .order("imported_at", { ascending: false })
      .limit(data.limit);
    if (data.status) q = q.eq("status", data.status);
    if (data.listTag) q = q.eq("list_tag", data.listTag);

    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Counts by status (for stat tiles)
// ─────────────────────────────────────────────────────────────────────────────
export const getProspectCounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("prospect_contacts")
      .select("status");
    if (error) throw new Error(error.message);
    const counts: Record<Status, number> = {
      active: 0,
      converted: 0,
      unsubscribed: 0,
      bounced: 0,
    };
    for (const r of (data ?? []) as Array<{ status: Status }>) {
      counts[r.status] = (counts[r.status] ?? 0) + 1;
    }
    return { total: (data ?? []).length, counts };
  });

// ─────────────────────────────────────────────────────────────────────────────
// List distinct list tags (for filter dropdown)
// ─────────────────────────────────────────────────────────────────────────────
export const listProspectTags = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("list_prospect_tags");
    if (error) throw new Error(error.message);
    return {
      tags: (data ?? []) as Array<{ list_tag: string; count: number }>,
    };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Import CSV
// Skips duplicates, existing members, and suppressed addresses.
// ─────────────────────────────────────────────────────────────────────────────
export const importProspects = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      rows: Array<{ email: string; fullName?: string | null }>;
      listTag: string;
      sourceNote?: string;
    }) =>
      z
        .object({
          rows: z
            .array(
              z.object({
                email: z.string(),
                fullName: z.string().max(200).nullable().optional(),
              }),
            )
            .min(1)
            .max(5000),
          listTag: z.string().trim().min(1).max(120),
          sourceNote: z.string().max(500).optional(),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Clean + dedupe input
    const map = new Map<string, string | null>();
    for (const r of data.rows) {
      const email = r.email.toLowerCase().trim();
      if (!EMAIL_RE.test(email)) continue;
      if (!map.has(email)) map.set(email, r.fullName?.trim() || null);
    }
    if (map.size === 0) {
      return { inserted: 0, skippedDuplicates: 0, skippedMembers: 0, skippedSuppressed: 0 };
    }
    const emails = [...map.keys()];

    // Existing prospects (skip)
    const { data: existing } = await supabaseAdmin
      .from("prospect_contacts")
      .select("email")
      .in("email", emails);
    const existingSet = new Set(
      (existing ?? []).map((r: any) => (r.email as string).toLowerCase()),
    );

    // Suppressed (skip)
    const { data: suppressed } = await supabaseAdmin
      .from("suppressed_emails")
      .select("email")
      .in("email", emails);
    const suppressedSet = new Set(
      (suppressed ?? []).map((r: any) => (r.email as string).toLowerCase()),
    );

    // Existing members: scan auth.users in pages, filter by our email set.
    // (auth.admin has no bulk email lookup.)
    const memberSet = new Set<string>();
    let page = 1;
    for (let i = 0; i < 50; i++) {
      const { data: usersPage, error: uErr } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 1000,
      });
      if (uErr) break;
      const users = usersPage?.users ?? [];
      if (users.length === 0) break;
      for (const u of users) {
        const em = (u.email ?? "").toLowerCase().trim();
        if (em && map.has(em)) memberSet.add(em);
      }
      if (users.length < 1000) break;
      page += 1;
    }

    const toInsert: Array<{
      email: string;
      full_name: string | null;
      list_tag: string;
      source_note: string | null;
      imported_by: string;
    }> = [];
    let skippedDuplicates = 0;
    let skippedMembers = 0;
    let skippedSuppressed = 0;
    for (const [email, fullName] of map.entries()) {
      if (existingSet.has(email)) {
        skippedDuplicates += 1;
        continue;
      }
      if (memberSet.has(email)) {
        skippedMembers += 1;
        continue;
      }
      if (suppressedSet.has(email)) {
        skippedSuppressed += 1;
        continue;
      }
      toInsert.push({
        email,
        full_name: fullName,
        list_tag: data.listTag.trim(),
        source_note: data.sourceNote?.trim() || null,
        imported_by: context.userId,
      });
    }

    if (toInsert.length === 0) {
      return { inserted: 0, skippedDuplicates, skippedMembers, skippedSuppressed };
    }

    const { error } = await supabaseAdmin
      .from("prospect_contacts")
      .insert(toInsert);
    if (error) throw new Error(error.message);
    return {
      inserted: toInsert.length,
      skippedDuplicates,
      skippedMembers,
      skippedSuppressed,
    };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Delete a single row
// ─────────────────────────────────────────────────────────────────────────────
export const deleteProspect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("prospect_contacts")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Delete an entire list tag
// ─────────────────────────────────────────────────────────────────────────────
export const deleteProspectTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { listTag: string }) =>
    z.object({ listTag: z.string().trim().min(1).max(120) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error, count } = await supabaseAdmin
      .from("prospect_contacts")
      .delete({ count: "exact" })
      .eq("list_tag", data.listTag);
    if (error) throw new Error(error.message);
    return { deleted: count ?? 0 };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Mark unsubscribed
// ─────────────────────────────────────────────────────────────────────────────
export const unsubscribeProspect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error: fErr } = await supabaseAdmin
      .from("prospect_contacts")
      .select("email")
      .eq("id", data.id)
      .maybeSingle();
    if (fErr) throw new Error(fErr.message);
    if (!row) throw new Error("Prospect not found");

    const { error } = await supabaseAdmin
      .from("prospect_contacts")
      .update({
        status: "unsubscribed",
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    // Add to suppression list too so no future campaign send touches them.
    await supabaseAdmin
      .from("suppressed_emails")
      .upsert(
        {
          email: (row.email as string).toLowerCase(),
          reason: "unsubscribed",
          metadata: { source: "admin_prospects" },
        } as never,
        { onConflict: "email" },
      );
    return { ok: true };
  });
