/**
 * Enqueue learner review-request emails for every certificate registration
 * in a batch, once the batch has been marked printed. Idempotent: skips
 * registrations that already have a review_request tied to them.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendLearnerReviewRequestViaMailgun } from "@/lib/reviews/send-learner-review-request.server";

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const REVIEW_WINDOW_DAYS = 180;
const BASE_URL = "https://repsuk.org";

export async function enqueueLearnerReviewRequestsForBatch(batchId: string) {
  // Load batch + provider name
  const { data: batch, error: bErr } = await supabaseAdmin
    .from("certificate_batches")
    .select("id, provider_id")
    .eq("id", batchId)
    .maybeSingle();
  if (bErr) throw new Error(bErr.message);
  if (!batch) return { enqueued: 0, skipped: 0 };

  const { data: provider } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name")
    .eq("id", batch.provider_id)
    .maybeSingle();
  const providerName =
    (provider?.full_name as string | null) ?? "Your training provider";

  // Load all registrations in the batch with learner contact info
  const { data: regs, error: rErr } = await supabaseAdmin
    .from("certificate_registrations")
    .select(
      "id, course_id, course_title, learner_id, learners:learner_id ( full_name, email )",
    )
    .eq("batch_id", batchId);
  if (rErr) throw new Error(rErr.message);
  if (!regs || regs.length === 0) return { enqueued: 0, skipped: 0 };

  // Skip any registrations that already have a review_request
  const regIds = regs.map((r: any) => r.id);
  const { data: existing } = await supabaseAdmin
    .from("review_requests")
    .select("certificate_registration_id")
    .in("certificate_registration_id", regIds);
  const alreadyEnqueued = new Set(
    (existing ?? []).map((e: any) => e.certificate_registration_id),
  );

  const expiresAt = new Date(
    Date.now() + REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  let enqueued = 0;
  let skipped = 0;

  for (const r of regs as any[]) {
    if (alreadyEnqueued.has(r.id)) {
      skipped++;
      continue;
    }
    const email: string | null = r.learners?.email ?? null;
    if (!email) {
      skipped++;
      continue;
    }
    const learnerName: string | null = r.learners?.full_name ?? null;
    const courseTitle: string = r.course_title ?? "your course";

    const token = generateToken();

    const { data: inserted, error: iErr } = await supabaseAdmin
      .from("review_requests")
      .insert({
        professional_id: batch.provider_id,
        certificate_registration_id: r.id,
        course_id: r.course_id ?? null,
        course_title_snapshot: courseTitle,
        provider_name_snapshot: providerName,
        client_email: email.toLowerCase(),
        client_name: learnerName,
        kind: "learner",
        token,
        expires_at: expiresAt,
      } as never)
      .select("id")
      .maybeSingle();

    if (iErr || !inserted) {
      skipped++;
      continue;
    }

    try {
      await sendLearnerReviewRequestViaMailgun({
        reviewRequestId: (inserted as any).id,
        recipientEmail: email,
        templateData: {
          learnerName,
          courseTitle,
          providerName,
          reviewUrl: `${BASE_URL}/r/${token}`,
          joinRepsUrl: `${BASE_URL}/join?ref=cert&code=NEWPRO50`,
        },
      });
      enqueued++;
    } catch (err) {
      // Log but don't abort the whole batch
      console.error("[learner-review-request] send failed", err);
      await supabaseAdmin
        .from("review_requests")
        .update({
          failed_at: new Date().toISOString(),
          failure_reason: err instanceof Error ? err.message : String(err),
        } as never)
        .eq("id", (inserted as any).id);
      skipped++;
    }
  }

  return { enqueued, skipped };
}
