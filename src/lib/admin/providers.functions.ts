/**
 * Admin — Training-provider control surface.
 *
 * Provider discriminator: `professionals.account_type = 'organisation'`.
 * Canonical provider display name: `profiles.business_name`.
 * `professionals.legal_entity_name` is NEVER surfaced or edited here.
 *
 * All handlers verify `has_role('admin')` and audit via the existing
 * `log_admin_action` RPC. Service-role client is loaded lazily inside
 * every handler.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { regenerateProviderSlug } from "@/lib/verification/provider-name.functions";
import {
  _closeMembershipImpl,
  type CancelReason,
  type CloseMode,
} from "@/lib/admin/close-membership.server";

/* ------------------------------------------------------------------ */
/* Admin gate                                                          */
/* ------------------------------------------------------------------ */
async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin" as never,
  });
  if (!isAdmin) throw new Error("Forbidden: admin role required");
}

/* ------------------------------------------------------------------ */
/* Field whitelist                                                     */
/* ------------------------------------------------------------------ */

/** Fields admins may edit inline via `updateProviderField`. Every other
 *  column on `professionals` is read-only from this surface. Provider
 *  display name (business_name) has its OWN action — `renameProvider` —
 *  and is not in this whitelist. */
const EDITABLE_FIELDS = [
  "headline",
  "bio",
  "value_prop",
  "contact_email",
  "contact_phone",
  "website",
  "website_url",
  "city",
  "address",
  "country",
  "year_established",
  "staff_count",
  "company_number",
  "cover_url",
  "social_instagram",
  "social_linkedin",
  "social_youtube",
  "social_tiktok",
  "social_x",
  "awarding_bodies",
] as const;

export type EditableProviderField = (typeof EDITABLE_FIELDS)[number];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normaliseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("URL is empty");
  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    throw new Error("Invalid URL");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("Only http/https URLs are allowed");
  }
  // Normalise trailing slash on root paths only.
  let out = u.toString();
  if (u.pathname === "/" && out.endsWith("/")) out = out.slice(0, -1);
  return out;
}

function validateAndCoerce(field: EditableProviderField, value: unknown): any {
  // null/empty → null (clears the field).
  if (value === null || value === undefined || value === "") return null;

  switch (field) {
    case "contact_email": {
      const v = String(value).trim().toLowerCase();
      if (!EMAIL_RE.test(v)) throw new Error("Invalid email address");
      if (v.length > 255) throw new Error("Email too long");
      return v;
    }
    case "website":
    case "website_url":
    case "cover_url":
    case "social_instagram":
    case "social_linkedin":
    case "social_youtube":
    case "social_tiktok":
    case "social_x":
      return normaliseUrl(String(value));
    case "year_established": {
      const n = Number(value);
      const currentYear = new Date().getUTCFullYear();
      if (!Number.isInteger(n) || n < 1800 || n > currentYear) {
        throw new Error(`Year must be an integer between 1800 and ${currentYear}`);
      }
      return n;
    }
    case "staff_count": {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 0) throw new Error("Staff count must be ≥ 0");
      return n;
    }
    case "awarding_bodies": {
      if (!Array.isArray(value)) throw new Error("awarding_bodies must be an array");
      const arr = value
        .map((s) => String(s ?? "").trim())
        .filter((s) => s.length > 0);
      // Dedupe (case-insensitive).
      const seen = new Set<string>();
      const out: string[] = [];
      for (const s of arr) {
        const k = s.toLowerCase();
        if (!seen.has(k)) {
          seen.add(k);
          out.push(s);
        }
      }
      return out;
    }
    case "contact_phone": {
      const v = String(value).trim();
      if (!v) return null;
      // Light normalise only — DB check constraint enforces E.164 shape.
      return v;
    }
    case "bio":
    case "headline":
    case "value_prop":
    case "city":
    case "address":
    case "country":
    case "company_number": {
      const v = String(value).trim();
      if (v.length > 4000) throw new Error("Value too long");
      return v || null;
    }
    default:
      throw new Error(`Field not editable: ${String(field)}`);
  }
}

