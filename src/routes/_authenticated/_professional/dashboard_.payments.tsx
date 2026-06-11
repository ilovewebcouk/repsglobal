import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react";

import { PCard, PPanel, ProShell } from "@/components/dashboard/ProShell";

export const Route = createFileRoute("/dashboard_/payments")({
  head: () => ({
    meta: [
      { title: "Payments — REPS Professional" },
      {
        name: "description",
        content:
          "Track revenue, payouts, invoices, subscription clients and failed payments across your REPS business.",
      },
      { property: "og:title", content: "Payments — REPS Professional" },
      { property: "og:description", content: "Revenue, payouts and invoices." },
      { property: "og:url", content: "/dashboard/payments" },
    ],
    links: [{ rel: "canonical", href: "/dashboard/payments" }],
  }),
  component: PaymentsPage,
});

const KPIS = [
  { label: "Revenue (30d)", value: "£8,420", delta: "+18% MoM", tone: "up" },
  { label: "Pending payout", value: "£1,260", delta: "Releases 03 Jun", tone: "neutral" },
  { label: "Subscriptions", value: "32", delta: "MRR £2,184", tone: "up" },
  { label: "Average order", value: "£68", delta: "+£4 vs 30d", tone: "up" },
  { label: "Failed (7d)", value: "3", delta: "Needs retry", tone: "warn" },
  { label: "Refunds (30d)", value: "£162", delta: "1.9% rate", tone: "down" },
] as const;

const INVOICES = [
  { id: "INV-3041", client: "Sarah Johnson", svc: "Strength Coaching — May", date: "29 May", amount: "£288.00", status: "Paid" },
  { id: "INV-3040", client: "Daniel Okafor", svc: "Performance Plan", date: "28 May", amount: "£220.00", status: "Paid" },
  { id: "INV-3039", client: "Hannah Reid", svc: "Nutrition Strategy", date: "27 May", amount: "£60.00", status: "Refunded" },
  { id: "INV-3038", client: "Marcus Hall", svc: "Strength Coaching — May", date: "26 May", amount: "£288.00", status: "Paid" },
  { id: "INV-3037", client: "Priya Mehta", svc: "Hybrid Programme", date: "25 May", amount: "£140.00", status: "Failed" },
  { id: "INV-3036", client: "Olivia Brennan", svc: "Conditioning Pack", date: "25 May", amount: "£72.00", status: "Paid" },
  { id: "INV-3035", client: "Aisha Khan", svc: "Performance Plan", date: "24 May", amount: "£220.00", status: "Pending" },
  { id: "INV-3034", client: "Tom Whitfield", svc: "Strength Coaching — May", date: "23 May", amount: "£288.00", status: "Paid" },
] as const;

const PAYOUTS = [
  { date: "03 Jun", amount: "£1,260.00", bank: "Monzo •• 4421", status: "Scheduled" },
  { date: "27 May", amount: "£1,840.00", bank: "Monzo •• 4421", status: "Paid" },
  { date: "20 May", amount: "£1,615.00", bank: "Monzo •• 4421", status: "Paid" },
  { date: "13 May", amount: "£1,940.00", bank: "Monzo •• 4421", status: "Paid" },
] as const;

const SUBS = [
  { client: "Sarah Johnson", plan: "Strength — Monthly", price: "£288 / mo", next: "29 Jun", status: "Active" },
  { client: "Marcus Hall", plan: "Strength — Monthly", price: "£288 / mo", next: "26 Jun", status: "Active" },
  { client: "Daniel Okafor", plan: "Performance — Monthly", price: "£220 / mo", next: "28 Jun", status: "Active" },
  { client: "Priya Mehta", plan: "Hybrid — Monthly", price: "£140 / mo", next: "—", status: "Past due" },
  { client: "Tom Whitfield", plan: "Strength — Monthly", price: "£288 / mo", next: "23 Jun", status: "Active" },
] as const;

const REV_POINTS = [120, 180, 150, 220, 260, 200, 320, 290, 340, 380, 360, 420];

