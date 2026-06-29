// Admin Billing Console — /admin/billing
// Single page with sticky KPI strip + 4 tabs (Payments · Subscriptions · Disputes · Refunds).
// Tab and view live in URL search params so links are deep-linkable from sidebars and emails.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { z } from "zod";
import { CreditCard, Receipt, ShieldAlert, Undo2, ExternalLink, RefreshCw, Search } from "lucide-react";

import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import {
  getBillingKpis,
  listPayments,
  listSubscriptions,
  listDisputes,
  listRefunds,
  type BillingKpis,
  type PaymentRow,
  type SubscriptionRow,
  type DisputeRow,
  type RefundRow,
} from "@/lib/admin/billing-console/list.functions";
import { CancelStripeSubCard } from "@/components/admin/billing/CancelStripeSubCard";

const TAB_VALUES = ["payments", "subscriptions", "disputes", "refunds"] as const;
type TabValue = (typeof TAB_VALUES)[number];

const searchSchema = z.object({
  tab: z.enum(TAB_VALUES).optional(),
  view: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/admin_/billing")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Billing console — REPS Admin" },
      { name: "description", content: "Payments, subscriptions, disputes and refunds in one place." },
    ],
  }),
  component: BillingConsole,
});

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function BillingConsole() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const tab: TabValue = search.tab ?? "payments";

  const setTab = (next: TabValue) => navigate({ search: { ...search, tab: next } as any });

  const kpisFn = useServerFn(getBillingKpis);
  const kpisQ = useQuery<BillingKpis>({
    queryKey: ["admin", "billing", "kpis"],
    queryFn: () => kpisFn(),
    staleTime: 60_000,
  });

  return (
    <DashboardShell role="admin" active="Billing" title="Billing" subtitle="Payments, subscriptions, disputes and refunds — sourced from Stripe.">
      <KpiStrip data={kpisQ.data} loading={kpisQ.isLoading} onRefresh={() => kpisQ.refetch()} />

      <div className="mt-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
          <TabsList className="bg-reps-panel border border-reps-border h-auto p-1">
            <TabsTrigger value="payments" className="data-[state=active]:bg-reps-orange-soft data-[state=active]:text-reps-orange gap-2">
              <Receipt className="h-4 w-4" /> Payments
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="data-[state=active]:bg-reps-orange-soft data-[state=active]:text-reps-orange gap-2">
              <CreditCard className="h-4 w-4" /> Subscriptions
            </TabsTrigger>
            <TabsTrigger value="disputes" className="data-[state=active]:bg-reps-orange-soft data-[state=active]:text-reps-orange gap-2">
              <ShieldAlert className="h-4 w-4" /> Disputes
            </TabsTrigger>
            <TabsTrigger value="refunds" className="data-[state=active]:bg-reps-orange-soft data-[state=active]:text-reps-orange gap-2">
              <Undo2 className="h-4 w-4" /> Refunds
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="mt-4"><PaymentsTab /></TabsContent>
          <TabsContent value="subscriptions" className="mt-4"><SubscriptionsTab /></TabsContent>
          <TabsContent value="disputes" className="mt-4"><DisputesTab /></TabsContent>
          <TabsContent value="refunds" className="mt-4"><RefundsTab /></TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}

// ---------------------------------------------------------------------------
// KPI strip
// ---------------------------------------------------------------------------

