import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ArrowUpRight,
  BadgePoundSterling,
  CreditCard,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { ACard, AdminShell, APanel } from "@/components/dashboard/AdminShell";

export const Route = createFileRoute("/admin_/payments")({
  component: AdminPaymentsPage,
});

const KPIS = [
  { label: "Gross volume (MTD)", value: "£284,910", delta: "+12.6%", icon: BadgePoundSterling },
  { label: "Net revenue", value: "£42,736", delta: "Take rate 15%", icon: Wallet },
  { label: "Subscriptions", value: "4,066", delta: "+148 this month", icon: CreditCard },
  { label: "Refunds (30d)", value: "£3,210", delta: "1.1% of volume", icon: RefreshCw },
];

const TX = [
  { id: "TXN-92831", pro: "Sophie Reid", client: "Hannah W.", type: "Booking", amount: "£45.00", fee: "£6.75", status: "Succeeded", when: "12 min ago" },
  { id: "TXN-92830", pro: "Daniel Okafor", client: "Owen D.", type: "Subscription", amount: "£14.00", fee: "£2.10", status: "Succeeded", when: "38 min ago" },
  { id: "TXN-92829", pro: "Amelia Chen", client: "Priya S.", type: "Class pack", amount: "£120.00", fee: "£18.00", status: "Succeeded", when: "1h ago" },
  { id: "TXN-92828", pro: "James Carter", client: "Tom R.", type: "Booking", amount: "£60.00", fee: "£9.00", status: "Refunded", when: "2h ago" },
  { id: "TXN-92827", pro: "Marcus Doyle", client: "k.ahmed", type: "Booking", amount: "£40.00", fee: "£6.00", status: "Failed", when: "3h ago" },
  { id: "TXN-92826", pro: "Laura Bennett", client: "j.smith", type: "Plan", amount: "£89.00", fee: "£13.35", status: "Succeeded", when: "5h ago" },
];

function statusClass(s: string) {
  if (s === "Succeeded") return "bg-reps-green/15 text-reps-green";
  if (s === "Refunded") return "bg-reps-orange-soft text-reps-orange";
  if (s === "Failed") return "bg-red-500/15 text-red-400";
  return "bg-white/10 text-white/70";
}

const REVENUE = [42, 55, 48, 62, 70, 58, 75, 82, 68, 88, 95, 102];

function AdminPaymentsPage() {
  const max = Math.max(...REVENUE);
  return (
    <AdminShell
      active="Payments"
      title="Payments"
      subtitle="Platform-wide payouts, take rate, and transaction health."
      actions={
        <button className="flex h-10 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel px-4 text-[13px] font-semibold text-white/85">
          <ArrowDownToLine className="h-4 w-4" /> Export
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <ACard key={k.label}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[12px] text-white/55">{k.label}</div>
                <div className="mt-1 font-display text-[26px] font-bold text-white">{k.value}</div>
                <div className="mt-1 text-[11px] text-white/55">{k.delta}</div>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <k.icon className="h-4 w-4" />
              </span>
            </div>
          </ACard>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <APanel className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-reps-border px-5 py-4">
            <div>
              <h2 className="font-display text-[16px] font-bold text-white">Revenue trend</h2>
              <p className="text-[12px] text-white/55">Net revenue, last 12 months · £k</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-reps-green">
              <TrendingUp className="h-3.5 w-3.5" /> +18.4% YoY
            </span>
          </div>
          <div className="p-5">
            <svg viewBox="0 0 600 180" className="h-44 w-full">
              <defs>
                <linearGradient id="rev" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#FF7A00" stopOpacity="0" />
                </linearGradient>
              </defs>
              {(() => {
                const pts = REVENUE.map((v, i) => {
                  const x = (i / (REVENUE.length - 1)) * 580 + 10;
                  const y = 160 - (v / max) * 140;
                  return [x, y];
                });
                const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
                const area = `${line} L590,170 L10,170 Z`;
                return (
                  <>
                    <path d={area} fill="url(#rev)" />
                    <path d={line} fill="none" stroke="#FF7A00" strokeWidth="2.5" />
                    {pts.map((p, i) => (
                      <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#FF7A00" />
                    ))}
                  </>
                );
              })()}
            </svg>
            <div className="mt-2 flex justify-between text-[10px] text-white/45">
              {["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"].map(
                (m) => (
                  <span key={m}>{m}</span>
                ),
              )}
            </div>
          </div>
        </APanel>

        <APanel>
          <div className="border-b border-reps-border px-5 py-4">
            <h2 className="font-display text-[16px] font-bold text-white">Payouts queue</h2>
            <p className="text-[12px] text-white/55">Next batch · Mon 09:00</p>
          </div>
          <div className="space-y-3 p-5">
            <div className="rounded-[12px] border border-reps-border bg-reps-ink p-4">
              <div className="text-[11px] text-white/55">Pending payouts</div>
              <div className="mt-1 font-display text-[22px] font-bold text-white">£68,420</div>
              <div className="mt-1 text-[11px] text-white/55">to 312 professionals</div>
            </div>
            <div className="rounded-[12px] border border-reps-border bg-reps-ink p-4">
              <div className="text-[11px] text-white/55">In transit</div>
              <div className="mt-1 font-display text-[22px] font-bold text-white">£12,140</div>
              <div className="mt-1 text-[11px] text-white/55">Stripe · 48 transfers</div>
            </div>
            <button className="flex w-full items-center justify-center gap-1 rounded-[10px] bg-reps-orange py-2.5 text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-hover">
              Release payouts <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </APanel>
      </div>

      <APanel className="mt-6">
        <div className="flex items-center justify-between border-b border-reps-border px-5 py-4">
          <h2 className="font-display text-[16px] font-bold text-white">Recent transactions</h2>
          <button className="text-[12px] font-semibold text-reps-orange">View all</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-reps-border text-left text-[11px] uppercase tracking-wider text-white/45">
                <th className="px-5 py-3 font-semibold">Txn</th>
                <th className="px-3 py-3 font-semibold">Professional</th>
                <th className="px-3 py-3 font-semibold">Client</th>
                <th className="px-3 py-3 font-semibold">Type</th>
                <th className="px-3 py-3 font-semibold">Amount</th>
                <th className="px-3 py-3 font-semibold">Fee</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">When</th>
              </tr>
            </thead>
            <tbody>
              {TX.map((t) => (
                <tr key={t.id} className="border-b border-reps-border/60 last:border-b-0">
                  <td className="px-5 py-3 font-mono text-[12px] text-white/75">{t.id}</td>
                  <td className="px-3 py-3 text-white">{t.pro}</td>
                  <td className="px-3 py-3 text-white/65">{t.client}</td>
                  <td className="px-3 py-3 text-white/65">{t.type}</td>
                  <td className="px-3 py-3 font-semibold text-white">{t.amount}</td>
                  <td className="px-3 py-3 text-white/55">{t.fee}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(t.status)}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-white/55">{t.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </APanel>
    </AdminShell>
  );
}
