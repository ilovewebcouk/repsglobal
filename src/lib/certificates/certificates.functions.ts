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
  course_kind: "regulated" | "reps_course";
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
  postage_fee_pence: number;
  default_rm_service_code: string;
  currency: string;
  updated_at: string;
};

export type ShipToAddressDTO = {
  fullName: string;
  companyName?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  county?: string | null;
  postcode: string;
  countryCode: string;
  phoneNumber?: string | null;
  emailAddress?: string | null;
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
      .select(
        "unit_price_pence, postage_fee_pence, default_rm_service_code, currency, updated_at",
      )
      .eq("id", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      unit_price_pence: (data?.unit_price_pence as number | undefined) ?? 1500,
      postage_fee_pence: (data?.postage_fee_pence as number | undefined) ?? 650,
      default_rm_service_code:
        (data?.default_rm_service_code as string | undefined) ?? "TPN",
      currency: (data?.currency as string | undefined) ?? "gbp",
      updated_at: (data?.updated_at as string | undefined) ?? new Date().toISOString(),
    };
  });

const setPricingInput = z.object({
  unit_price_pence: z.number().int().min(0).max(50000).optional(),
  postage_fee_pence: z.number().int().min(0).max(10000).optional(),
  default_rm_service_code: z.enum(["TPN", "TPS"]).optional(),
});

export const setCertificatePricing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => setPricingInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const adminId = (context as any).realUserId ?? userId;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: adminId,
      _role: "admin",
    } as never);
    if (!isAdmin) throw new Error("Forbidden");

    const patch: Record<string, unknown> = {
      updated_by: userId,
      updated_at: new Date().toISOString(),
    };
    if (typeof data.unit_price_pence === "number")
      patch.unit_price_pence = data.unit_price_pence;
    if (typeof data.postage_fee_pence === "number")
      patch.postage_fee_pence = data.postage_fee_pence;
    if (data.default_rm_service_code)
      patch.default_rm_service_code = data.default_rm_service_code;

    const { error } = await supabase
      .from("certificate_pricing")
      .update(patch as never)
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
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RegistrationDTO[]> => {
    const { supabase, userId } = context;
    await assertProviderIsOrganisation(supabase, userId);
    const { data, error } = await supabase
      .from("certificate_registrations")
      .select(
        `id, learner_id, course_id, course_kind, course_title, course_level, reps_course_number,
         status, batch_id, format, enrolled_at, passed_at, paid_at, issued_at,
         dispatched_at, certificate_number, verification_token, price_pence_at_issue,
         created_at,
         learners!inner ( full_name, email )`,
      )
      .eq("provider_id", userId)
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => ({
      id: r.id,
      learner_id: r.learner_id,
      learner_name: r.learners?.full_name ?? "",
      learner_email: r.learners?.email ?? "",
      course_id: r.course_id,
      course_kind: r.course_kind,
      course_title: r.course_title,
      course_level: r.course_level,
      reps_course_number: r.reps_course_number,
      status: r.status,
      batch_id: r.batch_id,
      format: r.format,
      enrolled_at: r.enrolled_at,
      passed_at: r.passed_at,
      paid_at: r.paid_at,
      issued_at: r.issued_at,
      dispatched_at: r.dispatched_at,
      certificate_number: r.certificate_number,
      verification_token: r.verification_token,
      price_pence_at_issue: r.price_pence_at_issue,
      created_at: r.created_at,
    }));
  });

