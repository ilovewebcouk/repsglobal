import { createFileRoute } from "@tanstack/react-router";
import {
  Hash,
  MessageSquare,
  PencilLine,
  Pin,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/_authenticated/_professional/_pro/dashboard_/community")({
  head: () => ({
    meta: [
      { title: "Community — REPS Professional" },
      {
        name: "description",
        content:
          "The Pro Lounge for verified REPS professionals, and the group spaces you run for your clients.",
      },
      { property: "og:title", content: "Community — REPS Professional" },
      { property: "og:description", content: "Pro Lounge and client group spaces." },
      { property: "og:url", content: "/dashboard/community" },
    ],
    links: [{ rel: "canonical", href: "/dashboard/community" }],
  }),
  component: CommunityPage,
});

const CATS = ["All", "Coaching", "Business", "CPD", "Off-topic"] as const;

const THREADS = [
  {
    title: "How are you pricing hybrid programmes in 2026?",
    author: "Amelia Carter",
    level: "L3",
    category: "Business",
    replies: 28,
    last: "12m ago",
    pinned: true,
  },
  {
    title: "Best assessment for rotator cuff weakness in over-50s?",
    author: "Marcus Hall",
    level: "L4",
    category: "Coaching",
    replies: 14,
    last: "1h ago",
  },
  {
    title: "REPS renewal — anyone else's evidence rejected?",
    author: "Priya Mehta",
    level: "L3",
    category: "CPD",
    replies: 22,
    last: "2h ago",
  },
  {
    title: "Onboarding script that converts — share yours",
    author: "Tom Whitfield",
    level: "L3",
    category: "Business",
    replies: 41,
    last: "3h ago",
  },
  {
    title: "Block periodisation vs DUP for general-pop strength",
    author: "Hannah Reid",
    level: "L4",
    category: "Coaching",
    replies: 18,
    last: "5h ago",
  },
  {
    title: "Manchester pros — Saturday meet-up at Castlefield?",
    author: "James Carter",
    level: "L3",
    category: "Off-topic",
    replies: 9,
    last: "Yesterday",
  },
];

const GROUPS = [
  { name: "Strength Squad", members: 24, last: "Posted: programme drop · 1h ago" },
  { name: "Hybrid Programme — May intake", members: 12, last: "Check-in Friday · 4h ago" },
  { name: "Nutrition Strategy clients", members: 18, last: "Recipe shared · Yesterday" },
  { name: "Off-season athletes", members: 7, last: "Video added · 2 days ago" },
];

const TRENDING = ["#pricing-2026", "#reps-endorsed", "#hybrid-coaching", "#client-retention", "#deadlift-cues"];

const SUGGESTED = [
  { name: "Sophie Nguyen", role: "Strength Coach · L4", city: "Leeds" },
  { name: "Rishi Patel", role: "Sports Therapist · L3", city: "Birmingham" },
  { name: "Eve Robinson", role: "Pre/Postnatal · L3", city: "Bristol" },
];

