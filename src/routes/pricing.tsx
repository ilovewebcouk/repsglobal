import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Fragment, useState } from "react";
import { Check, Minus, Sparkles, Star, Users, Building2, ShieldCheck, Eye, LayoutGrid } from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { createCheckoutSession } from "@/lib/billing/billing.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — REPs · Free to list, verified to be trusted, pro to run your business" },
      {
        name: "description",
        content:
          "Free to list. £99/year to get verified. £29/mo Founding Pro to run bookings, clients and programmes. Studio and Enterprise for teams.",
      },
      { property: "og:title", content: "Pricing — REPs" },
      {
        property: "og:description",
        content: "Free profile, Verified trust, Pro operating system. Founding pricing available before public launch.",
      },
      { property: "og:url", content: "/pricing" },
    ],
    links: [{ rel: "canonical", href: "/pricing" }],
  }),
  component: PricingPage,
});

type Billing = "monthly" | "annual";

type PriceView = { price: string; was?: string; period: string; meta?: string };

type PlanTierKey = "free" | "verified" | "pro" | "business";

type PlanCard = {
  tier: string;
  tierKey: PlanTierKey;
  desc: string;
  cta: string;
  ctaHref: string;
  founding?: boolean;
  featured?: boolean;
  features: string[];
  pricing: Record<Billing, PriceView>;
};

const PLANS: PlanCard[] = [
  {
    tier: "Free Profile",
    tierKey: "free",
    desc: "Get listed. Get found.",
    cta: "Create free profile",
    ctaHref: "/signup",
    features: [
      "Basic public profile",
      "Claim flow",
      "Category & location listing",
      "Unverified status badge",
    ],
    pricing: {
      monthly: { price: "£0", period: "Free forever" },
      annual: { price: "£0", period: "Free forever" },
    },
  },
  {
    tier: "Verified",
    tierKey: "verified",
    desc: "Monetise your professional trust.",
    cta: "Get verified",
    ctaHref: "/signup",
    features: [
      "Verified badge",
      "Credentials displayed",
      "Reviews enabled",
      "Enhanced directory profile",
      "Enquiries inbox",
    ],
    pricing: {
      monthly: { price: "£12", period: "per month", meta: "Billed monthly" },
      annual: { price: "£8.25", period: "per month", meta: "£99 billed yearly · 2 months free" },
    },
  },
  {
    tier: "Pro",
    tierKey: "pro",
    desc: "Run your full coaching practice.",
    cta: "Start Founding Pro",
    ctaHref: "/signup",
    founding: true,
    featured: true,
    features: [
      "Everything in Verified",
      "Leads CRM",
      "Client management",
      "Bookings & calendar",
      "Programmes",
      "Basic nutrition",
      "Check-ins",
      "Messaging inbox",
    ],
    pricing: {
      monthly: { price: "£29", was: "£39", period: "per month", meta: "Billed monthly" },
      annual: { price: "£24", was: "£32", period: "per month", meta: "£290 billed yearly · 2 months free" },
    },
  },
  {
    tier: "Business",
    tierKey: "business",
    desc: "Scale online and hybrid coaching.",
    cta: "Start Founding Business",
    ctaHref: "/signup",
    founding: true,
    features: [
      "Everything in Pro",
      "AI insights",
      "Advanced check-ins",
      "Automations",
      "Content studio",
      "Enhanced directory placement",
    ],
    pricing: {
      monthly: { price: "£59", was: "£79", period: "per month", meta: "Billed monthly" },
      annual: { price: "£49", was: "£66", period: "per month", meta: "£590 billed yearly · 2 months free" },
    },
  },
];

const STUDIO_PRICING: Record<Billing, PriceView> = {
  monthly: { price: "£149", period: "per month", meta: "Billed monthly" },
  annual: { price: "£124", period: "per month", meta: "£1,490 billed yearly · 2 months free" },
};


type TierKey = "verified" | "pro" | "business" | "studio";
type CellValue = boolean | string;

type CompareGroup = {
  title: string;
  rows: { label: string; verified: CellValue; pro: CellValue; business: CellValue; studio: CellValue }[];
};

