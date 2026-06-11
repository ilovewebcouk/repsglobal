import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  Download,
  Filter,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

import { ACard, AdminShell, APanel } from "@/components/dashboard/AdminShell";
import proJames from "@/assets/pro-james.jpg";
import proSophie from "@/assets/pro-sophie.jpg";
import proLaura from "@/assets/pro-laura.jpg";
import proDaniel from "@/assets/pro-daniel.jpg";

export const Route = createFileRoute("/admin_/professionals")({
  component: AdminProfessionalsPage,
});

const KPIS = [
  { label: "Active professionals", value: "12,486", delta: "+184 this month", icon: Users },
  { label: "Verified", value: "11,902", delta: "95.3% of base", icon: ShieldCheck },
  { label: "Avg. rating", value: "4.78", delta: "+0.02 vs last 30d", icon: Star },
  { label: "New signups (30d)", value: "428", delta: "+12.4%", icon: TrendingUp },
];

const ROWS = [
  {
    img: proJames,
    name: "James Carter",
    handle: "@james-carter",
    location: "London",
    tier: "Level 4 PT",
    status: "Verified",
    rating: "4.92",
    clients: 128,
    revenue: "£8,420",
    joined: "Mar 2022",
  },
  {
    img: proSophie,
    name: "Sophie Reid",
    handle: "@sophie-reid",
    location: "Manchester",
    tier: "Level 3 PT",
    status: "Verified",
    rating: "4.86",
    clients: 92,
    revenue: "£6,180",
    joined: "Jul 2023",
  },
  {
    img: proLaura,
    name: "Laura Bennett",
    handle: "@laura-bennett",
    location: "Bristol",
    tier: "Nutrition L4",
    status: "Pending",
    rating: "—",
    clients: 4,
    revenue: "£240",
    joined: "May 2026",
  },
  {
    img: proDaniel,
    name: "Daniel Okafor",
    handle: "@daniel-okafor",
    location: "Birmingham",
    tier: "Level 4 S&C",
    status: "Verified",
    rating: "4.81",
    clients: 76,
    revenue: "£5,920",
    joined: "Sep 2021",
  },
  {
    img: proJames,
    name: "Marcus Doyle",
    handle: "@marcus-doyle",
    location: "Leeds",
    tier: "Level 3 PT",
    status: "Flagged",
    rating: "4.21",
    clients: 41,
    revenue: "£2,140",
    joined: "Feb 2024",
  },
  {
    img: proSophie,
    name: "Amelia Chen",
    handle: "@amelia-chen",
    location: "Edinburgh",
    tier: "Pilates L4",
    status: "Verified",
    rating: "4.95",
    clients: 154,
    revenue: "£11,860",
    joined: "Jan 2020",
  },
];

const TABS = ["All", "Verified", "Pending", "Flagged", "Suspended", "Recently joined"];

function statusClass(s: string) {
  if (s === "Verified") return "bg-reps-green/15 text-reps-green";
  if (s === "Pending") return "bg-reps-orange-soft text-reps-orange";
  if (s === "Flagged") return "bg-red-500/15 text-red-400";
  return "bg-white/10 text-white/70";
}

function AdminProfessionalsPage() {
  return (
    <AdminShell
      active="Professionals"
      title="Professionals"
      subtitle="Manage the full register of REPS professionals."
      actions={
        <button className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover">
          <Plus className="h-4 w-4" /> Invite professional
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

      <APanel className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-reps-border px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            {TABS.map((t, i) => (
              <button
                key={t}
                className={
                  i === 0
                    ? "h-8 rounded-full bg-reps-orange-soft px-3 text-[12px] font-semibold text-reps-orange"
                    : "h-8 rounded-full border border-reps-border px-3 text-[12px] font-medium text-white/65 hover:text-white"
                }
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-9 items-center gap-2 rounded-[10px] border border-reps-border px-3 text-[12px] font-medium text-white/75">
              <Filter className="h-3.5 w-3.5" /> Filters
            </button>
            <button className="flex h-9 items-center gap-2 rounded-[10px] border border-reps-border px-3 text-[12px] font-medium text-white/75">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-reps-border text-left text-[11px] uppercase tracking-wider text-white/45">
                <th className="px-5 py-3 font-semibold">Professional</th>
                <th className="px-3 py-3 font-semibold">Location</th>
                <th className="px-3 py-3 font-semibold">Tier</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Rating</th>
                <th className="px-3 py-3 font-semibold">Clients</th>
                <th className="px-3 py-3 font-semibold">MRR</th>
                <th className="px-3 py-3 font-semibold">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.handle} className="border-b border-reps-border/60 last:border-b-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src={r.img} className="h-9 w-9 rounded-full object-cover" alt="" />
                      <div>
                        <div className="font-semibold text-white">{r.name}</div>
                        <div className="text-[11px] text-white/50">{r.handle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-white/75">{r.location}</td>
                  <td className="px-3 py-3 text-white/75">{r.tier}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(r.status)}`}>
                      {r.status === "Verified" && <CheckCircle2 className="h-3 w-3" />}
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-white/75">{r.rating}</td>
                  <td className="px-3 py-3 text-white/75">{r.clients}</td>
                  <td className="px-3 py-3 text-white/75">{r.revenue}</td>
                  <td className="px-3 py-3 text-white/55">{r.joined}</td>
                  <td className="px-5 py-3 text-right">
                    <button className="flex h-8 w-8 items-center justify-center rounded-[8px] text-white/55 hover:bg-reps-ink hover:text-white">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-reps-border px-5 py-3 text-[12px] text-white/55">
          <span>Showing 1–6 of 12,486</span>
          <div className="flex gap-2">
            <button className="h-8 rounded-[8px] border border-reps-border px-3 text-white/70">Previous</button>
            <button className="h-8 rounded-[8px] bg-reps-orange px-3 font-semibold text-white">1</button>
            <button className="h-8 rounded-[8px] border border-reps-border px-3 text-white/70">2</button>
            <button className="h-8 rounded-[8px] border border-reps-border px-3 text-white/70">3</button>
            <button className="h-8 rounded-[8px] border border-reps-border px-3 text-white/70">Next</button>
          </div>
        </div>
      </APanel>
    </AdminShell>
  );
}
