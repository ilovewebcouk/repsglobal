/**
 * Competitor data — single source of truth for /compare and /compare/reps-vs-* pages.
 *
 * Pricing, client limits, and add-ons were sourced from each vendor's publicly
 * available pricing page on the verification date below. See
 * /comparison-methodology for the full process.
 *
 * Last verified: 2026-06-03
 */

import trainerizeLogo from "@/assets/logos/trainerize.svg.asset.json";
import mypthubLogo from "@/assets/logos/mypthub.svg.asset.json";
import ptDistinctionLogo from "@/assets/logos/pt-distinction.svg.asset.json";

import trainerizeHero from "@/assets/compare/reps-vs-trainerize-hero.jpg";
import mypthubHero from "@/assets/compare/reps-vs-mypthub-hero.jpg";
import ptDistinctionHero from "@/assets/compare/reps-vs-pt-distinction-hero.jpg";

export const DATA_VERIFIED_DATE = "3 June 2026";

/**
 * REPs Pro reference — single source of truth for /compare/reps-vs-* copy.
 * On comparison pages we compare REPs Pro (the full software platform) only.
 * Verified is a public register listing, not coaching software, and appears
 * at most as a one-line aside. The full 3-tier ladder lives on /pricing.
 */
export const REPS_TIER_REFERENCE = {
  tiers: [
    { name: "Pro", price: "£59/mo", note: "Full software platform, founding pricing locked for life (was £79/mo)" },
  ],
  summary:
    "REPs Pro is £59/mo (founding, was £79/mo) and includes the full software platform — directory profile, verification, CRM, bookings, payments, programmes, check-ins, nutrition, client portal and REPs AI. No paid add-on stack or per-client charges.",
} as const;

export type PricingTier = {
  name: string;
  /** Monthly price as displayed on the vendor's page, in their currency. */
  price: string;
  /** Free-text client cap, e.g. "3", "Up to 50", "Unlimited", or "Up to 200 (slider)". */
  clientCap: string;
};

export type AddOn = {
  name: string;
  cost: string;
  /** Optional note shown beneath the cost. */
  note?: string;
};

export type Competitor = {
  /** URL-safe slug — must match the route filename: compare.reps-vs-<slug>.tsx */
  slug: "trainerize" | "mypthub" | "pt-distinction";
  /** Display name as used in copy. */
  name: string;
  /** Short logo URL from src/assets/logos. */
  logo: string;
  /** Default rendered logo height in px so different SVG aspect ratios optically match. */
  logoHeight: number;
  /** Per-page hero image (also used as og:image / twitter:image). */
  hero: string;
  /** Public pricing page (cited in the footnote on every comparison page). */
  pricingUrl: string;
  /** One-line characterisation used in cards and TL;DRs. */
  bestFor: string;

  /** Pricing tiers as published. */
  tiers: PricingTier[];
  /** Currency symbol used in tiers, for the worked-example block. */
  currency: "$" | "£" | "€";
  /** Free trial length (free text, e.g. "30-day free trial", "14-day", "Free forever tier"). */
  freeTrial: string;
  /** Transaction / payment-processing fees, if any. */
  transactionFees: string;

  /** Everything sold separately on top of the base tier (the wedge). */
  addOns: AddOn[];

  /**
   * Hidden-add-ons worked example. We project monthly cost at three client tiers
   * to make the difference concrete vs the REPs tier ladder — each row shows
   * what the competitor's base tier plus the add-ons a serious coach actually
   * needs comes to at that client count.
   */
  workedExample: {
    /** Tier or plan the customer is on at this client count. */
    label: string;
    clients: number;
    /** Base monthly cost on that tier in the competitor's currency. */
    base: number;
    /** Add-ons a serious coach typically needs at this stage. */
    addOnsApplied: { name: string; cost: number }[];
    /** Total monthly. */
    total: number;
  }[];

  /** TL;DR — when each side wins. Honest framing on purpose. */
  tldr: {
    repsWins: string[];
    competitorWins: string[];
  };
  /** "When <Competitor> is the right choice" — credibility section. */
  whenCompetitorIsRight: string;
  /** 4-6 FAQ entries, written for people-also-ask intent. */
  faqs: { q: string; a: string }[];
};

