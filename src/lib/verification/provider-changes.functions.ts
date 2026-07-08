/**
 * Unified provider change-request queue.
 *
 * Every editable field on a training-provider's Profile page (About, Contact,
 * Company, Social) is routed through this queue as a pending
 * `provider_change_requests` row. Admins approve/reject; approval applies
 * the value to the underlying column via `apply_provider_change`.
 *
 * Name changes still live in `provider_name_requests` and domain-email
 * changes in `provider_domain_verifications`. The admin queue view
 * `provider_pending_queue` merges all three.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";

/* ------------------------------------------------------------------ */
/* Field registry                                                       */
/* ------------------------------------------------------------------ */

export type ProviderFieldGroup = "identity" | "about" | "contact" | "company" | "social";

export type ProviderFieldKey =
  | "tagline"
  | "about"
  | "website_url"
  | "contact_email"
  | "contact_phone"
  | "address"

  | "year_established"
  | "company_number"
  | "social_instagram"
  | "social_linkedin"
  | "social_youtube"
  | "social_tiktok"
  | "social_x";

export const PROVIDER_FIELD_LABELS: Record<ProviderFieldKey, string> = {
  tagline: "Tagline",
  about: "Public description",
  website_url: "Website URL",
  contact_email: "Contact email",
  contact_phone: "Telephone",
  address: "Address",

  year_established: "Year established",
  company_number: "Company number",
  social_instagram: "Instagram",
  social_linkedin: "LinkedIn",
  social_youtube: "YouTube",
  social_tiktok: "TikTok",
  social_x: "X (Twitter)",
};

const FIELD_GROUP: Record<ProviderFieldKey, ProviderFieldGroup> = {
  tagline: "about",
  about: "about",
  website_url: "contact",
  contact_email: "contact",
  contact_phone: "contact",
  address: "contact",

  year_established: "company",
  company_number: "company",
  social_instagram: "social",
  social_linkedin: "social",
  social_youtube: "social",
  social_tiktok: "social",
  social_x: "social",
};

export type ProviderChangeRequest = {
  id: string;
  provider_id: string;
  field_group: ProviderFieldGroup;
  field_key: ProviderFieldKey;
  proposed_value: { value: string | null } | null;
  current_value: { value: string | null } | null;
  status: "pending" | "approved" | "rejected" | "superseded";
  admin_note: string | null;
  reviewer_id: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

/* ------------------------------------------------------------------ */
/* Per-field validation                                                 */
/* ------------------------------------------------------------------ */

const currentYear = new Date().getFullYear();

const ValueSchema: Record<ProviderFieldKey, z.ZodTypeAny> = {
  tagline: z.string().trim().max(160).nullable(),
  about: z.string().trim().max(800).nullable(),
  website_url: z
    .string()
    .trim()
    .max(500)
    .regex(/^https?:\/\/.+/i, "Website URL must start with http:// or https://")
    .nullable(),
  contact_email: z.string().trim().email().max(254).nullable(),
  contact_phone: z
    .string()
    .trim()
    .regex(
      /^\+[1-9]\d{6,14}$/,
      "Enter a valid international phone number (e.g. +44 7911 123456).",
    )
    .nullable(),
  address: z.string().trim().max(500).nullable(),

  year_established: z
    .union([
      z.number().int().min(1800).max(currentYear),
      z.null(),
    ])
    .transform((v) => (v == null ? null : String(v))),
  company_number: z.string().trim().max(40).nullable(),
  social_instagram: z.string().trim().max(120).nullable(),
  social_linkedin: z.string().trim().max(120).nullable(),
  social_youtube: z.string().trim().max(120).nullable(),
  social_tiktok: z.string().trim().max(120).nullable(),
  social_x: z.string().trim().max(120).nullable(),
};

function normaliseSocial(v: string | null): string | null {
  if (v == null) return null;
  let s = v.trim();
  if (!s) return null;
  s = s.replace(/^https?:\/\//i, "");
  if (s.includes("/")) {
    const parts = s.split("/").filter(Boolean);
    s = parts[parts.length - 1] ?? "";
  }
  s = s.replace(/^@+/, "").trim();
  return s || null;
}

function normaliseValue(key: ProviderFieldKey, value: string | null): string | null {
  if (value == null) return null;
  if (
    key === "social_instagram" ||
    key === "social_linkedin" ||
    key === "social_youtube" ||
    key === "social_tiktok" ||
    key === "social_x"
  ) {
    return normaliseSocial(value);
  }
  const v = value.trim();
  return v === "" ? null : v;
}

/* ------------------------------------------------------------------ */
/* Load current value from the correct source table                    */
/* ------------------------------------------------------------------ */

async function loadCurrentValue(
  sb: any,
  userId: string,
  key: ProviderFieldKey,
): Promise<string | null> {
  if (key === "tagline" || key === "about") {
    const { data } = await sb
      .from("websites")
      .select("tagline, about")
      .eq("professional_id", userId)
      .maybeSingle();
    const v = (data as any)?.[key];
    return v == null ? null : String(v);
  }
  const { data } = await sb
    .from("professionals")
    .select(key)
    .eq("id", userId)
    .maybeSingle();
  const v = (data as any)?.[key];
  return v == null ? null : String(v);
}

/* ------------------------------------------------------------------ */
/* submitProviderChange — provider-facing                              */
/* ------------------------------------------------------------------ */

const SubmitInput = z.object({
  field_key: z.enum([
    "tagline",
    "about",
    "website_url",
    "contact_email",
    "contact_phone",
    "year_established",
    "company_number",
    "social_instagram",
    "social_linkedin",
    "social_youtube",
    "social_tiktok",
    "social_x",
  ]),
  // We accept string | number | null and coerce inside the handler.
  proposed_value: z.union([z.string(), z.number(), z.null()]),
});

export const submitProviderChange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => SubmitInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const sb = supabase as any;
    const key = data.field_key as ProviderFieldKey;

    // Validate against per-field schema.
    let normalised: string | null;
    if (key === "year_established") {
      const parsed = ValueSchema.year_established.parse(
        data.proposed_value === "" || data.proposed_value == null
          ? null
          : Number(data.proposed_value),
      );
      normalised = parsed as string | null;
    } else {
      const raw =
        data.proposed_value == null
          ? null
          : String(data.proposed_value);
      const parsed = ValueSchema[key].parse(raw);
      normalised = normaliseValue(key, parsed as string | null);
    }

    const current = await loadCurrentValue(sb, userId, key);

    // No-op if unchanged (case-sensitive string compare)
    if ((current ?? null) === (normalised ?? null)) {
      return { ok: true as const, unchanged: true as const };
    }

    const { error } = await sb.from("provider_change_requests").insert({
      provider_id: userId,
      field_group: FIELD_GROUP[key],
      field_key: key,
      proposed_value: { value: normalised },
      current_value: { value: current },
      status: "pending",
    });
    if (error) throw new Error(error.message);

    return { ok: true as const, submitted: true as const };
  });