/* ------------------------------------------------------------------ */
/* Slug helpers                                                        */
/* ------------------------------------------------------------------ */

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function uniqueProviderSlug(sa: any, name: string, excludeId?: string): Promise<string | null> {
  const base = slugify(name);
  if (!base) return null;
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const query = sa.from("professionals").select("id").eq("slug", slug);
    if (excludeId) query.neq("id", excludeId);
    const { data: clash } = await query.maybeSingle();
    if (!clash) break;
    slug = `${base}-${i}`;
  }
  return slug;
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type ProviderListRow = {
  id: string;
  business_name: string | null;
  slug: string | null;
  contact_email: string | null;
  verification_status: string | null;
  is_published: boolean;
  suspended_at: string | null;
  reps_member_id: string | null;
  created_at: string | null;
};

export type ProviderSnapshot = {
  id: string;
  email: string | null;
  business_name: string | null;
  avatar_url: string | null;
  professional: Record<string, any>;
};

/* ------------------------------------------------------------------ */
/* listProviders                                                       */
/* ------------------------------------------------------------------ */

const ListInput = z.object({
  q: z.string().optional(),
  verified: z.enum(["any", "verified", "unverified"]).default("any"),
  published: z.enum(["any", "published", "hidden"]).default("any"),
  suspended: z.enum(["any", "suspended", "active"]).default("any"),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
});

export const listProviders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListInput.parse(d ?? {}))
  .handler(async ({ data, context }): Promise<{ rows: ProviderListRow[]; total: number }> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sa = supabaseAdmin as any;

    // Pull all organisations, filter/search in-memory. Small population.
    let query = sa
      .from("professionals")
      .select(
        "id, slug, contact_email, verification_status, is_published, suspended_at, reps_member_id, created_at",
      )
      .eq("account_type", "organisation")
      .order("created_at", { ascending: false });

    if (data.verified === "verified") query = query.eq("verification_status", "verified");
    if (data.verified === "unverified") query = query.neq("verification_status", "verified");
    if (data.published === "published") query = query.eq("is_published", true);
    if (data.published === "hidden") query = query.eq("is_published", false);
    if (data.suspended === "suspended") query = query.not("suspended_at", "is", null);
    if (data.suspended === "active") query = query.is("suspended_at", null);

    const { data: pros, error } = await query;
    if (error) throw new Error(error.message);
    const ids = (pros ?? []).map((r: any) => r.id);

    // Join business_name from profiles.
    const nameMap = new Map<string, string | null>();
    if (ids.length > 0) {
      const { data: profs } = await sa
        .from("profiles")
        .select("id, business_name")
        .in("id", ids);
      for (const p of (profs ?? []) as any[]) nameMap.set(p.id, p.business_name ?? null);
    }

    const q = data.q?.trim().toLowerCase() ?? "";
    let rows: ProviderListRow[] = (pros ?? []).map((r: any) => ({
      id: r.id,
      business_name: nameMap.get(r.id) ?? null,
      slug: r.slug,
      contact_email: r.contact_email,
      verification_status: r.verification_status,
      is_published: r.is_published,
      suspended_at: r.suspended_at,
      reps_member_id: r.reps_member_id,
      created_at: r.created_at,
    }));

    if (q) {
      rows = rows.filter((r) => {
        return (
          (r.business_name ?? "").toLowerCase().includes(q) ||
          (r.slug ?? "").toLowerCase().includes(q) ||
          (r.contact_email ?? "").toLowerCase().includes(q)
        );
      });
    }

    const total = rows.length;
    rows = rows.slice(data.offset, data.offset + data.limit);
    return { rows, total };
  });

/* ------------------------------------------------------------------ */
/* getProvider                                                         */
/* ------------------------------------------------------------------ */

const UserIdInput = z.object({ user_id: z.string().uuid() });

export const getProvider = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UserIdInput.parse(d))
  .handler(async ({ data, context }): Promise<ProviderSnapshot | null> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sa = supabaseAdmin as any;

    const { data: pro } = await sa
      .from("professionals")
      .select("*")
      .eq("id", data.user_id)
      .maybeSingle();

    if (!pro || pro.account_type !== "organisation") return null;

    const [{ data: profile }, { data: authUser }] = await Promise.all([
      sa.from("profiles").select("business_name, avatar_url").eq("id", data.user_id).maybeSingle(),
      supabaseAdmin.auth.admin.getUserById(data.user_id),
    ]);

    // Strip legal_entity_name defensively so the UI never even sees it.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { legal_entity_name: _drop, ...safePro } = pro as any;

    return {
      id: data.user_id,
      email: authUser?.user?.email ?? null,
      business_name: profile?.business_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      professional: safePro,
    };
  });

