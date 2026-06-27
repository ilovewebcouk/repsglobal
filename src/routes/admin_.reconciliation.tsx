import { Fragment, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { requireRole } from "@/lib/route-gates";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard } from "@/components/dashboard/primitives";
import { Badge } from "@/components/ui/badge";
import { PeriodSelector } from "@/components/admin/PeriodSelector";
import {
  resolvePeriod,
  PERIOD_OPTIONS,
  type PeriodKey,
} from "@/lib/admin/overview-period";
import {
  getRevenueReconciliation,
  getRegistrationsReconciliation,
  getForecastReconciliation,
  getGrowthReconciliation,
  getActiveMembersReconciliation,
  type RevenueRow,
  type RevenueReportDTO,
  type RegistrationReportDTO,
  type ForecastReportDTO,
  type GrowthReportDTO,
  type ActiveMembersReportDTO,
} from "@/lib/admin/reconciliation.functions";
import {
  listPaymentFailedSubs,
  recoverPaymentFailedSub,
  type PaymentFailedSubRow,
} from "@/lib/admin/payment-recovery.functions";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";


import {
  FORECAST_HORIZON_OPTIONS,
  type ForecastHorizon,
} from "@/lib/admin/metrics-definitions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "@tanstack/react-router";

const searchSchema = z.object({
  period: fallback(
    z.enum([
      "today",
      "yesterday",
      "last_7d",
      "last_30d",
      "mtd",
      "prev_month",
      "qtd",
      "ytd",
      "custom",
    ]),
    "yesterday",
  ).default("yesterday"),
  from: z.string().optional(),
  to: z.string().optional(),
  fcast: fallback(
    z.enum([
      "remaining_this_month",
      "next_month",
      "next_30d",
      "current_quarter",
      "current_year",
      "custom",
    ]),
    "next_30d",
  ).default("next_30d"),
  fcastFrom: z.string().optional(),
  fcastTo: z.string().optional(),
});

export const Route = createFileRoute("/admin_/reconciliation")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "KPI Reconciliation — REPS Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ReconciliationPage,
});

function fmtPounds(pence: number | null | undefined) {
  if (!pence) return "£0.00";
  return "£" + (pence / 100).toFixed(2);
}