function KpiStrip({ data, loading, onRefresh }: { data?: BillingKpis; loading: boolean; onRefresh: () => void }) {
  return (
    <div className="rounded-[12px] border border-reps-border bg-reps-panel/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/55">
          Live financial snapshot
          {data?.mirrorAgeSeconds != null && (
            <Badge variant="outline" className="border-white/15 bg-white/5 text-[10px] text-white/70">
              Stripe mirror · {formatAge(data.mirrorAgeSeconds)}
            </Badge>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={onRefresh} className="h-7 gap-1 text-white/70 hover:text-white">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        <Kpi label="MRR" value={loading ? "—" : formatGbp(data!.mrrPence)} accent="orange" />
        <Kpi label="Active paying" value={loading ? "—" : data!.activePaying.toString()} />
        <Kpi label="Trialing" value={loading ? "—" : data!.trialing.toString()} accent="emerald" />
        <Kpi label="Past due" value={loading ? "—" : data!.pastDue.toString()} accent={data && data.pastDue > 0 ? "amber" : undefined} />
        <Kpi label="Open disputes" value={loading ? "—" : data!.openDisputes.toString()} accent={data && data.openDisputes > 0 ? "red" : undefined} />
        <Kpi label="Disputed amount" value={loading ? "—" : formatGbp(data!.disputedAmountPence)} />
        <Kpi label="Refunds (30d)" value={loading ? "—" : `${data!.refunds30dCount} · ${formatGbp(data!.refunds30dAmountPence)}`} />
      </div>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: "orange" | "emerald" | "amber" | "red" }) {
  const tone =
    accent === "orange" ? "text-reps-orange" :
    accent === "emerald" ? "text-emerald-300" :
    accent === "amber" ? "text-amber-300" :
    accent === "red" ? "text-red-300" :
    "text-white";
  return (
    <div className="rounded-[10px] border border-reps-border bg-reps-panel p-3">
      <div className="text-[11px] uppercase tracking-wider text-white/55">{label}</div>
      <div className={cn("mt-1 text-[20px] font-semibold tabular-nums", tone)}>{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payments tab
// ---------------------------------------------------------------------------

function PaymentsTab() {
  const fn = useServerFn(listPayments);
  const [status, setStatus] = useState<"all" | "succeeded" | "failed" | "refunded" | "disputed">("all");
  const [range, setRange] = useState<number>(30);
  const [q, setQ] = useState("");

  const query = useQuery<PaymentRow[]>({
    queryKey: ["admin", "billing", "payments", status, range, q],
    queryFn: () => fn({ data: { status, rangeDays: range, search: q || undefined, limit: 200 } }),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-3">
      <ConsoleToolbar>
        <ChipRow
          options={[
            { value: "all", label: "All" },
            { value: "succeeded", label: "Succeeded" },
            { value: "failed", label: "Failed" },
            { value: "refunded", label: "Refunded" },
            { value: "disputed", label: "Disputed" },
          ]}
          value={status}
          onChange={(v) => setStatus(v as any)}
        />
        <ChipRow
          options={[
            { value: "7", label: "7d" },
            { value: "30", label: "30d" },
            { value: "90", label: "90d" },
            { value: "365", label: "12m" },
          ]}
          value={String(range)}
          onChange={(v) => setRange(Number(v))}
        />
        <SearchBox value={q} onChange={setQ} placeholder="Search email, name, charge ID…" />
      </ConsoleToolbar>

      <TableShell
        empty={!query.isLoading && (query.data?.length ?? 0) === 0}
        emptyMessage="No payments match these filters."
        loading={query.isLoading}
      >
        <table className="w-full text-[13px]">
          <thead className="border-b border-reps-border text-left text-[11px] uppercase tracking-wider text-white/55">
            <tr>
              <Th>Date</Th>
              <Th>Member</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th>Stripe</Th>
            </tr>
          </thead>
          <tbody>
            {(query.data ?? []).map((p) => (
              <tr key={p.id} className="border-b border-reps-border/60 hover:bg-white/[0.02]">
                <Td className="text-white/70">{formatDateTime(p.createdAt)}</Td>
                <Td>{memberCell(p.userId, p.fullName, p.email)}</Td>
                <Td className="tabular-nums text-white">{formatGbp(p.amountPence, p.currency)}</Td>
                <Td><StatusPill status={p.status} /></Td>
                <Td className="text-white/65">
                  <div className="flex flex-wrap items-center gap-2">
                    {p.stripeChargeId && (
                      <a className="inline-flex items-center gap-1 text-white/75 hover:text-reps-orange" target="_blank" rel="noreferrer" href={`https://dashboard.stripe.com/charges/${p.stripeChargeId}`}>
                        charge <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {p.stripeCustomerId && (
                      <a className="inline-flex items-center gap-1 text-white/75 hover:text-reps-orange" target="_blank" rel="noreferrer" href={`https://dashboard.stripe.com/customers/${p.stripeCustomerId}`}>
                        customer <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subscriptions tab
// ---------------------------------------------------------------------------

function SubscriptionsTab() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const fn = useServerFn(listSubscriptions);
  const view = (search.view as any) ?? "all";
  const [q, setQ] = useState(search.q ?? "");

  const setView = (v: string) =>
    navigate({ search: { ...search, view: v === "all" ? undefined : v } as any });

  const query = useQuery<SubscriptionRow[]>({
    queryKey: ["admin", "billing", "subs", view, q],
    queryFn: () => fn({ data: { view, search: q || undefined, limit: 500 } }),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-3">

      <ConsoleToolbar>
        <ChipRow
          options={[
            { value: "all", label: "All" },
            { value: "trialing", label: "Trialing" },
            { value: "active", label: "Active" },
            { value: "past_due", label: "Past due" },
            { value: "canceling", label: "Canceling" },
            { value: "canceled", label: "Canceled" },
            { value: "verified", label: "Core" },
            { value: "pro", label: "Pro" },
            { value: "studio", label: "Studio" },
          ]}
          value={view}
          onChange={setView}
        />
        <SearchBox value={q} onChange={setQ} placeholder="Search email, name, sub ID…" />
      </ConsoleToolbar>

      <TableShell
        empty={!query.isLoading && (query.data?.length ?? 0) === 0}
        emptyMessage="No subscriptions match this view."
        loading={query.isLoading}
      >
        <table className="w-full text-[13px]">
          <thead className="border-b border-reps-border text-left text-[11px] uppercase tracking-wider text-white/55">
            <tr>
              <Th>Member</Th>
              <Th>Plan</Th>
              <Th>Status</Th>
              <Th>MRR</Th>
              <Th>Renews / Trial</Th>
              <Th>Stripe</Th>
            </tr>
          </thead>
          <tbody>
            {(query.data ?? []).map((s) => (
              <tr key={s.userId} className="border-b border-reps-border/60 hover:bg-white/[0.02]">
                <Td>{memberCell(s.userId, s.fullName, s.email)}</Td>
                <Td><PlanPill plan={s.plan} period={s.billingPeriod} /></Td>
                <Td><StatusPill status={s.status as any} cancelAtPeriodEnd={s.cancelAtPeriodEnd} /></Td>
                <Td className="tabular-nums text-white">{formatGbp(s.mrrPence)}</Td>
                <Td className="text-white/75">
                  {s.isTrial && s.trialDaysLeft != null
                    ? <span className="text-emerald-300">Trial · {s.trialDaysLeft}d left</span>
                    : s.renewalDate
                      ? formatDate(s.renewalDate)
                      : <span className="text-white/40">—</span>}
                </Td>
                <Td className="text-white/65">
                  <div className="flex flex-wrap items-center gap-2">
                    {s.stripeSubscriptionId && (
                      <a className="inline-flex items-center gap-1 text-white/75 hover:text-reps-orange" target="_blank" rel="noreferrer" href={`https://dashboard.stripe.com/subscriptions/${s.stripeSubscriptionId}`}>
                        sub <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {s.stripeCustomerId && (
                      <a className="inline-flex items-center gap-1 text-white/75 hover:text-reps-orange" target="_blank" rel="noreferrer" href={`https://dashboard.stripe.com/customers/${s.stripeCustomerId}`}>
                        customer <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Disputes tab
// ---------------------------------------------------------------------------

function DisputesTab() {
  const fn = useServerFn(listDisputes);
  const query = useQuery<DisputeRow[]>({
    queryKey: ["admin", "billing", "disputes"],
    queryFn: () => fn(),
    staleTime: 60_000,
  });

  return (
    <TableShell
      empty={!query.isLoading && (query.data?.length ?? 0) === 0}
      emptyMessage="No disputes on record."
      loading={query.isLoading}
    >
      <table className="w-full text-[13px]">
        <thead className="border-b border-reps-border text-left text-[11px] uppercase tracking-wider text-white/55">
          <tr>
            <Th>Opened</Th>
            <Th>Member</Th>
            <Th>Reason</Th>
            <Th>Amount</Th>
            <Th>Stage</Th>
            <Th>Evidence due</Th>
            <Th>Stripe</Th>
          </tr>
        </thead>
        <tbody>
          {(query.data ?? []).map((d) => (
            <tr key={d.id} className="border-b border-reps-border/60 hover:bg-white/[0.02]">
              <Td className="text-white/70">{formatDate(d.openedAt)}</Td>
              <Td>{memberCell(d.userId, d.fullName, d.email)}</Td>
              <Td className="text-white/80">{d.reason ?? "—"}</Td>
              <Td className="tabular-nums text-white">{formatGbp(d.amountPence, d.currency)}</Td>
              <Td><DisputeStagePill stage={d.lifecycleStage} status={d.status} /></Td>
              <Td className="text-white/70">{d.evidenceDueBy ? formatDate(d.evidenceDueBy) : "—"}</Td>
              <Td>
                {d.stripeDisputeId && (
                  <a className="inline-flex items-center gap-1 text-white/75 hover:text-reps-orange" target="_blank" rel="noreferrer" href={`https://dashboard.stripe.com/disputes/${d.stripeDisputeId}`}>
                    dispute <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableShell>
  );
}

// ---------------------------------------------------------------------------
// Refunds tab
// ---------------------------------------------------------------------------

function RefundsTab() {
  const fn = useServerFn(listRefunds);
  const [range, setRange] = useState<number>(90);
  const query = useQuery<RefundRow[]>({
    queryKey: ["admin", "billing", "refunds", range],
    queryFn: () => fn({ data: { rangeDays: range, limit: 300 } }),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-3">
      <ConsoleToolbar>
        <ChipRow
          options={[
            { value: "30", label: "30d" },
            { value: "90", label: "90d" },
            { value: "365", label: "12m" },
          ]}
          value={String(range)}
          onChange={(v) => setRange(Number(v))}
        />
      </ConsoleToolbar>

      <TableShell
        empty={!query.isLoading && (query.data?.length ?? 0) === 0}
        emptyMessage="No refunds in this window."
        loading={query.isLoading}
      >
        <table className="w-full text-[13px]">
          <thead className="border-b border-reps-border text-left text-[11px] uppercase tracking-wider text-white/55">
            <tr>
              <Th>Date</Th>
              <Th>Member</Th>
              <Th>Amount</Th>
              <Th>Reason</Th>
              <Th>Stripe</Th>
            </tr>
          </thead>
          <tbody>
            {(query.data ?? []).map((r) => (
              <tr key={r.id} className="border-b border-reps-border/60 hover:bg-white/[0.02]">
                <Td className="text-white/70">{formatDateTime(r.createdAt)}</Td>
                <Td>{memberCell(r.userId, r.fullName, r.email)}</Td>
                <Td className="tabular-nums text-white">{formatGbp(r.amountPence, r.currency)}</Td>
                <Td className="text-white/80">{r.reason ?? "—"}</Td>
                <Td>
                  {r.stripeChargeId && (
                    <a className="inline-flex items-center gap-1 text-white/75 hover:text-reps-orange" target="_blank" rel="noreferrer" href={`https://dashboard.stripe.com/charges/${r.stripeChargeId}`}>
                      charge <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

function ConsoleToolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[10px] border border-reps-border bg-reps-panel/60 p-3">
      {children}
    </div>
  );
}

function ChipRow({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-[10px] border border-reps-border bg-reps-panel p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-[8px] px-3 py-1.5 text-[12px] font-medium transition-colors",
            value === opt.value ? "bg-reps-orange-soft text-reps-orange" : "text-white/65 hover:text-white",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative flex-1 min-w-[220px] max-w-[420px]">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 border-reps-border bg-reps-panel pl-8 text-[13px] text-white placeholder:text-white/40"
      />
    </div>
  );
}

function TableShell({ children, loading, empty, emptyMessage }: { children: React.ReactNode; loading: boolean; empty: boolean; emptyMessage: string }) {
  if (loading) {
    return (
      <div className="space-y-2 rounded-[12px] border border-reps-border bg-reps-panel/60 p-4">
        <Skeleton className="h-8 w-full bg-white/5" />
        <Skeleton className="h-8 w-full bg-white/5" />
        <Skeleton className="h-8 w-full bg-white/5" />
      </div>
    );
  }
  if (empty) {
    return (
      <div className="rounded-[12px] border border-reps-border bg-reps-panel/40 p-10 text-center text-[13px] text-white/55">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-[12px] border border-reps-border bg-reps-panel/60">
      {children}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2.5 font-medium">{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2.5 align-middle", className)}>{children}</td>;
}

function memberCell(userId: string | null, name: string | null, email: string | null) {
  if (!userId) return <span className="text-white/55">{email ?? "Unknown"}</span>;
  return (
    <Link to="/admin/members/$userId" params={{ userId }} className="group block leading-tight">
      <div className="font-medium text-white group-hover:text-reps-orange">{name || email || "Unnamed"}</div>
      {email && name && <div className="text-[11px] text-white/55">{email}</div>}
    </Link>
  );
}

function StatusPill({ status, cancelAtPeriodEnd }: { status: PaymentRow["status"] | string; cancelAtPeriodEnd?: boolean }) {
  if (cancelAtPeriodEnd) {
    return <Badge className="border-amber-400/40 bg-amber-500/15 text-amber-200">Canceling</Badge>;
  }
  const map: Record<string, string> = {
    succeeded: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
    active: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
    trialing: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
    refunded: "border-white/15 bg-white/5 text-white/75",
    failed: "border-red-400/40 bg-red-500/15 text-red-200",
    past_due: "border-red-400/40 bg-red-500/15 text-red-200",
    unpaid: "border-red-400/40 bg-red-500/15 text-red-200",
    disputed: "border-red-400/40 bg-red-500/15 text-red-200",
    canceled: "border-white/15 bg-white/5 text-white/55",
    incomplete: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  };
  const cls = map[status] ?? "border-white/15 bg-white/5 text-white/75";
  return <Badge className={cls}>{labelFor(status)}</Badge>;
}

function DisputeStagePill({ stage, status }: { stage: string; status: string }) {
  const map: Record<string, string> = {
    opened: "border-red-400/40 bg-red-500/15 text-red-200",
    funds_withdrawn: "border-red-400/40 bg-red-500/15 text-red-200",
    funds_reinstated: "border-amber-400/40 bg-amber-500/15 text-amber-200",
    won: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
    lost: "border-white/15 bg-white/5 text-white/65",
  };
  const cls = map[stage] ?? "border-white/15 bg-white/5 text-white/75";
  return (
    <div className="flex flex-col gap-0.5">
      <Badge className={cls}>{labelFor(stage)}</Badge>
      {status && status !== stage && <span className="text-[10px] uppercase tracking-wider text-white/45">{labelFor(status)}</span>}
    </div>
  );
}

function PlanPill({ plan, period }: { plan: string; period: string | null }) {
  const name = plan === "verified" ? "Core" : plan === "pro" ? "Pro" : plan === "studio" ? "Studio" : "Free";
  const cls =
    plan === "verified" ? "border-reps-orange/40 bg-reps-orange-soft text-reps-orange" :
    plan === "pro" ? "border-violet-400/40 bg-violet-500/15 text-violet-200" :
    plan === "studio" ? "border-sky-400/40 bg-sky-500/15 text-sky-200" :
    "border-white/15 bg-white/5 text-white/65";
  return (
    <div className="flex items-center gap-1.5">
      <Badge className={cls}>{name}</Badge>
      {period && <span className="text-[10px] uppercase tracking-wider text-white/45">{period === "annual" ? "annual" : "monthly"}</span>}
    </div>
  );
}

function labelFor(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function formatGbp(pence: number, currency: string = "gbp") {
  const value = pence / 100;
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: 2 }).format(value);
  } catch {
    return `£${value.toFixed(2)}`;
  }
}

function formatDate(iso: string) {
  try { return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso)); }
  catch { return iso; }
}

function formatDateTime(iso: string) {
  try { return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)); }
  catch { return iso; }
}

function formatAge(seconds: number) {
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`;
  return `${Math.round(seconds / 86400)}d ago`;
}
