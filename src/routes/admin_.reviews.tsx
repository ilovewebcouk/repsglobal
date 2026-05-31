import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Flag, MessageSquare, Star, ThumbsUp } from "lucide-react";

import { ACard, AdminShell, APanel } from "@/components/dashboard/AdminShell";
import proJames from "@/assets/pro-james.jpg";
import proSophie from "@/assets/pro-sophie.jpg";
import proLaura from "@/assets/pro-laura.jpg";
import proDaniel from "@/assets/pro-daniel.jpg";

export const Route = createFileRoute("/admin_/reviews")({
  component: AdminReviewsPage,
});

const KPIS = [
  { label: "Avg. platform rating", value: "4.78", icon: Star },
  { label: "Reviews (30d)", value: "2,184", icon: MessageSquare },
  { label: "Flagged", value: "23", icon: Flag },
  { label: "Auto-approved", value: "94%", icon: ThumbsUp },
];

const FLAGGED = [
  {
    pro: "Marcus Doyle",
    proImg: proJames,
    reviewer: "Anonymous",
    rating: 1,
    excerpt: "Trainer didn't show up to two sessions in a row and ignored my messages…",
    reason: "Complaint — no-show",
    when: "2h ago",
  },
  {
    pro: "Laura Bennett",
    proImg: proLaura,
    reviewer: "j.smith@…",
    rating: 5,
    excerpt: "Absolutely amazing!!! Use code LAURA20 for a discount, link in bio!!",
    reason: "Auto-flag — promotional",
    when: "4h ago",
  },
  {
    pro: "Daniel Okafor",
    proImg: proDaniel,
    reviewer: "k.ahmed@…",
    rating: 2,
    excerpt: "Wouldn't recommend. Felt unsafe with the equipment provided.",
    reason: "Safety concern",
    when: "8h ago",
  },
  {
    pro: "Amelia Chen",
    proImg: proSophie,
    reviewer: "Anonymous",
    rating: 1,
    excerpt: "*** is a fake trainer, total ***",
    reason: "Profanity / personal attack",
    when: "1d ago",
  },
];

const DIST = [
  { stars: 5, pct: 78, count: 1703 },
  { stars: 4, pct: 14, count: 305 },
  { stars: 3, pct: 5, count: 109 },
  { stars: 2, pct: 2, count: 44 },
  { stars: 1, pct: 1, count: 23 },
];

function Stars({ n }: { n: number }) {
  return (
    <span className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < n ? "fill-reps-orange text-reps-orange" : "text-white/20"
          }`}
        />
      ))}
    </span>
  );
}

function AdminReviewsPage() {
  return (
    <AdminShell
      active="Reviews"
      title="Reviews moderation"
      subtitle="Approve, reject, and escalate reviews flagged by our trust system."
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <ACard key={k.label}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] text-white/55">{k.label}</div>
                <div className="mt-1 font-display text-[26px] font-bold text-white">{k.value}</div>
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
              <h2 className="font-display text-[16px] font-bold text-white">Flagged for review</h2>
              <p className="text-[12px] text-white/55">23 items awaiting moderation</p>
            </div>
            <button className="text-[12px] font-semibold text-reps-orange">Open queue</button>
          </div>
          <ul className="divide-y divide-reps-border">
            {FLAGGED.map((f, i) => (
              <li key={i} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <img src={f.proImg} className="h-10 w-10 rounded-full object-cover" alt="" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white">{f.pro}</span>
                      <Stars n={f.rating} />
                      <span className="text-[11px] text-white/45">· {f.reviewer} · {f.when}</span>
                    </div>
                    <p className="mt-1 text-[13px] text-white/75">"{f.excerpt}"</p>
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-400">
                      <AlertTriangle className="h-3 w-3" /> {f.reason}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button className="h-8 rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white shadow-none hover:bg-reps-orange-hover">
                      Approve
                    </button>
                    <button className="h-8 rounded-[10px] border border-reps-border px-3 text-[12px] font-semibold text-white/75">
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </APanel>

        <div className="space-y-6">
          <APanel>
            <div className="border-b border-reps-border px-5 py-4">
              <h3 className="font-display text-[15px] font-bold text-white">Rating distribution</h3>
              <p className="text-[12px] text-white/55">Last 30 days · 2,184 reviews</p>
            </div>
            <div className="space-y-2 p-5">
              {DIST.map((d) => (
                <div key={d.stars} className="flex items-center gap-3 text-[12px]">
                  <span className="w-3 text-white/65">{d.stars}</span>
                  <Star className="h-3 w-3 fill-reps-orange text-reps-orange" />
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-reps-ink">
                    <div className="h-full bg-reps-orange" style={{ width: `${d.pct}%` }} />
                  </div>
                  <span className="w-12 text-right text-white/55">{d.count}</span>
                </div>
              ))}
            </div>
          </APanel>

          <ACard>
            <h3 className="font-display text-[15px] font-bold text-white">Trust system</h3>
            <ul className="mt-3 space-y-2 text-[12px] text-white/70">
              <li className="flex justify-between">
                <span>Profanity filter</span>
                <span className="font-semibold text-reps-green">Active</span>
              </li>
              <li className="flex justify-between">
                <span>Promo detection</span>
                <span className="font-semibold text-reps-green">Active</span>
              </li>
              <li className="flex justify-between">
                <span>Auto-approve threshold</span>
                <span className="font-semibold text-white">95% conf.</span>
              </li>
            </ul>
          </ACard>
        </div>
      </div>
    </AdminShell>
  );
}
