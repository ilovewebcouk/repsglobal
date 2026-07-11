/**
 * Server functions for training-provider domain email verification.
 *
 * Stage 2 of the two-stage provider verification flow:
 *   Stage 1 = Stripe Identity (existing, unchanged)
 *   Stage 2 = Confirm an email on the provider's website domain
 *             → then admin approves the domain itself.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";
import { z } from "zod";

import {
  domainFromEmail,
  domainFromWebsite,
  isFreeEmailDomain,
  isEmailShape,
  type ProviderDomainState,
  type ProviderDomainStatus,
} from "./provider-domain-shared";

const CONFIRM_TTL_HOURS = 24;
const MAX_RESENDS_PER_DAY = 5;
const MIN_RESEND_INTERVAL_MS = 60_000; // 1/min

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* -------------------------------------------------------------------------- */
/* getProviderDomainVerification                                              */
/* -------------------------------------------------------------------------- */

export const getProviderDomainVerification = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }): Promise<ProviderDomainState> => {
    const { supabase, userId } = context;

    const [{ data: pro }, { data: row }] = await Promise.all([
      supabase
        .from("professionals")
        .select("website")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("provider_domain_verifications")
        .select(
          "status, email, email_sent_at, email_confirmed_at, admin_reviewed_at, admin_decision_reason, admin_notes",
        )
        .eq("professional_id", userId)
        .maybeSingle(),
    ]);

    const rawWebsite = (pro?.website as string | null) ?? null;
    const expectedDomain = domainFromWebsite(rawWebsite);

    return {
      status: (row?.status as ProviderDomainStatus | undefined) ?? "unstarted",
      expectedDomain,
      email: (row?.email as string | null) ?? null,
      emailSentAt: (row?.email_sent_at as string | null) ?? null,
      emailConfirmedAt: (row?.email_confirmed_at as string | null) ?? null,
      adminReviewedAt: (row?.admin_reviewed_at as string | null) ?? null,
      adminDecisionReason: (row?.admin_decision_reason as string | null) ?? null,
      adminNotes: (row?.admin_notes as string | null) ?? null,
      websiteMissing: !expectedDomain,
      rawWebsite,
    };
  });

/* -------------------------------------------------------------------------- */
/* setProviderWebsite — inline update from the verification page              */
/* -------------------------------------------------------------------------- */

const SetWebsiteInput = z.object({
  website: z.string().trim().min(3).max(500),
});

export const setProviderWebsite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SetWebsiteInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    let raw = data.website.trim();
    if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;

    const domain = domainFromWebsite(raw);
    if (!domain) {
      throw new Error("That doesn't look like a valid website URL.");
    }
    if (isFreeEmailDomain(domain)) {
      throw new Error(
        "Use your provider's own website domain — free email providers (Gmail, Outlook, etc.) aren't accepted.",
      );
    }

    const { error } = await supabase
      .from("professionals")
      .update({ website: raw })
      .eq("id", userId);
    if (error) throw new Error(error.message);

    return { ok: true, website: raw, domain };
  });

/* -------------------------------------------------------------------------- */
/* startProviderDomainVerification                                            */
/* -------------------------------------------------------------------------- */

const StartInput = z.object({
  email: z.string().trim().min(3).max(255),
});

