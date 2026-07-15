/**
 * Admin — Training-provider control surface.
 *
 * Provider discriminator: `professionals.account_type = 'training_provider'`.
 * Canonical provider display name: `profiles.full_name` (the ONE source of
 * truth for a training provider's display name — e.g. "Northline Fitness Academy").
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
/* URL helper                                                          */
/* ------------------------------------------------------------------ */

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
  let out = u.toString();
  if (u.pathname === "/" && out.endsWith("/")) out = out.slice(0, -1);
  return out;
}

/* ------------------------------------------------------------------ */
/* Slug helpers                                                        */
/* ------------------------------------------------------------------ */

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
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
  full_name: string | null;
  slug: string | null;
  contact_email: string | null;
  verification_status: string | null;
  is_published: boolean;
  suspended_at: string | null;
  reps_member_id: string | null;
  created_at: string | null;
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
      .eq("account_type", "training_provider")
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

    // Join full_name from profiles.
    const nameMap = new Map<string, string | null>();
    if (ids.length > 0) {
      const { data: profs } = await sa
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);
      for (const p of (profs ?? []) as any[]) nameMap.set(p.id, p.full_name ?? null);
    }

    const q = data.q?.trim().toLowerCase() ?? "";
    let rows: ProviderListRow[] = (pros ?? []).map((r: any) => ({
      id: r.id,
      full_name: nameMap.get(r.id) ?? null,
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
          (r.full_name ?? "").toLowerCase().includes(q) ||
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
/* Shared input                                                        */
/* ------------------------------------------------------------------ */

const UserIdInput = z.object({ user_id: z.string().uuid() });

/* ------------------------------------------------------------------ */
/* readProviderProfileForAdmin — mirrors dashboard read shape          */
/* ------------------------------------------------------------------ */

export const readProviderProfileForAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UserIdInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sa = supabaseAdmin as any;

    const [{ data: pro }, { data: site }, { data: profile }, { data: dom }] = await Promise.all([
      sa
        .from("professionals")
        .select(
          "slug, website_url, contact_email, contact_phone, address, social_instagram, social_linkedin, social_youtube, social_tiktok, social_x, account_type",
        )
        .eq("id", data.user_id)
        .maybeSingle(),
      sa
        .from("websites")
        .select("tagline, about")
        .eq("professional_id", data.user_id)
        .maybeSingle(),
      sa.from("profiles").select("full_name").eq("id", data.user_id).maybeSingle(),
      sa
        .from("provider_domain_verifications")
        .select("status")
        .eq("professional_id", data.user_id)
        .maybeSingle(),
    ]);

    if (!pro || pro.account_type !== "training_provider") {
      throw new Error("Not a training provider");
    }

    return {
      slug: (pro.slug as string | null) ?? null,
      approved_name: (profile?.full_name as string | null) ?? null,
      tagline: (site?.tagline as string | null) ?? null,
      about: (site?.about as string | null) ?? null,
      website_url: (pro.website_url as string | null) ?? null,
      contact_email: (pro.contact_email as string | null) ?? null,
      contact_phone: (pro.contact_phone as string | null) ?? null,
      address: (pro.address as string | null) ?? null,
      social_instagram: (pro.social_instagram as string | null) ?? null,
      social_linkedin: (pro.social_linkedin as string | null) ?? null,
      social_youtube: (pro.social_youtube as string | null) ?? null,
      social_tiktok: (pro.social_tiktok as string | null) ?? null,
      social_x: (pro.social_x as string | null) ?? null,
      domain_status: (dom?.status as string | null) ?? null,
    };
  });

/* ------------------------------------------------------------------ */
/* adminUpdateProviderProfileMirror                                    */
/*                                                                     */
/* Mirrors the provider self-service `updateMyProviderProfile` write   */
/* path so admin edits write to the SAME columns the training-provider */
/* dashboard reads. Bypasses `provider_change_requests` — admin acts   */
/* directly, and every change is audited.                              */
/*                                                                     */
/*   tagline / about       → public.websites                           */
/*   website_url / contact_email / contact_phone / address / social_*  */
/*                          → public.professionals                     */
/*                                                                     */
/* Provider name is NOT part of this payload — always goes through     */
/* `renameProvider`.                                                   */
/* ------------------------------------------------------------------ */

const PHONE_RE = /^\+[1-9]\d{6,14}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const nullableStr = (max: number) =>
  z
    .union([z.string().trim().max(max), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v == null || v === "" ? null : v));

const MirrorInput = z.object({
  user_id: z.string().uuid(),
  patch: z.object({
    tagline: nullableStr(160),
    about: nullableStr(800),
    website_url: nullableStr(500),
    contact_email: nullableStr(254),
    contact_phone: nullableStr(32),
    address: nullableStr(500),
    social_instagram: nullableStr(120),
    social_linkedin: nullableStr(120),
    social_youtube: nullableStr(120),
    social_tiktok: nullableStr(120),
    social_x: nullableStr(120),
  }),
  override_domain_lock: z.boolean().optional().default(false),
  override_email_lock: z.boolean().optional().default(false),
  reason: z.string().trim().max(500).optional().nullable(),
});

export type AdminProviderMirrorPatch = z.infer<typeof MirrorInput>["patch"];

export const adminUpdateProviderProfileMirror = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => MirrorInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sa = supabaseAdmin as any;

    const p = data.patch;

    // Post-parse field validation (shape only — trimmed / empty→null above).
    if (p.contact_email && !EMAIL_RE.test(p.contact_email)) {
      throw new Error("Invalid contact email address.");
    }
    if (p.contact_phone && !PHONE_RE.test(p.contact_phone)) {
      throw new Error("Enter a valid international phone number (e.g. +447123456789).");
    }
    if (p.website_url && !/^https?:\/\/.+/i.test(p.website_url)) {
      throw new Error("Website URL must start with http:// or https://");
    }

    // Confirm this user IS an organisation and fetch current state.
    const { data: pro } = await sa
      .from("professionals")
      .select(
        "id, account_type, website_url, contact_email, contact_phone, address, social_instagram, social_linkedin, social_youtube, social_tiktok, social_x",
      )
      .eq("id", data.user_id)
      .maybeSingle();
    if (!pro) throw new Error("Provider not found");
    if (pro.account_type !== "training_provider") throw new Error("Not a training provider");

    const { data: site } = await sa
      .from("websites")
      .select("professional_id, tagline, about")
      .eq("professional_id", data.user_id)
      .maybeSingle();

    // Check domain-verification locks. Website/email are locked once domain
    // is approved; admins can override with an explicit flag.
    const { data: dom } = await sa
      .from("provider_domain_verifications")
      .select("status, email")
      .eq("professional_id", data.user_id)
      .maybeSingle();
    const domainLocked = dom?.status === "approved";
    if (domainLocked && p.website_url !== undefined && p.website_url !== pro.website_url) {
      if (!data.override_domain_lock) {
        throw new Error("Website is domain-locked. Enable 'Override domain lock' to change it.");
      }
    }
    if (domainLocked && p.contact_email !== undefined && p.contact_email !== pro.contact_email) {
      if (!data.override_email_lock) {
        throw new Error("Contact email is domain-locked. Enable 'Override email lock' to change it.");
      }
    }

    // Split payload: websites vs professionals.
    const beforeSite = { tagline: site?.tagline ?? null, about: site?.about ?? null };
    const afterSite = {
      tagline: p.tagline !== undefined ? p.tagline : beforeSite.tagline,
      about: p.about !== undefined ? p.about : beforeSite.about,
    };
    const siteDirty =
      (p.tagline !== undefined && p.tagline !== beforeSite.tagline) ||
      (p.about !== undefined && p.about !== beforeSite.about);

    const proCols = [
      "website_url",
      "contact_email",
      "contact_phone",
      "address",
      "social_instagram",
      "social_linkedin",
      "social_youtube",
      "social_tiktok",
      "social_x",
    ] as const;
    const beforePro: Record<string, string | null> = {};
    const afterPro: Record<string, string | null> = {};
    const proPatch: Record<string, string | null> = {};
    for (const k of proCols) {
      beforePro[k] = (pro as any)[k] ?? null;
      const incoming = (p as any)[k];
      if (incoming !== undefined && incoming !== beforePro[k]) {
        proPatch[k] = incoming;
        afterPro[k] = incoming;
      } else {
        afterPro[k] = beforePro[k];
      }
    }
    const proDirty = Object.keys(proPatch).length > 0;

    if (!siteDirty && !proDirty) {
      return { ok: true, changed: 0 };
    }

    if (siteDirty) {
      const { error: sErr } = await sa
        .from("websites")
        .upsert(
          { professional_id: data.user_id, ...afterSite } as never,
          { onConflict: "professional_id" },
        );
      if (sErr) throw new Error(sErr.message);
    }
    if (proDirty) {
      const { error: uErr } = await sa
        .from("professionals")
        .update(proPatch as never)
        .eq("id", data.user_id);
      if (uErr) throw new Error(uErr.message);
    }

    await sa.rpc("log_admin_action", {
      _actor_id: context.userId,
      _action: "provider.profile_update",
      _target_table: "professionals",
      _target_id: data.user_id,
      _before_state: { ...beforePro, ...beforeSite },
      _after_state: { ...afterPro, ...afterSite },
      _reason:
        (data.reason ?? null) ||
        (data.override_domain_lock || data.override_email_lock
          ? `override_locks:${[
              data.override_domain_lock ? "domain" : null,
              data.override_email_lock ? "email" : null,
            ]
              .filter(Boolean)
              .join(", ")}`
          : null),
    });

    const changed = (siteDirty ? 1 : 0) + Object.keys(proPatch).length;
    return { ok: true, changed };
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
    if (pro.account_type !== "training_provider") throw new Error("Not a training provider");

    const oldSlug: string | null = pro.slug ?? null;

    const { data: oldProfile } = await sa
      .from("profiles")
      .select("full_name")
      .eq("id", data.user_id)
      .maybeSingle();
    const oldName: string | null = oldProfile?.full_name ?? null;

    // Update full_name (upsert — profiles row may not yet exist for legacy).
    const { error: pErr } = await sa
      .from("profiles")
      .upsert({ id: data.user_id, full_name: data.name } as never, { onConflict: "id" });
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
      _before_state: { full_name: oldName, slug: oldSlug },
      _after_state: { full_name: data.name, slug: newSlug },
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
          account_type: "training_provider",
          full_name: data.name,
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

    // Pre-seed profiles.full_name and professionals row.
    const slug = await uniqueProviderSlug(sa, data.name, newUserId);
    if (!slug) throw new Error("Could not derive a slug from that name.");

    await sa
      .from("profiles")
      .upsert({ id: newUserId, full_name: data.name } as never, { onConflict: "id" });

    const proRow: Record<string, unknown> = {
      id: newUserId,
      account_type: "training_provider",
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

      // NOTE (temporary compat): admin_pro_invites.plan CHECK constraint only
      // permits 'verified' | 'pro' and the table has no metadata/kind/note
      // column. We record provider invites as plan='pro' so acceptance still
      // works, and distinguish them by the seeded professionals.account_type
      // ='training_provider' row keyed on email at accept-time.
      // FOLLOW-UP: add a proper provider invite type (either extend the plan
      // enum with 'provider' or add a signup_kind/kind column) so provider
      // invites are not recorded as pro invites.
      await sa.from("admin_pro_invites").insert({
        email: data.email,
        full_name: data.name,
        plan: "pro" as never,
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
        full_name: data.name,
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
    if (pro.account_type !== "training_provider") throw new Error("Not a training provider");

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
    if (pro.account_type !== "training_provider") throw new Error("Not a training provider");

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
    if (pro.account_type !== "training_provider") throw new Error("Not a training provider");

    const result = await _closeMembershipImpl({
      user_id: data.user_id,
      mode: "end_now_delete" as CloseMode,
      reason: "admin_delete" as CancelReason,
      notes: data.reason + (data.notes ? ` — ${data.notes}` : ""),
      actor_id: `admin:${context.userId}`,
    });

    return result;
  });