function CommunityPage() {
  return (
    <DashboardShell role="trainer" tier="pro"
      active="Community"
      title="Community"
      subtitle="Talk shop with verified pros and run group spaces for your clients."
      actions={
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
        >
          <PencilLine className="h-4 w-4" /> New thread
        </button>
      }
    >
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-reps-border pb-3">
        {[
          { l: "Pro Lounge", icon: ShieldCheck, active: true, count: "248 online" },
          { l: "My Groups", icon: Users, active: false, count: "4 active" },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.l}
              type="button"
              className={`flex h-10 items-center gap-2 rounded-[10px] px-4 text-[13px] font-semibold ${
                t.active
                  ? "bg-reps-orange-soft text-reps-orange"
                  : "text-white/65 hover:bg-reps-panel hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.l}
              <span className="text-[11px] font-medium opacity-70">· {t.count}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* LEFT — Pro Lounge feed */}
        <div className="space-y-6 xl:col-span-8">
          <PPanel>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-reps-border px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                {CATS.map((c, i) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-9 rounded-full border px-3 text-[12px] font-semibold ${
                      i === 0
                        ? "border-reps-orange-border bg-reps-orange-soft text-reps-orange"
                        : "border-reps-border bg-reps-panel-soft text-white/65 hover:text-white"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="flex h-9 w-[200px] items-center gap-2 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] text-white/55">
                <Search className="h-3.5 w-3.5" /> Search threads…
              </div>
            </div>
            <ul className="divide-y divide-reps-border/60">
              {THREADS.map((t) => (
                <li
                  key={t.title}
                  className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-reps-panel-soft/40"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-reps-orange-soft text-[12px] font-semibold text-reps-orange">
                    {t.author
                      .split(" ")
                      .map((p) => p[0])
                      .join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {t.pinned && (
                        <span className="flex h-5 items-center gap-1 rounded-full bg-reps-orange-soft px-2 text-[10px] font-semibold text-reps-orange">
                          <Pin className="h-3 w-3" /> Pinned
                        </span>
                      )}
                      <span className="text-[14px] font-semibold text-white">{t.title}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] text-white/55">
                      <span className="font-semibold text-white/80">{t.author}</span>
                      <span className="flex h-4 items-center gap-1 rounded-full bg-reps-orange-soft px-1.5 text-[10px] font-semibold text-reps-orange">
                        <ShieldCheck className="h-2.5 w-2.5" /> {t.level}
                      </span>
                      <span>·</span>
                      <span className="rounded-full bg-reps-panel-soft px-2 py-0.5 font-semibold text-white/70">
                        {t.category}
                      </span>
                      <span>· {t.last}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-white/60">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span className="font-semibold text-white">{t.replies}</span>
                  </div>
                </li>
              ))}
            </ul>
          </PPanel>

          <PPanel>
            <div className="flex items-center justify-between border-b border-reps-border px-5 py-4">
              <h3 className="text-[14px] font-semibold text-white">My client groups</h3>
              <span className="text-[11px] text-white/55">{GROUPS.length} active</span>
            </div>
            <ul className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
              {GROUPS.map((g) => (
                <li
                  key={g.name}
                  className="rounded-[16px] border border-reps-border bg-reps-panel-soft p-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-[13px] font-semibold text-white">{g.name}</h4>
                    <span className="flex h-5 items-center gap-1 rounded-full bg-reps-panel px-2 text-[10px] font-semibold text-white/70">
                      <Users className="h-3 w-3" /> {g.members}
                    </span>
                  </div>
                  <p className="mt-1 text-[11.5px] text-white/55">{g.last}</p>
                  <button
                    type="button"
                    className="mt-3 flex h-8 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel px-3 text-[11.5px] font-semibold text-white/80 shadow-none hover:text-white"
                  >
                    Open
                  </button>
                </li>
              ))}
            </ul>
          </PPanel>
        </div>

        {/* RIGHT */}
        <div className="space-y-6 xl:col-span-4">
          <PCard>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-[14px] font-semibold text-white">REPS guidelines</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-white/70">
                  Pro Lounge is for verified professionals. Keep it respectful, on-topic and no
                  client poaching. Full guidelines linked at the bottom.
                </p>
              </div>
            </div>
          </PCard>

          <PCard>
            <h3 className="text-[14px] font-semibold text-white">Trending topics</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {TRENDING.map((t) => (
                <li
                  key={t}
                  className="flex h-7 items-center gap-1 rounded-full border border-reps-border bg-reps-panel-soft px-2.5 text-[11.5px] font-semibold text-white/80"
                >
                  <Hash className="h-3 w-3 text-reps-orange" /> {t.replace("#", "")}
                </li>
              ))}
            </ul>
          </PCard>

          <PCard>
            <h3 className="text-[14px] font-semibold text-white">Suggested pros to follow</h3>
            <ul className="mt-3 space-y-3">
              {SUGGESTED.map((p) => (
                <li key={p.name} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-reps-orange-soft text-[11px] font-semibold text-reps-orange">
                    {p.name
                      .split(" ")
                      .map((s) => s[0])
                      .join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-semibold text-white">{p.name}</div>
                    <div className="truncate text-[11px] text-white/55">
                      {p.role} · {p.city}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="flex h-7 items-center gap-1 rounded-[10px] border border-reps-orange-border bg-reps-orange-soft px-2.5 text-[11px] font-semibold text-reps-orange shadow-none"
                  >
                    <UserPlus className="h-3 w-3" /> Follow
                  </button>
                </li>
              ))}
            </ul>
          </PCard>
        </div>
      </div>
    </DashboardShell>
  );
}
