import { createFileRoute } from "@tanstack/react-router";
import { Scale, Camera, CheckCircle2, LineChart } from "lucide-react";
import { ClientShell, PortalCard } from "@/components/portal/ClientShell";

export const Route = createFileRoute("/portal_/check-ins")({
  head: () => ({
    meta: [
      { title: "Check-ins — REPS Client Portal" },
      { name: "description", content: "Weekly progress, photos and metrics." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckInsPage,
});

function CheckInsPage() {
  const weights = [69.4, 69.1, 68.9, 68.8, 68.5, 68.4];
  const max = Math.max(...weights);
  const min = Math.min(...weights);
  const norm = (v: number) => 100 - ((v - min) / (max - min || 1)) * 100;

  return (
    <ClientShell active="Check-ins" title="Check-ins" subtitle="Weekly · next due tomorrow">
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <PortalCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-reps-orange-soft text-reps-orange"><Scale className="h-3.5 w-3.5" /></span>
              <span className="text-[13.5px] font-semibold text-white">This week's check-in</span>
            </div>
            <span className="text-[11.5px] text-white/55">Due Mon 1 Jun</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { l: "Weight", v: "68.4 kg", d: "−0.3" },
              { l: "Sleep avg", v: "7h 12m", d: "+18m" },
              { l: "Energy", v: "7.8 /10", d: "+0.4" },
              { l: "Soreness", v: "3 /10", d: "−1" },
            ].map((s) => (
              <div key={s.l} className="rounded-[12px] border border-reps-border bg-reps-ink p-3">
                <div className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-white/55">{s.l}</div>
                <div className="mt-1 text-[15px] font-semibold text-white">{s.v}</div>
                <div className="text-[11px] font-medium text-reps-green">{s.d} vs last</div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[12px] border border-reps-border bg-reps-ink p-4">
            <div className="mb-2 flex items-center gap-2 text-[12.5px] font-medium text-white/80">
              <LineChart className="h-4 w-4 text-reps-orange" /> Weight · last 6 weeks
            </div>
            <svg viewBox="0 0 300 80" className="h-24 w-full">
              <polyline
                fill="none"
                stroke="#ff6a00"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={weights.map((v, i) => `${(i / (weights.length - 1)) * 300},${norm(v) * 0.7 + 5}`).join(" ")}
              />
            </svg>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {["Front", "Side", "Back"].map((p) => (
              <div key={p} className="aspect-[3/4] rounded-[16px] border border-dashed border-reps-border bg-reps-ink/60 p-3 text-center">
                <div className="flex h-full flex-col items-center justify-center text-white/45">
                  <Camera className="h-5 w-5" />
                  <div className="mt-2 text-[11.5px] font-medium">{p} photo</div>
                  <div className="text-[10.5px] text-white/35">Tap to upload</div>
                </div>
              </div>
            ))}
          </div>

          <button className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-reps-orange text-[13.5px] font-semibold text-white hover:bg-reps-orange-hover">
            <CheckCircle2 className="h-4 w-4" /> Submit weekly check-in
          </button>
        </PortalCard>

        <PortalCard>
          <div className="text-[13.5px] font-semibold text-white">History</div>
          <ul className="mt-3 space-y-2">
            {[
              { w: "Week 6", date: "Sun 24 May", wt: "68.7 kg", note: "Strong squat session." },
              { w: "Week 5", date: "Sun 17 May", wt: "69.0 kg", note: "Travel — adherence 80%." },
              { w: "Week 4", date: "Sun 10 May", wt: "69.2 kg", note: "Hit PB on deadlift." },
              { w: "Week 3", date: "Sun  3 May", wt: "69.5 kg", note: "Sleep down, energy 6/10." },
            ].map((row) => (
              <li key={row.w} className="rounded-[12px] border border-reps-border bg-reps-ink p-3">
                <div className="flex items-center justify-between">
                  <div className="text-[12.5px] font-medium text-white">{row.w}</div>
                  <div className="text-[11.5px] text-white/55">{row.date} · {row.wt}</div>
                </div>
                <div className="mt-1 text-[12px] text-white/65">{row.note}</div>
              </li>
            ))}
          </ul>
        </PortalCard>
      </div>
    </ClientShell>
  );
}
