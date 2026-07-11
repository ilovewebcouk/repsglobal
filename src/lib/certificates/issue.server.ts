/**
 * Certificate batch issuance — runs from the Stripe webhook after a
 * cert_batch checkout is paid. For each registration in the batch:
 *   1. assign next REPS-CERT-NNNNNN number + verification token
 *   2. build PDF (certificate + unit summary) with QR
 *   3. upload to `certificates` storage bucket (private)
 *   4. flip status → 'issued' (or 'awaiting_print' record on the batch)
 *
 * Server-only. Uses supabaseAdmin (service role) — bypasses RLS.
 */

export async function issueCertificatesForBatch(batchId: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Load batch + provider
  const { data: batch } = await supabaseAdmin
    .from("certificate_batches")
    .select("id, provider_id, format, status")
    .eq("id", batchId)
    .maybeSingle();
  if (!batch) throw new Error(`Batch ${batchId} not found`);
  if (batch.status === "issued" || batch.status === "awaiting_print" || batch.status === "fulfilled") {
    return; // idempotent — already issued
  }

  const providerId = batch.provider_id as string;

  // Provider name (public trading name) + certificate logo
  const { data: providerProfile } = await supabaseAdmin
    .from("profiles").select("full_name, certificate_logo_url").eq("id", providerId).maybeSingle();
  const providerName = (providerProfile?.full_name as string | null) ?? "Training provider";
  const providerLogoUrl = ((providerProfile as any)?.certificate_logo_url as string | null) ?? null;

  // Load all registrations in this batch
  const { data: regs } = await supabaseAdmin
    .from("certificate_registrations")
    .select("id, learner_id, course_id, course_kind, course_title, course_level, reps_course_number, status")
    .eq("batch_id", batchId);

  if (!regs || regs.length === 0) {
    await supabaseAdmin.from("certificate_batches").update({ status: "issued", issued_at: new Date().toISOString() } as never).eq("id", batchId);
    return;
  }

  const publicBase = (process.env.PUBLIC_SITE_URL ?? "https://repsuk.org").replace(/\/$/, "");
  const { generateCertificatePdf } = await import("./pdf.server");

  for (const reg of regs) {
    if ((reg as any).status !== "paid") continue;

    // Learner
    const { data: learner } = await supabaseAdmin
      .from("learners").select("full_name, email").eq("id", (reg as any).learner_id).maybeSingle();

    // Ofqual number (regulated kind only) + learning outcomes / modules
    let ofqualNumber: string | null = null;
    let unitSummary: string[] = [];
    if ((reg as any).course_kind === "regulated") {
      const { data: perm } = await supabaseAdmin
        .from("provider_regulated_permissions")
        .select("ofqual_number, spec_learning_outcomes")
        .eq("id", (reg as any).course_id).maybeSingle();
      ofqualNumber = ((perm as any)?.ofqual_number as string | null) ?? null;
      const outcomes = (perm as any)?.spec_learning_outcomes as unknown;
      if (Array.isArray(outcomes)) {
        unitSummary = outcomes.filter((x): x is string => typeof x === "string");
      } else if (outcomes && typeof outcomes === "object") {
        unitSummary = Object.values(outcomes).filter((x): x is string => typeof x === "string");
      }
    } else {
      const { data: rc } = await supabaseAdmin
        .from("reps_courses")
        .select("spec_modules, spec_learning_outcomes")
        .eq("id", (reg as any).course_id).maybeSingle();
      const mods = (rc as any)?.spec_modules as unknown;
      if (Array.isArray(mods)) {
        unitSummary = mods
          .map((m) => (typeof m === "string" ? m : (m as any)?.title ?? (m as any)?.name ?? null))
          .filter((x): x is string => typeof x === "string");
      }
      if (unitSummary.length === 0) {
        const outcomes = (rc as any)?.spec_learning_outcomes as unknown;
        if (Array.isArray(outcomes)) {
          unitSummary = outcomes.filter((x): x is string => typeof x === "string");
        }
      }
    }

    // Assign number + token
    const { data: numRow } = await supabaseAdmin.rpc("next_certificate_number" as never);
    const certificateNumber = (numRow as unknown as string) ?? `REPS-CERT-${Date.now()}`;
    const verificationToken = crypto.randomUUID();

    const issuedAt = new Date();
    const verificationUrl = `${publicBase}/verify/${verificationToken}`;

    // Build PDF
    const pdfBytes = await generateCertificatePdf({
      certificateNumber,
      learnerName: (learner?.full_name as string | null) ?? "Learner",
      courseTitle: (reg as any).course_title,
      courseLevel: (reg as any).course_level,
      repsCourseNumber: (reg as any).reps_course_number,
      ofqualNumber,
      providerName,
      providerLogoUrl,
      issuedAt,
      verificationUrl,
      unitSummary,
    });

    // Upload
    const path = `${providerId}/${batchId}/${certificateNumber}.pdf`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("certificates")
      .upload(path, pdfBytes, { contentType: "application/pdf", upsert: true });
    if (upErr) {
      console.error("[cert-issue] upload failed", upErr);
      continue;
    }

    await supabaseAdmin
      .from("certificate_registrations")
      .update({
        status: "issued",
        issued_at: issuedAt.toISOString(),
        certificate_number: certificateNumber,
        verification_token: verificationToken,
        pdf_path: path,
      } as never)
      .eq("id", (reg as any).id);

    // Email the learner directly with a signed download link
    try {
      const learnerEmail = (learner?.email as string | null) ?? null;
      if (learnerEmail) {
        const { data: signed } = await supabaseAdmin.storage
          .from("certificates")
          .createSignedUrl(path, 60 * 60 * 24 * 30); // 30 days
        const { sendTransactionalEmailServer } = await import("@/lib/email/send.server");
        await sendTransactionalEmailServer({
          templateName: "learner-certificate-issued",
          recipientEmail: learnerEmail,
          idempotencyKey: `learner-cert-issued:${(reg as any).id}`,
          templateData: {
            learnerName: (learner?.full_name as string | null) ?? null,
            courseTitle: (reg as any).course_title,
            providerName,
            certificateNumber,
            downloadUrl: signed?.signedUrl ?? verificationUrl,
            verificationUrl,
          },
        });
      }
    } catch (err) {
      console.error("[cert-issue] learner notification failed", err);
    }
  }

  // Batch status: UK/printed batches queue for admin print; digital-only closes as issued
  const nextStatus = batch.format === "printed_and_digital" ? "awaiting_print" : "issued";
  await supabaseAdmin
    .from("certificate_batches")
    .update({ status: nextStatus, issued_at: new Date().toISOString() } as never)
    .eq("id", batchId);

  // Notify the provider that their certificates are ready.
  try {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(providerId);
    const providerEmail = authUser?.user?.email ?? null;
    if (providerEmail) {
      const { sendTransactionalEmailServer } = await import("@/lib/email/send.server");
      await sendTransactionalEmailServer({
        templateName: "certificates-ready",
        recipientEmail: providerEmail,
        idempotencyKey: `cert-batch-ready:${batchId}`,
        templateData: {
          providerName,
          count: regs.length,
          formatLabel: batch.format,
        },
      });
    }
  } catch (err) {
    console.error("[cert-issue] provider notification failed", err);
  }
}