export const createRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => registrationInput.parse(d))
  .handler(async ({ data, context }): Promise<RegistrationDTO> => {
    const { supabase, userId } = context;
    const { country } = await assertProviderIsOrganisation(supabase, userId);

    // Verify learner belongs to provider
    const { data: learner } = await supabase
      .from("learners")
      .select("id, full_name, email")
      .eq("id", data.learner_id)
      .eq("provider_id", userId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!learner) throw new Error("Learner not found.");

    // Look up course from the correct table based on kind
    let courseTitle = "Untitled course";
    let courseLevel: number | null = null;
    let repsCourseNumber: string | null = null;

    if (data.course_kind === "regulated") {
      const { data: course } = await supabase
        .from("provider_regulated_permissions")
        .select("id, ofqual_snapshot, reps_qualification_number, status")
        .eq("id", data.course_id)
        .eq("provider_id", userId)
        .maybeSingle();
      if (!course) throw new Error("Course not found.");
      if ((course as any).status !== "approved") {
        throw new Error("This qualification isn't approved yet.");
      }
      const snap = ((course as any).ofqual_snapshot ?? {}) as { title?: string; level?: string };
      courseTitle = snap.title ?? "Ofqual-regulated qualification";
      courseLevel = snap.level && /\d+/.test(snap.level) ? Number(snap.level.match(/\d+/)![0]) : null;
      repsCourseNumber = ((course as any).reps_qualification_number as string | null) ?? null;
    } else {
      const { data: course } = await supabase
        .from("reps_courses")
        .select("id, official_title, official_level, reps_qual_number, status")
        .eq("id", data.course_id)
        .eq("provider_id", userId)
        .maybeSingle();
      if (!course) throw new Error("Course not found.");
      if ((course as any).status !== "approved") {
        throw new Error("This REPS-endorsed course isn't approved yet.");
      }
      courseTitle = ((course as any).official_title as string | null) ?? "REPS-endorsed course";
      courseLevel = ((course as any).official_level as number | null) ?? null;
      repsCourseNumber = ((course as any).reps_qual_number as string | null) ?? null;
    }

    const { data: row, error } = await supabase
      .from("certificate_registrations")
      .insert({
        provider_id: userId,
        learner_id: data.learner_id,
        course_id: data.course_id,
        course_kind: data.course_kind,
        course_title: courseTitle,
        course_level: courseLevel,
        reps_course_number: repsCourseNumber,
        format: formatForCountry(country),
        status: "enrolled",
      } as never)
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    return {
      id: row!.id as string,
      learner_id: row!.learner_id as string,
      learner_name: (learner as any).full_name,
      learner_email: (learner as any).email,
      course_id: row!.course_id as string,
      course_kind: (row as any).course_kind,
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

const shipToAddressSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  companyName: z.string().trim().max(120).optional().nullable(),
  addressLine1: z.string().trim().min(1).max(160),
  addressLine2: z.string().trim().max(160).optional().nullable(),
  city: z.string().trim().min(1).max(80),
  county: z.string().trim().max(80).optional().nullable(),
  postcode: z.string().trim().min(3).max(16),
  countryCode: z.string().trim().length(2).default("GB"),
  phoneNumber: z.string().trim().max(32).optional().nullable(),
  emailAddress: z.string().trim().email().max(160).optional().nullable(),
});

export const createCertificateBatchCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        registration_ids: z.array(z.string().uuid()).min(1).max(100),
        environment: z.enum(["sandbox", "live"]),
        ship_to_address: shipToAddressSchema.optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<{ url: string } | { error: string }> => {
    try {
      const { supabase, userId, claims } = context;
      const { country } = await assertProviderIsOrganisation(supabase, userId);

      // Load pricing (unit + postage)
      const { data: pricing } = await supabase
        .from("certificate_pricing")
        .select("unit_price_pence, postage_fee_pence, currency")
        .eq("id", true)
        .maybeSingle();
      const unitPricePence = (pricing?.unit_price_pence as number | undefined) ?? 1500;
      const postageFeePence =
        (pricing?.postage_fee_pence as number | undefined) ?? 650;
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
      const isPrinted = format === "printed_and_digital";
      const count = regs.length;

      // For UK/printed batches, require a shipping address up-front
      if (isPrinted && !data.ship_to_address) {
        return {
          error:
            "A UK postal address is required for printed certificates. Please add your shipping details before checking out.",
        };
      }

      const postageSnapshot = isPrinted ? postageFeePence : 0;
      const totalPence = unitPricePence * count + postageSnapshot;

      // Create batch
      const { data: batch, error: batchErr } = await supabase
        .from("certificate_batches")
        .insert({
          provider_id: userId,
          count,
          unit_price_pence: unitPricePence,
          postage_fee_pence_snapshot: postageSnapshot,
          total_pence: totalPence,
          currency,
          format,
          environment: data.environment,
          status: "pending",
          ship_to_address: data.ship_to_address ?? null,
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
        const line_items: any[] = [
          {
            quantity: count,
            price_data: {
              currency,
              unit_amount: unitPricePence,
              product_data: {
                name: isPrinted
                  ? "REPS Certificate — printed + digital"
                  : "REPS Certificate — digital",
                description:
                  "Jointly-branded certificate of achievement and unit summary, QR-verified on repsuk.org.",
              },
            },
          },
        ];
        if (isPrinted && postageSnapshot > 0) {
          line_items.push({
            quantity: 1,
            price_data: {
              currency,
              unit_amount: postageSnapshot,
              product_data: {
                name: "Postage & tracked delivery — Royal Mail",
                description: "Tracked delivery of your printed certificates.",
              },
            },
          });
        }

        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          customer_email: email ?? undefined,
          line_items,
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
            description: `REPS certificates — ${count} × ${(unitPricePence / 100).toFixed(2)}${
              postageSnapshot ? ` + £${(postageSnapshot / 100).toFixed(2)} postage` : ""
            }`,
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

// ─────────────────────────────────────────────────────────────────────────────
// Admin surfaces

async function assertAdmin(supabase: any, userId: string) {
  const { data: isAdmin } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  } as never);
  if (!isAdmin) throw new Error("Forbidden");
}

export type AdminBatchDTO = BatchDTO & {
  provider_id: string;
  provider_name: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  postage_fee_pence_snapshot: number;
  rm_service_code: string | null;
  rm_order_identifier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  label_pdf_path: string | null;
  shipped_at: string | null;
  ship_to_address: ShipToAddressDTO | null;
};

export const adminListBatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        status: z
          .enum([
            "all",
            "pending",
            "paid",
            "issued",
            "awaiting_print",
            "printed",
            "dispatched",
            "fulfilled",
            "canceled",
          ])
          .default("all"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<AdminBatchDTO[]> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, (context as any).realUserId ?? userId);
    let q = supabase
      .from("certificate_batches")
      .select(
        "id, provider_id, status, count, unit_price_pence, total_pence, currency, format, paid_at, issued_at, dispatched_at, created_at, stripe_checkout_session_id, stripe_payment_intent_id, postage_fee_pence_snapshot, rm_service_code, rm_order_identifier, tracking_number, tracking_url, label_pdf_path, shipped_at, ship_to_address",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const providerIds = Array.from(new Set((rows ?? []).map((r: any) => r.provider_id)));
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", providerIds);
    const nameById = new Map<string, string | null>(
      (profs ?? []).map((p: any) => [p.id, p.full_name ?? null]),
    );
    return (rows ?? []).map((r: any) => ({
      ...(r as BatchDTO),
      provider_id: r.provider_id,
      provider_name: nameById.get(r.provider_id) ?? null,
      stripe_checkout_session_id: r.stripe_checkout_session_id,
      stripe_payment_intent_id: r.stripe_payment_intent_id,
      postage_fee_pence_snapshot: (r.postage_fee_pence_snapshot as number) ?? 0,
      rm_service_code: r.rm_service_code ?? null,
      rm_order_identifier: r.rm_order_identifier ?? null,
      tracking_number: r.tracking_number ?? null,
      tracking_url: r.tracking_url ?? null,
      label_pdf_path: r.label_pdf_path ?? null,
      shipped_at: r.shipped_at ?? null,
      ship_to_address: (r.ship_to_address as ShipToAddressDTO | null) ?? null,
    }));
  });

export type PrintQueueRowDTO = {
  batch_id: string;
  provider_id: string;
  provider_name: string | null;
  count: number;
  paid_at: string | null;
  status: string;
  ship_to_address: ShipToAddressDTO | null;
  rm_service_code: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
  learners: Array<{
    registration_id: string;
    certificate_number: string | null;
    learner_name: string;
    learner_email: string;
    course_title: string;
    course_level: number | null;
    pdf_path: string | null;
  }>;
};

export const adminListPrintQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PrintQueueRowDTO[]> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, (context as any).realUserId ?? userId);

    const { data: batches, error } = await supabase
      .from("certificate_batches")
      .select(
        "id, provider_id, count, paid_at, status, ship_to_address, rm_service_code, tracking_number, tracking_url, shipped_at",
      )
      .in("status", ["awaiting_print", "printed"])
      .eq("format", "printed_and_digital")
      .order("paid_at", { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);

    const batchIds = (batches ?? []).map((b: any) => b.id);
    if (batchIds.length === 0) return [];

    const { data: regs } = await supabase
      .from("certificate_registrations")
      .select(
        "id, batch_id, certificate_number, course_title, course_level, pdf_path, learners!inner(full_name, email)",
      )
      .in("batch_id", batchIds);

    const providerIds = Array.from(new Set((batches ?? []).map((b: any) => b.provider_id)));
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", providerIds);
    const nameById = new Map<string, string | null>(
      (profs ?? []).map((p: any) => [p.id, p.full_name ?? null]),
    );

    return (batches ?? []).map((b: any) => ({
      batch_id: b.id,
      provider_id: b.provider_id,
      provider_name: nameById.get(b.provider_id) ?? null,
      count: b.count,
      paid_at: b.paid_at,
      status: b.status,
      ship_to_address: (b.ship_to_address as ShipToAddressDTO | null) ?? null,
      rm_service_code: b.rm_service_code ?? null,
      tracking_number: b.tracking_number ?? null,
      tracking_url: b.tracking_url ?? null,
      shipped_at: b.shipped_at ?? null,
      learners: (regs ?? [])
        .filter((r: any) => r.batch_id === b.id)
        .map((r: any) => ({
          registration_id: r.id,
          certificate_number: r.certificate_number,
          learner_name: r.learners?.full_name ?? "",
          learner_email: r.learners?.email ?? "",
          course_title: r.course_title,
          course_level: r.course_level,
          pdf_path: r.pdf_path,
        })),
    }));
  });

