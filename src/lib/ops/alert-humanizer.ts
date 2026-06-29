// Operator-readable labels and summaries for ops alert kinds.
//
// The DB stores raw alert kinds like "payments.failed_active" with a JSON
// context blob. Operators see a humanised label, a one-line summary that
// explains *why it matters*, and a deep link to the page that owns the
// underlying records.
//
// New alert kinds MUST be added here in the same PR that adds them to
// `public.ops_alerts_evaluate()` — an alert with no humaniser entry will
// render with a generic fallback.

export interface HumanisedAlert {
  /** Short operator-facing label, e.g. "Failed payments rising". */
  label: string;
  /** One-line explanation of what happened and why it matters. */
  summary: string;
  /** Where to go to fix it. */
  href: string | null;
  /** Optional CTA label override (defaults to "Open"). */
  cta?: string;
}

type Ctx = Record<string, unknown>;

function n(ctx: Ctx, key: string): number {
  const v = ctx?.[key];
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const p = Number(v);
    if (Number.isFinite(p)) return p;
  }
  return 0;
}

const HUMANISERS: Record<string, (ctx: Ctx) => HumanisedAlert> = {
  "cron.failed": (ctx) => ({
    label: "Scheduled job failed",
    summary: `${n(ctx, "failures_24h")} cron run${n(ctx, "failures_24h") === 1 ? "" : "s"} failed in the last 24h — automated work is not running.`,
    href: "/admin/health",
    cta: "Open Platform Health",
  }),
  "webhook.dlq": (ctx) => ({
    label: "Stripe webhooks dead-lettered",
    summary: `${n(ctx, "dlq_7d")} webhook event${n(ctx, "dlq_7d") === 1 ? "" : "s"} in the last 7 days could not be processed. Members may be missing or stuck.`,
    href: "/admin/ops",
    cta: "Open Webhook Recovery",
  }),
  "webhook.stuck_processing": (ctx) => ({
    label: "Webhook events stuck",
    summary: `${n(ctx, "count")} payment event${n(ctx, "count") === 1 ? "" : "s"} have been pending processing for >15 minutes. The webhook pipeline is backed up.`,
    href: "/admin/ops/platform",
    cta: "Open Platform",
  }),
  "email.queue_backing_up": (ctx) => ({
    label: "Email queue backing up",
    summary: `${n(ctx, "queue_transactional")} transactional + ${n(ctx, "queue_auth")} auth emails queued — sends are falling behind.`,
    href: "/admin/ops/email",
    cta: "Open Email",
  }),
  "email.dlq": (ctx) => ({
    label: "Emails dead-lettered",
    summary: `${n(ctx, "dlq_7d")} email${n(ctx, "dlq_7d") === 1 ? "" : "s"} failed permanently in the last 7 days. Members did not get the message.`,
    href: "/admin/ops/email",
    cta: "Open Email",
  }),
  "payments.failed_active": (ctx) => ({
    label: "Failed payments",
    summary: `${n(ctx, "count")} member${n(ctx, "count") === 1 ? "" : "s"} ${n(ctx, "count") === 1 ? "is" : "are"} in a broken-card state (past_due / unpaid / incomplete) and ${n(ctx, "count") === 1 ? "is" : "are"} silently missing from Active paying members.`,
    href: "/admin/ops",
    cta: "Open Payment Recovery",
  }),
  "payments.failure_spike": (ctx) => ({
    label: "Payment failures spiking today",
    summary: `${n(ctx, "today")} payment failures today vs a 7-day avg of ${n(ctx, "avg_7d").toFixed(1)}. Something has changed — check Stripe, the gateway, or a release.`,
    href: "/admin/ops/billing",
    cta: "Open Billing Health",
  }),
  "payments.refund_spike": (ctx) => ({
    label: "Refunds spiking today",
    summary: `${n(ctx, "today")} refunds today (threshold: 3). Unusual — verify there is no operational mistake or fraud chargeback wave.`,
    href: "/admin/ops/billing",
    cta: "Open Billing Health",
  }),
  "test.notification": () => ({
    label: "Test alert",
    summary: "Manual test alert sent from the Alerts page. Safe to acknowledge.",
    href: "/admin/ops/alerts",
    cta: "Open Alerts",
  }),
};

/**
 * Convert a raw `ops_alerts` row into operator-facing copy.
 *
 * Returns a generic-but-honest fallback for unknown kinds rather than
 * exposing the raw enum or a JSON dump.
 */
export function humaniseAlert(kind: string, context: unknown): HumanisedAlert {
  const ctx = (context && typeof context === "object" ? (context as Ctx) : {}) as Ctx;
  const fn = HUMANISERS[kind];
  if (fn) return fn(ctx);
  return {
    label: kind.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    summary:
      "No humaniser registered for this alert kind. Add it to src/lib/ops/alert-humanizer.ts in the same PR that adds the alert.",
    href: "/admin/ops/alerts",
  };
}

export const KNOWN_ALERT_KINDS = Object.keys(HUMANISERS);