/* ------------------------------------------------------------------ */
/* updateProviderField                                                 */
/* ------------------------------------------------------------------ */

const UpdateFieldInput = z.object({
  user_id: z.string().uuid(),
  field: z.enum(EDITABLE_FIELDS as unknown as [string, ...string[]]),
  value: z.unknown(),
  reason: z.string().trim().max(500).optional().nullable(),
});

export const updateProviderField = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateFieldInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const field = data.field as EditableProviderField;
    const coerced = validateAndCoerce(field, data.value);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sa = supabaseAdmin as any;

    const { data: pro } = await sa
      .from("professionals")
      .select(`id, account_type, ${field}`)
      .eq("id", data.user_id)
      .maybeSingle();
    if (!pro) throw new Error("Provider not found");
    if (pro.account_type !== "organisation") throw new Error("Not a training provider");

    const beforeValue = (pro as any)[field] ?? null;

    const { error: uErr } = await sa
      .from("professionals")
      .update({ [field]: coerced })
      .eq("id", data.user_id);
    if (uErr) throw new Error(uErr.message);

    await sa.rpc("log_admin_action", {
      _actor_id: context.userId,
      _action: "provider.field_update",
      _target_table: "professionals",
      _target_id: data.user_id,
      _before_state: { [field]: beforeValue },
      _after_state: { [field]: coerced },
      _reason: data.reason ?? null,
    });

    return { ok: true, field, value: coerced };
  });

/* ------------------------------------------------------------------ */
/* renameProvider                                                      */
/* ------------------------------------------------------------------ */

const RenameInput = z.object({
  user_id: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  reason: z.string().trim().min(1).max(500),
});

export const renameProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RenameInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sa = supabaseAdmin as any;

    const { data: pro } = await sa
      .from("professionals")
      .select("id, account_type, slug")
      .eq("id", data.user_id)
      .maybeSingle();
    if (!pro) throw new Error("Provider not found");
    if (pro.account_type !== "organisation") throw new Error("Not a training provider");

    const oldSlug: string | null = pro.slug ?? null;

    const { data: oldProfile } = await sa
      .from("profiles")
      .select("business_name")
      .eq("id", data.user_id)
      .maybeSingle();
    const oldName: string | null = oldProfile?.business_name ?? null;

    // Update business_name (upsert — profiles row may not yet exist for legacy).
    const { error: pErr } = await sa
      .from("profiles")
      .upsert({ id: data.user_id, business_name: data.name } as never, { onConflict: "id" });
    if (pErr) throw new Error(pErr.message);

    const newSlug = await regenerateProviderSlug(sa, data.user_id, data.name);
    if (!newSlug) {
      throw new Error(
        "Could not derive a slug from that name. Please choose a name that includes letters or digits.",
      );
    }

    // Insert legacy redirect if the slug actually changed.
    if (oldSlug && oldSlug !== newSlug) {
      await sa
        .from("legacy_redirects")
        .upsert(
          {
            source_path: `/t/${oldSlug}`,
            destination_path: `/t/${newSlug}`,
            kind: "provider_rename",
            resolved_to_slug: newSlug,
          } as never,
          { onConflict: "source_path" },
        );
    }

    await sa.rpc("log_admin_action", {
      _actor_id: context.userId,
      _action: "provider.rename",
      _target_table: "professionals",
      _target_id: data.user_id,
      _before_state: { business_name: oldName, slug: oldSlug },
      _after_state: { business_name: data.name, slug: newSlug },
      _reason: data.reason,
    });

    return { ok: true, old_slug: oldSlug, new_slug: newSlug };
  });

/* ------------------------------------------------------------------ */
/* createProvider (manual invite + pre-seed)                           */
/* ------------------------------------------------------------------ */

const CreateInput = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  name: z.string().trim().min(1).max(120),
  website: z.string().trim().optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
});