export const adminMarkBatchPrinted = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ batch_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const actor = (context as any).realUserId ?? userId;
    await assertAdmin(supabase, actor);
    const { error } = await supabase
      .from("certificate_batches")
      .update({
        status: "printed",
        printed_at: new Date().toISOString(),
        printed_by: actor,
      } as never)
      .eq("id", data.batch_id)
      .eq("status", "awaiting_print");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDownloadPrintPack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        batch_id: z.string().uuid(),
        format: z.enum(["merged", "zip"]).default("merged"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<{ url: string }> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, (context as any).realUserId ?? userId);
    const { buildMergedPrintPack, buildIndividualZip } = await import(
      "@/lib/certificates/print-pack.server"
    );
    const path =
      data.format === "zip"
        ? await buildIndividualZip(data.batch_id)
        : await buildMergedPrintPack(data.batch_id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("certificates")
      .createSignedUrl(path, 60 * 15);
    if (error || !signed?.signedUrl) throw new Error(error?.message ?? "Could not sign URL");
    return { url: signed.signedUrl };
  });

export const adminMarkBatchDispatched = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        batch_id: z.string().uuid(),
        service_code: z.enum(["TPN", "TPS"]).optional(),
      })
      .parse(d),
  )
  .handler(
    async ({
      data,
      context,
    }): Promise<{
      ok: true;
      tracking_number: string | null;
      tracking_url: string | null;
      label_pdf_path: string | null;
    }> => {
      const { supabase, userId } = context;
      await assertAdmin(supabase, (context as any).realUserId ?? userId);

      // Load batch + address snapshot
      const { data: batch, error: bErr } = await supabase
        .from("certificate_batches")
        .select(
          "id, provider_id, count, status, format, ship_to_address, shipped_at, tracking_number",
        )
        .eq("id", data.batch_id)
        .maybeSingle();
      if (bErr) throw new Error(bErr.message);
      if (!batch) throw new Error("Batch not found.");
      if (batch.format !== "printed_and_digital") {
        throw new Error("Only UK printed batches are dispatched via Royal Mail.");
      }
      if (batch.status !== "printed") {
        throw new Error(
          batch.status === "awaiting_print"
            ? "Mark this batch as printed before generating a Royal Mail label."
            : `Batch is in status '${batch.status}' — cannot dispatch.`,
        );
      }
      const address = batch.ship_to_address as ShipToAddressDTO | null;
      if (!address) {
        throw new Error(
          "This batch has no shipping address on file. The provider must add one before dispatch.",
        );
      }

      // Load default service if not supplied
      const { data: pricing } = await supabase
        .from("certificate_pricing")
        .select("default_rm_service_code")
        .eq("id", true)
        .maybeSingle();
      const serviceCode =
        data.service_code ??
        (pricing?.default_rm_service_code as string | undefined) ??
        "TPN";

      // Call Royal Mail
      const {
        createRoyalMailOrder,
        generateRoyalMailLabel,
        buildTrackingUrl,
        estimateShipmentWeightGrams,
      } = await import("@/lib/certificates/royal-mail.server");

      const rmOrder = await createRoyalMailOrder({
        orderReference: batch.id as string,
        serviceCode,
        recipient: address,
        weightGrams: estimateShipmentWeightGrams(batch.count as number),
        itemCount: batch.count as number,
        specialInstructions: `REPS certificates x${batch.count}`,
      });

      // Fetch the label PDF and upload to storage
      const labelBytes = await generateRoyalMailLabel(rmOrder.orderIdentifier);
      const labelPath = `batches/${batch.id}/label.pdf`;

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error: upErr } = await supabaseAdmin.storage
        .from("certificates")
        .upload(labelPath, labelBytes, {
          contentType: "application/pdf",
          upsert: true,
        });
      if (upErr) throw new Error(`Could not save shipping label: ${upErr.message}`);

      const trackingUrl = rmOrder.trackingNumber
        ? buildTrackingUrl(rmOrder.trackingNumber)
        : null;
      const now = new Date().toISOString();

      const { error: updErr } = await supabase
        .from("certificate_batches")
        .update({
          status: "dispatched",
          dispatched_at: now,
          shipped_at: now,
          rm_service_code: serviceCode,
          rm_order_identifier: String(rmOrder.orderIdentifier),
          rm_order_reference: rmOrder.orderReference,
          tracking_number: rmOrder.trackingNumber ?? null,
          tracking_url: trackingUrl,
          label_pdf_path: labelPath,
        } as never)
        .eq("id", data.batch_id);
      if (updErr) throw new Error(updErr.message);

      await supabase
        .from("certificate_registrations")
        .update({ status: "dispatched", dispatched_at: now } as never)
        .eq("batch_id", data.batch_id)
        .eq("status", "issued");

      // Notify the provider that the parcel is on the way.
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(
          batch.provider_id as string,
        );
        const providerEmail = authUser?.user?.email ?? null;
        if (providerEmail) {
          const { data: prof } = await supabaseAdmin
            .from("profiles").select("full_name").eq("id", batch.provider_id as string).maybeSingle();
          const { sendTransactionalEmailServer } = await import("@/lib/email/send.server");
          await sendTransactionalEmailServer({
            templateName: "certificates-shipped",
            recipientEmail: providerEmail,
            idempotencyKey: `cert-batch-shipped:${data.batch_id}`,
            templateData: {
              providerName: (prof?.full_name as string | null) ?? null,
              count: batch.count,
              serviceLabel: serviceCode === "TPS" ? "Royal Mail Tracked 24" : "Royal Mail Tracked 48",
              trackingNumber: rmOrder.trackingNumber ?? null,
              trackingUrl,
            },
          });
        }
      } catch (err) {
        console.error("[cert-dispatch] provider notification failed", err);
      }

      return {
        ok: true,
        tracking_number: rmOrder.trackingNumber ?? null,
        tracking_url: trackingUrl,
        label_pdf_path: labelPath,
      };
    },
  );