export const startProviderDomainVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => StartInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const email = data.email.trim().toLowerCase();

    if (!isEmailShape(email)) {
      throw new Error("That doesn't look like a valid email address.");
    }

    // Load provider website + canonical display name (profiles.full_name).
    const { data: pro } = await supabase
      .from("professionals")
      .select("website")
      .eq("id", userId)
      .maybeSingle();
    const { data: prof } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();
    const providerDisplayName =
      ((prof as { full_name?: string | null } | null)?.full_name ?? "").trim() ||
      "Your organisation";



    const rawWebsite = (pro?.website as string | null) ?? null;
    const expectedDomain = domainFromWebsite(rawWebsite);
    if (!expectedDomain) {
      throw new Error(
        "Add your provider website in your profile first — we need it to verify a matching email.",
      );
    }

    const emailDomain = domainFromEmail(email);
    if (!emailDomain) {
      throw new Error("That doesn't look like a valid email address.");
    }

    if (isFreeEmailDomain(emailDomain)) {
      throw new Error(
        "You need to use a business email on your provider's own domain — free email providers (Gmail, Outlook, Yahoo, etc.) can't be verified.",
      );
    }

    if (emailDomain !== expectedDomain) {
      throw new Error(
        `That email must be on ${expectedDomain} to match your provider website. You entered @${emailDomain}.`,
      );
    }

    // Look up existing row for rate limit + idempotency
    const { data: existing } = await supabase
      .from("provider_domain_verifications")
      .select("id, status, last_resend_at, resend_count_today, email_sent_at")
      .eq("professional_id", userId)
      .maybeSingle();

    if (existing?.status === "approved") {
      throw new Error("Your provider domain is already verified.");
    }

    // Rate limit resends
    const now = Date.now();
    if (existing?.last_resend_at) {
      const last = new Date(existing.last_resend_at).getTime();
      if (now - last < MIN_RESEND_INTERVAL_MS) {
        throw new Error("Please wait a minute before requesting another email.");
      }
    }
    // Daily counter (reset on new UTC day)
    const today = new Date().toISOString().slice(0, 10);
    const lastSentDay = existing?.email_sent_at
      ? new Date(existing.email_sent_at).toISOString().slice(0, 10)
      : null;
    const resendCountToday =
      lastSentDay === today ? existing?.resend_count_today ?? 0 : 0;
    if (resendCountToday >= MAX_RESENDS_PER_DAY) {
      throw new Error("You've hit today's resend limit. Try again tomorrow.");
    }

    // Mint token
    const rawToken = generateToken();
    const tokenHash = await sha256Hex(rawToken);
    const expiresAt = new Date(now + CONFIRM_TTL_HOURS * 3600_000).toISOString();
    const nowIso = new Date(now).toISOString();

    // Load service-role client via server-only module for the write (needed
    // to bypass the "status <> approved" update policy in edge cases and
    // to write suppressed/log records safely).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const upsertPayload = {
      professional_id: userId,
      domain: expectedDomain,
      email,
      status: "email_sent" as ProviderDomainStatus,
      confirmation_token_hash: tokenHash,
      confirmation_expires_at: expiresAt,
      email_sent_at: nowIso,
      last_resend_at: nowIso,
      resend_count_today: resendCountToday + 1,
    };

    const { error: upsertErr } = await supabaseAdmin
      .from("provider_domain_verifications")
      .upsert(upsertPayload, { onConflict: "professional_id" });
    if (upsertErr) throw new Error(`Could not save your request: ${upsertErr.message}`);

    // Build confirmation URL. Prefer public site URL from env; fall back
    // to the canonical prod host.
    const siteUrl =
      process.env.PUBLIC_SITE_URL ??
      process.env.VITE_PUBLIC_SITE_URL ??
      "https://repsuk.org";
    const confirmUrl = `${siteUrl.replace(/\/$/, "")}/api/public/verify-provider-domain?token=${rawToken}`;

    const { sendTransactionalEmailServer } = await import("@/lib/email/send.server");
    await sendTransactionalEmailServer({
      templateName: "provider-domain-confirm",
      recipientEmail: email,
      idempotencyKey: `provider-domain-${userId}-${tokenHash.slice(0, 12)}`,
      templateData: {
        providerName: providerDisplayName,
        domain: expectedDomain,
        confirmUrl,
        expiresInHours: CONFIRM_TTL_HOURS,
      },
    });

    return { ok: true, expectedDomain, email };
  });

/* -------------------------------------------------------------------------- */
/* Admin decisions                                                            */
/* -------------------------------------------------------------------------- */

const AdminListInput = z.object({
  status: z
    .enum(["pending_admin_review", "approved", "rejected", "all"])
    .default("pending_admin_review"),
});

export const adminListProviderDomainQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AdminListInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    let query = supabase
      .from("provider_domain_verifications")
      .select(
        "id, professional_id, domain, email, status, email_sent_at, email_confirmed_at, admin_reviewed_at, admin_decision_reason, admin_notes, created_at, updated_at",
      )
      .order("email_confirmed_at", { ascending: false, nullsFirst: false });

    if (data.status !== "all") query = query.eq("status", data.status);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const AdminDecideInput = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  reason: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const adminDecideProviderDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AdminDecideInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const nowIso = new Date().toISOString();
    const newStatus: ProviderDomainStatus =
      data.decision === "approve" ? "approved" : "rejected";

    const { error } = await supabaseAdmin
      .from("provider_domain_verifications")
      .update({
        status: newStatus,
        admin_reviewed_at: nowIso,
        admin_reviewer_id: userId,
        admin_decision_reason: data.reason ?? null,
        admin_notes: data.notes ?? null,
      })
      .eq("id", data.id);

    if (error) throw new Error(error.message);

    return { ok: true, status: newStatus };
  });
