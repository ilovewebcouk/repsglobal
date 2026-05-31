import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BadgeCheck,
  CreditCard,
  Crown,
  TrendingUp,
  Users,
} from "lucide-react";

import { ACard, AdminShell, APanel } from "@/components/dashboard/AdminShell";

export const Route = createFileRoute("/admin_/memberships")({
  component: AdminMembershipsPage,
});

const PLANS = [
  {
    tier: "Foundation",
    price: "£0",
    members: 8420,
    pct: 67.5,
    color: "bg-white/30",
    perks: ["Public listing", "Basic profile", "Up to 3 services"],
  },
  {
    tier: "Pro",
    price: "£14/mo",
    members: 3210,
    pct: 25.7,
    color: "bg-reps-orange",
    perks: ["Verified badge", "Booking engine", "Unlimited services"],
  },
  {
    tier: "Elite",
    price: "£39/mo",
    members: 856,
    pct: 6.8,
    color: "bg-reps-green",
    perks: ["Featured placement", "AI session planner", "Priority support"],
  },
];

const RECENT = [
  { name: "Sophie Reid", action: "Upgraded Foundation → Pro", when: "12m ago", delta: "+£14" },
  { name: "Daniel Okafor", action: "Renewed Elite annually", when: "1h ago", delta: "+£468" },
  { name: "Marcus Doyle", action: "Cancelled Pro", when: "3h ago", delta: "−£14" },
  { name: "Amelia Chen", action: "Upgraded Pro → Elite", when: "5h ago", delta: "+£25" },
  { name: "Hannah Wright", action: "Joined Pro", when: "8h ago", delta: "+£14" },
];

function AdminMembershipsPage() {
  return (
    <AdminShell
      active="Memberships"
      title="Memberships"
      subtitle="Track plan distribution, conversions, and recurring revenue."
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <ACard>
          <div className="text-[12px] text-white/55">MRR</div>
          <div className="mt-1 font-display text-[26px] font-bold text-white">£78,346</div>
          <div className="mt-1 text-[11px] text-reps-green">+8.4% vs last month</div>
        </ACard>
        <ACard>
          <div className="text-[12px] text-white/55">Paid members</div>
          <div className="mt-1 font-display text-[26px] font-bold text-white">4,066</div>
          <div className="mt-1 text-[11px] text-white/55">32.5% of base</div>
        </ACard>
        <ACard>
          <div className="text-[12px] text-white/55">Foundation → Pro conv.</div>
          <div className="mt-1 font-display text-[26px] font-bold text-white">3.8%</div>
          <div className="mt-1 text-[11px] text-reps-green">+0.4 pts</div>
        </ACard>
        <ACard>
          <div className="text-[12px] text-white/55">Monthly churn</div>
          <div className="mt-1 font-display text-[26px] font-bold text-white">2.1%</div>
          <div className="mt-1 text-[11px] text-white/55">Target ≤2.5%</div>
        </ACard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {PLANS.map((p) => (
          <APanel key={p.tier} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {p.tier === "Elite" ? (
                    <Crown className="h-4 w-4 text-reps-orange" />
                  ) : p.tier === "Pro" ? (
                    <BadgeCheck className="h-4 w-4 text-reps-orange" />
                  ) : (
                    <Users className="h-4 w-4 text-white/60" />
                  )}
                  <h3 className="font-display text-[17px] font-bold text-white">{p.tier}</h3>
                </div>
                <div className="mt-1 text-[12px] text-white/55">{p.price}</div>
              </div>
              <span className="font-display text-[22px] font-bold text-white">
                {p.members.toLocaleString()}
              </span>
            </div>

            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-reps-ink">
              <div className={`h-full ${p.color}`} style={{ width: `${p.pct}%` }} />
            </div>
            <div className="mt-1 text-[11px] text-white/55">{p.pct}% of total</div>

            <ul className="mt-4 space-y-1.5 text-[12px] text-white/70">
              {p.perks.map((perk) => (
                <li key={perk} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-reps-orange" /> {perk}
                </li>
              ))}
            </ul>
          </APanel>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <APanel className="lg:col-span-2">
          <div className="border-b border-reps-border px-5 py-4">
            <h2 className="font-display text-[16px] font-bold text-white">Plan distribution</h2>
            <p className="text-[12px] text-white/55">Across 12,486 professionals</p>
          </div>
          <div className="p-5">
            <div className="flex h-3 overflow-hidden rounded-full bg-reps-ink">
              <div className="h-full bg-white/30" style={{ width: "67.5%" }} />
              <div className="h-full bg-reps-orange" style={{ width: "25.7%" }} />
              <div className="h-full bg-reps-green" style={{ width: "6.8%" }} />
            </div>
            <div className="mt-3 flex items-center gap-5 text-[11px] text-white/60">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-white/30" /> Foundation
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-reps-orange" /> Pro
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-reps-green" /> Elite
              </span>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              {[
                { k: "Avg. LTV", v: "£842" },
                { k: "Avg. tenure", v: "14 mo" },
                { k: "Renewal rate", v: "89.4%" },
              ].map((s) => (
                <div key={s.k} className="rounded-[12px] border border-reps-border bg-reps-ink p-3">
                  <div className="text-[11px] text-white/55">{s.k}</div>
                  <div className="mt-0.5 font-display text-[18px] font-bold text-white">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </APanel>

        <APanel>
          <div className="flex items-center justify-between border-b border-reps-border px-5 py-4">
            <h2 className="font-display text-[16px] font-bold text-white">Recent activity</h2>
            <CreditCard className="h-4 w-4 text-white/40" />
          </div>
          <ul className="divide-y divide-reps-border">
            {RECENT.map((r, i) => (
              <li key={i} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-white">{r.name}</div>
                  <div className="text-[11px] text-white/55">{r.action}</div>
                  <div className="text-[10px] text-white/40">{r.when}</div>
                </div>
                <span
                  className={`text-[12px] font-semibold ${
                    r.delta.startsWith("+") ? "text-reps-green" : "text-red-400"
                  }`}
                >
                  {r.delta}
                </span>
              </li>
            ))}
          </ul>
        </APanel>
      </div>
    </AdminShell>
  );
}
