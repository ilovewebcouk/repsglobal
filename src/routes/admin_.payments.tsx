import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { requireRole } from "@/lib/route-gates";
import {
  AlertTriangle,
  ArrowDownToLine,
  BadgePoundSterling,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import { getSubscriptionMetrics, getMarketplaceMetrics, type SubscriptionMetrics, type MarketplaceMetrics } from "@/lib/payments/admin.functions";

type Tab = "subscriptions" | "marketplace";

export const Route = createFileRoute("/admin_/payments")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  validateSearch: (s: Record<string, unknown>) => {
    const raw = typeof s.tab === "string" ? (s.tab as Tab) : "subscriptions";
    const tab: Tab = raw === "marketplace" ? "marketplace" : "subscriptions";
    return { tab };
  },
  component: AdminPaymentsPage,
});

function fmtMoney(pence: number, currency = "gbp"): string {
  const formatter = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: pence % 100 === 0 ? 0 : 2,
  });
  return formatter.format(pence / 100);
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function fmtRelative(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function AdminPaymentsPage() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <DashboardShell
      role="admin"
      active="Payments"
      title="Payments"
      subtitle="REPs subscription revenue and Stripe Connect marketplace activity — two lenses, never blended."
      actions={
        <button className="flex h-10 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel px-4 text-[13px] font-semibold text-white/85">
          <ArrowDownToLine className="h-4 w-4" /> Export
        </button>
      }
    >
      <div className="mb-6 inline-flex rounded-[12px] border border-reps-border bg-reps-panel-soft p-1">
        {[
          { key: "subscriptions" as const, label: "REPs Subscriptions" },
          { key: "marketplace" as const, label: "Marketplace (Connect)" },
        ].map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => navigate({ search: { tab: t.key }, replace: true })}
              className={`h-9 rounded-[10px] px-4 text-[13px] font-semibold transition-colors ${
                active ? "bg-reps-orange text-white" : "text-white/65 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "subscriptions" ? <SubscriptionsTab /> : <MarketplaceTab />}
    </DashboardShell>
  );
}

/* ────────────────────────────── Subscriptions tab ─────────────────────── */

function SubscriptionsTab() {
  const fetchMetrics = useServerFn(getSubscriptionMetrics);
  const { data, isLoading } = useQuery({ queryKey: ["admin-subs-metrics"], queryFn: () => fetchMetrics() });

  if (isLoading || !data) return <LoadingState />;
  const m: SubscriptionMetrics = data;

  const kpis = [
    { label: "MRR", value: fmtMoney(m.mrrPence), sub: `${m.activeCount} active subscribers`, icon: BadgePoundSterling },
    { label: "ARR (run-rate)", value: fmtMoney(m.arrPence), sub: "12 × current MRR", icon: TrendingUp },
    { label: "New this month", value: String(m.newThisMonth), sub: "Net new paid", icon: Users },
    { label: "Past due", value: String(m.pastDueCount), sub: "Failed payment recovery", icon: AlertTriangle },
  ];

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <PCard key={k.label}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[12px] text-white/55">{k.label}</div>
                <div className="mt-1 font-display text-[26px] font-bold text-white">{k.value}</div>
                <div className="mt-1 text-[11px] text-white/55">{k.sub}</div>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <k.icon className="h-4 w-4" />
              </span>
            </div>
          </PCard>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <PPanel className="lg:col-span-2">
          <div className="border-b border-reps-border px-5 py-4">
            <h2 className="font-display text-[16px] font-bold text-white">MRR by tier</h2>
            <p className="text-[12px] text-white/55">Live subscriptions only · Verified normalised to monthly</p>
          </div>
          <div className="divide-y divide-reps-border/60">
            {m.byTier.length === 0 ? (
              <EmptyRow label="No active paid subscriptions yet." />
            ) : (
              m.byTier.map((row) => {
                const share = m.mrrPence > 0 ? row.mrrPence / m.mrrPence : 0;
                return (
                  <div key={row.tier} className="px-5 py-4">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[14px] font-semibold capitalize text-white">{row.tier}</span>
                        <span className="text-[12px] text-white/55">{row.count} subscribers</span>
                      </div>
                      <div className="font-display text-[16px] font-bold text-white">{fmtMoney(row.mrrPence)}</div>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div className="h-full bg-reps-orange" style={{ width: `${share * 100}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </PPanel>

        <PPanel>
          <div className="border-b border-reps-border px-5 py-4">
            <h2 className="font-display text-[16px] font-bold text-white">Failed payments</h2>
            <p className="text-[12px] text-white/55">Past-due subscriptions to recover</p>
          </div>
          <div className="divide-y divide-reps-border/60">
            {m.failedPayments.length === 0 ? (
              <EmptyRow label="No past-due subscriptions. 🎉" />
            ) : (
              m.failedPayments.map((f) => (
                <div key={f.userId} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-white">{f.email ?? f.userId}</div>
                    <div className="text-[11px] text-white/55 capitalize">{f.tier} · {f.status}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                    <ShieldAlert className="h-3 w-3" />
                  </span>
                </div>
              ))
            )}
          </div>
        </PPanel>
      </div>

      <PPanel className="mt-6">
        <div className="border-b border-reps-border px-5 py-4">
          <h2 className="font-display text-[16px] font-bold text-white">Recent subscription events</h2>
          <p className="text-[12px] text-white/55">From Stripe webhooks · last 15</p>
        </div>
        <div className="divide-y divide-reps-border/60">
          {m.recentEvents.length === 0 ? (
            <EmptyRow label="No events recorded yet." />
          ) : (
            m.recentEvents.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-5 py-3 text-[13px]">
                <span className="font-mono text-[12px] text-white/75">{e.eventType}</span>
                <span className="text-[12px] text-white/45">{fmtRelative(e.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </PPanel>
    </>
  );
}

/* ────────────────────────────── Marketplace tab ───────────────────────── */

function MarketplaceTab() {
  const fetchMetrics = useServerFn(getMarketplaceMetrics);
  const { data, isLoading } = useQuery({ queryKey: ["admin-marketplace-metrics"], queryFn: () => fetchMetrics() });

  if (isLoading || !data) return <LoadingState />;
  const m: MarketplaceMetrics = data;

  return (
    <>
      <div className="mb-5 rounded-[12px] border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-[12.5px] text-emerald-100/90">
        <strong className="font-semibold text-emerald-200">REPs takes £0 from these payments.</strong>{" "}
        This view aggregates client-to-pro activity across all connected Stripe accounts.
      </div>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Connected (active)" value={String(m.connectedActive)} sub={`${m.connectedPending} pending · ${m.connectedRestricted} restricted`} Icon={CheckCircle2} />
        <KpiCard label="Gross volume (30d)" value={fmtMoney(m.grossVolume30dPence)} sub="Across all pros" Icon={Wallet} />
        <KpiCard label="Bookings (30d)" value={String(m.bookings30d)} sub="All statuses" Icon={CreditCard} />
        <KpiCard label="Refund rate" value={fmtPct(m.refundRate)} sub="Of paid bookings" Icon={RefreshCw} />
        <KpiCard label="Dispute rate" value={fmtPct(m.disputeRate)} sub="Of paid bookings" Icon={ShieldAlert} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <PPanel className="lg:col-span-2">
          <div className="border-b border-reps-border px-5 py-4">
            <h2 className="font-display text-[16px] font-bold text-white">Top pros by volume (30d)</h2>
            <p className="text-[12px] text-white/55">Where the marketplace activity is concentrated</p>
          </div>
          <div className="divide-y divide-reps-border/60">
            {m.topPros.length === 0 ? (
              <EmptyRow label="No bookings yet. Once pros connect Stripe and clients book, they'll show here." />
            ) : (
              m.topPros.map((p) => (
                <div key={p.professionalId} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-white">{p.fullName ?? p.professionalId}</div>
                    <div className="text-[11px] text-white/55">{p.bookings} bookings{p.chargesEnabled ? "" : " · charges disabled"}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-display text-[15px] font-bold text-white">{fmtMoney(p.volumePence)}</div>
                    {p.slug ? (
                      <Link to="/c/$slug" params={{ slug: p.slug }} className="text-white/45 hover:text-white">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </PPanel>

        <PPanel>
          <div className="border-b border-reps-border px-5 py-4">
            <h2 className="font-display text-[16px] font-bold text-white">Connected accounts</h2>
            <p className="text-[12px] text-white/55">{m.connectedAccounts.length} total</p>
          </div>
          <div className="divide-y divide-reps-border/60 max-h-96 overflow-y-auto">
            {m.connectedAccounts.length === 0 ? (
              <EmptyRow label="No pros have connected Stripe yet." />
            ) : (
              m.connectedAccounts.map((a) => (
                <div key={a.professionalId} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-white">{a.fullName ?? a.professionalId}</div>
                    <div className="text-[11px] text-white/55">{a.country ?? "—"}</div>
                  </div>
                  <StatusPill account={a} />
                </div>
              ))
            )}
          </div>
        </PPanel>
      </div>

      <PPanel className="mt-6">
        <div className="border-b border-reps-border px-5 py-4">
          <h2 className="font-display text-[16px] font-bold text-white">Recent bookings</h2>
          <p className="text-[12px] text-white/55">Last 20 · across all pros</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-reps-border text-left text-[11px] uppercase tracking-wider text-white/45">
                <th className="px-5 py-3 font-semibold">Pro</th>
                <th className="px-3 py-3 font-semibold">Service</th>
                <th className="px-3 py-3 font-semibold">Client</th>
                <th className="px-3 py-3 font-semibold">Amount</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">When</th>
              </tr>
            </thead>
            <tbody>
              {m.recentBookings.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-[13px] text-white/55">No bookings in the last 30 days.</td></tr>
              ) : m.recentBookings.map((b) => (
                <tr key={b.id} className="border-b border-reps-border/60 last:border-b-0">
                  <td className="px-5 py-3 text-white">{b.proName ?? "—"}</td>
                  <td className="px-3 py-3 text-white/65">{b.serviceTitle ?? "—"}</td>
                  <td className="px-3 py-3 text-white/65 truncate max-w-[180px]">{b.clientEmail}</td>
                  <td className="px-3 py-3 font-semibold text-white">{fmtMoney(b.amountPence, b.currency)}</td>
                  <td className="px-3 py-3"><BookingStatusPill status={b.status} /></td>
                  <td className="px-5 py-3 text-white/55">{fmtRelative(b.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PPanel>
    </>
  );
}

/* ────────────────────────────── helpers ────────────────────────────────── */

function KpiCard({ label, value, sub, Icon }: { label: string; value: string; sub: string; Icon: React.ComponentType<{ className?: string }> }) {
  return (
    <PCard>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[12px] text-white/55">{label}</div>
          <div className="mt-1 font-display text-[22px] font-bold text-white">{value}</div>
          <div className="mt-1 text-[11px] text-white/55">{sub}</div>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </PCard>
  );
}

function StatusPill({ account }: { account: MarketplaceMetrics["connectedAccounts"][number] }) {
  if (account.disconnectedAt) return <Pill cls="border-white/20 bg-white/5 text-white/55" label="Disconnect requested" />;
  if (account.chargesEnabled && account.payoutsEnabled) return <Pill cls="border-emerald-400/30 bg-emerald-500/15 text-emerald-300" label="Active" />;
  if (!account.detailsSubmitted) return <Pill cls="border-amber-400/30 bg-amber-500/15 text-amber-300" label="Pending" />;
  return <Pill cls="border-amber-400/30 bg-amber-500/15 text-amber-300" label="Restricted" />;
}

function BookingStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
    pending: "border-white/20 bg-white/5 text-white/55",
    refunded: "border-amber-400/30 bg-amber-500/15 text-amber-300",
    partially_refunded: "border-amber-400/30 bg-amber-500/15 text-amber-300",
    failed: "border-red-500/30 bg-red-500/15 text-red-300",
    canceled: "border-white/20 bg-white/5 text-white/55",
    disputed: "border-red-500/30 bg-red-500/15 text-red-300",
  };
  return <Pill cls={map[status] ?? "border-white/20 bg-white/5 text-white/55"} label={status.replace("_", " ")} />;
}

function Pill({ cls, label }: { cls: string; label: string }) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${cls}`}>{label}</span>;
}

function EmptyRow({ label }: { label: string }) {
  return <div className="px-5 py-8 text-center text-[13px] text-white/55">{label}</div>;
}

function LoadingState() {
  return (
    <PPanel className="p-10">
      <div className="flex items-center gap-3 text-[13px] text-white/60">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading payments data…
      </div>
    </PPanel>
  );
}