const COMPARE_GROUPS: CompareGroup[] = [
  {
    title: "Billing",
    rows: [
      { label: "Monthly price", verified: "£12", pro: "£29", business: "£59", studio: "£149" },
      { label: "Annual price (per month)", verified: "£8.25", pro: "£24", business: "£49", studio: "£124" },
      { label: "Save with annual", verified: "2 months free", pro: "2 months free", business: "2 months free", studio: "2 months free" },
    ],
  },
  {
    title: "Profile & visibility",
    rows: [
      { label: "Public directory listing", verified: true, pro: true, business: true, studio: true },
      { label: "Verified badge", verified: true, pro: true, business: true, studio: true },
      { label: "Enhanced directory placement", verified: false, pro: false, business: true, studio: true },
      { label: "Organisation profile", verified: false, pro: false, business: false, studio: true },
      { label: "Multiple locations", verified: false, pro: false, business: false, studio: true },
    ],
  },
  {
    title: "Clients & enquiries",
    rows: [
      { label: "Reviews", verified: true, pro: true, business: true, studio: true },
      { label: "Enquiries inbox", verified: true, pro: true, business: true, studio: true },
      { label: "Leads CRM", verified: false, pro: true, business: true, studio: true },
      { label: "Client management", verified: false, pro: true, business: true, studio: true },
      { label: "Shared clients across coaches", verified: false, pro: false, business: false, studio: true },
    ],
  },
  {
    title: "Coaching delivery",
    rows: [
      { label: "Bookings & calendar", verified: false, pro: true, business: true, studio: true },
      { label: "Programmes", verified: false, pro: true, business: true, studio: true },
      { label: "Basic nutrition", verified: false, pro: true, business: true, studio: true },
      { label: "Check-ins", verified: false, pro: "Basic", business: "Advanced", studio: "Advanced" },
      { label: "Messaging inbox", verified: false, pro: true, business: true, studio: true },
    ],
  },
  {
    title: "Growth & automation",
    rows: [
      { label: "Content studio", verified: false, pro: false, business: true, studio: true },
      { label: "Automations", verified: false, pro: false, business: true, studio: true },
      { label: "AI insights", verified: false, pro: false, business: true, studio: true },
    ],
  },
  {
    title: "Teams & operations",
    rows: [
      { label: "Multi-coach roles", verified: false, pro: false, business: false, studio: true },
      { label: "Reporting", verified: false, pro: false, business: false, studio: true },
      { label: "Coach seats included", verified: "—", pro: "1", business: "1", studio: "5" },
    ],
  },
  {
    title: "Support",
    rows: [
      { label: "Verification speed", verified: "Standard", pro: "Priority", business: "Priority", studio: "Priority" },
      { label: "Account manager", verified: false, pro: false, business: false, studio: true },
    ],
  },
];

const TIER_META: Record<TierKey, { label: string; price: string }> = {
  verified: { label: "Verified", price: "£99/yr" },
  pro: { label: "Pro", price: "£29/mo" },
  business: { label: "Business", price: "£59/mo" },
  studio: { label: "Studio", price: "£149/mo" },
};

const FAQ = [
  {
    q: "Is REPs really free to join?",
    a: "Yes. A Free Profile gives you a claimable public listing forever — clients can find you in the directory. Verified (£99/year) unlocks the verified badge, reviews and enquiries.",
  },
  {
    q: "What's the difference between Verified and Pro?",
    a: "Verified is about trust and visibility — credentials, reviews, enhanced directory profile. Pro adds the operating system to actually run your practice: bookings, CRM, programmes, check-ins and messaging.",
  },
  {
    q: "How does verification work?",
    a: "Upload your qualifications, insurance and any CPD. Our team reviews within 24 hours. You'll see a Verified badge on your profile once approved.",
  },
  {
    q: "What does REPs take per booking?",
    a: "On Pro and above, REPs takes 15% of each booking made through the platform. Stripe fees are included.",
  },
  {
    q: "Will founding pricing stay forever?",
    a: "Yes. Founding member pricing is locked for the lifetime of your subscription — but it's only available before public launch and to a limited number of professionals.",
  },
  {
    q: "Can I switch between monthly and annual?",
    a: "Yes, anytime from your dashboard. Annual saves you 2 months versus monthly.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Plans are monthly or annual and you can downgrade or cancel from your dashboard at any time.",
  },
];

function Cell({ value, dim = false }: { value: CellValue; dim?: boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-reps-orange-soft text-reps-orange">
        <Check className="h-3 w-3" />
      </span>
    );
  }
  if (value === false) {
    return <Minus className="h-3.5 w-3.5 text-white/25" />;
  }
  return <span className={`text-[13px] ${dim ? "text-white/55" : "text-white/80"}`}>{value}</span>;
}

