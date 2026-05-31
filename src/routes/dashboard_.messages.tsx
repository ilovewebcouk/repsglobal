import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Calendar as CalendarIcon,
  CheckCheck,
  CreditCard,
  Filter,
  MessagesSquare,
  Paperclip,
  Phone,
  Pin,
  Search,
  Send,
  Smile,
  Sparkles,
  Star,
  Video,
} from "lucide-react";

import { PCard, PPanel, ProShell } from "@/components/dashboard/ProShell";

export const Route = createFileRoute("/dashboard_/messages")({
  head: () => ({
    meta: [
      { title: "Messages — REPs Professional" },
      { name: "description", content: "Inbox, threads and client context across your REPs business." },
      { property: "og:title", content: "Messages — REPs Professional" },
      { property: "og:description", content: "Inbox and client threads." },
      { property: "og:url", content: "/dashboard/messages" },
    ],
    links: [{ rel: "canonical", href: "/dashboard/messages" }],
  }),
  component: MessagesPage,
});

const THREADS = [
  { name: "Sarah Johnson", initials: "SJ", last: "Quick one — should I keep cardio in on Sat?", time: "09:14", unread: 2, active: true, online: true },
  { name: "Marcus Hall", initials: "MH", last: "Cheers! See you tomorrow at 07:00.", time: "08:51", unread: 0, online: true },
  { name: "Hannah Reid", initials: "HR", last: "I've uploaded this week's photos.", time: "Yest", unread: 1 },
  { name: "Daniel Okafor", initials: "DO", last: "Can we move Thursday to Friday?", time: "Yest", unread: 0 },
  { name: "Priya Mehta", initials: "PM", last: "Macros felt better this week, thank you 🙏", time: "Mon", unread: 0 },
  { name: "Olivia Brennan", initials: "OB", last: "I won't make Friday's class.", time: "Sun", unread: 0 },
  { name: "Tom Whitfield", initials: "TW", last: "PB on the deadlift this morning!", time: "Sun", unread: 0 },
  { name: "Aisha Khan", initials: "AK", last: "Sent over the intake form.", time: "Sat", unread: 0 },
  { name: "Ben Adeyemi", initials: "BA", last: "Sorry I missed the assessment.", time: "Fri", unread: 0 },
];

type Msg = { from: "me" | "them"; text: string; time: string };
const THREAD: Msg[] = [
  { from: "them", text: "Morning James! Quick one — should I keep cardio in on Saturday or push it to Sunday?", time: "09:14" },
  { from: "them", text: "Legs are still a bit sore from Thursday tbh.", time: "09:14" },
  { from: "me", text: "Morning! Push it to Sunday — give the quads another day. Light walk Saturday is fine.", time: "09:16" },
  { from: "me", text: "How did the Bulgarians feel yesterday — any knee discomfort?", time: "09:16" },
  { from: "them", text: "No knee stuff, just normal soreness 👌", time: "09:18" },
  { from: "me", text: "Perfect. Keep Saturday's calories where they are and we'll smash Sunday.", time: "09:20" },
];

