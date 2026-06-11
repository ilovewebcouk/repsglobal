import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Flag,
  MessageSquare,
  Reply,
  Search,
  Sparkles,
  Star,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";

import { PCard, PPanel, ProShell } from "@/components/dashboard/ProShell";

export const Route = createFileRoute("/_authenticated/_professional/_pro/dashboard_/reviews")({
  head: () => ({
    meta: [
      { title: "Reviews — REPS Professional" },
      { name: "description", content: "Public reviews, rating breakdown and response composer for your REPS profile." },
      { property: "og:title", content: "Reviews — REPS Professional" },
      { property: "og:description", content: "Reviews and response composer." },
      { property: "og:url", content: "/dashboard/reviews" },
    ],
    links: [{ rel: "canonical", href: "/dashboard/reviews" }],
  }),
  component: ReviewsPage,
});

const KPIS = [
  { label: "Overall rating", value: "4.9", delta: "92 reviews", tone: "neutral" },
  { label: "Last 30 days", value: "+8", delta: "All 5★", tone: "up" },
  { label: "Response rate", value: "98%", delta: "Avg 4h", tone: "up" },
  { label: "Awaiting reply", value: "3", delta: "Action needed", tone: "warn" },
  { label: "Flagged", value: "1", delta: "Review queue", tone: "down" },
];

const BREAKDOWN = [
  { stars: 5, count: 82, pct: 89 },
  { stars: 4, count: 7, pct: 8 },
  { stars: 3, count: 2, pct: 2 },
  { stars: 2, count: 1, pct: 1 },
  { stars: 1, count: 0, pct: 0 },
];

const REVIEWS = [
  {
    name: "Sarah Johnson",
    initials: "SJ",
    rating: 5,
    date: "2 days ago",
    service: "1:1 Strength Coaching",
    body: "James has completely changed my relationship with the gym. The programming is sharp, the check-ins are thorough, and I've hit PBs I never thought possible. Cannot recommend highly enough.",
    pinned: true,
    awaitingReply: false,
  },
  {
    name: "Marcus Hall",
    initials: "MH",
    rating: 5,
    date: "5 days ago",
    service: "Performance Plan",
    body: "Six months in and the difference is night and day — both physically and how I think about training. James is the real deal.",
    awaitingReply: true,
  },
  {
    name: "Hannah Reid",
    initials: "HR",
    rating: 4,
    date: "1 week ago",
    service: "Nutrition Strategy",
    body: "Great strategy session, really clear macros and a plan I can actually stick to. Would have liked one more follow-up call included in the package.",
    awaitingReply: true,
  },
  {
    name: "Priya Mehta",
    initials: "PM",
    rating: 5,
    date: "2 weeks ago",
    service: "Hybrid Programme",
    body: "Brilliant coach. The hybrid setup means I get the structure of in-person and the flexibility of online — works perfectly for my schedule.",
    awaitingReply: false,
  },
  {
    name: "Tom Whitfield",
    initials: "TW",
    rating: 5,
    date: "3 weeks ago",
    service: "1:1 Strength Coaching",
    body: "Pulled a 200kg deadlift for the first time this week. James knows how to programme strength without burning you out.",
    awaitingReply: false,
  },
];

const FLAGGED = [
  { name: "Anonymous", body: "Review flagged for off-topic content and personal information.", date: "Today" },
];

function Stars({ n, size = "sm" }: { n: number; size?: "sm" | "lg" }) {
  const s = size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`${s} ${i < n ? "fill-reps-orange text-reps-orange" : "text-white/20"}`} />
      ))}
    </span>
  );
}