export const createProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sa = supabaseAdmin as any;

    const website = data.website ? normaliseUrl(data.website) : null;

    // Send Supabase invite — throws if the email already exists.
    const redirectTo = `https://repsuk.org/pricing`;
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email: data.email,
      options: {
        redirectTo,
        data: {
          signup_kind: "professional",
          account_type: "organisation",
          business_name: data.name,
        },
      },
    });
    if (linkErr) {
      if (/already.*registered|exists/i.test(linkErr.message)) {
        throw new Error("That email is already registered on REPs.");
      }
      throw new Error(linkErr.message);
    }
    const inviteUrl = linkData.properties?.action_link ?? redirectTo;
    const newUserId = linkData.user?.id;
    if (!newUserId) throw new Error("Invite created but no user id was returned.");

    // Pre-seed profiles.business_name and professionals row.
    const slug = await uniqueProviderSlug(sa, data.name, newUserId);
    if (!slug) throw new Error("Could not derive a slug from that name.");

    await sa
      .from("profiles")
      .upsert({ id: newUserId, business_name: data.name } as never, { onConflict: "id" });

    const proRow: Record<string, unknown> = {
      id: newUserId,
      account_type: "organisation",
      slug,
      is_published: false,
    };
    if (website) proRow.website_url = website;

    const { error: proErr } = await sa
      .from("professionals")
      .upsert(proRow as never, { onConflict: "id" });
    if (proErr) throw new Error(proErr.message);

    // Send branded invite email via existing transactional pipeline.
    try {
      const { sendTransactionalEmailServer } = await import("@/lib/email/send.server");
      const { data: inviter } = await sa
        .from("profiles")
        .select("full_name")
        .eq("id", context.userId)
        .maybeSingle();
      const inviterName = (inviter as any)?.full_name ?? "The REPs team";

      const sendRes = await sendTransactionalEmailServer({
        templateName: "professional-invite",
        recipientEmail: data.email,
        templateData: {
          inviteeName: data.name,
          inviterName,
          planLabel: "Training provider",
          acceptUrl: inviteUrl,
        },
      });

      await sa.from("admin_pro_invites").insert({
        email: data.email,
        full_name: data.name,
        plan: "pro" as never, // enum lacks 'provider' — see plan snag #1
        invited_by: context.userId,
        invite_url: inviteUrl,
        email_message_id: (sendRes as { messageId?: string }).messageId ?? null,
      } as never);
    } catch (e) {
      // Invite user exists, seed done — surface but don't roll back.
      console.error("[createProvider] invite email/track failed", e);
    }

    await sa.rpc("log_admin_action", {
      _actor_id: context.userId,
      _action: "provider.manual_create",
      _target_table: "professionals",
      _target_id: newUserId,
      _before_state: null,
      _after_state: {
        id: newUserId,
        email: data.email,
        business_name: data.name,
        slug,
        website_url: website,
      },
      _reason: data.note ?? null,
    });

    return { ok: true, user_id: newUserId, slug };
  });

/* ------------------------------------------------------------------ */
/* suspendProvider / republishProvider                                 */
/* ------------------------------------------------------------------ */

const SuspendInput = z.object({
  user_id: z.string().uuid(),
  reason: z.string().trim().min(1).max(500),
});

export const suspendProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SuspendInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sa = supabaseAdmin as any;

    const { data: pro } = await sa
      .from("professionals")
      .select("id, account_type, is_published, suspended_at, suspension_reason, unpublished_reason, unpublished_at")
      .eq("id", data.user_id)
      .maybeSingle();
    if (!pro) throw new Error("Provider not found");
    if (pro.account_type !== "organisation") throw new Error("Not a training provider");

    const now = new Date().toISOString();
    const update = {
      is_published: false,
      suspended_at: now,
      suspension_reason: data.reason,
      unpublished_reason: "admin_suspend",
      unpublished_at: now,
    };
    const { error } = await sa
      .from("professionals")
      .update(update as never)
      .eq("id", data.user_id);
    if (error) throw new Error(error.message);

    await sa.rpc("log_admin_action", {
      _actor_id: context.userId,
      _action: "provider.suspend",
      _target_table: "professionals",
      _target_id: data.user_id,
      _before_state: pro,
      _after_state: update,
      _reason: data.reason,
    });

    return { ok: true };
  });

const RepublishInput = z.object({
  user_id: z.string().uuid(),
  reason: z.string().trim().max(500).optional().nullable(),
});

