import { createFileRoute, Link } from "@tanstack/react-router";
import { Apple, ArrowRight, Camera, Check, Clock, Dumbbell, MessageSquare, PlayCircle, Repeat, Sparkles } from "lucide-react";

import { FeatureGroupLayout } from "@/components/features/FeatureGroupLayout";
import heroCoaching from "@/assets/hero-coaching-bg.jpg.asset.json";

export const Route = createFileRoute("/features/coaching")({
  head: () => ({
    meta: [
      { title: "Coaching — Programmes, check-ins and nutrition · REPs" },
      {
        name: "description",
        content:
          "The Trainerize-class coaching stack — programmes, nutrition and 60-second check-ins — wired into the same client record as your bookings and payments.",
      },
      { property: "og:title", content: "Coaching — REPs for Professionals" },
      {
        property: "og:description",
        content: "Programmes, nutrition and check-ins, built for coaches.",
      },
      { property: "og:image", content: heroCoaching.url },
      { property: "og:url", content: "https://repsglobal.lovable.app/features/coaching" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/features/coaching" }],
  }),
  component: CoachingPillar,
});

function CoachingPillar() {
  return (
    <FeatureGroupLayout
      groupKey="coaching"
      heroLead="The coaching app your clients"
      heroAccent="will actually open on a Tuesday."
      heroImage={{
        src: heroCoaching.url,
        alt: "REPs-verified coach cueing a kettlebell squat with a client at a premium boutique gym at dusk",
      }}
    >
      {/* PROGRAMMES */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
          <div className="max-w-[680px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              Programmes
            </span>
            <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[38px]">
              Programmes that don't feel like homework.
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
              Build a 12-week block in an afternoon, not a weekend. Drag-and-drop sessions, video demos on every exercise, and one-tap swaps when a client says "the lat pulldown's taken — what now?"
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { icon: Dumbbell, title: "Build once, reuse forever", body: "Templates for your common goals — hypertrophy, fat loss, prep, return-to-lifting. Tweak per client, don't start from scratch." },
              { icon: PlayCircle, title: "Video on every move", body: "1,200+ stock demos, or upload your own cueing. Clients see what good looks like, on the gym floor." },
              { icon: Repeat, title: "Swap on the fly", body: "Bench taken? Cable broken? One tap swaps for a working alternative — no WhatsApp panic." },
            ].map((s) => (
              <div key={s.title} className="rounded-[18px] border border-reps-border bg-reps-panel p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <s.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-[17px] font-bold text-white">{s.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CHECK-INS */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
                Weekly check-ins
              </span>
              <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[38px]">
                A check-in that takes 60 seconds. Not a Google Form they ignore.
              </h2>
              <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
                Weight, sleep, energy, adherence — four taps. Photos optional, dropped straight in. You see this week vs last week side-by-side, with the AI summary at the top: <em>"Sarah's down 0.6kg, sleep up two hours, adherence 90%. She's asking about adding a fourth session."</em>
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Custom questions per client — strength clients get RPE, fat-loss clients get hunger.",
                  "Photo timeline with metric overlays — actually motivating, not just numbers.",
                  "Adherence streak that flags when a client misses two weeks running.",
                  "All six check-ins read by AI on Monday — top of your inbox, ranked by who needs you.",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-[14.5px] text-white/85">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[22px] border border-reps-border bg-reps-panel p-6">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                <Clock className="h-3.5 w-3.5 text-reps-orange" /> Week 8 of 12 · Sarah K
              </div>
              <div className="mt-4 space-y-3">
                {[
                  { k: "Weight", v: "72.4kg", d: "−0.6kg" },
                  { k: "Sleep avg", v: "7h 20m", d: "+2h" },
                  { k: "Adherence", v: "90%", d: "+15%" },
                  { k: "Energy (1–10)", v: "8", d: "+1" },
                ].map((r) => (
                  <div key={r.k} className="flex items-center justify-between rounded-[10px] border border-reps-border bg-reps-ink/40 px-4 py-3">
                    <span className="text-[13px] text-white/70">{r.k}</span>
                    <span className="flex items-baseline gap-2">
                      <span className="font-display text-[16px] font-bold text-white">{r.v}</span>
                      <span className="text-[12px] font-semibold text-reps-orange">{r.d}</span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-[10px] border border-reps-orange-border bg-reps-orange-soft/40 p-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
                  <Sparkles className="h-3.5 w-3.5" /> AI summary
                </div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/85">
                  Sarah's progressing well. She's asked twice about adding a fourth session — worth a 5-min reply today.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NUTRITION + MESSAGES */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
          <div className="max-w-[680px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              The rest of the stack
            </span>
            <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[38px]">
              Nutrition and messages. Same client record.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {[
              { icon: Apple, title: "Nutrition without the spreadsheet", body: "Macros generated from goal, weight and activity. Meal templates clients can swap from — not a 40-page PDF nobody opens. Allergies and dietary preferences respected." },
              { icon: MessageSquare, title: "Messages off your personal phone", body: "A focused client inbox that isn't WhatsApp. Quiet hours so you stop replying at 11pm. AI drafts the first reply in your tone — you approve and send." },
              { icon: Camera, title: "Photos on the timeline", body: "Front, side, back — uploaded in the check-in, dropped onto the timeline with the metric overlay. Clients see the change. So do you." },
              { icon: Check, title: "One client record, end-to-end", body: "Sessions booked, payments taken, programme delivered, check-ins logged, nutrition tracked — all on one page. No tab-hopping." },
            ].map((s) => (
              <div key={s.title} className="flex gap-4 rounded-[18px] border border-reps-border bg-reps-panel p-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <s.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-[17px] font-bold text-white">{s.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link
              to="/features/ai"
              className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-reps-orange hover:underline"
            >
              See how REPs AI reads check-ins for you <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </FeatureGroupLayout>
  );
}
