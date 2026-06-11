import { createFileRoute } from "@tanstack/react-router";
import { Paperclip, Send, Search } from "lucide-react";
import { ClientShell, PortalCard } from "@/components/portal/ClientShell";

export const Route = createFileRoute("/portal_/messages")({
  head: () => ({
    meta: [
      { title: "Messages — REPS Client Portal" },
      { name: "description", content: "Chat with your coach." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MessagesPage,
});

const THREADS = [
  { name: "James Carter", role: "Coach", last: "Nice session — add 2.5kg next week.", time: "2h", unread: 1, active: true },
  { name: "Support", role: "REPS", last: "Your invoice for May is ready.", time: "1d", unread: 0, active: false },
];

const MSGS = [
  { from: "coach", text: "How did the squats feel today?", time: "9:14" },
  { from: "me", text: "Solid — 4×6 @ 80kg all clean. Last set felt RPE 8.", time: "9:22" },
  { from: "coach", text: "Nice. Add 2.5kg next week and keep the same RPE target.", time: "9:24" },
  { from: "coach", text: "Also — let's bump protein to 175g on training days.", time: "9:25" },
  { from: "me", text: "Got it. Will update the meal plan tonight.", time: "9:31" },
];

function MessagesPage() {
  return (
    <ClientShell active="Messages" title="Messages" subtitle="Chat with your coach and the REPS team">
      <div className="grid h-[calc(100vh-9.5rem)] gap-5 lg:grid-cols-[320px_1fr]">
        <PortalCard className="overflow-hidden p-0">
          <div className="border-b border-reps-border p-3">
            <div className="flex h-9 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-ink px-2.5">
              <Search className="h-3.5 w-3.5 text-white/45" />
              <input placeholder="Search conversations…" className="flex-1 bg-transparent text-[12.5px] text-white placeholder:text-white/40 focus:outline-none" />
            </div>
          </div>
          <ul>
            {THREADS.map((t) => (
              <li
                key={t.name}
                className={`flex cursor-pointer items-start gap-3 border-b border-reps-border px-4 py-3 ${t.active ? "bg-reps-orange-soft/40" : "hover:bg-white/5"}`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-reps-orange text-[12px] font-semibold text-white">
                  {t.name.split(" ").map((s) => s[0]).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-[13px] font-semibold text-white">{t.name}</span>
                    <span className="text-[10.5px] text-white/45">{t.time}</span>
                  </div>
                  <div className="truncate text-[11.5px] text-white/60">{t.last}</div>
                </div>
                {t.unread > 0 && <span className="mt-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-reps-orange px-1 text-[10px] font-semibold text-white">{t.unread}</span>}
              </li>
            ))}
          </ul>
        </PortalCard>

        <PortalCard className="flex flex-col overflow-hidden p-0">
          <div className="flex items-center gap-3 border-b border-reps-border px-5 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-reps-orange text-[12px] font-semibold text-white">JC</div>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-semibold text-white">James Carter</div>
              <div className="text-[11.5px] text-reps-green">Online · Coach</div>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {MSGS.map((m, i) => (
              <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[70%] rounded-[16px] px-3.5 py-2 text-[13px] ${
                    m.from === "me"
                      ? "bg-reps-orange text-white"
                      : "border border-reps-border bg-reps-ink text-white/85"
                  }`}
                >
                  <div>{m.text}</div>
                  <div className={`mt-1 text-[10.5px] ${m.from === "me" ? "text-white/70" : "text-white/45"}`}>{m.time}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-reps-border p-3">
            <div className="flex items-center gap-2 rounded-[12px] border border-reps-border bg-reps-ink px-3 py-2">
              <button className="text-white/55 hover:text-white"><Paperclip className="h-4 w-4" /></button>
              <input placeholder="Message James…" className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/40 focus:outline-none" />
              <button className="inline-flex h-8 items-center gap-1.5 rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white">
                <Send className="h-3.5 w-3.5" /> Send
              </button>
            </div>
          </div>
        </PortalCard>
      </div>
    </ClientShell>
  );
}
