import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, BarChart3, Calendar, Check, Sparkles, Star, TrendingUp, Users } from "lucide-react";

import { FeatureGroupLayout } from "@/components/features/FeatureGroupLayout";
import heroGrowth from "@/assets/hero-growth-bg.jpg.asset.json";

export const Route = createFileRoute("/features/growth")({
  head: () => ({
    meta: [
      { title: "Growth — One move to grow this month · REPs" },
      {
        name: "description",
        content:
          "Revenue, retention and churn risk surfaced as a Monday-morning card — not a dashboard you have to read. The one move to grow your practice this month, ranked by impact.",
      },
      { property: "og:title", content: "Growth — REPs for Professionals" },
      {
        property: "og:description",
        content: "The one move to grow this month — ranked by impact.",
      },
      { property: "og:image", content: heroGrowth.url },
      { property: "og:url", content: "https://repsglobal.lovable.app/features/growth" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/features/growth" }],
  }),
  component: GrowthPillar,
});

function GrowthPillar() {
  return (
    <FeatureGroupLayout
      groupKey="growth"
      heroLead="You're a coach. Not a data analyst."
      heroAccent="Here's the one move to make this month."
      heroImage={{
        src: heroGrowth.url,
        alt: "REPs-verified studio owner standing in the doorway of her boutique studio at dusk",
      }}
    >
      {/* MONDAY MORNING CARD */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
                The Monday morning card
              </span>
              <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[38px]">
                One card. One move. Read in 90 seconds.
              </h2>
              <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
                Every Monday, REPs writes you one card. Not a dashboard. Not a 12-tab spreadsheet. One ranked action — the single highest-impact thing you could do this week — backed by the numbers it came from.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Ranked by impact on monthly revenue — not vanity metrics.",
                  "Always shows the working — \"here's the four clients this is based on.\"",
                  "Ignored last week's? It tells you whether it still matters.",
                  "One tap drafts the message, books the call, or fires the renewal email.",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-[14.5px] text-white/85">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[22px] border border-reps-orange-border bg-reps-panel p-7 ring-1 ring-reps-orange/20">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
                <Sparkles className="h-3.5 w-3.5" /> Monday · 8 June
              </div>
              <h3 className="mt-4 font-display text-[22px] font-bold leading-tight text-white">
                Reach out to 3 clients due to renew this month.
              </h3>
              <p className="mt-3 text-[14px] leading-relaxed text-white/70">
                Sarah K, Tom B and Priya R all hit their 12-week milestone this Friday. Two of them have above-average adherence. A 5-minute call now is worth roughly <span className="font-semibold text-white">£1,440 over the next quarter</span>.
              </p>
              <div className="mt-5 flex gap-2">
                <button className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-hover">
                  Draft the messages <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button className="inline-flex h-10 items-center rounded-[10px] border border-white/20 px-4 text-[13px] font-semibold text-white shadow-none hover:bg-white/10">
                  Show the working
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RETENTION & CHURN */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
          <div className="max-w-[680px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              Retention before it bites
            </span>
            <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[38px]">
              Clients don't ghost overnight. We spot it three weeks early.
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
              Adherence sliding. Check-ins slipping. Messages getting shorter. By the time a client cancels, you've usually already lost them. REPs flags it while there's still a session to salvage.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { icon: AlertTriangle, title: "Churn risk, ranked", body: "Top three clients most likely to cancel this month. Why. What to do about it." },
              { icon: Calendar, title: "Renewal radar", body: "Every package and membership coming up — so you start the renewal conversation, not the client." },
              { icon: Users, title: "Cohort revenue", body: "What's happening with the clients you signed in January, vs March. Where retention is leaking." },
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

      {/* REVIEWS + REPORTING */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
          <div className="max-w-[680px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              The stuff that compounds
            </span>
            <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[38px]">
              Reviews. Referrals. Reporting.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { icon: Star, title: "Verified reviews on autopilot", body: "After a client hits their 8-week milestone, REPs asks for a review. They write it once. It shows on your directory profile, your shop-front, and Google." },
              { icon: TrendingUp, title: "Referral tracking", body: "When a client refers a friend, the trail is logged. You see who's actually sending you work — and can say thank you." },
              { icon: BarChart3, title: "Reports for your accountant", body: "Monthly revenue, by tier, by client, by payment method. Exportable. No spreadsheet wizardry required." },
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
          <div className="mt-10">
            <Link
              to="/features/ai"
              className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-reps-orange hover:underline"
            >
              See how REPs AI builds the Monday card <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </FeatureGroupLayout>
  );
}
