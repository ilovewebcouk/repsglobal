// Shared pricing & forecast helpers for admin billing pages.
// Pure utility — no server-fn imports, safe to use anywhere.
//
// Tier ladder (locked):
//   Core     — £34 / year (annual ONLY, no monthly option) — internal key: "verified"
//   Pro      — £59 / month
//   Studio   — £149 / month
//
// Never display a monthly equivalent for Core in the UI.


export type Tier = "verified" | "pro" | "studio" | "training_provider";
export type BillingPeriod = "monthly" | "annual";
export type BillingEnv = "sandbox" | "live";

export const TIER_PRICE_PENCE: Record<Tier, number> = {
  verified: 3400,
  pro: 5900,
  studio: 14900,
  training_provider: 47900,
};

/** Annual price in pence for tiers sold annually (Pro Founding annual = £590; TP annual = £479). */
export const TIER_ANNUAL_PRICE_PENCE: Partial<Record<Tier, number>> = {
  verified: 3400,
  pro: 59000,
  training_provider: 47900,
};

export const TIER_CADENCE_MONTHS: Record<Tier, number> = {
  verified: 12,
  pro: 1,
  studio: 1,
  training_provider: 12,
};

export const TIER_LABEL: Record<Tier, string> = {
  verified: "Core",
  pro: "Pro",
  studio: "Studio",
  training_provider: "Training Provider",
};

/** Single-payment amount (in pence) for one renewal cycle of `tier`. */
export function paymentPence(tier: string): number {
  if (tier === "verified") return TIER_PRICE_PENCE.verified;
  if (tier === "pro") return TIER_PRICE_PENCE.pro;
  if (tier === "studio") return TIER_PRICE_PENCE.studio;
  if (tier === "training_provider") return TIER_PRICE_PENCE.training_provider;
  return 0;
}

/** Period-aware single-payment amount (in pence). Annual Pro = £590, not £59. */
export function paymentPenceFor(tier: string, period: BillingPeriod | null | undefined): number {
  if (tier === "verified") return TIER_PRICE_PENCE.verified;
  if (tier === "pro") {
    return period === "annual" ? TIER_ANNUAL_PRICE_PENCE.pro! : TIER_PRICE_PENCE.pro;
  }
  if (tier === "studio") return TIER_PRICE_PENCE.studio;
  if (tier === "training_provider") return TIER_PRICE_PENCE.training_provider;
  return 0;
}

/** Annual run-rate (in pence) contributed by one active subscription of `tier`. */
export function annualPence(tier: string): number {
  if (tier === "verified") return TIER_PRICE_PENCE.verified;
  if (tier === "pro") return TIER_PRICE_PENCE.pro * 12;
  if (tier === "studio") return TIER_PRICE_PENCE.studio * 12;
  if (tier === "training_provider") return TIER_PRICE_PENCE.training_provider;
  return 0;
}

/** Period-aware annual run-rate. Annual rows use their annual price; monthly = ×12. */
export function annualPenceFor(tier: string, period: BillingPeriod | null | undefined): number {
  if (tier === "verified") return TIER_PRICE_PENCE.verified;
  if (tier === "pro") {
    return period === "annual" ? TIER_ANNUAL_PRICE_PENCE.pro! : TIER_PRICE_PENCE.pro * 12;
  }
  if (tier === "studio") return TIER_PRICE_PENCE.studio * 12;
  if (tier === "training_provider") return TIER_PRICE_PENCE.training_provider;
  return 0;
}

/** Months between consecutive renewals, given the tier and billing period. */
export function cadenceMonthsFor(tier: string, period: BillingPeriod | null | undefined): number {
  if (tier === "verified") return 12;
  if (tier === "pro") return period === "annual" ? 12 : 1;
  if (tier === "studio") return 1;
  if (tier === "training_provider") return 12;
  return 12;
}

export function isPaidTier(t: string): t is Tier {
  return t === "verified" || t === "pro" || t === "studio" || t === "training_provider";
}

/** Server-side billing env selector. Defaults to live; sandbox is opt-in via BILLING_ENV=sandbox. */
export function currentBillingEnv(): BillingEnv {
  const v = (process.env.BILLING_ENV ?? "").toLowerCase();
  return v === "sandbox" ? "sandbox" : "live";
}

// -- Europe/London date helpers -------------------------------------------------

const LONDON_TZ = "Europe/London";

/** Returns the {year, month (1-12), day} of `d` in Europe/London. */
export function londonParts(d: Date): { y: number; m: number; day: number } {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
  return { y: Number(parts.year), m: Number(parts.month), day: Number(parts.day) };
}

/** "YYYY-MM" key in Europe/London for grouping forecast rows. */
export function londonMonthKey(d: Date): string {
  const { y, m } = londonParts(d);
  return `${y}-${String(m).padStart(2, "0")}`;
}

/** Add N whole months to a YYYY-MM-01 date (UTC arithmetic — month-key safe). */
export function addMonths(yyyymm: string, months: number): string {
  const [yStr, mStr] = yyyymm.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const total = y * 12 + (m - 1) + months;
  const newY = Math.floor(total / 12);
  const newM = (total % 12) + 1;
  return `${newY}-${String(newM).padStart(2, "0")}`;
}

/** Quarter label ("Q1 2026") for a YYYY-MM key. */
export function quarterFor(yyyymm: string): { quarter: number; year: number; label: string } {
  const [y, m] = yyyymm.split("-").map(Number);
  const q = Math.ceil(m / 3);
  return { quarter: q, year: y, label: `Q${q} ${y}` };
}

/** ISO date N days from now (UTC instant — fine for "next 14 days" windows). */
export function daysFromNow(days: number, from: Date = new Date()): Date {
  return new Date(from.getTime() + days * 86400 * 1000);
}

/** Format a "YYYY-MM" key for display ("Jun 2026"). */
export function formatMonthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: LONDON_TZ });
}

/** GBP pence → "£1,234". */
export function gbp(pence: number): string {
  return "£" + (pence / 100).toLocaleString("en-GB", { maximumFractionDigits: 0 });
}

/** GBP pence → "£1,234.56". */
export function gbpExact(pence: number): string {
  return "£" + (pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
