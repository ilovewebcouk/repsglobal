import { Fragment } from "react";
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
  getMembershipReconciliation,
  getRegistrationsReconciliation,
  getForecastReconciliation,
  type RevenueRow,
  type RevenueReportDTO,
  type MemberReportDTO,
  type RegistrationReportDTO,
  type ForecastReportDTO,
} from "@/lib/admin/reconciliation.functions";

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
  const { period, from, to } = Route.useSearch();
  const range = resolvePeriod(period, { from, to });
  const periodLabel =
    PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? period;

  const revFn = useServerFn(getRevenueReconciliation);
  const memFn = useServerFn(getMembershipReconciliation);
  const regFn = useServerFn(getRegistrationsReconciliation);
  const fcastFn = useServerFn(getForecastReconciliation);

  const revenue = useQuery({
    queryKey: ["admin-recon", "revenue", range.from, range.to],
    queryFn: () => revFn({ data: { from: range.from, to: range.to } }),
  });
  const members = useQuery({
    queryKey: ["admin-recon", "members"],
    queryFn: () => memFn(),
  });
  const regs = useQuery({
    queryKey: ["admin-recon", "regs", range.from, range.to],
    queryFn: () => regFn({ data: { from: range.from, to: range.to } }),
  });
  const forecast = useQuery({
    queryKey: ["admin-recon", "forecast"],
    queryFn: () => fcastFn(),
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
            <a href="#members" className="text-white/70 hover:text-white">
              Members
            </a>
            <a href="#registrations" className="text-white/70 hover:text-white">
              Registrations
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

        {/* ---- Members --------------------------------------------------- */}
        <section id="members" className="scroll-mt-24">
          <PCard>
            <SectionHeader
              title="Membership reconciliation"
              total={
                members.data
                  ? `${members.data.total_members} dashboard total`
                  : "loading…"
              }
              sub="Counts every distinct user whose live subscription is active or trialing in verified/pro/studio."
            />
            {members.isLoading ? (
              <Loading />
            ) : members.error ? (
              <ErrorBox e={members.error} />
            ) : members.data ? (
              <MembersTable rows={members.data.rows} total={members.data.total_members} />
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
// Members table
// ---------------------------------------------------------------------------

function MembersTable({
  rows,
  total,
}: {
  rows: MemberReportDTO["rows"];
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
              <th className="py-2 pr-3">Tier</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Env</th>
              <th className="py-2 pr-3">Created</th>
              <th className="py-2 pr-3">Current period end</th>
              <th className="py-2 pr-3">Cancel at end?</th>
              <th className="py-2 pr-3">Subscription</th>
              <th className="py-2 pr-3">Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.subscription_id}
                className={`border-t border-white/5 ${r.included_in_member_count ? "" : "text-white/40"}`}
              >
                <td className="py-2 pr-3">
                  {r.included_in_member_count ? "✓" : "✕"}
                </td>
                <td className="py-2 pr-3">{r.email ?? "—"}</td>
                <td className="py-2 pr-3">{r.tier}</td>
                <td className="py-2 pr-3">{r.status}</td>
                <td className="py-2 pr-3">{r.environment}</td>
                <td className="py-2 pr-3 whitespace-nowrap">{fmtDateTime(r.created_at)}</td>
                <td className="py-2 pr-3 whitespace-nowrap">{fmtDateTime(r.current_period_end)}</td>
                <td className="py-2 pr-3">{r.cancel_at_period_end ? "yes" : "no"}</td>
                <td className="py-2 pr-3 font-mono text-[10px]">{r.subscription_id}</td>
                <td className="py-2 pr-3 text-white/55">{r.exclusion_reason ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Footer label="Total members" value={String(total)} accent />
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