function PricingPage() {
  const [activeTier, setActiveTier] = useState<TierKey>("pro");
  const [billing, setBilling] = useState<Billing>("annual");
  const [checkoutTier, setCheckoutTier] = useState<PlanTierKey | null>(null);
  const navigate = useNavigate();
  const startCheckout = useServerFn(createCheckoutSession);

  async function handlePaidCta(tierKey: Exclude<PlanTierKey, "free">) {
    setCheckoutTier(tierKey);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        navigate({
          to: "/signup",
          search: { tier: tierKey, period: billing, next: "checkout" } as never,
        });
        return;
      }
      const result = await startCheckout({ data: { tier: tierKey, period: billing } });
      if (result?.url) {
        window.location.href = result.url;
      } else {
        toast.error("Could not start checkout. Please try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setCheckoutTier(null);
    }
  }


  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      {/* Hero */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1100px] px-6 py-20 text-center lg:px-10 lg:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
            <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> Pricing
          </span>
          <h1 className="mt-5 font-display text-[44px] font-bold leading-tight text-white lg:text-[56px]">
            Free to list. Verified to be trusted.
            <br />
            Pro to run your business.
          </h1>
          <p className="mx-auto mt-4 max-w-[620px] text-[16px] text-white/65">
            REPs isn't another coaching app. It's a public register, a trust layer and an operating system — priced so every professional can start free and grow.
          </p>
        </div>
      </section>

      {/* Founding banner */}
      <section className="border-b border-reps-border bg-reps-panel/40">
        <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-3 px-6 py-4 text-center lg:flex-row lg:px-10 lg:text-left">
          <div className="flex items-center gap-3 text-[14px] text-white/85">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-reps-orange-border bg-reps-orange-soft px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
              <Star className="h-3 w-3 fill-reps-orange" /> Founding members
            </span>
            <span>
              Lock in <span className="font-semibold text-white">£29/mo Pro</span> or{" "}
              <span className="font-semibold text-white">£59/mo Business</span> before public launch.
            </span>
          </div>
          <span className="text-[12px] text-white/55">Limited spots · price locked for life</span>
        </div>
      </section>

      {/* Plan cards */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10">
          {/* Monthly / Annual toggle */}
          <div className="mb-10 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel p-1">
              {(["monthly", "annual"] as Billing[]).map((b) => {
                const active = billing === b;
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBilling(b)}
                    className={
                      active
                        ? "flex h-9 items-center gap-2 rounded-full bg-reps-orange px-5 text-[13px] font-semibold text-white"
                        : "flex h-9 items-center gap-2 rounded-full px-5 text-[13px] font-semibold text-white/65 hover:text-white"
                    }
                  >
                    {b === "monthly" ? "Monthly" : "Annual"}
                    {b === "annual" && (
                      <span
                        className={
                          active
                            ? "rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
                            : "rounded-full border border-reps-orange-border bg-reps-orange-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-reps-orange"
                        }
                      >
                        Save 2 months
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((p) => {
              const view = p.pricing[billing];
              return (
              <div
                key={p.tier}
                className={
                  p.featured
                    ? "relative flex flex-col rounded-[22px] border-2 border-reps-orange bg-reps-panel p-7"
                    : "relative flex flex-col rounded-[22px] border border-reps-border bg-reps-panel p-7"
                }
              >
                {p.featured && (
                  <span className="absolute -top-3 left-7 inline-flex items-center gap-1 rounded-full bg-reps-orange px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                    <Star className="h-3 w-3 fill-white" /> Most popular
                  </span>
                )}

                <h2 className="font-display text-[20px] font-bold text-white">{p.tier}</h2>
                <p className="mt-1 text-[13px] text-white/55">{p.desc}</p>

                <div className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  {view.was && (
                    <span className="text-[16px] font-medium text-white/35 line-through">{view.was}</span>
                  )}
                  <span className="font-display text-[38px] font-bold text-white">{view.price}</span>
                  <span className="text-[12px] text-white/55">{view.period}</span>
                </div>
                {view.meta && (
                  <div className="mt-1 text-[12px] text-white/55">{view.meta}</div>
                )}
                {p.founding && (
                  <div className="mt-3">
                    <span className="inline-flex items-center gap-1 rounded-full border border-reps-orange-border bg-reps-orange-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-reps-orange">
                      Founding price — limited
                    </span>
                  </div>
                )}

                <Link
                  to={p.ctaHref}
                  className={
                    p.featured
                      ? "mt-6 flex h-11 items-center justify-center rounded-[10px] bg-reps-orange text-[13px] font-semibold text-white hover:bg-reps-orange-hover"
                      : "mt-6 flex h-11 items-center justify-center rounded-[10px] border border-white/20 text-[13px] font-semibold text-white hover:bg-white/10"
                  }
                >
                  {p.cta}
                </Link>

                <ul className="mt-6 space-y-2.5 text-[13px]">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-white/75">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-reps-orange-soft text-reps-orange">
                        <Check className="h-3 w-3" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              );
            })}
          </div>

          {/* Teams & organisations strip */}
          <div className="mt-10 overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel">
            <div className="grid gap-px bg-reps-border md:grid-cols-2">
              <div className="flex flex-col bg-reps-panel p-7">
                <div className="flex items-center gap-2 text-white/55">
                  <Users className="h-4 w-4" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider">For teams</span>
                </div>
                <h3 className="mt-2 font-display text-[22px] font-bold text-white">Studio</h3>
                <p className="mt-1 text-[13px] text-white/55">Teams, gyms and multi-coach businesses.</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-display text-[28px] font-bold text-white">{STUDIO_PRICING[billing].price}</span>
                  <span className="text-[12px] text-white/55">{STUDIO_PRICING[billing].period}</span>
                </div>
                {STUDIO_PRICING[billing].meta && (
                  <div className="mt-1 text-[12px] text-white/55">{STUDIO_PRICING[billing].meta}</div>
                )}
                <ul className="mt-4 grid grid-cols-1 gap-x-4 gap-y-1.5 text-[13px] text-white/75 sm:grid-cols-2">
                  {["Multi-coach roles", "Organisation profile", "Shared clients", "Locations", "Reporting"].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-reps-orange" /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/contact"
                  className="mt-5 inline-flex h-10 w-fit items-center justify-center rounded-[10px] border border-white/20 px-4 text-[13px] font-semibold text-white hover:bg-white/10"
                >
                  Talk to sales
                </Link>
              </div>

              <div className="flex flex-col bg-reps-panel p-7">
                <div className="flex items-center gap-2 text-white/55">
                  <Building2 className="h-4 w-4" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider">For organisations</span>
                </div>
                <h3 className="mt-2 font-display text-[22px] font-bold text-white">Enterprise</h3>
                <p className="mt-1 text-[13px] text-white/55">Chains, education providers and associations.</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-display text-[28px] font-bold text-white">Custom</span>
                  <span className="text-[12px] text-white/55">talk to us</span>
                </div>
                <ul className="mt-4 grid grid-cols-1 gap-x-4 gap-y-1.5 text-[13px] text-white/75 sm:grid-cols-2">
                  {["Bulk verification", "API access", "Migration", "SSO", "Custom onboarding", "SLAs"].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-reps-orange" /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/contact"
                  className="mt-5 inline-flex h-10 w-fit items-center justify-center rounded-[10px] border border-white/20 px-4 text-[13px] font-semibold text-white hover:bg-white/10"
                >
                  Contact us
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-[13px] text-white/55">
            Clients always search REPs for free. Pricing applies to professionals only.
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10">
          <div className="text-center">
            <h2 className="font-display text-[32px] font-bold text-white">Compare every feature</h2>
            <p className="mx-auto mt-3 max-w-[560px] text-[14px] text-white/65">
              Side-by-side detail for Verified, Pro, Business and Studio. Free Profile and Enterprise sit either side.
            </p>
          </div>

          {/* Mobile tier selector (sticky) */}
          <div className="sticky top-[64px] z-20 -mx-6 mt-8 border-y border-reps-border bg-reps-ink/85 px-6 py-3 backdrop-blur lg:hidden">
            <div className="flex gap-2 overflow-x-auto">
              {(Object.keys(TIER_META) as TierKey[]).map((t) => {
                const active = activeTier === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setActiveTier(t)}
                    className={
                      active
                        ? "flex shrink-0 items-center gap-2 rounded-full bg-reps-orange px-4 py-1.5 text-[12px] font-semibold text-white"
                        : "flex shrink-0 items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-4 py-1.5 text-[12px] font-semibold text-white/75 hover:text-white"
                    }
                  >
                    <span>{TIER_META[t].label}</span>
                    <span className={active ? "text-white/85" : "text-white/45"}>{TIER_META[t].price}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel">
            {/* Desktop table */}
            <table className="hidden w-full lg:table">
              <thead>
                <tr className="border-b border-reps-border">
                  <th className="w-[34%] px-6 py-5 text-left text-[12px] font-semibold uppercase tracking-wider text-white/45">
                    Feature
                  </th>
                  {(Object.keys(TIER_META) as TierKey[]).map((t) => {
                    const isPro = t === "pro";
                    return (
                      <th
                        key={t}
                        className={
                          isPro
                            ? "border-x border-reps-orange/30 bg-reps-orange-soft/40 px-4 py-5 text-center"
                            : "px-4 py-5 text-center"
                        }
                      >
                        <div className="font-display text-[15px] font-bold text-white">{TIER_META[t].label}</div>
                        <div className="mt-0.5 text-[12px] text-white/55">{TIER_META[t].price}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {COMPARE_GROUPS.map((group) => (
                  <Fragment key={`g-${group.title}`}>
                    <tr className="bg-reps-panel-soft/60">
                      <td
                        colSpan={5}
                        className="px-6 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-white/55"
                      >
                        {group.title}
                      </td>
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={`${group.title}-${row.label}`} className="border-t border-reps-border/60">
                        <td className="px-6 py-3 text-[14px] text-white/80">{row.label}</td>
                        <td className="px-4 py-3 text-center">
                          <Cell value={row.verified} />
                        </td>
                        <td className="border-x border-reps-orange/30 bg-reps-orange-soft/20 px-4 py-3 text-center">
                          <Cell value={row.pro} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Cell value={row.business} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Cell value={row.studio} />
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>

            {/* Mobile table */}
            <table className="w-full lg:hidden">
              <thead>
                <tr className="border-b border-reps-border">
                  <th className="w-[60%] px-5 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-white/45">
                    Feature
                  </th>
                  <th className="px-4 py-4 text-center">
                    <div className="font-display text-[14px] font-bold text-white">{TIER_META[activeTier].label}</div>
                    <div className="mt-0.5 text-[11px] text-white/55">{TIER_META[activeTier].price}</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_GROUPS.map((group) => (
                  <Fragment key={`mg-${group.title}`}>
                    <tr className="bg-reps-panel-soft/60">
                      <td
                        colSpan={2}
                        className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-white/55"
                      >
                        {group.title}
                      </td>
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={`m-${group.title}-${row.label}`} className="border-t border-reps-border/60">
                        <td className="px-5 py-3 text-[14px] text-white/80">{row.label}</td>
                        <td className="px-4 py-3 text-center">
                          <Cell value={row[activeTier]} />
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 text-center text-[13px] text-white/55">
            Need API, SSO, bulk verification or migration?{" "}
            <Link to="/contact" className="text-reps-orange hover:underline">
              See Enterprise →
            </Link>
          </div>
        </div>
      </section>

      {/* Why priced this way */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10">
          <div className="text-center">
            <h2 className="font-display text-[28px] font-bold text-white">Why REPs is priced this way</h2>
            <p className="mx-auto mt-3 max-w-[560px] text-[14px] text-white/65">
              A ladder, not a paywall — each tier maps to a different stage of your career.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Eye,
                title: "Visibility — Free.",
                body: "Every professional gets a free, claimable profile so clients can find you in the directory.",
              },
              {
                icon: ShieldCheck,
                title: "Trust — Verified.",
                body: "Pay once a year to prove your credentials and unlock reviews and enquiries from clients.",
              },
              {
                icon: LayoutGrid,
                title: "Operating system — Pro & up.",
                body: "Run bookings, clients, programmes and growth tools all in one place.",
              },
            ].map((c) => (
              <div key={c.title} className="rounded-[18px] border border-reps-border bg-reps-panel p-6">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-reps-orange-soft text-reps-orange">
                  <c.icon className="h-4 w-4" />
                </span>
                <h3 className="mt-4 font-display text-[16px] font-bold text-white">{c.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/65">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[820px] px-6 py-20 lg:px-10">
          <h2 className="font-display text-[28px] font-bold text-white">Frequently asked</h2>
          <div className="mt-8 divide-y divide-reps-border overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel">
            {FAQ.map((item) => (
              <details key={item.q} className="group px-6 py-5 [&_summary]:list-none">
                <summary className="flex cursor-pointer items-start justify-between gap-4 text-[15px] font-semibold text-white">
                  {item.q}
                  <span className="text-reps-orange transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-[13px] leading-relaxed text-white/65">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
