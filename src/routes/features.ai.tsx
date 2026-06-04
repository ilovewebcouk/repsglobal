import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Brain,
  ClipboardCheck,
  Dumbbell,
  PenTool,
  ScanLine,
  Sparkles,
  X,
  Check,
  ArrowRight,
} from "lucide-react";

import {
  FeatureGroupLayout,
  AINarrativeCard,
} from "@/components/features/FeatureGroupLayout";
import { AI_FEATURES } from "@/components/features/feature-config";
import heroAi from "@/assets/hero-ai-bg.jpg.asset.json";

export const Route = createFileRoute("/features/ai")({
  head: () => ({
    meta: [
      { title: "REPs AI Operating System — The AI layer behind your fitness business" },
      {
        name: "description",
        content:
          "Trainerize, MyPTHub and PT Distinction bolt AI on. REPs runs your business on it — programmes drafted, check-ins summarised, leads scored, risks flagged, next moves ranked.",
      },
      { property: "og:title", content: "REPs AI Operating System" },
      {
        property: "og:description",
        content: "Not just AI features. An AI operating layer for your fitness business.",
      },
      { property: "og:image", content: heroAi.url },
      { property: "og:url", content: "https://repsglobal.lovable.app/features/ai" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/features/ai" }],
  }),
  component: AIGroupPage,
});

const NARRATIVE = [
  {
    icon: Dumbbell,
    title: "Programmes, drafted in seconds",
    body: "Describe the client in one line. REPs writes the 12-week plan with the right exercises, sets and video demos. You tweak. You publish.",
  },
  {
    icon: ClipboardCheck,
    title: "Check-ins, read for you",
    body: "Six check-ins summarised into one card: the headline, the change to make, and who needs a human reply this week.",
  },
  {
    icon: ScanLine,
    title: "Leads, scored and answered",
    body: "Every enquiry scored on intent. Hot leads bumped to the top with a personalised first-draft reply ready to send.",
  },
  {
    icon: Sparkles,
    title: "Next Move, every Monday",
    body: "The single highest-leverage action this week — which package to push, which client to call, which day to open up.",
  },
  {
    icon: AlertTriangle,
    title: "Risk, flagged before it churns",
    body: "AI watches adherence, mood and check-in cadence — and tells you who's about to ghost before they do.",
  },
  {
    icon: PenTool,
    title: "Content, on tap and on-brand",
    body: "Posts, captions and lead magnets drafted in your tone of voice from a one-line brief. Approve and ship.",
  },
];

const COMPARE_ROWS = [
  ["AI programme writer", true, "Limited", "Limited", false, false],
  ["AI check-in summariser", true, false, false, false, false],
  ["AI lead scoring + reply drafts", true, false, false, false, false],
  ["AI client risk alerts", true, false, false, false, false],
  ["Weekly Next Move cards", true, false, false, false, false],
  ["AI content studio", true, false, false, false, false],
] as const;

function AIGroupPage() {
  return (
    <FeatureGroupLayout
      groupKey="ai"
      heroLead="Not just AI features."
      heroAccent="An AI operating layer for your whole business."
      heroImage={{
        src: heroAi.url,
        alt: "REPs-verified coach reviewing an AI-drafted programme on a tablet at a premium boutique gym at dusk",
      }}
    >
      {/* NARRATIVE — 6 cards */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <div className="max-w-[720px]">
            <span className="inline-flex items-center gap-2 rounded-full bg-reps-orange-soft px-3 py-1 text-[12px] font-semibold text-reps-orange">
              <Brain className="h-3.5 w-3.5" /> The AI operating layer
            </span>
            <h2 className="mt-4 font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]">
              The AI layer behind your fitness business.
            </h2>
            <p className="mt-3 text-[15.5px] leading-relaxed text-white/70">
              REPs isn't an app with AI bolted on. It's an operating layer that drafts your
              programmes, reads your check-ins, scores your leads, flags your risks and
              ranks your next moves — so you stay the coach, and the admin runs itself.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {NARRATIVE.map((n) => (
              <AINarrativeCard key={n.title} icon={n.icon} title={n.title} body={n.body} />
            ))}
          </div>
        </div>
      </section>

      {/* 14-ITEM GRID */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <div className="max-w-[620px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
              Every AI capability
            </span>
            <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-white lg:text-[34px]">
              14 AI capabilities, one platform.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {AI_FEATURES.map((f) => (
              <div
                key={f.slug}
                className="flex h-full flex-col rounded-[16px] border border-reps-border bg-reps-panel p-5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-display text-[15px] font-bold text-white">
                  {f.label}
                </h3>
                <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-white/65">
                  {f.oneLiner}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {f.includedIn.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-reps-orange-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-reps-orange"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MINI COMPARE */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <div className="max-w-[620px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
              How REPs AI compares
            </span>
            <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-white lg:text-[34px]">
              Nobody else runs your business on AI.
            </h2>
            <p className="mt-3 text-[14.5px] leading-relaxed text-white/65">
              The competition has form-builders with an AI button. REPs has an AI operating
              layer that touches every part of your day.
            </p>
          </div>
          <div className="mt-8 overflow-x-auto rounded-[18px] border border-reps-border">
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <thead className="bg-reps-panel/60 text-[11px] uppercase tracking-wider text-white/55">
                <tr>
                  <th className="px-4 py-3 font-semibold">Capability</th>
                  <th className="px-4 py-3 font-semibold text-reps-orange">REPs</th>
                  <th className="px-4 py-3 font-semibold">Trainerize</th>
                  <th className="px-4 py-3 font-semibold">My PT Hub</th>
                  <th className="px-4 py-3 font-semibold">PT Distinction</th>
                  <th className="px-4 py-3 font-semibold">Kahunas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-reps-border">
                {COMPARE_ROWS.map((row) => (
                  <tr key={row[0] as string} className="bg-reps-panel/20">
                    {row.map((cell, i) => (
                      <td key={i} className="px-4 py-3 text-white/85">
                        {i === 0 ? (
                          <span className="font-semibold text-white">{cell}</span>
                        ) : cell === true ? (
                          <Check className="h-4 w-4 text-reps-orange" />
                        ) : cell === false ? (
                          <X className="h-4 w-4 text-white/30" />
                        ) : (
                          <span className="text-white/65">{cell}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 text-center">
            <Link
              to="/compare"
              className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-white/25 px-5 text-[13px] font-semibold text-white hover:bg-white/10"
            >
              See the full comparison <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </FeatureGroupLayout>
  );
}