export const adminDownloadShippingLabel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ batch_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ url: string }> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, (context as any).realUserId ?? userId);
    const { data: batch } = await supabase
      .from("certificate_batches")
      .select("label_pdf_path")
      .eq("id", data.batch_id)
      .maybeSingle();
    if (!batch?.label_pdf_path) throw new Error("No shipping label on file for this batch.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("certificates")
      .createSignedUrl(batch.label_pdf_path as string, 60 * 10);
    if (error || !signed?.signedUrl) throw new Error(error?.message ?? "Could not sign URL");
    return { url: signed.signedUrl };
  });

export type BatchTrackingDTO = {
  batch_id: string;
  format: string;
  status: string;
  rm_service_code: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
};

export const getBatchTracking = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ batch_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<BatchTrackingDTO | null> => {
    const { supabase, userId } = context;
    const { data: batch } = await supabase
      .from("certificate_batches")
      .select(
        "id, provider_id, format, status, rm_service_code, tracking_number, tracking_url, shipped_at",
      )
      .eq("id", data.batch_id)
      .maybeSingle();
    if (!batch) return null;
    if (batch.provider_id !== userId) {
      // allow admin override
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: (context as any).realUserId ?? userId,
        _role: "admin",
      } as never);
      if (!isAdmin) throw new Error("Forbidden");
    }
    return {
      batch_id: batch.id as string,
      format: batch.format as string,
      status: batch.status as string,
      rm_service_code: (batch.rm_service_code as string | null) ?? null,
      tracking_number: (batch.tracking_number as string | null) ?? null,
      tracking_url: (batch.tracking_url as string | null) ?? null,
      shipped_at: (batch.shipped_at as string | null) ?? null,
    };
  });