export const COMPETITORS: Record<Competitor["slug"], Competitor> = {
  trainerize: {
    slug: "trainerize",
    name: "Trainerize",
    logo: trainerizeLogo.url,
    logoHeight: 28,
    hero: trainerizeHero,
    pricingUrl: "https://www.trainerize.com/pricing",
    bestFor:
      "Coaches who already have a full client roster and just need a delivery app.",
    currency: "$",
    freeTrial: "Free Basic plan (1 client) · 30-day trial on paid plans",
    transactionFees: "Stripe Integrated Payments sold as a paid add-on",
    tiers: [
      { name: "Basic", price: "Free", clientCap: "1 client" },
      { name: "Grow", price: "$9/mo", clientCap: "Up to 2 clients" },
      { name: "Pro (slider)", price: "$23/mo+", clientCap: "5 to 200 clients (slider; price scales)" },
      { name: "Studio Plus", price: "$248/mo", clientCap: "Up to 500-1,000 clients per location" },
    ],
    addOns: [
      { name: "Custom Branded App", cost: "Paid add-on", note: "Free only on Studio Plus" },
      { name: "Stripe Integrated Payments", cost: "Paid add-on", note: "Sold as a paid add-on on lower tiers" },
      { name: "Advanced Nutrition Coaching", cost: "Paid add-on", note: "Smart Meal Planner is not included by default" },
      { name: "Video Coaching", cost: "Paid add-on", note: "Live & on-demand sessions sold separately" },
      { name: "Business Add-on", cost: "Paid add-on", note: "Scheduling, products, referrals" },
    ],
    workedExample: [
      {
        label: "Grow + payments + nutrition add-ons",
        clients: 2,
        base: 9,
        addOnsApplied: [
          { name: "Stripe Payments add-on", cost: 10 },
          { name: "Advanced Nutrition Coaching", cost: 10 },
        ],
        total: 29,
      },
      {
        label: "Pro slider (~30 clients) + 3 typical add-ons",
        clients: 30,
        base: 49,
        addOnsApplied: [
          { name: "Stripe Payments add-on", cost: 10 },
          { name: "Advanced Nutrition Coaching", cost: 10 },
          { name: "Branded App add-on", cost: 49 },
        ],
        total: 118,
      },
      {
        label: "Pro slider (~75 clients) + 4 add-ons (full stack)",
        clients: 75,
        base: 79,
        addOnsApplied: [
          { name: "Stripe Payments add-on", cost: 10 },
          { name: "Advanced Nutrition Coaching", cost: 10 },
          { name: "Branded App add-on", cost: 49 },
          { name: "Video Coaching add-on", cost: 19 },
        ],
        total: 167,
      },
    ],
    tldr: {
      repsWins: [
        "You want a public profile clients can find — REPs is the verified register, Trainerize is private software.",
        "You want a REPs tier where every feature is included, instead of a base plan plus a stack of paid add-ons (branded app, payments, nutrition, video).",
        "You want REPs verification and AI as the operating system, not as features bolted on top.",
      ],
      competitorWins: [
        "You're a studio or franchise with hundreds of members and you've already standardised on ABC Trainerize.",
        "You don't need to be found — your roster is full and you just want the workout-delivery app.",
        "You're committed to building inside the ABC ecosystem (Glofox, Mindbody integrations).",
      ],
    },
    whenCompetitorIsRight:
      "Trainerize is a mature, well-built workout delivery app. If you're a multi-location studio on Studio Plus, you already have a full client roster from your gym floor, and you don't need a public register or verified credential — Trainerize will serve you well. They've been at it since 2010 and the app is solid.",
    faqs: [
      {
        q: "Is Trainerize available in the UK?",
        a: "Yes — Trainerize is a North American product but works globally. Pricing is in USD. REPs is built in the UK around the public REPs register, which Trainerize doesn't offer.",
      },
      {
        q: "How much does Trainerize actually cost with add-ons?",
        a: "The listed tier ($9-$248/mo) is the base — and the Pro tier uses a client-count slider, so a coach with ~30 clients lands around $49/mo before add-ons. Once a serious coach turns on payments, nutrition coaching and a branded app, the all-in usually lands well above $100/mo. REPs Pro is £59/mo founding (was £79/mo) with the full software platform included.",
      },
      {
        q: "What's the best Trainerize alternative for UK personal trainers?",
        a: "If you want to be found by clients searching the public register, get verified, and avoid the stack of payments + nutrition + AI add-ons sitting on top of one base plan, REPs is built specifically for UK PTs. If you only need a workout app, MyPTHub and PT Distinction are also alternatives.",
      },
      {
        q: "Does Trainerize have a free plan?",
        a: "Yes — a free Basic plan for 1 client. Paid plans start at $9/mo (Grow, up to 2 clients). REPs Pro is £59/mo founding (was £79/mo), with the full software platform included and founding pricing locked for life for early members before public launch.",
      },
      {
        q: "Does Trainerize include AI?",
        a: "Trainerize has an AI Workout Builder and some automated messaging. REPs ships AI through the whole platform: programme drafts, nutrition planning, check-in summaries, lead scoring, content drafting, churn-risk alerts.",
      },
    ],
  },

  mypthub: {
    slug: "mypthub",
    name: "MyPTHub",
    logo: mypthubLogo.url,
    logoHeight: 30,
    hero: mypthubHero,
    pricingUrl: "https://www.mypthub.net/pricing",
    bestFor:
      "Coaches who want an all-in-one app and are happy to add the branded-app and AI add-ons later.",
    currency: "$",
    freeTrial: "30-day free trial, no card required",
    transactionFees: "Included in base tiers",
    tiers: [
      { name: "Starter", price: "$25/mo", clientCap: "3 clients" },
      { name: "Premium", price: "$59/mo", clientCap: "Unlimited clients" },
      { name: "Ultimate", price: "$215/mo", clientCap: "Unlimited + 5 extra trainers" },
    ],
    addOns: [
      { name: "Custom Branded App (iOS & Android)", cost: "$95 one-time" },
      { name: "Additional Trainers", cost: "$10/mo per trainer" },
      { name: "White Label App", cost: "$145/mo" },
      { name: "Check-Ins AI", cost: "$12/mo", note: "Their AI feature — sold separately" },
      { name: "Zapier integration", cost: "$19/mo" },
    ],
    workedExample: [
      {
        label: "Starter + branded app + AI",
        clients: 3,
        base: 25,
        addOnsApplied: [
          { name: "Branded app (~$8/mo amortised)", cost: 8 },
          { name: "Check-Ins AI", cost: 12 },
        ],
        total: 45,
      },
      {
        label: "Premium + AI + Zapier",
        clients: 20,
        base: 59,
        addOnsApplied: [
          { name: "Check-Ins AI", cost: 12 },
          { name: "Zapier integration", cost: 19 },
        ],
        total: 90,
      },
      {
        label: "Premium + branded app + AI + 2 trainers",
        clients: 40,
        base: 59,
        addOnsApplied: [
          { name: "Branded app amortised", cost: 8 },
          { name: "Check-Ins AI", cost: 12 },
          { name: "2 additional trainers", cost: 20 },
        ],
        total: 99,
      },
    ],
    tldr: {
      repsWins: [
        "You want clients to find you — REPs is the verified public register, MyPTHub is a private app you bring your own clients to.",
        "You want AI as the operating layer inside your tier, not a $12/mo Check-Ins AI add-on bolted on top.",
        "You don't want to pay extra for a branded app, extra trainers, or Zapier — every feature in your REPs tier is included.",
      ],
      competitorWins: [
        "You already have a full client list and just need the delivery app.",
        "You want one of the cheapest entry-level tiers in the market ($25/mo Starter).",
        "You don't need a public-facing register or verified credential.",
      ],
    },
    whenCompetitorIsRight:
      "MyPTHub is a solid all-in-one coaching app with one of the cheapest entry tiers in the category. If you've already built your client list elsewhere and you just want a no-frills delivery app — and you're comfortable paying separately for the branded app and AI add-ons — MyPTHub is a reasonable pick.",
    faqs: [
      {
        q: "What's the difference between REPs and MyPTHub?",
        a: "MyPTHub is private coaching software — clients have to already be yours. REPs is a verified public register clients search to find a PT, plus the operations and AI layer to run your practice. Different category.",
      },
      {
        q: "Is MyPTHub's pricing transparent?",
        a: "The headline pricing is — but the branded app ($95 one-time), Check-Ins AI ($12/mo), additional trainers ($10/mo each), and Zapier ($19/mo) are all add-ons. A coach using all of them ends up north of $90/mo. REPs Pro is £59/mo founding (was £79/mo) with the full software platform included.",
      },
      {
        q: "Does MyPTHub include AI?",
        a: "Their Check-Ins AI is a paid $12/mo add-on. REPs ships AI through the whole platform — programmes, nutrition, check-ins, leads, content, risk alerts — included inside the tier.",
      },
      {
        q: "Best MyPTHub alternative for UK trainers?",
        a: "If you want to be found by clients, get REPs verified, and avoid the stack of paid add-ons, REPs is built for UK PTs. Other alternatives include Trainerize and PT Distinction.",
      },
      {
        q: "Does MyPTHub charge per client?",
        a: "No — Premium ($59/mo) and above are unlimited clients. The Starter tier is capped at 3. The cost creeps in via the add-on stack rather than per-client charges.",
      },
    ],
  },

  "pt-distinction": {
    slug: "pt-distinction",
    name: "PT Distinction",
    logo: ptDistinctionLogo.url,
    logoHeight: 24,
    hero: ptDistinctionHero,
    pricingUrl: "https://www.ptdistinction.com/pricing",
    bestFor: "Coaches who love a deep feature set and don't mind paying per extra client.",
    currency: "$",
    freeTrial: "1-month free trial on all plans",
    transactionFees: "Payments included on base tiers",
    tiers: [
      { name: "Basic", price: "$19.90/mo", clientCap: "3 clients (then $6/mo each)" },
      { name: "Pro", price: "$59.90/mo", clientCap: "25 clients (then $2.40/mo each)" },
      { name: "Master", price: "$89.90/mo", clientCap: "50 clients (then $1.60/mo each)" },
    ],
    addOns: [
      { name: "Extra clients (Basic)", cost: "$6/mo each", note: "After the first 3 clients" },
      { name: "Extra clients (Pro)", cost: "$2.40/mo each", note: "After the first 25 clients" },
      { name: "Extra clients (Master)", cost: "$1.60/mo each", note: "After the first 50 clients" },
      { name: "Extra trainers", cost: "Free", note: "Genuinely included" },
    ],
    workedExample: [
      {
        label: "Basic + extra clients",
        clients: 10,
        base: 19.9,
        addOnsApplied: [{ name: "7 extra clients × $6", cost: 42 }],
        total: 61.9,
      },
      {
        label: "Pro at cap",
        clients: 25,
        base: 59.9,
        addOnsApplied: [],
        total: 59.9,
      },
      {
        label: "Pro + extra clients",
        clients: 50,
        base: 59.9,
        addOnsApplied: [{ name: "25 extra clients × $2.40", cost: 60 }],
        total: 119.9,
      },
    ],
    tldr: {
      repsWins: [
        "You want a public register listing — REPs is where clients search, PT Distinction is private software.",
        "You don't want to do mental arithmetic on per-client charges every time you sign a client — REPs tiers don't add a per-client fee inside the tier.",
        "You want AI as the operating system across the whole platform, plus REPs verification.",
      ],
      competitorWins: [
        "You like a deep, mature feature set with AI Program Builder, Smart Meal Planner and AI Assistant included on the base tier.",
        "You have a small fixed roster that fits within a single tier's client cap.",
        "You want a genuinely no-add-ons feature set (except extra clients).",
      ],
    },
    whenCompetitorIsRight:
      "PT Distinction is one of the most feature-rich coaching apps on the market — AI Program Builder, Smart Meal Planner, and AI Assistant are included from the $19.90 Basic tier. If your client roster is stable, fits cleanly inside a tier, and you don't need a public register, it's a strong product.",
    faqs: [
      {
        q: "How does PT Distinction's per-client pricing work?",
        a: "Each tier includes a client cap (3 on Basic, 25 on Pro, 50 on Master). Beyond that you pay per extra client — $6, $2.40 or $1.60/mo depending on tier. A coach with 50 clients on Pro pays $59.90 + 25 × $2.40 = $119.90/mo. REPs tiers don't add a per-client fee inside the tier.",
      },
      {
        q: "REPs vs PT Distinction — which is better for UK PTs?",
        a: "PT Distinction is the more feature-dense private coaching app. REPs is a public verified register plus operations and AI in one platform. If clients finding you matters, REPs wins. If you're roster-full and want feature density, PT Distinction is reasonable.",
      },
      {
        q: "Does PT Distinction include AI?",
        a: "Yes — AI Program Builder, Smart Meal Planner and AI Assistant are included on the Basic tier. REPs ships AI across more surfaces (lead scoring, content, churn risk, weekly growth cards), and it's all included inside the tier.",
      },
      {
        q: "Best PT Distinction alternative in the UK?",
        a: "REPs is the UK-built alternative that combines public discovery, verified credential, operations, coaching delivery and AI in one platform — without per-client charges inside the tier.",
      },
      {
        q: "Does PT Distinction have transaction fees?",
        a: "PT Distinction doesn't charge a platform fee on payments. Standard payment-processor fees still apply through Stripe.",
      },
    ],
  },
};

export const COMPETITOR_LIST: Competitor[] = [
  COMPETITORS.trainerize,
  COMPETITORS.mypthub,
  COMPETITORS["pt-distinction"],
];

/**
 * REPs equivalent for the side-by-side strip and head-to-head pricing card.
 * Tier-based ladder, with every feature inside the chosen tier included.
 */
export const REPS_SIDE = {
  name: "REPs",
  tiers: [
    {
      name: "REPs Pro",
      price: "£59/mo",
      clientCap: "Unlimited",
    },
  ] satisfies PricingTier[],
  freeTrial: "Founding pricing on Pro locked for early members before public launch",
  transactionFees: "No add-on stack inside any tier",
  bestFor:
    "UK personal trainers who want to be found, verified, and run the whole practice in one place.",
  whatsIncluded: REPS_TIER_REFERENCE.summary,
  addOns: [
    { name: "No paid add-ons inside any tier", cost: "Pick the tier that fits" },
  ] satisfies AddOn[],
};