function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function ReconciliationPage() {
  const { period, from, to, fcast, fcastFrom, fcastTo } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/reconciliation" });
  const range = resolvePeriod(period, { from, to });
  const periodLabel =
    PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? period;

  const revFn = useServerFn(getRevenueReconciliation);
  const memFn = useServerFn(getActiveMembersReconciliation);
  const regFn = useServerFn(getRegistrationsReconciliation);
  const fcastFn = useServerFn(getForecastReconciliation);
  const growthFn = useServerFn(getGrowthReconciliation);

  const revenue = useQuery({
    queryKey: ["admin-recon", "revenue", range.from, range.to],
    queryFn: () => revFn({ data: { from: range.from, to: range.to } }),
  });
  const members = useQuery({
    queryKey: ["admin-recon", "active-members"],
    queryFn: () => memFn(),
  });
  const regs = useQuery({
    queryKey: ["admin-recon", "regs", range.from, range.to],
    queryFn: () => regFn({ data: { from: range.from, to: range.to } }),
  });
  const forecast = useQuery({
    queryKey: ["admin-recon", "forecast", fcast, fcastFrom ?? "", fcastTo ?? ""],
    queryFn: () =>
      fcastFn({
        data: { horizon: fcast, from: fcastFrom, to: fcastTo },
      }),
  });
  const growth = useQuery({
    queryKey: ["admin-recon", "growth", range.from, range.to],
    queryFn: () => growthFn({ data: { from: range.from, to: range.to } }),
  });

  const paymentFailedFn = useServerFn(listPaymentFailedSubs);
  const paymentFailed = useQuery({
    queryKey: ["admin-recon", "payment-failed"],
    queryFn: () => paymentFailedFn(),
  });



  return (
    <DashboardShell
      role="admin"
      active="Overview"
      title="KPI reconciliation"
      subtitle={`Raw rows behind every /admin KPI. Every excluded row carries a reason. Period: ${periodLabel} (${range.from} → ${range.to}).`}
      actions={<PeriodSelector value={period} />}
    >
      <div className="space-y-6">
        <PCard>
          <div className="text-[12px] text-white/55">
            This page is read-only. Numbers shown here are derived by
            <em> replaying the exact predicates </em>
            in <code>src/lib/admin/overview.functions.ts</code>. If the
            footers below don't match the dashboard tiles, the bug is in the
            shared predicate — fix that in a separate task and do not patch
            the dashboard from this page.
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-[12px]">
            <Link
              to="/admin"
              search={{ period }}
              className="underline text-reps-orange"
            >
              ← Back to /admin
            </Link>
            <a href="#revenue" className="text-white/70 hover:text-white">
              Revenue
            </a>
            <a href="#forecast" className="text-white/70 hover:text-white">
              Forecast
            </a>
            <a href="#members" className="text-white/70 hover:text-white">
              Members
            </a>
            <a href="#payment-failed" className="text-white/70 hover:text-white">
              Payment failed
            </a>
            <a href="#registrations" className="text-white/70 hover:text-white">
              Registrations
            </a>
            <a href="#growth" className="text-white/70 hover:text-white">
              Net growth

            </a>
          </div>
        </PCard>

        {/* ---- Revenue --------------------------------------------------- */}
        <section id="revenue" className="scroll-mt-24">
          <PCard>
            <SectionHeader
              title="Revenue reconciliation"
              total={
                revenue.data
                  ? `${fmtPounds(revenue.data.total_revenue_pence)} dashboard total`
                  : "loading…"
              }
            />
            {revenue.isLoading ? (
              <Loading />
            ) : revenue.error ? (
              <ErrorBox e={revenue.error} />
            ) : revenue.data ? (
              <RevenueTable data={revenue.data} />
            ) : null}
          </PCard>
        </section>

        {/* ---- Forecast -------------------------------------------------- */}
        <section id="forecast" className="scroll-mt-24">
          <PCard>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">
                Forecast horizon (independent of historical period)
              </div>
              <Select
                value={fcast}
                onValueChange={(v) =>
                  navigate({
                    search: (prev: Record<string, unknown>) => ({
                      ...prev,
                      fcast: v as ForecastHorizon,
                    }),
                  })
                }
              >
                <SelectTrigger className="h-7 w-[180px] rounded-[6px] border border-white/10 bg-white/[0.03] px-2 text-[12px] text-white/75">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-[10px]">
                  {FORECAST_HORIZON_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-[12px]">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <SectionHeader
              title="Projected cash due reconciliation"
              total={
                forecast.data
                  ? `${fmtPounds(forecast.data.total_forecast_pence)} dashboard total`
                  : "loading…"
              }
              sub={
                forecast.data
                  ? `Window: ${forecast.data.window.from} → ${forecast.data.window.to}. Three sources, deduplicated: (1) active live subscriptions due to renew; (2) legacy_stripe_link.access_expires_at within window; (3) bd_member_seed.bd_next_due_date within window. Stripe is not called.`
                  : "Independent horizon — never reuses the historical period."
              }
            />
            {forecast.isLoading ? (
              <Loading />
            ) : forecast.error ? (
              <ErrorBox e={forecast.error} />
            ) : forecast.data ? (
              <ForecastTables data={forecast.data} />
            ) : null}
          </PCard>
        </section>

        {/* ---- Net Member Growth ---------------------------------------- */}
        <section id="growth" className="scroll-mt-24">
          <PCard>
            <SectionHeader
              title="Net member growth reconciliation"
              total={
                growth.data
                  ? `${growth.data.net_growth >= 0 ? "+" : ""}${growth.data.net_growth} net · ${growth.data.joined_total} joined · ${growth.data.churned_total} churned`
                  : "loading…"
              }
              sub="Joined = users whose FIRST live paid subscription was created inside the window. Churned = users whose latest churn_lifecycle stage entered a terminal state (lapsed/dormant) inside the window. Net = joined − churned."
            />
            {growth.isLoading ? (
              <Loading />
            ) : growth.error ? (
              <ErrorBox e={growth.error} />
            ) : growth.data ? (
              <GrowthTables data={growth.data} />
            ) : null}
          </PCard>
        </section>

        {/* ---- Active Paying Members ------------------------------------ */}
        <section id="members" className="scroll-mt-24">
          <PCard>
            <SectionHeader
              title="Active members reconciliation"
              total={
                members.data
                  ? `${members.data.counts.final_active_members.toLocaleString()} active`
                  : "loading…"
              }
              sub="Canonical Active Paying Member collection from src/lib/members/active-paying-member.ts. Unions live Stripe subscriptions, legacy_stripe_link, and bd_member_seed; deduplicates by user_id → claimed_user_id → email → bd_member_id. This number must match the Active Members tile on /admin exactly."
            />
            {members.isLoading ? (
              <Loading />
            ) : members.error ? (
              <ErrorBox e={members.error} />
            ) : members.data ? (
              <ActiveMembersView data={members.data} />
            ) : null}
          </PCard>
        </section>

        {/* ---- Payment failed / incomplete ------------------------------ */}
        <section id="payment-failed" className="scroll-mt-24">
          <PCard>
            <SectionHeader
              title="Payment failed / incomplete"
              total={
                paymentFailed.data
                  ? `${paymentFailed.data.length} subs needing recovery`
                  : "loading…"
              }
              sub="Live Stripe subscriptions stuck in incomplete / past_due / unpaid. These members were charged but the payment failed — they silently drop out of the Active Members count. Use 'Send recovery email' to enrol them in the churn lifecycle and mint a single-use card-update link."
            />
            {paymentFailed.isLoading ? (
              <Loading />
            ) : paymentFailed.error ? (
              <ErrorBox e={paymentFailed.error} />
            ) : paymentFailed.data ? (
              <PaymentFailedTable rows={paymentFailed.data} />
            ) : null}
          </PCard>
        </section>

        {/* ---- Registrations -------------------------------------------- */}

        <section id="registrations" className="scroll-mt-24">
          <PCard>
            <SectionHeader
              title="Registrations reconciliation"
              total={
                regs.data
                  ? `${regs.data.total_registrations} dashboard total`
                  : "loading…"
              }
              sub="Counts users whose FIRST live paid subscription was created inside the selected window."
            />
            {regs.isLoading ? (
              <Loading />
            ) : regs.error ? (
              <ErrorBox e={regs.error} />
            ) : regs.data ? (
              <RegistrationsTable rows={regs.data.rows} total={regs.data.total_registrations} />
            ) : null}
          </PCard>
        </section>
      </div>
    </DashboardShell>
  );
}

function SectionHeader({
  title,
  total,
  sub,
}: {
  title: string;
  total: string;
  sub?: string;
}) {
  return (
    <div className="mb-4 border-b border-white/10 pb-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-[20px] font-semibold text-white">
          {title}
        </h2>
        <span className="text-[13px] text-reps-orange">{total}</span>
      </div>
      {sub ? <div className="mt-1 text-[12px] text-white/55">{sub}</div> : null}
    </div>
  );
}

function Loading() {
  return <div className="py-6 text-center text-white/55 text-[12px]">Loading…</div>;
}
function ErrorBox({ e }: { e: unknown }) {
  return (
    <div className="rounded-[10px] border border-red-400/30 bg-red-500/10 p-3 text-[12px] text-red-200">
      {e instanceof Error ? e.message : "Failed to load"}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Revenue table
// ---------------------------------------------------------------------------

function RevenueTable({ data }: { data: RevenueReportDTO }) {
  if (data.groups.length === 0) {
    return (
      <div className="py-6 text-center text-white/55 text-[12px]">
        No payment_events rows in this window.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead className="text-left text-white/55">
            <tr>
              <th className="py-2 pr-3">In?</th>
              <th className="py-2 pr-3">Created (London)</th>
              <th className="py-2 pr-3">Event type</th>
              <th className="py-2 pr-3">Stripe IDs</th>
              <th className="py-2 pr-3 text-right">amount_paid</th>
              <th className="py-2 pr-3 text-right">amount</th>
              <th className="py-2 pr-3 text-right">refunded</th>
              <th className="py-2 pr-3 text-right">Used by dashboard</th>
              <th className="py-2 pr-3">Reason</th>
            </tr>
          </thead>
          <tbody>
            {data.groups.map((g) => (
              <Fragment key={g.payment_key}>
                <tr className="border-t border-white/10 bg-white/[0.02]">
                  <td colSpan={9} className="py-2 pr-3 text-[11px] text-white/55">
                    Group <code>{g.payment_key}</code> · canonical {fmtPounds(g.canonical_amount)}
                  </td>
                </tr>
                {g.rows.map((r) => (
                  <RevenueRowView key={r.id} r={r} />
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px]">
        <Footer label="Raw events" value={String(data.raw_event_count)} />
        <Footer
          label="Distinct stripe_event_id"
          value={String(data.distinct_event_count)}
        />
        <Footer
          label="Revenue total"
          value={fmtPounds(data.total_revenue_pence)}
          accent
        />
      </div>
    </div>
  );
}

function RevenueRowView({ r }: { r: RevenueRow }) {
  return (
    <tr
      className={`border-t border-white/5 ${r.included_in_total ? "" : "text-white/40"}`}
    >
      <td className="py-2 pr-3">
        {r.included_in_total ? (
          <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
            ✓
          </Badge>
        ) : (
          <Badge className="bg-zinc-500/15 text-zinc-300 border border-zinc-400/30">
            ✕
          </Badge>
        )}
      </td>
      <td className="py-2 pr-3 whitespace-nowrap">{fmtDateTime(r.created_at)}</td>
      <td className="py-2 pr-3">
        {r.event_type}
        {r.livemode === false ? (
          <Badge className="ml-1 bg-amber-500/15 text-amber-300 border border-amber-400/30 text-[10px]">
            test
          </Badge>
        ) : null}
      </td>
      <td className="py-2 pr-3 font-mono text-[10px] leading-tight">
        <div>evt: {r.stripe_event_id ?? "—"}</div>
        {r.invoice_id ? <div>inv: {r.invoice_id}</div> : null}
        {r.payment_intent ? <div>pi: {r.payment_intent}</div> : null}
        {r.charge_id ? <div>ch: {r.charge_id}</div> : null}
        {r.customer_id ? <div>cus: {r.customer_id}</div> : null}
        {r.subscription_id ? <div>sub: {r.subscription_id}</div> : null}
      </td>
      <td className="py-2 pr-3 text-right">{fmtPounds(r.amount_paid)}</td>
      <td className="py-2 pr-3 text-right">{fmtPounds(r.amount)}</td>
      <td className="py-2 pr-3 text-right">
        {r.refunded ? "fully" : fmtPounds(r.amount_refunded)}
      </td>
      <td className="py-2 pr-3 text-right font-semibold">
        {fmtPounds(r.calculated_amount_used_by_dashboard)}
      </td>
      <td className="py-2 pr-3 text-white/55">{r.exclusion_reason ?? ""}</td>
    </tr>
  );
}

function Footer({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[10px] border border-white/10 bg-white/[0.02] p-3">
      <div className="text-[11px] text-white/55">{label}</div>
      <div
        className={`mt-1 font-display text-[18px] font-bold ${accent ? "text-reps-orange" : "text-white"}`}
      >
        {value}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Active Paying Members view
// ---------------------------------------------------------------------------

function ActiveMembersView({ data }: { data: ActiveMembersReportDTO }) {
  const c = data.counts;
  const lines: Array<[string, number]> = [
    ["Stripe subscriptions", c.stripe_subscriptions],
    ["Legacy members", c.legacy_members],
    ["BD migrated members", c.bd_migrated_members],

    ["Duplicates removed", c.duplicates_removed],
    ["Final Active Members", c.final_active_members],
  ];
  const [sourceFilter, setSourceFilter] = useState<
    "all" | "subscription" | "legacy_link" | "bd_seed"
  >("all");
  const [showExcluded, setShowExcluded] = useState(true);

  const rows = data.rawRows.filter((r) => {
    if (sourceFilter !== "all" && r.source !== sourceFilter) return false;
    if (!showExcluded && !r.included_in_total) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-white/10 bg-white/[0.02] p-4 font-mono text-[13px] text-white/85">
        {lines.map(([label, val], i) => (
          <div
            key={label}
            className={`flex items-baseline justify-between gap-4 ${
              i === lines.length - 1
                ? "mt-2 border-t border-white/10 pt-2 text-white"
                : ""
            }`}
          >
            <span>{label}</span>
            <span className="tabular-nums">{val.toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[12px]">
        <span className="text-white/55">Filter:</span>
        {(
          [
            ["all", "All sources"],
            ["subscription", "Subscriptions"],
            ["legacy_link", "Legacy links"],
            ["bd_seed", "BD seeds"],
          ] as const
        ).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setSourceFilter(val)}
            className={`rounded border px-2 py-1 ${
              sourceFilter === val
                ? "border-white/30 bg-white/10 text-white"
                : "border-white/10 text-white/60 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-white/65">
          <input
            type="checkbox"
            checked={showExcluded}
            onChange={(e) => setShowExcluded(e.target.checked)}
          />
          Show excluded rows
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead className="text-left text-white/55">
            <tr>
              <th className="py-2 pr-3">In?</th>
              <th className="py-2 pr-3">Source</th>
              <th className="py-2 pr-3">Identity</th>
              <th className="py-2 pr-3">Tier</th>
              <th className="py-2 pr-3">Status / Expiry</th>
              <th className="py-2 pr-3">Merged into</th>
              <th className="py-2 pr-3">Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const reason =
                r.exclusion_reason ??
                r.merge_reason ??
                (r.included_in_total ? "primary" : "");
              return (
                <tr
                  key={`${r.source}:${r.source_row_id}`}
                  className={`border-t border-white/5 ${
                    r.included_in_total ? "" : "text-white/40"
                  }`}
                >
                  <td className="py-2 pr-3">
                    {r.included_in_total ? "✓" : "✕"}
                  </td>
                  <td className="py-2 pr-3">{r.source}</td>
                  <td className="py-2 pr-3">
                    <div>{r.email ?? "—"}</div>
                    <div className="font-mono text-[10px] text-white/45">
                      {r.user_id ?? r.bd_member_id ?? r.source_row_id}
                    </div>
                  </td>
                  <td className="py-2 pr-3">{r.tier ?? "—"}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {r.status_or_window ?? "—"}
                  </td>
                  <td className="py-2 pr-3 font-mono text-[10px]">
                    {r.merged_into_member_id ?? ""}
                  </td>
                  <td className="py-2 pr-3 text-white/55">{reason}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Footer
        label="Final Active Members"
        value={String(c.final_active_members)}
        accent
      />
    </div>
  );
}


// ---------------------------------------------------------------------------
// Registrations table
// ---------------------------------------------------------------------------

function RegistrationsTable({
  rows,
  total,
}: {
  rows: RegistrationReportDTO["rows"];
  total: number;
}) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead className="text-left text-white/55">
            <tr>
              <th className="py-2 pr-3">In?</th>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Profile created</th>
              <th className="py-2 pr-3">Email confirmed</th>
              <th className="py-2 pr-3">First paid sub</th>
              <th className="py-2 pr-3">Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.user_id}
                className={`border-t border-white/5 ${r.included_in_registration_count ? "" : "text-white/40"}`}
              >
                <td className="py-2 pr-3">
                  {r.included_in_registration_count ? "✓" : "✕"}
                </td>
                <td className="py-2 pr-3">{r.email ?? "—"}</td>
                <td className="py-2 pr-3 whitespace-nowrap">{fmtDateTime(r.profile_created_at)}</td>
                <td className="py-2 pr-3 whitespace-nowrap">{fmtDateTime(r.email_confirmed_at)}</td>
                <td className="py-2 pr-3 whitespace-nowrap">{fmtDateTime(r.first_paid_subscription_at)}</td>
                <td className="py-2 pr-3 text-white/55">{r.exclusion_reason ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Footer label="Total registrations" value={String(total)} accent />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Forecast tables
// ---------------------------------------------------------------------------

function ForecastTables({ data }: { data: ForecastReportDTO }) {
  const tierLine = Object.entries(data.tier_pricing_pence)
    .map(([t, p]) => `${t} ${fmtPounds(p)}`)
    .join(" · ");
  return (
    <div className="space-y-6">
      <div className="rounded-[10px] border border-white/10 bg-white/[0.02] p-3 text-[12px] text-white/70">
        Window: <code>{data.window.from}</code> → <code>{data.window.to}</code>
        <br />
        Tier renewal pricing used: <span className="text-white">{tierLine}</span>
      </div>

      <div>
        <div className="mb-2 text-[13px] font-semibold text-white">
          Subscriptions renewing in window
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="text-left text-white/55">
              <tr>
                <th className="py-2 pr-3">In?</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Tier</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Env</th>
                <th className="py-2 pr-3">current_period_end</th>
                <th className="py-2 pr-3 text-right">Forecast</th>
                <th className="py-2 pr-3">Reason</th>
              </tr>
            </thead>
            <tbody>
              {data.subs.map((r) => (
                <tr
                  key={r.subscription_id}
                  className={`border-t border-white/5 ${r.included_in_forecast ? "" : "text-white/40"}`}
                >
                  <td className="py-2 pr-3">
                    {r.included_in_forecast ? "✓" : "✕"}
                  </td>
                  <td className="py-2 pr-3">{r.email ?? "—"}</td>
                  <td className="py-2 pr-3">{r.tier}</td>
                  <td className="py-2 pr-3">{r.status}</td>
                  <td className="py-2 pr-3">{r.environment}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {fmtDateTime(r.current_period_end)}
                  </td>
                  <td className="py-2 pr-3 text-right font-semibold">
                    {fmtPounds(r.forecast_amount_pence)}
                  </td>
                  <td className="py-2 pr-3 text-white/55">
                    {r.exclusion_reason ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="mb-2 text-[13px] font-semibold text-white">
          Legacy Stripe links renewing in window
        </div>
        <div className="mb-2 text-[11px] text-white/55">
          Source the renewal cron uses to charge £{(data.legacy_amount_pence / 100).toFixed(0)} on
          access_expires_at. Deduped against active subscriptions.
        </div>
        {data.links.length === 0 ? (
          <div className="py-3 text-[12px] text-white/55">
            No legacy_stripe_link rows considered.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="text-left text-white/55">
                <tr>
                  <th className="py-2 pr-3">In?</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">bd_member_id</th>
                  <th className="py-2 pr-3">stripe_customer_id</th>
                  <th className="py-2 pr-3">access_expires_at</th>
                  <th className="py-2 pr-3 text-right">Forecast</th>
                  <th className="py-2 pr-3">Reason</th>
                </tr>
              </thead>
              <tbody>
                {data.links.map((r, i) => (
                  <tr
                    key={`${r.bd_member_id ?? "x"}-${i}`}
                    className={`border-t border-white/5 ${r.included_in_forecast ? "" : "text-white/40"}`}
                  >
                    <td className="py-2 pr-3">
                      {r.included_in_forecast ? "✓" : "✕"}
                    </td>
                    <td className="py-2 pr-3">{r.email ?? "—"}</td>
                    <td className="py-2 pr-3 font-mono text-[10px]">
                      {r.bd_member_id ?? "—"}
                    </td>
                    <td className="py-2 pr-3 font-mono text-[10px]">
                      {r.stripe_customer_id ?? "—"}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {fmtDateTime(r.access_expires_at)}
                    </td>
                    <td className="py-2 pr-3 text-right font-semibold">
                      {fmtPounds(r.forecast_amount_pence)}
                    </td>
                    <td className="py-2 pr-3 text-white/55">
                      {r.exclusion_reason ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 text-[13px] font-semibold text-white">
          BD member seeds (unlinked anniversaries)
        </div>
        <div className="mb-2 text-[11px] text-white/55">
          Catches members whose anniversary falls in the window but who aren't
          already counted via an active subscription or legacy Stripe link.
        </div>
        {data.seeds.length === 0 ? (
          <div className="py-3 text-[12px] text-white/55">
            No bd_member_seed rows considered.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="text-left text-white/55">
                <tr>
                  <th className="py-2 pr-3">In?</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">bd_member_id</th>
                  <th className="py-2 pr-3">claimed_user_id</th>
                  <th className="py-2 pr-3">bd_next_due_date</th>
                  <th className="py-2 pr-3 text-right">Forecast</th>
                  <th className="py-2 pr-3">Reason</th>
                </tr>
              </thead>
              <tbody>
                {data.seeds.map((r, i) => (
                  <tr
                    key={`${r.bd_member_id ?? "x"}-${i}`}
                    className={`border-t border-white/5 ${r.included_in_forecast ? "" : "text-white/40"}`}
                  >
                    <td className="py-2 pr-3">
                      {r.included_in_forecast ? "✓" : "✕"}
                    </td>
                    <td className="py-2 pr-3">{r.email ?? "—"}</td>
                    <td className="py-2 pr-3 font-mono text-[10px]">
                      {r.bd_member_id ?? "—"}
                    </td>
                    <td className="py-2 pr-3 font-mono text-[10px]">
                      {r.claimed_user_id ?? "—"}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {fmtDateTime(r.bd_next_due_date)}
                    </td>
                    <td className="py-2 pr-3 text-right font-semibold">
                      {fmtPounds(r.forecast_amount_pence)}
                    </td>
                    <td className="py-2 pr-3 text-white/55">
                      {r.exclusion_reason ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-[12px]">
        <Footer
          label="Subscriptions subtotal"
          value={fmtPounds(data.subs_total_pence)}
        />
        <Footer
          label="Legacy links subtotal"
          value={fmtPounds(data.links_total_pence)}
        />
        <Footer
          label="Seeds subtotal"
          value={fmtPounds(data.seeds_total_pence)}
        />
        <Footer
          label="Forecast total"
          value={fmtPounds(data.total_forecast_pence)}
          accent
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Net Member Growth tables
// ---------------------------------------------------------------------------

function GrowthTables({ data }: { data: GrowthReportDTO }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 text-[12px] text-white/55">
          Joined inside window ({data.joined_total} included)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="text-left text-white/45">
              <tr>
                <th className="py-2 pr-3 font-medium">User</th>
                <th className="py-2 pr-3 font-medium">First paid sub</th>
                <th className="py-2 pr-3 font-medium">Tier</th>
                <th className="py-2 pr-3 font-medium">Counted?</th>
                <th className="py-2 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody>
              {data.joined.map((r) => (
                <tr key={`j-${r.user_id}`} className="border-t border-white/5">
                  <td className="py-2 pr-3 text-white/80">
                    {r.email ?? r.user_id}
                  </td>
                  <td className="py-2 pr-3 text-white/70">
                    {fmtDateTime(r.first_paid_subscription_at)}
                  </td>
                  <td className="py-2 pr-3 text-white/70">{r.tier ?? "—"}</td>
                  <td className="py-2 pr-3">
                    {r.included_in_joined ? (
                      <Badge className="bg-reps-green/15 text-reps-green">Yes</Badge>
                    ) : (
                      <Badge className="bg-white/10 text-white/55">No</Badge>
                    )}
                  </td>
                  <td className="py-2 text-white/55">
                    {r.exclusion_reason ?? "—"}
                  </td>
                </tr>
              ))}
              {data.joined.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-white/55">
                    No paid subscriptions on record.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="mb-2 text-[12px] text-white/55">
          Churned inside window ({data.churned_total} included)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="text-left text-white/45">
              <tr>
                <th className="py-2 pr-3 font-medium">User</th>
                <th className="py-2 pr-3 font-medium">Stage</th>
                <th className="py-2 pr-3 font-medium">Entered at</th>
                <th className="py-2 pr-3 font-medium">Counted?</th>
                <th className="py-2 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody>
              {data.churned.map((r) => (
                <tr key={`c-${r.user_id}`} className="border-t border-white/5">
                  <td className="py-2 pr-3 text-white/80">
                    {r.email ?? r.user_id}
                  </td>
                  <td className="py-2 pr-3 text-white/70">{r.stage ?? "—"}</td>
                  <td className="py-2 pr-3 text-white/70">
                    {fmtDateTime(r.entered_at)}
                  </td>
                  <td className="py-2 pr-3">
                    {r.included_in_churned ? (
                      <Badge className="bg-reps-orange/15 text-reps-orange">Yes</Badge>
                    ) : (
                      <Badge className="bg-white/10 text-white/55">No</Badge>
                    )}
                  </td>
                  <td className="py-2 text-white/55">
                    {r.exclusion_reason ?? "—"}
                  </td>
                </tr>
              ))}
              {data.churned.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-white/55">
                    No churn_lifecycle records yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PaymentFailedTable({ rows }: { rows: PaymentFailedSubRow[] }) {
  const qc = useQueryClient();
  const recoverFn = useServerFn(recoverPaymentFailedSub);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <div className="mt-4 rounded-[14px] border border-emerald-400/30 bg-emerald-500/10 p-4 text-[13px] text-emerald-200">
        No subscriptions stuck in incomplete / past_due / unpaid. Every paying member is fully active.
      </div>
    );
  }

  async function send(userId: string, tier: string) {
    setBusyId(userId);
    setMsg(null);
    try {
      const t = (tier === "pro" ? "pro" : "verified") as "verified" | "pro";
      const r = await recoverFn({ data: { user_id: userId, intended_tier: t } });
      setMsg(r.ok ? "Sent recovery email and enrolled in churn lifecycle." : `Failed: ${(r as { error?: string }).error ?? "unknown"}`);
      await qc.invalidateQueries({ queryKey: ["admin-recon", "payment-failed"] });
    } catch (e) {
      setMsg(`Failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      {msg ? (
        <div className="rounded-[10px] border border-white/15 bg-white/5 p-3 text-[12px] text-white/80">{msg}</div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="text-left text-white/55">
            <tr>
              <th className="py-2 pr-4">Member</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Tier</th>
              <th className="py-2 pr-4">Churn</th>
              <th className="py-2 pr-4">Nudges</th>
              <th className="py-2 pr-4">Stripe</th>
              <th className="py-2 pr-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.user_id} className="border-t border-white/10">
                <td className="py-2 pr-4">
                  <div className="font-medium text-white">{r.full_name ?? "—"}</div>
                  <div className="text-[11px] text-white/55">{r.email ?? r.user_id}</div>
                  {r.is_legacy_migration ? (
                    <Badge className="mt-1 border-amber-400/40 bg-amber-400/10 text-amber-200">BD migration</Badge>
                  ) : null}
                </td>
                <td className="py-2 pr-4">
                  <Badge className="border-rose-400/40 bg-rose-500/10 text-rose-200">{r.status}</Badge>
                </td>
                <td className="py-2 pr-4 text-white/80">{r.tier ?? "—"}</td>
                <td className="py-2 pr-4 text-white/80">{r.churn_stage ?? "—"}</td>
                <td className="py-2 pr-4 text-white/80">
                  {r.nudge_count}
                  {r.last_nudge_at ? (
                    <span className="ml-1 text-[11px] text-white/45">{fmtDateTime(r.last_nudge_at)}</span>
                  ) : null}
                  {r.renewal_token_active ? (
                    <Badge className="ml-2 border-emerald-400/30 bg-emerald-500/15 text-emerald-200">token live</Badge>
                  ) : null}
                </td>
                <td className="py-2 pr-4">
                  {r.stripe_customer_id ? (
                    <a
                      href={`https://dashboard.stripe.com/customers/${r.stripe_customer_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-reps-orange underline"
                    >
                      open
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2 pr-4 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === r.user_id}
                    onClick={() => send(r.user_id, r.tier ?? "verified")}
                  >
                    {busyId === r.user_id ? "Sending…" : "Send recovery email"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