function ReviewsPage() {
  return (
    <ProShell
      active="Reviews"
      title="Reviews"
      subtitle="Public reviews, response composer and moderation queue."
      actions={
        <button type="button" className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-hover">
          <ArrowUpRight className="h-4 w-4" />
          View public profile
        </button>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {KPIS.map((k) => (
          <PCard key={k.label} className="!p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50">{k.label}</div>
            <div className="mt-2 font-display text-[26px] font-bold leading-none text-white">{k.value}</div>
            <div className={`mt-2 text-[11px] font-medium ${k.tone === "up" ? "text-emerald-300" : k.tone === "warn" ? "text-reps-orange" : k.tone === "down" ? "text-rose-300" : "text-white/55"}`}>{k.delta}</div>
          </PCard>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* LEFT — reviews feed */}
        <div className="space-y-6 xl:col-span-8">
          <PPanel>
            <div className="flex items-center justify-between border-b border-reps-border px-5 py-4">
              <h3 className="text-[14px] font-semibold text-white">All reviews</h3>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-[200px] items-center gap-2 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] text-white/55">
                  <Search className="h-3.5 w-3.5" /> Search…
                </div>
                {["All", "5★", "4★", "Awaiting reply"].map((c, i) => (
                  <button key={c} type="button" className={`h-9 rounded-full border px-3 text-[12px] font-semibold ${i === 0 ? "border-reps-orange-border bg-reps-orange-soft text-reps-orange" : "border-reps-border bg-reps-panel-soft text-white/65 hover:text-white"}`}>{c}</button>
                ))}
              </div>
            </div>
            <ul className="divide-y divide-reps-border/60">
              {REVIEWS.map((r) => (
                <li key={r.name + r.date} className="px-5 py-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-reps-orange-soft text-[12px] font-semibold text-reps-orange">{r.initials}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-semibold text-white">{r.name}</span>
                        {r.pinned && <span className="flex h-5 items-center gap-1 rounded-full bg-reps-orange-soft px-2 text-[10px] font-semibold text-reps-orange">Pinned</span>}
                        {r.awaitingReply && <span className="flex h-5 items-center rounded-full bg-amber-500/12 px-2 text-[10px] font-semibold text-amber-300">Awaiting reply</span>}
                        <span className="text-[11px] text-white/45">· {r.service} · {r.date}</span>
                      </div>
                      <div className="mt-1.5"><Stars n={r.rating} /></div>
                      <p className="mt-2.5 text-[13px] leading-relaxed text-white/80">{r.body}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button type="button" className="flex h-8 items-center gap-1.5 rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white shadow-none hover:bg-reps-orange-hover">
                          <Reply className="h-3.5 w-3.5" /> Reply
                        </button>
                        <button type="button" className="flex h-8 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/80 shadow-none hover:text-white">
                          <ThumbsUp className="h-3.5 w-3.5" /> Thank
                        </button>
                        <button type="button" className="flex h-8 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/60 shadow-none hover:text-white">
                          <Flag className="h-3.5 w-3.5" /> Flag
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </PPanel>
        </div>

        {/* RIGHT */}
        <div className="space-y-6 xl:col-span-4">
          <PCard>
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-white">Rating breakdown</h3>
              <span className="font-display text-[28px] font-bold text-white">4.9</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[12px] text-white/55">
              <Stars n={5} size="lg" /> from 92 reviews
            </div>
            <div className="mt-4 space-y-2">
              {BREAKDOWN.map((b) => (
                <div key={b.stars} className="flex items-center gap-3 text-[12px]">
                  <span className="w-6 text-white/65">{b.stars}★</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-reps-panel-soft">
                    <div className="h-full rounded-full bg-reps-orange" style={{ width: `${b.pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-white/65">{b.count}</span>
                </div>
              ))}
            </div>
          </PCard>

          <PCard>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <MessageSquare className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-[14px] font-semibold text-white">Reply to Marcus</h3>
                <p className="mt-1 text-[12px] text-white/55">Drafted from your tone presets.</p>
                <textarea
                  rows={5}
                  defaultValue="Marcus — thank you. Six months in and you've put the work in every single session. Onwards to the next block."
                  className="mt-3 w-full resize-none rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2.5 text-[13px] text-white placeholder:text-white/40 focus:outline-none"
                />
                <div className="mt-2 flex gap-2">
                  <button type="button" className="flex h-8 items-center gap-1.5 rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white shadow-none hover:bg-reps-orange-hover">
                    <Reply className="h-3.5 w-3.5" /> Publish reply
                  </button>
                  <button type="button" className="flex h-8 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/80 shadow-none hover:text-white">
                    <Sparkles className="h-3.5 w-3.5" /> Regenerate
                  </button>
                </div>
              </div>
            </div>
          </PCard>

          <PCard>
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-white">Flagged for moderation</h3>
              <span className="flex h-6 items-center rounded-full bg-rose-500/12 px-2.5 text-[11px] font-semibold text-rose-300">1 pending</span>
            </div>
            <ul className="mt-3 space-y-2">
              {FLAGGED.map((f) => (
                <li key={f.name} className="rounded-[12px] border border-reps-border bg-reps-panel-soft p-3">
                  <div className="flex items-center justify-between text-[12px] text-white/65">
                    <span>{f.name}</span>
                    <span>{f.date}</span>
                  </div>
                  <p className="mt-1 text-[12px] text-white/75">{f.body}</p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" className="flex h-7 items-center rounded-[8px] bg-reps-orange px-2.5 text-[11px] font-semibold text-white shadow-none">Approve</button>
                    <button type="button" className="flex h-7 items-center rounded-[8px] border border-reps-border bg-reps-panel px-2.5 text-[11px] font-semibold text-white/80 shadow-none">Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          </PCard>

          <PCard>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <TrendingUp className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-[14px] font-semibold text-white">Review velocity</h3>
                <p className="mt-1 text-[12px] text-white/65">You're averaging 2.4 new reviews per week — top 5% of REPS Level 3 trainers in Manchester.</p>
              </div>
            </div>
          </PCard>
        </div>
      </div>
    </ProShell>
  );
}
