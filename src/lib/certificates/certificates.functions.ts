/**
 * Student certification & registration — server functions.
 *
 * Training providers register learners against their approved REPS
 * courses (`provider_regulated_permissions`), mark them passed, batch-
 * checkout via Stripe, and REPS issues a jointly-branded PDF + QR-
 * verifiable e-certificate.
 *
 * Two audiences:
 *  - Provider (authenticated organisation) — CRUD learners + registrations,
 *    kick off batch checkout.
 *  - Public (anon) — look up a certificate by its opaque verification token
 *    (safe columns only).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuthWithImpersonation as requireSupabaseAuth } from "@/integrations/supabase/auth-middleware-impersonation";

// ─────────────────────────────────────────────────────────────────────────────
// Types shared with the UI

export type LearnerDTO = {
  id: string;
  full_name: string;
  email: string;
  dob: string | null;
  country: string | null;
  created_at: string;
};

export type RegistrationStatus =
  | "enrolled"
  | "passed"
  | "pending_payment"
  | "paid"
  | "issued"
  | "dispatched"
  | "revoked"
  | "canceled";

export type RegistrationDTO = {
  id: string;
  learner_id: string;
  learner_name: string;
  learner_email: string;
  course_id: string;
  course_title: string;
  course_level: number | null;
  reps_course_number: string | null;
  status: RegistrationStatus;
  batch_id: string | null;
  format: "digital" | "printed_and_digital" | null;
  enrolled_at: string;
  passed_at: string | null;
  paid_at: string | null;
  issued_at: string | null;
  dispatched_at: string | null;
  certificate_number: string | null;
  verification_token: string | null;
  price_pence_at_issue: number | null;
  created_at: string;
};

export type BatchDTO = {
  id: string;
  status: string;
  count: number;
  unit_price_pence: number;
  total_pence: number;
  currency: string;
  format: string;
  paid_at: string | null;
  issued_at: string | null;
  dispatched_at: string | null;
  created_at: string;
};

export type CertificatePricingDTO = {
  unit_price_pence: number;
  currency: string;
  updated_at: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Provider guard

async function assertProviderIsOrganisation(supabase: any, userId: string) {
  const { data } = await supabase
    .from("professionals")
    .select("account_type, country")
    .eq("id", userId)
    .maybeSingle();
  if (data?.account_type !== "organisation") {
    throw new Error(
      "Only training-provider accounts can manage students and certificates.",
    );
  }
  return { country: (data?.country as string | null) ?? null };
}

function formatForCountry(country: string | null): "digital" | "printed_and_digital" {
  if (!country) return "digital";
  const c = country.trim().toLowerCase();
  if (
    c === "gb" ||
    c === "uk" ||
    c === "united kingdom" ||
    c === "great britain" ||
    c === "england" ||
    c === "scotland" ||
    c === "wales" ||
    c === "northern ireland"
  ) {
    return "printed_and_digital";
  }
  return "digital";
}

// ─────────────────────────────────────────────────────────────────────────────
// Pricing

export const getCertificatePricing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CertificatePricingDTO> => {
    const { data, error } = await context.supabase
      .from("certificate_pricing")
      .select("unit_price_pence, currency, updated_at")
      .eq("id", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (
      data ?? {
        unit_price_pence: 1500,
        currency: "gbp",
        updated_at: new Date().toISOString(),
      }
    );
  });

const setPricingInput = z.object({
  unit_price_pence: z.number().int().min(0).max(50000),
});

export const setCertificatePricing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => setPricingInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    } as never);
    if (!isAdmin) throw new Error("Forbidden");

    const { error } = await supabase
      .from("certificate_pricing")
      .update({
        unit_price_pence: data.unit_price_pence,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", true);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Learners — CRUD

const learnerInput = z.object({
  full_name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(160).transform((e) => e.toLowerCase()),
  dob: z.string().date().optional().nullable(),
  country: z.string().trim().max(80).optional().nullable(),
});

export const listMyLearners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LearnerDTO[]> => {
    const { supabase, userId } = context;
    await assertProviderIsOrganisation(supabase, userId);
    const { data, error } = await supabase
      .from("learners")
      .select("id, full_name, email, dob, country, created_at")
      .eq("provider_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []) as LearnerDTO[];
  });

export const createLearner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => learnerInput.parse(d))
  .handler(async ({ data, context }): Promise<LearnerDTO> => {
    const { supabase, userId } = context;
    await assertProviderIsOrganisation(supabase, userId);

    const { data: row, error } = await supabase
      .from("learners")
      .insert({
        provider_id: userId,
        full_name: data.full_name,
        email: data.email,
        dob: data.dob ?? null,
        country: data.country ?? null,
        created_by: userId,
      } as never)
      .select("id, full_name, email, dob, country, created_at")
      .single();
    if (error) {
      if (error.code === "23505") {
        throw new Error("A learner with this email already exists on your account.");
      }
      throw new Error(error.message);
    }
    return row as LearnerDTO;
  });

const updateLearnerInput = learnerInput.extend({ id: z.string().uuid() });

export const updateLearner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateLearnerInput.parse(d))
  .handler(async ({ data, context }): Promise<LearnerDTO> => {
    const { supabase, userId } = context;
    await assertProviderIsOrganisation(supabase, userId);
    const { data: row, error } = await supabase
      .from("learners")
      .update({
        full_name: data.full_name,
        email: data.email,
        dob: data.dob ?? null,
        country: data.country ?? null,
      } as never)
      .eq("id", data.id)
      .eq("provider_id", userId)
      .select("id, full_name, email, dob, country, created_at")
      .single();
    if (error) throw new Error(error.message);
    return row as LearnerDTO;
  });

export const deleteLearner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertProviderIsOrganisation(supabase, userId);

    // Refuse if the learner has any non-cancelled registrations
    const { count } = await supabase
      .from("certificate_registrations")
      .select("id", { count: "exact", head: true })
      .eq("learner_id", data.id)
      .eq("provider_id", userId)
      .not("status", "in", "(canceled,revoked)");
    if ((count ?? 0) > 0) {
      throw new Error(
        "This learner has certificate registrations. Cancel them before deleting.",
      );
    }

    const { error } = await supabase
      .from("learners")
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq("id", data.id)
      .eq("provider_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Approved courses lookup — union of Ofqual-regulated permissions AND
// REPS-endorsed courses (both live in different tables).

export type ProviderCourseOptionDTO = {
  id: string;
  kind: "regulated" | "reps_course";
  title: string;
  level: number | null;
  reps_course_number: string | null;
  ofqual_number: string | null;
};

export const listMyApprovedCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProviderCourseOptionDTO[]> => {
    const { supabase, userId } = context;
    await assertProviderIsOrganisation(supabase, userId);

    // Ofqual-regulated permissions the provider has approval for
    const { data: regulated, error: regErr } = await supabase
      .from("provider_regulated_permissions")
      .select("id, ofqual_number, ofqual_snapshot, reps_qualification_number, created_at")
      .eq("provider_id", userId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (regErr) throw new Error(regErr.message);

    // REPS-endorsed courses the provider has had accredited
    const { data: repsCourses, error: rcErr } = await supabase
      .from("reps_courses")
      .select("id, official_title, official_level, reps_qual_number, created_at")
      .eq("provider_id", userId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (rcErr) throw new Error(rcErr.message);

    const regulatedRows: ProviderCourseOptionDTO[] = (regulated ?? []).map((r: any) => {
      const snap = (r.ofqual_snapshot ?? {}) as { title?: string; level?: string };
      const parsedLevel =
        snap.level && /\d+/.test(snap.level) ? Number(snap.level.match(/\d+/)![0]) : null;
      return {
        id: r.id,
        kind: "regulated",
        title: snap.title ?? "Ofqual-regulated qualification",
        level: parsedLevel,
        reps_course_number: (r.reps_qualification_number as string | null) ?? null,
        ofqual_number: (r.ofqual_number as string | null) ?? null,
      };
    });

    const repsRows: ProviderCourseOptionDTO[] = (repsCourses ?? []).map((r: any) => ({
      id: r.id,
      kind: "reps_course",
      title: (r.official_title as string | null) ?? "REPS-endorsed course",
      level: (r.official_level as number | null) ?? null,
      reps_course_number: (r.reps_qual_number as string | null) ?? null,
      ofqual_number: null,
    }));

    return [...regulatedRows, ...repsRows];
  });

// ─────────────────────────────────────────────────────────────────────────────
// Registrations

const registrationInput = z.object({
  learner_id: z.string().uuid(),
  course_id: z.string().uuid(),
  course_kind: z.enum(["regulated", "reps_course"]),
});

export const listMyRegistrations = createServerFn({ method: "GET" })
...
    if (error) throw new Error(error.message);

    return {
      id: row!.id as string,
      learner_id: row!.learner_id as string,
      learner_name: (learner as any).full_name,
      learner_email: (learner as any).email,
      course_id: row!.course_id as string,
      course_title: row!.course_title as string,
      course_level: row!.course_level as number | null,
      reps_course_number: row!.reps_course_number as string | null,
      status: row!.status as RegistrationStatus,
      batch_id: row!.batch_id as string | null,
      format: row!.format as any,
      enrolled_at: row!.enrolled_at as string,
      passed_at: row!.passed_at as string | null,
      paid_at: row!.paid_at as string | null,
      issued_at: row!.issued_at as string | null,
      dispatched_at: row!.dispatched_at as string | null,
      certificate_number: row!.certificate_number as string | null,
      verification_token: row!.verification_token as string | null,
      price_pence_at_issue: row!.price_pence_at_issue as number | null,
      created_at: row!.created_at as string,
    };
  });

export const markRegistrationsPassed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ ids: z.array(z.string().uuid()).min(1).max(200) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertProviderIsOrganisation(supabase, userId);
    const { error } = await supabase
      .from("certificate_registrations")
      .update({ status: "passed", passed_at: new Date().toISOString(), marked_passed_by: userId } as never)
      .eq("provider_id", userId)
      .eq("status", "enrolled")
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const cancelRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertProviderIsOrganisation(supabase, userId);
    const { error } = await supabase
      .from("certificate_registrations")
      .update({ status: "canceled" } as never)
      .eq("id", data.id)
      .eq("provider_id", userId)
      .in("status", ["enrolled", "passed"]);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Batch checkout

export const createCertificateBatchCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        registration_ids: z.array(z.string().uuid()).min(1).max(100),
        environment: z.enum(["sandbox", "live"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<{ url: string } | { error: string }> => {
    try {
      const { supabase, userId, claims } = context;
      const { country } = await assertProviderIsOrganisation(supabase, userId);

      // Load pricing
      const { data: pricing } = await supabase
        .from("certificate_pricing")
        .select("unit_price_pence, currency")
        .eq("id", true)
        .maybeSingle();
      const unitPricePence = (pricing?.unit_price_pence as number | undefined) ?? 1500;
      const currency = (pricing?.currency as string | undefined) ?? "gbp";

      // Validate registrations
      const { data: regs, error: regsErr } = await supabase
        .from("certificate_registrations")
        .select("id, status, batch_id")
        .eq("provider_id", userId)
        .in("id", data.registration_ids);
      if (regsErr) throw new Error(regsErr.message);
      if (!regs || regs.length !== data.registration_ids.length) {
        return { error: "Some registrations weren't found on your account." };
      }
      const notReady = regs.filter((r: any) => r.status !== "passed" || r.batch_id);
      if (notReady.length > 0) {
        return {
          error:
            "Some registrations aren't ready to check out. Only 'passed' registrations without an open batch can be paid for.",
        };
      }

      const format = formatForCountry(country);
      const count = regs.length;
      const totalPence = unitPricePence * count;

      // Create batch
      const { data: batch, error: batchErr } = await supabase
        .from("certificate_batches")
        .insert({
          provider_id: userId,
          count,
          unit_price_pence: unitPricePence,
          total_pence: totalPence,
          currency,
          format,
          environment: data.environment,
          status: "pending",
        } as never)
        .select("id")
        .single();
      if (batchErr) throw new Error(batchErr.message);

      // Attach registrations to batch and flip to pending_payment
      const { error: linkErr } = await supabase
        .from("certificate_registrations")
        .update({
          batch_id: batch!.id,
          status: "pending_payment",
          price_pence_at_issue: unitPricePence,
        } as never)
        .in("id", data.registration_ids);
      if (linkErr) throw new Error(linkErr.message);

      // Stripe Checkout (platform account, REPS revenue)
      const { createStripeClient, getCheckoutOrigin, getStripeErrorMessage } =
        await import("@/lib/billing/stripe.server");
      const stripe = createStripeClient(data.environment);
      const origin = getCheckoutOrigin();
      const email = (claims.email as string | undefined) ?? null;

      try {
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          customer_email: email ?? undefined,
          line_items: [
            {
              quantity: count,
              price_data: {
                currency,
                unit_amount: unitPricePence,
                product_data: {
                  name:
                    format === "printed_and_digital"
                      ? "REPS Certificate — printed + digital"
                      : "REPS Certificate — digital",
                  description:
                    "Jointly-branded certificate of achievement and unit summary, QR-verified on repsuk.org.",
                },
              },
            },
          ],
          success_url: `${origin}/dashboard/students?checkout=success&batch=${batch!.id}`,
          cancel_url: `${origin}/dashboard/students?checkout=canceled&batch=${batch!.id}`,
          metadata: {
            kind: "cert_batch",
            batch_id: batch!.id,
            provider_id: userId,
            count: String(count),
            environment: data.environment,
          },
          payment_intent_data: {
            description: `REPS certificates — ${count} × ${(unitPricePence / 100).toFixed(2)}`,
            metadata: { kind: "cert_batch", batch_id: batch!.id },
          },
        });

        if (!session.url) throw new Error("Stripe did not return a checkout URL");

        await supabase
          .from("certificate_batches")
          .update({ stripe_checkout_session_id: session.id } as never)
          .eq("id", batch!.id);

        return { url: session.url };
      } catch (err) {
        // Roll back — release the registrations back to 'passed'
        await supabase
          .from("certificate_registrations")
          .update({ batch_id: null, status: "passed", price_pence_at_issue: null } as never)
          .eq("batch_id", batch!.id);
        await supabase.from("certificate_batches").update({ status: "canceled" } as never).eq("id", batch!.id);
        return { error: getStripeErrorMessage(err) };
      }
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not start checkout" };
    }
  });

export const listMyBatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BatchDTO[]> => {
    const { supabase, userId } = context;
    await assertProviderIsOrganisation(supabase, userId);
    const { data, error } = await supabase
      .from("certificate_batches")
      .select(
        "id, status, count, unit_price_pence, total_pence, currency, format, paid_at, issued_at, dispatched_at, created_at",
      )
      .eq("provider_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []) as BatchDTO[];
  });

// ─────────────────────────────────────────────────────────────────────────────
// Certificate download (signed URL)

export const getCertificateSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ registration_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ url: string }> => {
    const { supabase, userId } = context;
    const { data: reg } = await supabase
      .from("certificate_registrations")
      .select("pdf_path, provider_id, status")
      .eq("id", data.registration_id)
      .maybeSingle();
    if (!reg) throw new Error("Certificate not found.");

    // Provider owns it OR admin
    if (reg.provider_id !== userId) {
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      } as never);
      if (!isAdmin) throw new Error("Forbidden");
    }
    if (!reg.pdf_path) throw new Error("Certificate PDF is not ready yet.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("certificates")
      .createSignedUrl(reg.pdf_path as string, 60 * 15);
    if (error || !signed?.signedUrl) throw new Error(error?.message ?? "Could not sign URL");
    return { url: signed.signedUrl };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Public verify — anon read via publishable-key client + narrow policy

export type PublicVerifyDTO =
  | {
      valid: true;
      certificate_number: string;
      learner_name: string;
      course_title: string;
      course_level: number | null;
      reps_course_number: string | null;
      provider_name: string;
      issued_at: string;
      status: "issued" | "dispatched" | "revoked";
    }
  | { valid: false; reason: "not_found" };

export const verifyCertificateByToken = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({ token: z.string().min(8).max(120) }).parse(d),
  )
  .handler(async ({ data }): Promise<PublicVerifyDTO> => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabasePublic = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data: row } = await supabasePublic
      .from("certificate_registrations")
      .select(
        "certificate_number, course_title, course_level, reps_course_number, issued_at, status, provider_id, learners!inner(full_name)",
      )
      .eq("verification_token", data.token)
      .in("status", ["issued", "dispatched", "revoked"])
      .maybeSingle();

    if (!row || !row.certificate_number || !row.issued_at) {
      return { valid: false, reason: "not_found" };
    }

    // Provider name — read from profiles (already publicly readable name)
    const { data: providerProfile } = await supabasePublic
      .from("profiles")
      .select("full_name")
      .eq("id", (row as any).provider_id)
      .maybeSingle();

    return {
      valid: true,
      certificate_number: row.certificate_number as string,
      learner_name: ((row as any).learners?.full_name as string | null) ?? "",
      course_title: row.course_title as string,
      course_level: (row.course_level as number | null) ?? null,
      reps_course_number: (row.reps_course_number as string | null) ?? null,
      provider_name: (providerProfile?.full_name as string | null) ?? "Training provider",
      issued_at: row.issued_at as string,
      status: row.status as "issued" | "dispatched" | "revoked",
    };
  });