/* ------------------------------------------------------------------ */
/* listMyProviderChanges — provider-facing                             */
/* ------------------------------------------------------------------ */

export const listMyProviderChanges = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(
    async ({
      context,
    }): Promise<{
      pending: Record<string, ProviderChangeRequest>;
      recent: ProviderChangeRequest[];
    }> => {
      const { supabase, userId } = context;
      const sb = supabase as any;

      const [{ data: pendingRows }, { data: recentRows }] = await Promise.all([
        sb
          .from("provider_change_requests")
          .select("*")
          .eq("provider_id", userId)
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
        sb
          .from("provider_change_requests")
          .select("*")
          .eq("provider_id", userId)
          .in("status", ["rejected", "approved"])
          .order("reviewed_at", { ascending: false, nullsFirst: false })
          .limit(20),
      ]);

      const pending: Record<string, ProviderChangeRequest> = {};
      for (const r of (pendingRows ?? []) as ProviderChangeRequest[]) {
        pending[r.field_key] = r;
      }

      return {
        pending,
        recent: (recentRows ?? []) as ProviderChangeRequest[],
      };
    },
  );

/* ------------------------------------------------------------------ */
/* Admin-facing                                                         */
/* ------------------------------------------------------------------ */

async function assertAdmin(supabase: any, userId: string): Promise<void> {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [k: string]: JsonValue }
  | JsonValue[];

export type AdminProviderQueueItem = {
  source: "change" | "name" | "domain";
  id: string;
  provider_id: string;
  provider_name: string | null;
  provider_email: string | null;
  provider_slug: string | null;
  field_group: string;
  field_key: string;
  field_label: string;
  proposed_value: JsonValue;
  current_value: JsonValue;
  status: string;
  created_at: string;
};

