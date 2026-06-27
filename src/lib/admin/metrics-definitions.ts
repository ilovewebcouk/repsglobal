// Canonical metric definitions — the SINGLE source of truth for /admin KPIs.
//
// Both `overview.functions.ts` (dashboard tiles) and `reconciliation.functions.ts`
// (row-level audit) MUST import constants and predicates from this file.
// Never re-implement tier/price/window/status logic anywhere else.
//
// Rules:
//   * One canonical definition per KPI.
//   * One source of truth per KPI (listed in plan).
//   * Historical vs forecast windows are *never* shared.

// --- Subscription predicates -------------------------------------------------
export const ACTIVE_STATUSES = ["active", "trialing"] as const;
export const COUNTED_TIERS = ["verified", "pro", "studio"] as const;

// Pro > Studio > Verified for "which sub represents the user"
// (higher rank wins on dedupe). Matches historical overview behaviour.
export const TIER_RANK: Record<string, number> = {
  studio: 3,
  pro: 2,
  verified: 1,
};

// --- Renewal pricing (forecast only) ----------------------------------------
// Pence per tier per renewal cycle. Mirrors src/lib/billing.ts.
export const TIER_RENEWAL_PENCE: Record<string, number> = {
  verified: 9900,
  pro: 5900,
  studio: 14900,
};

export const LEGACY_AMOUNT_PENCE = TIER_RENEWAL_PENCE.verified;

// --- Churn -------------------------------------------------------------------
// `churn_lifecycle.stage` values that represent "this user has churned".
// `lapsed` = subscription expired without renewal; `dormant` = long-term gone.
// `recovered`/`active` are explicit returns to good standing.
export const TERMINAL_CHURN_STAGES = ["lapsed", "dormant"] as const;

export type TerminalChurnStage = (typeof TERMINAL_CHURN_STAGES)[number];

export function isTerminalChurnStage(stage: string | null | undefined): boolean {
  return !!stage && (TERMINAL_CHURN_STAGES as readonly string[]).includes(stage);
}

// --- Forecast horizon --------------------------------------------------------
export type ForecastHorizon =
  | "remaining_this_month"
  | "next_month"
  | "next_30d"
  | "current_quarter"
  | "current_year"
  | "custom";

export const FORECAST_HORIZON_OPTIONS: {
  value: ForecastHorizon;
  label: string;
}[] = [
  { value: "remaining_this_month", label: "Remaining this month" },
  { value: "next_month", label: "Next month" },
  { value: "next_30d", label: "Next 30 days" },
  { value: "current_quarter", label: "Current quarter" },
  { value: "current_year", label: "Current year" },
  { value: "custom", label: "Custom range" },
];

// --- Revenue payment-row decision -------------------------------------------
// Used by both the overview totals and the reconciliation table.
// Returns the canonical amount this row contributes after dedupe-by-payment.
export type RevenueDecision = {
  paymentKey: string;
  /** 1 = invoice.payment_succeeded (preferred); 2 = charge.succeeded. */
  rank: number;
  /** Pence the row contributes if it wins its payment_key. 0 = excluded. */
  amount: number;
  /** Null when the row would be counted, otherwise the exclusion text. */
  excluded: string | null;
};

export const COUNTED_PAYMENT_EVENT_TYPES = new Set([
  "invoice.payment_succeeded",
  "charge.succeeded",
]);

export function asString(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}