export const republishProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RepublishInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sa = supabaseAdmin as any;

    const { data: pro } = await sa
      .from("professionals")
      .select("id, account_type, is_published, suspended_at, suspension_reason, unpublished_reason, unpublished_at")
      .eq("id", data.user_id)
      .maybeSingle();
    if (!pro) throw new Error("Provider not found");
    if (pro.account_type !== "organisation") throw new Error("Not a training provider");

    const update = {
      is_published: true,
      suspended_at: null,
      suspension_reason: null,
      unpublished_reason: null,
      unpublished_at: null,
    };
    const { error } = await sa
      .from("professionals")
      .update(update as never)
      .eq("id", data.user_id);
    if (error) throw new Error(error.message);

    await sa.rpc("log_admin_action", {
      _actor_id: context.userId,
      _action: "provider.republish",
      _target_table: "professionals",
      _target_id: data.user_id,
      _before_state: pro,
      _after_state: update,
      _reason: data.reason ?? null,
    });

    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* closeProvider — thin wrapper over _closeMembershipImpl               */
/* ------------------------------------------------------------------ */

const CloseInput = z.object({
  user_id: z.string().uuid(),
  reason: z.string().trim().min(1).max(500),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const closeProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CloseInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    // Guard: only allow closing organisation accounts through this endpoint.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: pro } = await (supabaseAdmin as any)
      .from("professionals")
      .select("id, account_type")
      .eq("id", data.user_id)
      .maybeSingle();
    if (!pro) throw new Error("Provider not found");
    if (pro.account_type !== "organisation") throw new Error("Not a training provider");

    const result = await _closeMembershipImpl({
      user_id: data.user_id,
      mode: "end_now_delete" as CloseMode,
      reason: "admin_delete" as CancelReason,
      notes: data.reason + (data.notes ? ` — ${data.notes}` : ""),
      actor_id: `admin:${context.userId}`,
    });

    return result;
  });

/* ------------------------------------------------------------------ */
/* Read-only helpers for tabs                                          */
/* ------------------------------------------------------------------ */

export const getProviderActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UserIdInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sa = supabaseAdmin as any;
    const { data: rows } = await sa
      .from("admin_audit_log")
      .select("id, actor_id, action, before_state, after_state, reason, created_at")
      .eq("target_table", "professionals")
      .eq("target_id", data.user_id)
      .order("created_at", { ascending: false })
      .limit(200);
    return { rows: (rows ?? []) as any[] };
  });

export const getProviderRegulatedPermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UserIdInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sa = supabaseAdmin as any;
    const { data: rows } = await sa
      .from("provider_regulated_permissions")
      .select(
        "id, status, evidence_type, ofqual_number, ofqual_found, admin_note, reviewed_by, reviewed_at, created_at, updated_at",
      )
      .eq("provider_id", data.user_id)
      .order("created_at", { ascending: false });
    return { rows: (rows ?? []) as any[] };
  });

export const getProviderNameHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UserIdInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sa = supabaseAdmin as any;
    const [{ data: reqs }, { data: audits }, { data: domains }] = await Promise.all([
      sa
        .from("provider_name_requests")
        .select("id, requested_name, status, admin_note, reviewed_by, reviewed_at, created_at")
        .eq("user_id", data.user_id)
        .order("created_at", { ascending: false }),
      sa
        .from("admin_audit_log")
        .select("id, actor_id, action, before_state, after_state, reason, created_at")
        .eq("target_table", "professionals")
        .eq("target_id", data.user_id)
        .eq("action", "provider.rename")
        .order("created_at", { ascending: false }),
      sa
        .from("provider_domain_verifications")
        .select("*")
        .eq("provider_id", data.user_id)
        .order("created_at", { ascending: false }),
    ]);
    return {
      name_requests: (reqs ?? []) as any[],
      rename_audits: (audits ?? []) as any[],
      domains: (domains ?? []) as any[],
    };
  });

export const getProviderBilling = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UserIdInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sa = supabaseAdmin as any;
    const { data: subs } = await sa
      .from("subscriptions")
      .select(
        "id, tier, status, environment, cancel_at_period_end, current_period_end, canceled_at, stripe_customer_id, stripe_subscription_id, created_at",
      )
      .eq("user_id", data.user_id)
      .order("created_at", { ascending: false });
    return { subscriptions: (subs ?? []) as any[] };
  });
