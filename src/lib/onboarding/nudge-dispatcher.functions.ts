/**
 * Onboarding drip dispatcher.
 *
 * Stage machine (resolve_onboarding_stage in SQL is source of truth):
 *   not_signed_in      → log-in-1..5    at day 0/3/8/17/30
 *   verify_incomplete  → verify-1..4    at day 0/4/10/21
 *   website_unpublished→ website-1..3   at day 0/5/14
 *   complete           → complete       one-time
 *
 * Idempotency: PK (user_id, stage, step) on onboarding_nudges. If a row exists
 * we've already sent it — never resend. If a user drops back into a prior
 * stage (rare) they resume from max(step)+1 in that stage up to the cap.
 *
 * Global cap: at most one onboarding email per user per calendar day.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const ONBOARDING_STAGES = [
  "not_signed_in",
  "verify_incomplete",
  "website_unpublished",
  "complete",
] as const;
export type OnboardingStage = (typeof ONBOARDING_STAGES)[number];

const CADENCE: Record<OnboardingStage, number[]> = {
  not_signed_in: [0, 3, 8, 17, 30],
  verify_incomplete: [0, 4, 10, 21],
  website_unpublished: [0, 5, 14],
  complete: [0],
};

// Anyone whose auth account was confirmed before this cutoff is a "legacy"
// member (existed before the platform relaunch) and receives the log-in copy
// that references the rebuild + password reset. Anyone confirmed on or after
// this cutoff signed up on the new platform and receives welcome/sign-in copy.
const LEGACY_COHORT_CUTOFF_ISO = "2026-07-06T00:00:00Z";

type Cohort = "legacy" | "signup";

const TEMPLATE_KEYS: Record<Cohort, Record<OnboardingStage, string[]>> = {
  legacy: {
    not_signed_in: [
      "onboarding-log-in-1",
      "onboarding-log-in-2",
      "onboarding-log-in-3",
      "onboarding-log-in-4",
      "onboarding-log-in-5",
    ],
    verify_incomplete: [
      "onboarding-verify-1",
      "onboarding-verify-2",
      "onboarding-verify-3",
      "onboarding-verify-4",
    ],
    website_unpublished: [
      "onboarding-website-1",
      "onboarding-website-2",
      "onboarding-website-3",
    ],
    complete: ["onboarding-complete"],
  },
  signup: {
    not_signed_in: [
      "onboarding-signup-log-in-1",
      "onboarding-signup-log-in-2",
      "onboarding-signup-log-in-3",
      "onboarding-signup-log-in-4",
      "onboarding-signup-log-in-5",
    ],
    verify_incomplete: [
      "onboarding-signup-verify-1",
      "onboarding-verify-2",
      "onboarding-verify-3",
      "onboarding-verify-4",
    ],
    website_unpublished: [
      "onboarding-website-1",
      "onboarding-website-2",
      "onboarding-website-3",
    ],
    complete: ["onboarding-complete"],
  },
};


interface Candidate {
  userId: string;
  email: string;
  proName: string | null;
  stage: OnboardingStage;
  stageEnteredAt: string;
  nextStep: number;
  requiredDay: number;
  daysInStage: number;
  templateKey: string;
}

async function requireAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

async function resolveCandidates(): Promise<Candidate[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Pull all professionals + basic auth info via a joined RPC would be ideal;
  // for now, fetch professionals + resolve stage per-row via the SQL function.
  const { data: pros, error } = await supabaseAdmin
    .from("professionals")
    .select("id");
  if (error) throw error;
  if (!pros?.length) return [];

  // Canonical display name = profiles.full_name (see mem://index.md).
  const proIds = pros.map((p: { id: string }) => p.id);
  const { data: profs } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name")
    .in("id", proIds);
  const fullNameById = new Map<string, string | null>();
  for (const p of (profs as Array<{ id: string; full_name: string | null }> | null) ?? []) {
    fullNameById.set(p.id, p.full_name ?? null);
  }

  // Fetch auth users (email + confirmed_at) in one call to filter admins/demo
  // and to compute cohort (legacy vs new-signup) per user.
  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (authErr) throw authErr;
  const emailByUser = new Map<string, string>();
  const cohortByUser = new Map<string, Cohort>();
  const cutoffMs = new Date(LEGACY_COHORT_CUTOFF_ISO).getTime();
  for (const u of authData.users) {
    if (u.email) emailByUser.set(u.id, u.email);
    const confirmedAt = (u as { confirmed_at?: string | null }).confirmed_at
      ?? (u as { email_confirmed_at?: string | null }).email_confirmed_at
      ?? null;
    const confirmedMs = confirmedAt ? new Date(confirmedAt).getTime() : Number.POSITIVE_INFINITY;
    cohortByUser.set(u.id, confirmedMs < cutoffMs ? "legacy" : "signup");
  }

  // Existing sends in the last 24h (global cap) and per-stage step history.
  const { data: recent, error: recentErr } = await supabaseAdmin
    .from("onboarding_nudges")
    .select("user_id, stage, step, sent_at");
  if (recentErr) throw recentErr;
  const sentToday = new Set<string>();
  const stepsByUserStage = new Map<string, number>();
  const todayIso = new Date().toISOString().slice(0, 10);
  for (const r of recent ?? []) {
    if (String(r.sent_at).slice(0, 10) === todayIso) sentToday.add(String(r.user_id));
    const key = `${r.user_id}:${r.stage}`;
    const cur = stepsByUserStage.get(key) ?? 0;
    if (r.step > cur) stepsByUserStage.set(key, r.step);
  }

  // Suppression list.
  const { data: suppressed } = await supabaseAdmin.from("suppressed_emails").select("email");
  const suppressedSet = new Set((suppressed ?? []).map((s: any) => String(s.email).toLowerCase()));

  const now = Date.now();
  const out: Candidate[] = [];

  for (const p of pros) {
    const userId = p.id as string;
    const email = emailByUser.get(userId);
    if (!email) continue;
    const emailLc = email.toLowerCase();
    if (suppressedSet.has(emailLc)) continue;
    // Exclude admin/demo/internal
    if (emailLc.endsWith("@repsuk.org")) continue;
    if (emailLc === "cruz.pt@icloud.com") continue;
    if (sentToday.has(userId)) continue;

    const { data: stageRows, error: stErr } = await supabaseAdmin.rpc(
      "resolve_onboarding_stage",
      { _user_id: userId },
    );
    if (stErr || !stageRows?.length) continue;
    const row = stageRows[0] as { stage: string; stage_entered_at: string | null };
    if (!row.stage || row.stage === "muted") continue;
    if (!ONBOARDING_STAGES.includes(row.stage as OnboardingStage)) continue;

    const stage = row.stage as OnboardingStage;
    const stageEnteredAt = row.stage_entered_at ?? new Date(0).toISOString();
    const cadence = CADENCE[stage];
    const cohort = cohortByUser.get(userId) ?? "signup";
    const templates = TEMPLATE_KEYS[cohort][stage];
    const currentMaxStep = stepsByUserStage.get(`${userId}:${stage}`) ?? 0;
    const nextStep = currentMaxStep + 1;
    if (nextStep > cadence.length) continue; // cap reached

    const daysInStage = Math.floor((now - new Date(stageEnteredAt).getTime()) / 86400000);
    const requiredDay = cadence[nextStep - 1] ?? 0;
    if (daysInStage < requiredDay) continue;

    const proName = extractFirstName(fullNameById.get(userId) ?? null);
    out.push({
      userId, email, proName,
      stage, stageEnteredAt,
      nextStep, requiredDay, daysInStage,
      templateKey: templates[nextStep - 1],
    });
  }

  return out;
}

function extractFirstName(n: string | null | undefined): string | null {
  if (!n) return null;
  const first = n.trim().split(/\s+/)[0];
  return first || null;
}

async function renderAndSend(c: Candidate) {
  const React = await import("react");
  const { render } = await import("@react-email/components");
  const { TEMPLATES } = await import("@/lib/email-templates/registry");
  const { sendViaMailgun } = await import("@/lib/email/mailgun.server");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const tmpl = TEMPLATES[c.templateKey];
  if (!tmpl) throw new Error(`Template ${c.templateKey} missing`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const el = React.createElement(tmpl.component as any, { proName: c.proName });
  const html = await render(el);
  const text = await render(el, { plainText: true });
  const subject = typeof tmpl.subject === "function" ? tmpl.subject({}) : tmpl.subject;

  const idempotencyKey = `onboarding:${c.userId}:${c.stage}:${c.nextStep}`;

  const result = await sendViaMailgun({
    to: c.email,
    subject,
    html,
    text,
    templateName: c.templateKey,
    idempotencyKey,
  });

  if (result.ok) {
    await supabaseAdmin
      .from("onboarding_nudges")
      .insert({
        user_id: c.userId,
        stage: c.stage,
        step: c.nextStep,
        message_id: result.mailgunId ?? idempotencyKey,
      })
      .then(() => null, () => null);
  }

  return { ok: result.ok, error: result.error, mailgunId: result.mailgunId };
}

export const getOnboardingCohortStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Live counts from a single SQL query for accuracy.
    const { data, error } = await supabaseAdmin.rpc(
      // We reuse the resolver per-row via a simple aggregation query.
      // If perf becomes a problem later we can materialise.
      "get_onboarding_cohort_counts" as never,
    );
    if (!error && data) return data as Record<string, number>;

    // Fallback: JS-side aggregation using resolveCandidates surface.
    const cands = await resolveCandidates();
    const dueByStage: Record<string, number> = {};
    for (const c of cands) dueByStage[c.stage] = (dueByStage[c.stage] ?? 0) + 1;

    // Also count last-7-day sends.
    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: recent } = await supabaseAdmin
      .from("onboarding_nudges")
      .select("stage, step, sent_at")
      .gte("sent_at", since);
    const sentLast7ByStage: Record<string, number> = {};
    for (const r of recent ?? []) {
      sentLast7ByStage[String(r.stage)] = (sentLast7ByStage[String(r.stage)] ?? 0) + 1;
    }

    return {
      dueToday: dueByStage,
      sentLast7: sentLast7ByStage,
    } as unknown as Record<string, number>;
  });

export const dryRunOnboardingNudges = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const cands = await resolveCandidates();
    return {
      total: cands.length,
      byStage: cands.reduce<Record<string, number>>((acc, c) => {
        acc[c.stage] = (acc[c.stage] ?? 0) + 1;
        return acc;
      }, {}),
      sample: cands.slice(0, 20).map((c) => ({
        email: maskEmail(c.email),
        stage: c.stage,
        step: c.nextStep,
        daysInStage: c.daysInStage,
        templateKey: c.templateKey,
      })),
    };
  });

export const triggerOnboardingNudges = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ limit: z.number().int().min(1).max(200).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    return runOnboardingNudges({ limit: data.limit ?? 100 });
  });

/** Internal — called both by the admin trigger and the cron route. */
export async function runOnboardingNudges({ limit }: { limit: number }) {
  const cands = await resolveCandidates();
  const slice = cands.slice(0, limit);
  const results: Array<{ email: string; ok: boolean; error?: string; stage: string; step: number }> = [];
  for (const c of slice) {
    try {
      const r = await renderAndSend(c);
      results.push({ email: maskEmail(c.email), ok: r.ok, error: r.error, stage: c.stage, step: c.nextStep });
    } catch (e) {
      results.push({
        email: maskEmail(c.email),
        ok: false,
        error: e instanceof Error ? e.message : String(e),
        stage: c.stage,
        step: c.nextStep,
      });
    }
  }
  return {
    total: cands.length,
    processed: slice.length,
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    remaining: Math.max(0, cands.length - slice.length),
    firstErrors: results.filter((r) => !r.ok).slice(0, 10),
  };
}

function maskEmail(e: string): string {
  const [u, d] = e.split("@");
  if (!u || !d) return e;
  const head = u.length <= 2 ? u : `${u.slice(0, 2)}…`;
  return `${head}@${d}`;
}
