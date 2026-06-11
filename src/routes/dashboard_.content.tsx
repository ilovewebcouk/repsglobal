import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  FileText,
  Filter,
  Image as ImageIcon,
  Plus,
  Search,
  Sparkles,
  Upload,
  Video,
} from "lucide-react";

import { PCard, PPanel, ProShell } from "@/components/dashboard/ProShell";

export const Route = createFileRoute("/dashboard_/content")({
  head: () => ({
    meta: [
      { title: "Content Studio — REPS Professional" },
      {
        name: "description",
        content:
          "Plan, draft and publish every piece of content — videos, posts, programme assets and blog drafts.",
      },
      { property: "og:title", content: "Content Studio — REPS Professional" },
      { property: "og:description", content: "Content studio for REPS professionals." },
      { property: "og:url", content: "/dashboard/content" },
    ],
    links: [{ rel: "canonical", href: "/dashboard/content" }],
  }),
  component: ContentStudioPage,
});

const TABS = ["Videos", "Images", "Posts", "Blog drafts", "Programme assets"] as const;

const ASSETS = [
  { title: "RDL form breakdown", type: "Video", edited: "2h ago", duration: "3:24" },
  { title: "Week 1 hero — strength block", type: "Image", edited: "Yesterday" },
  { title: "Why progressive overload wins", type: "Post", edited: "2 days ago" },
  { title: "Hybrid Programme cover v3", type: "Programme asset", edited: "3 days ago" },
  { title: "Nutrition basics carousel", type: "Post", edited: "4 days ago" },
  { title: "Squat depth — common faults", type: "Video", edited: "5 days ago", duration: "2:11" },
  { title: "Client win — Sarah, 12 weeks", type: "Image", edited: "1 week ago" },
  { title: "Off-season blog draft", type: "Blog", edited: "1 week ago" },
];

const SCHEDULE = [
  { date: "Mon 02", title: "Form check Reel — Deadlift", channel: "Instagram", time: "07:00" },
  { date: "Tue 03", title: "Progressive overload post", channel: "Instagram", time: "12:30" },
  { date: "Wed 04", title: "Hybrid Programme launch", channel: "Email + IG", time: "09:00" },
  { date: "Fri 06", title: "Client win carousel", channel: "Instagram", time: "18:00" },
  { date: "Sat 07", title: "Weekend warm-up Reel", channel: "TikTok", time: "10:00" },
];

const STATS = [
  { label: "Storage used", value: "4.2 / 25 GB" },
  { label: "Scheduled · next 14d", value: "5" },
  { label: "Drafts awaiting review", value: "3" },
  { label: "AI suggestions", value: "12 new" },
];

function typeIcon(t: string) {
  if (t === "Video") return Video;
  if (t === "Image") return ImageIcon;
  if (t === "Programme asset") return ImageIcon;
  return FileText;
}

function ContentStudioPage() {
  return (
    <ProShell
      active="Content Studio"
      title="Content Studio"
      subtitle="Plan, draft and publish — videos, posts, programme assets, blogs."
      actions={
        <>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel px-3 text-[13px] font-semibold text-white/80 shadow-none hover:text-white"
          >
            <Upload className="h-4 w-4" /> Upload
          </button>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
          >
            <Plus className="h-4 w-4" /> New
          </button>
        </>
      }
    >
      {/* Top strip */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {STATS.map((s) => (
          <PCard key={s.label} className="!p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
              {s.label}
            </div>
            <div className="mt-2 font-display text-[22px] font-bold text-white">{s.value}</div>
          </PCard>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* LEFT — library */}
        <div className="space-y-6 xl:col-span-8">
          <PPanel>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-reps-border px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                {TABS.map((t, i) => (
                  <button
                    key={t}
                    type="button"
                    className={`h-9 rounded-full border px-3 text-[12px] font-semibold ${
                      i === 0
                        ? "border-reps-orange-border bg-reps-orange-soft text-reps-orange"
                        : "border-reps-border bg-reps-panel-soft text-white/65 hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-[200px] items-center gap-2 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] text-white/55">
                  <Search className="h-3.5 w-3.5" /> Search library…
                </div>
                <button
                  type="button"
                  className="flex h-9 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/80 shadow-none hover:text-white"
                >
                  <Filter className="h-3.5 w-3.5" /> Filter
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-5 md:grid-cols-3 xl:grid-cols-4">
              {ASSETS.map((a) => {
                const Icon = typeIcon(a.type);
                return (
                  <div
                    key={a.title}
                    className="overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel-soft transition-colors hover:border-reps-orange-border"
                  >
                    <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-reps-panel to-reps-midnight">
                      <Icon className="h-7 w-7 text-white/35" />
                      {a.duration ? (
                        <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
                          {a.duration}
                        </span>
                      ) : null}
                    </div>
                    <div className="p-3">
                      <div className="truncate text-[12.5px] font-semibold text-white">
                        {a.title}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10.5px] text-white/55">
                        <span className="rounded-full bg-reps-panel px-2 py-0.5 font-semibold text-white/70">
                          {a.type}
                        </span>
                        <span>{a.edited}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
                <h3 className="text-[14px] font-semibold text-white">AI content ideas</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-white/70">
                  Your strongest engagement window is Tuesday 18:00. 3 carousel ideas drafted from
                  your last 30 days of check-ins.
                </p>
                <button
                  type="button"
                  className="mt-3 flex h-8 items-center gap-1.5 rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
                >
                  Review ideas
                </button>
              </div>
            </div>
          </PCard>

          <PCard>
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-white">Scheduled · next 14 days</h3>
              <CalendarDays className="h-4 w-4 text-white/55" />
            </div>
            <ul className="mt-3 divide-y divide-reps-border/60">
              {SCHEDULE.map((s) => (
                <li key={s.title} className="flex items-start gap-3 py-2.5">
                  <span className="flex h-10 w-12 flex-col items-center justify-center rounded-[10px] bg-reps-panel-soft text-[10px] font-semibold uppercase text-white/65">
                    {s.date}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-semibold text-white">
                      {s.title}
                    </div>
                    <div className="text-[11px] text-white/55">
                      {s.channel} · {s.time}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </PCard>
        </div>
      </div>
    </ProShell>
  );
}