function Bubble({ m }: { m: Msg }) {
  const mine = m.from === "me";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[70%] rounded-[16px] px-3.5 py-2.5 text-[13px] leading-snug ${mine ? "bg-reps-orange text-white" : "bg-reps-panel-soft text-white/90 border border-reps-border"}`}>
        <p>{m.text}</p>
        <div className={`mt-1 text-[10px] ${mine ? "text-white/75" : "text-white/45"}`}>{m.time}</div>
      </div>
    </div>
  );
}

function MessagesPage() {
  return (
    <ProShell
      active="Messages"
      title="Messages"
      subtitle="One inbox for every client, lead and class enquiry."
      actions={
        <button type="button" className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-hover">
          <MessagesSquare className="h-4 w-4" />
          New message
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* INBOX */}
        <div className="xl:col-span-3">
          <PPanel className="flex h-[760px] flex-col overflow-hidden">
            <div className="flex items-center gap-2 border-b border-reps-border px-4 py-3">
              <div className="flex h-9 flex-1 items-center gap-2 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] text-white/55">
                <Search className="h-3.5 w-3.5" />
                <span>Search messages…</span>
              </div>
              <button type="button" className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-reps-border bg-reps-panel-soft text-white/70 shadow-none">
                <Filter className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 text-[11px]">
              {["All", "Unread", "Clients", "Leads"].map((c, i) => (
                <button key={c} className={`h-6 rounded-full border px-2.5 font-semibold ${i === 0 ? "border-reps-orange-border bg-reps-orange-soft text-reps-orange" : "border-reps-border bg-reps-panel-soft text-white/60"}`}>{c}</button>
              ))}
            </div>
            <ul className="flex-1 overflow-y-auto">
              {THREADS.map((t) => (
                <li key={t.name}>
                  <button
                    type="button"
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${t.active ? "bg-reps-orange-soft/50" : "hover:bg-reps-panel-soft/60"}`}
                  >
                    {t.active && <span className="-ml-4 h-11 w-1 rounded-r-full bg-reps-orange" />}
                    <div className="relative shrink-0">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-reps-orange-soft text-[12px] font-semibold text-reps-orange">{t.initials}</span>
                      {t.online && <span className="absolute -bottom-0 -right-0 h-2.5 w-2.5 rounded-full border-2 border-reps-panel bg-emerald-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`truncate text-[13px] font-semibold ${t.active ? "text-white" : "text-white/90"}`}>{t.name}</span>
                        <span className="text-[10px] text-white/45">{t.time}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[12px] text-white/60">{t.last}</span>
                        {t.unread ? (
                          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-reps-orange px-1 text-[10px] font-semibold text-white">{t.unread}</span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </PPanel>
        </div>

        {/* THREAD */}
        <div className="xl:col-span-6">
          <PPanel className="flex h-[760px] flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-reps-border px-5 py-3.5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-reps-orange-soft text-[12px] font-semibold text-reps-orange">SJ</span>
                <div>
                  <div className="text-[14px] font-semibold text-white">Sarah Johnson</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-white/55">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online · 1:1 Strength · Week 5 of 12
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {[Phone, Video, Pin].map((I, i) => (
                  <button key={i} aria-label="Action" type="button" className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-reps-border bg-reps-panel-soft text-white/70 shadow-none hover:text-white">
                    <I className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-reps-ink/40 px-5 py-5">
              <div className="flex justify-center">
                <span className="rounded-full bg-reps-panel-soft px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/50">Today</span>
              </div>
              {THREAD.map((m, i) => <Bubble key={i} m={m} />)}
              <div className="flex justify-end">
                <span className="text-[10px] text-white/45 flex items-center gap-1">
                  Read <CheckCheck className="h-3 w-3 text-reps-orange" />
                </span>
              </div>
            </div>

            <div className="border-t border-reps-border p-3">
              <div className="flex items-end gap-2 rounded-[12px] border border-reps-border bg-reps-panel-soft p-2">
                <button aria-label="Attach" type="button" className="flex h-9 w-9 items-center justify-center rounded-[8px] text-white/60 hover:text-white"><Paperclip className="h-4 w-4" /></button>
                <button aria-label="Emoji" type="button" className="flex h-9 w-9 items-center justify-center rounded-[8px] text-white/60 hover:text-white"><Smile className="h-4 w-4" /></button>
                <textarea
                  rows={1}
                  placeholder="Write a reply to Sarah…"
                  className="flex-1 resize-none bg-transparent px-2 py-2 text-[13px] text-white placeholder:text-white/40 focus:outline-none"
                />
                <button type="button" className="flex h-9 items-center gap-1.5 rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white shadow-none hover:bg-reps-orange-hover">
                  <Send className="h-3.5 w-3.5" /> Send
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/55">
                <Sparkles className="h-3 w-3 text-reps-orange" /> Quick replies:
                {["Push Saturday cardio to Sunday", "Confirm tomorrow 09:30", "Send updated programme"].map((q) => (
                  <button key={q} className="rounded-full border border-reps-border bg-reps-panel px-2.5 py-1 font-medium text-white/75 hover:text-white">{q}</button>
                ))}
              </div>
            </div>
          </PPanel>
        </div>

        {/* CONTEXT */}
        <div className="space-y-6 xl:col-span-3">
          <PCard>
            <div className="flex flex-col items-center text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-reps-orange-soft text-[18px] font-bold text-reps-orange">SJ</span>
              <h3 className="mt-3 text-[15px] font-semibold text-white">Sarah Johnson</h3>
              <p className="text-[12px] text-white/55">Client since Feb 2026</p>
              <div className="mt-3 flex w-full gap-2">
                <button type="button" className="flex h-8 flex-1 items-center justify-center rounded-[10px] border border-reps-border bg-reps-panel-soft text-[12px] font-semibold text-white/85 shadow-none hover:text-white">View profile</button>
                <button type="button" className="flex h-8 flex-1 items-center justify-center rounded-[10px] bg-reps-orange text-[12px] font-semibold text-white shadow-none hover:bg-reps-orange-hover">Book session</button>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-center">
              {[
                { label: "Adherence", value: "85%" },
                { label: "Sessions", value: "23" },
                { label: "Weight Δ", value: "-3.2kg" },
                { label: "LTV", value: "£1,728" },
              ].map((s) => (
                <div key={s.label} className="rounded-[10px] border border-reps-border bg-reps-panel-soft px-2 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-white/50">{s.label}</div>
                  <div className="mt-1 text-[14px] font-bold text-white">{s.value}</div>
                </div>
              ))}
            </div>
          </PCard>

          <PCard>
            <h3 className="text-[14px] font-semibold text-white">Upcoming</h3>
            <ul className="mt-3 space-y-2">
              {[
                { icon: CalendarIcon, label: "Tomorrow 09:30 — Strength" },
                { icon: CreditCard, label: "29 Jun — Renewal £288" },
                { icon: Star, label: "Programme review — week 6" },
              ].map((u) => (
                <li key={u.label} className="flex items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 py-2 text-[12px] text-white/80">
                  <u.icon className="h-3.5 w-3.5 text-reps-orange" />
                  {u.label}
                </li>
              ))}
            </ul>
          </PCard>

          <PCard>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-[14px] font-semibold text-white">AI reply suggestion</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-white/65">
                  Sarah's volume has been high for 3 weeks. Suggest a deload reminder when confirming Sunday's cardio.
                </p>
                <button type="button" className="mt-3 flex h-8 items-center gap-1 rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white shadow-none hover:bg-reps-orange-hover">
                  Draft reply <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </PCard>
        </div>
      </div>
    </ProShell>
  );
}