export type AdminRegistrationSearchDTO = {
  id: string;
  provider_id: string;
  provider_name: string | null;
  learner_name: string;
  learner_email: string;
  course_title: string;
  course_level: number | null;
  status: RegistrationStatus;
  certificate_number: string | null;
  verification_token: string | null;
  issued_at: string | null;
};

export const adminSearchRegistrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ q: z.string().trim().max(120).optional().default("") }).parse(d),
  )
  .handler(async ({ data, context }): Promise<AdminRegistrationSearchDTO[]> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, (context as any).realUserId ?? userId);

    let query = supabase
      .from("certificate_registrations")
      .select(
        "id, provider_id, status, certificate_number, verification_token, issued_at, course_title, course_level, learners!inner(full_name, email)",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    const q = data.q.trim();
    if (q) {
      // Try cert-number exact-ish match first, else fall back to email/name contains via learners join
      if (/^REPS-CERT-/i.test(q)) {
        query = query.ilike("certificate_number", `${q}%`);
      } else if (q.includes("@")) {
        query = query.filter("learners.email", "ilike", `%${q}%`);
      } else {
        query = query.filter("learners.full_name", "ilike", `%${q}%`);
      }
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const providerIds = Array.from(new Set((rows ?? []).map((r: any) => r.provider_id)));
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", providerIds);
    const nameById = new Map<string, string | null>(
      (profs ?? []).map((p: any) => [p.id, p.full_name ?? null]),
    );

    return (rows ?? []).map((r: any) => ({
      id: r.id,
      provider_id: r.provider_id,
      provider_name: nameById.get(r.provider_id) ?? null,
      learner_name: r.learners?.full_name ?? "",
      learner_email: r.learners?.email ?? "",
      course_title: r.course_title,
      course_level: r.course_level,
      status: r.status,
      certificate_number: r.certificate_number,
      verification_token: r.verification_token,
      issued_at: r.issued_at,
    }));
  });

export const adminRevokeCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        registration_id: z.string().uuid(),
        reason: z.string().trim().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, (context as any).realUserId ?? userId);
    const { error } = await supabase
      .from("certificate_registrations")
      .update({ status: "revoked" } as never)
      .eq("id", data.registration_id)
      .in("status", ["issued", "dispatched"]);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