function StatusPill({ s }: { s: string }) {
  const map: Record<string, string> = {
    Paid: "bg-emerald-500/12 text-emerald-300 border-emerald-500/25",
    Pending: "bg-amber-500/12 text-amber-300 border-amber-500/25",
    Failed: "bg-rose-500/12 text-rose-300 border-rose-500/25",
    Refunded: "bg-white/8 text-white/65 border-white/15",
    Scheduled: "bg-reps-orange-soft text-reps-orange border-reps-orange-border",
    Active: "bg-emerald-500/12 text-emerald-300 border-emerald-500/25",
    "Past due": "bg-rose-500/12 text-rose-300 border-rose-500/25",
  };
  return (
    <span className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-semibold ${map[s] ?? "border-white/15 text-white/65"}`}>
      {s}
    </span>
  );
}

function RevenueChart() {
  const w = 560;
  const h = 160;
  const max = Math.max(...REV_POINTS);
  const step = w / (REV_POINTS.length - 1);
  const pts = REV_POINTS.map((p, i) => [i * step, h - (p / max) * (h - 20) - 6] as const);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[160px] w-full">
      <defs>
        <linearGradient id="pay-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--reps-orange)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--reps-orange)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#pay-grad)" />
      <path d={line} stroke="var(--reps-orange)" strokeWidth={2} fill="none" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={2.5} fill="var(--reps-orange)" />
      ))}
    </svg>
  );
}

function PaymentsPage() {
  return (
    <ProShell
      active="Payments"
      title="Payments"
      subtitle="Revenue, payouts, invoices and subscriptions across your REPS business."
      actions={
        <>
          <button type="button" className="flex h-10 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel px-4 text-[13px] font-semibold text-white/85 shadow-none hover:text-white">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button type="button" className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-hover">
            <Plus className="h-4 w-4" />
            New invoice
          </button>
        </>
      }
    >
      {/* KPI ROW */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {KPIS.map((k) => (
          <PCard key={k.label} className="!p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50">{k.label}</div>
            <div className="mt-2 font-display text-[26px] font-bold leading-none text-white">{k.value}</div>
            <div className={`mt-2 text-[11px] font-medium ${k.tone === "up" ? "text-emerald-300" : k.tone === "down" ? "text-rose-300" : k.tone === "warn" ? "text-reps-orange" : "text-white/55"}`}>{k.delta}</div>
          </PCard>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* LEFT */}
        <div className="space-y-6 xl:col-span-8">
          <PPanel className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-semibold text-white">Revenue — last 12 weeks</h3>
                <p className="mt-0.5 text-[12px] text-white/55">Net of refunds, before platform fees.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display text-[22px] font-bold text-white">£8,420</span>
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                  <TrendingUp className="h-3 w-3" /> +18%
                </span>
              </div>
            </div>
            <div className="mt-4">
              <RevenueChart />
            </div>
          </PPanel>

          <PPanel>
            <div className="flex flex-wrap items-center gap-3 border-b border-reps-border px-5 py-4">
              <h3 className="text-[14px] font-semibold text-white">Invoices</h3>
              <div className="ml-auto flex items-center gap-2">
                <div className="flex h-9 w-[220px] items-center gap-2 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] text-white/55">
                  <Search className="h-3.5 w-3.5" />
                  <span>Search invoices…</span>
                </div>
                <button type="button" className="flex h-9 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/75 shadow-none hover:text-white">
                  <Filter className="h-3.5 w-3.5" />
                  Filters
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-reps-border text-[11px] font-semibold uppercase tracking-wider text-white/45">
                    <th className="px-5 py-3">Invoice</th>
                    <th className="px-3 py-3">Client</th>
                    <th className="px-3 py-3">Service</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3 text-right">Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {INVOICES.map((i) => (
                    <tr key={i.id} className="border-b border-reps-border/60 last:border-b-0 hover:bg-reps-panel-soft/60">
                      <td className="px-5 py-3.5 font-mono text-[12px] text-white/70">{i.id}</td>
                      <td className="px-3 py-3.5 font-semibold text-white">{i.client}</td>
                      <td className="px-3 py-3.5 text-white/75">{i.svc}</td>
                      <td className="px-3 py-3.5 text-white/65">{i.date}</td>
                      <td className="px-3 py-3.5"><StatusPill s={i.status} /></td>
                      <td className="px-3 py-3.5 text-right font-semibold text-white">{i.amount}</td>
                      <td className="px-3 py-3.5 text-right">
                        <button type="button" aria-label="More" className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-reps-border bg-reps-panel-soft text-white/60 shadow-none hover:text-white">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-reps-border px-5 py-3 text-[12px] text-white/55">
              <span>Showing 8 of 124 invoices</span>
              <div className="flex gap-2">
                <button className="flex h-8 items-center rounded-[8px] border border-reps-border bg-reps-panel-soft px-3 font-semibold text-white/75 shadow-none hover:text-white">Previous</button>
                <button className="flex h-8 items-center rounded-[8px] border border-reps-border bg-reps-panel-soft px-3 font-semibold text-white/75 shadow-none hover:text-white">Next</button>
              </div>
            </div>
          </PPanel>

          <PPanel>
            <div className="flex items-center justify-between border-b border-reps-border px-5 py-4">
              <h3 className="text-[14px] font-semibold text-white">Subscription clients</h3>
              <span className="text-[12px] text-white/55">MRR £2,184 · 32 active</span>
            </div>
            <ul className="divide-y divide-reps-border/60">
              {SUBS.map((s) => (
                <li key={s.client} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-reps-orange-soft text-[11px] font-semibold text-reps-orange">
                    {s.client.split(" ").map((x) => x[0]).join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-white">{s.client}</div>
                    <div className="text-[12px] text-white/55">{s.plan} · next {s.next}</div>
                  </div>
                  <div className="text-[13px] font-semibold text-white">{s.price}</div>
                  <StatusPill s={s.status} />
                </li>
              ))}
            </ul>
          </PPanel>
        </div>

        {/* RIGHT */}
        <div className="space-y-6 xl:col-span-4">
          <PPanel>
            <div className="flex items-center justify-between border-b border-reps-border px-5 py-4">
              <div>
                <h3 className="text-[14px] font-semibold text-white">Payouts</h3>
                <p className="mt-0.5 text-[12px] text-white/55">Weekly to Monzo •• 4421</p>
              </div>
              <button type="button" className="flex h-8 items-center gap-1.5 rounded-[8px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/75 shadow-none hover:text-white">
                <ArrowDownToLine className="h-3.5 w-3.5" /> Payout now
              </button>
            </div>
            <ul className="divide-y divide-reps-border/60">
              {PAYOUTS.map((p) => (
                <li key={p.date + p.amount} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-panel-soft text-white/70">
                    <Banknote className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-white">{p.date}</div>
                    <div className="text-[11px] text-white/55">{p.bank}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-semibold text-white">{p.amount}</div>
                    <StatusPill s={p.status} />
                  </div>
                </li>
              ))}
            </ul>
          </PPanel>

          <PCard>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[14px] font-semibold text-white">Failed payments</h3>
                <p className="mt-1 text-[12px] text-white/55">3 cards declined this week.</p>
              </div>
              <span className="flex h-6 items-center rounded-full bg-rose-500/12 px-2.5 text-[11px] font-semibold text-rose-300">
                Action needed
              </span>
            </div>
            <ul className="mt-4 space-y-3">
              {["Priya Mehta · Hybrid Programme · £140", "Liam Brooke · Strength Coaching · £72", "Ifeoma Cole · Online Plan · £55"].map((row) => (
                <li key={row} className="flex items-center justify-between rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2.5 text-[12px] text-white/80">
                  <span className="truncate">{row}</span>
                  <button type="button" className="flex h-7 items-center gap-1.5 rounded-[8px] bg-reps-orange px-2.5 text-[11px] font-semibold text-white shadow-none hover:bg-reps-orange-hover">
                    <CheckCircle2 className="h-3 w-3" /> Retry
                  </button>
                </li>
              ))}
            </ul>
          </PCard>

          <PCard>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <FileText className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-[14px] font-semibold text-white">Tax summary</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-white/65">
                  Year-to-date earnings £41,260 · Estimated tax £6,820. Download a Self Assessment-ready CSV.
                </p>
                <div className="mt-3 flex gap-2">
                  <button type="button" className="flex h-8 items-center gap-1.5 rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white shadow-none hover:bg-reps-orange-hover">
                    <Download className="h-3.5 w-3.5" /> CSV
                  </button>
                  <button type="button" className="flex h-8 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/80 shadow-none hover:text-white">
                    View report <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </PCard>
        </div>
      </div>
    </ProShell>
  );
}