export const adminListProviderQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminProviderQueueItem[]> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const sa = supabaseAdmin as any;

    const { data: rows, error } = await sa
      .from("provider_pending_queue")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const list = (rows ?? []) as Array<{
      source: "change" | "name" | "domain";
      id: string;
      provider_id: string;
      field_group: string;
      field_key: string;
      proposed_value: JsonValue;
      current_value: JsonValue;
      status: string;
      created_at: string;
    }>;

    if (list.length === 0) return [];

    const ids = Array.from(new Set(list.map((r) => r.provider_id)));
    const [{ data: profiles }, { data: pros }, usersRes] = await Promise.all([
      sa.from("profiles").select("id, business_name, full_name").in("id", ids),
      sa.from("professionals").select("id, slug").in("id", ids),
      sa.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);

    const pMap = new Map<string, { business: string | null; full: string | null }>();
    for (const p of ((profiles ?? []) as any[])) {
      pMap.set(p.id, {
        business: (p.business_name as string | null) ?? null,
        full: (p.full_name as string | null) ?? null,
      });
    }
    const slugMap = new Map<string, string | null>();
    for (const p of ((pros ?? []) as any[])) {
      slugMap.set(p.id, (p.slug as string | null) ?? null);
    }
    const emailMap = new Map<string, string | null>();
    for (const u of ((usersRes?.data?.users ?? []) as any[])) {
      emailMap.set(u.id, (u.email as string | null) ?? null);
    }

    return list.map((r) => {
      const label =
        r.field_key === "provider_name"
          ? "Provider name"
          : r.field_key === "provider_domain"
            ? "Provider domain"
            : PROVIDER_FIELD_LABELS[r.field_key as ProviderFieldKey] ??
              r.field_key;
      const p = pMap.get(r.provider_id);
      return {
        source: r.source,
        id: r.id,
        provider_id: r.provider_id,
        provider_name: p?.business ?? p?.full ?? null,
        provider_email: emailMap.get(r.provider_id) ?? null,
        provider_slug: slugMap.get(r.provider_id) ?? null,
        field_group: r.field_group,
        field_key: r.field_key,
        field_label: label,
        proposed_value: r.proposed_value,
        current_value: r.current_value,
        status: r.status,
        created_at: r.created_at,
      };
    });
  });

export const adminCountProviderQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ count: number }> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const sa = supabaseAdmin as any;
    const { count, error } = await sa
      .from("provider_pending_queue")
      .select("id", { count: "exact", head: true });
    if (error) throw new Error(error.message);
    return { count: (count as number | null) ?? 0 };
  });

const DecideInput = z.object({
  source: z.enum(["change", "name", "domain"]),
  id: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  admin_note: z.string().trim().max(500).nullable().optional(),
});

export const adminDecideProviderChange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DecideInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    if (data.decision === "rejected" && !data.admin_note?.trim()) {
      throw new Error("A note is required when rejecting a change.");
    }

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const sa = supabaseAdmin as any;

    if (data.source === "change") {
      const { data: row, error: readErr } = await sa
        .from("provider_change_requests")
        .select("*")
        .eq("id", data.id)
        .maybeSingle();
      if (readErr) throw new Error(readErr.message);
      if (!row) throw new Error("Change request not found.");
      if ((row as any).status !== "pending") {
        throw new Error(`Change already ${(row as any).status}.`);
      }

      if (data.decision === "approved") {
        const { error: rpcErr } = await sa.rpc("apply_provider_change", {
          _request_id: data.id,
        });
        if (rpcErr) throw new Error(rpcErr.message);
      }

      const { error: uErr } = await sa
        .from("provider_change_requests")
        .update({
          status: data.decision,
          admin_note: data.admin_note?.trim() || null,
          reviewer_id: userId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", data.id);
      if (uErr) throw new Error(uErr.message);

      return { ok: true as const };
    }

    if (data.source === "name") {
      // Reuse existing behaviour: approving copies business_name.
      const { data: row } = await sa
        .from("provider_name_requests")
        .select("*")
        .eq("id", data.id)
        .maybeSingle();
      if (!row) throw new Error("Name request not found.");
      if ((row as any).status !== "pending") {
        throw new Error(`Name request already ${(row as any).status}.`);
      }
      if (data.decision === "approved") {
        const { error: pErr } = await sa
          .from("profiles")
          .update({ business_name: (row as any).requested_name })
          .eq("id", (row as any).user_id);
        if (pErr) throw new Error(pErr.message);
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
      if (uErr) throw new Error(uErr.message);
      return { ok: true as const };
    }

    // source === "domain"
    const nowIso = new Date().toISOString();
    const newStatus = data.decision === "approved" ? "approved" : "rejected";
    const { error } = await sa
      .from("provider_domain_verifications")
      .update({
        status: newStatus,
        admin_reviewed_at: nowIso,
        admin_reviewer_id: userId,
        admin_decision_reason: data.admin_note?.trim() || null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
