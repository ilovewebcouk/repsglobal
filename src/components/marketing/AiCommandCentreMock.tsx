import { AlertTriangle, ArrowUpRight, Sparkles, Wand2 } from "lucide-react";

// Static placeholder visual for the AI hero moment — a stack of three "operating system" cards.
// No data, no logic — just a tactile preview of what REPs AI surfaces.
export function AiCommandCentreMock() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-10 rounded-[24px] bg-[radial-gradient(60%_50%_at_50%_30%,rgba(255,122,0,0.26),transparent_70%)] blur-2xl"
      />
      <div className="relative rounded-[22px] border border-reps-border bg-reps-panel/50 p-4 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.7)] lg:p-5">
        {/* OS chrome strip */}
        <div className="mb-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-reps-orange shadow-[0_0_8px_rgba(255,122,0,0.8)]" />
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/70">
              REPs AI · Live
            </span>
          </div>
          <span className="text-[10.5px] text-white/40">Mon 09:14</span>
        </div>
        <div className="grid gap-4">
        {/* Next Move card — primary */}
        <div className="rounded-[18px] border border-reps-orange-border bg-gradient-to-br from-reps-orange-soft to-reps-panel p-6 shadow-[0_20px_60px_-30px_rgba(255,122,0,0.5)]">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
            <Sparkles className="h-3.5 w-3.5" /> Next Move · Monday
          </div>
          <div className="mt-3 font-display text-[20px] font-bold leading-tight text-white">
            Raise your 1:1 rate to £85 for new clients.
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-white/70">
            Your last 12 enquiries converted at 67%. You're under-priced for your area by ~£12/session.
          </p>
          <div className="mt-4 flex items-center justify-between text-[11.5px]">
            <span className="text-white/55">Estimated impact</span>
            <span className="font-semibold text-reps-orange">+£480/mo</span>
          </div>
        </div>

        {/* Side-by-side: risk + writer */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[16px] border border-reps-border bg-reps-panel/80 p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/55">
              <AlertTriangle className="h-3.5 w-3.5 text-reps-orange" /> Risk alert
            </div>
            <div className="mt-2 text-[13px] font-semibold text-white">3 clients off-track</div>
            <p className="mt-1 text-[11.5px] leading-snug text-white/55">
              Adherence below 60% this week. Drafted check-in ready.
            </p>
            <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-reps-orange">
              Review queue <ArrowUpRight className="h-3 w-3" />
            </div>
          </div>
          <div className="rounded-[16px] border border-reps-border bg-reps-panel/80 p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/55">
              <Wand2 className="h-3.5 w-3.5 text-reps-orange" /> Programme writer
            </div>
            <div className="mt-2 text-[13px] font-semibold text-white">"12wk hypertrophy, 4×/wk"</div>
            <p className="mt-1 text-[11.5px] leading-snug text-white/55">
              Drafted · 48 sessions · video demos attached
            </p>
            <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-reps-orange">
              Open draft <ArrowUpRight className="h-3 w-3" />
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

