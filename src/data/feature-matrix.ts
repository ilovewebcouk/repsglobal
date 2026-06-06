/**
 * Feature parity matrix — shared between the full /compare table and the
 * 2-column head-to-head pages. The cell-index mapping is the contract:
 *
 *   0 = REPs
 *   1 = Trainerize
 *   2 = MyPTHub
 *   3 = PT Distinction
 *
 * Keep `cells` aligned with that order.
 */
export type Cell =
  | { kind: "yes"; note?: string }
  | { kind: "partial"; note: string }
  | { kind: "no"; note?: string };

export type Row = { feature: string; cells: [Cell, Cell, Cell, Cell] };
export type Group = { label: string; rows: Row[] };

export const FEATURE_INDEX = {
  reps: 0,
  trainerize: 1,
  mypthub: 2,
  "pt-distinction": 3,
} as const;

export type CompetitorSlug = keyof Omit<typeof FEATURE_INDEX, "reps">;

export const FEATURE_GROUPS: Group[] = [
  {
    label: "Visibility · Get discovered",
    rows: [
      {
        feature: "Found by clients searching the public register",
        cells: [
          { kind: "yes", note: "Searched by the public daily" },
          { kind: "no", note: "Bring your own clients" },
          { kind: "no", note: "Bring your own clients" },
          { kind: "no", note: "Bring your own clients" },
        ],
      },
      {
        feature: "Industry-recognised REPs credential",
        cells: [
          { kind: "yes", note: "REPs verified since 2009" },
          { kind: "no" },
          { kind: "no" },
          { kind: "no" },
        ],
      },
      {
        feature: "Verified qualifications & insurance",
        cells: [
          { kind: "yes", note: "Checked by humans" },
          { kind: "no", note: "Self-declared" },
          { kind: "no", note: "Self-declared" },
          { kind: "no", note: "Self-declared" },
        ],
      },
      {
        feature: "CPD tracked on profile",
        cells: [{ kind: "yes" }, { kind: "no" }, { kind: "no" }, { kind: "no" }],
      },
      {
        feature: "Reviews on the public record",
        cells: [{ kind: "yes" }, { kind: "no" }, { kind: "no" }, { kind: "no" }],
      },
    ],
  },
  {
    label: "Shop-front · Your own page",
    rows: [
      {
        feature: "Public single-page site at a personal URL (/c/your-name)",
        cells: [
          { kind: "yes" },
          { kind: "no", note: "Client portal only" },
          { kind: "no", note: "Client portal only" },
          { kind: "no", note: "Client portal only" },
        ],
      },
      {
        feature: "Personalised hero, accent colour & tier services",
        cells: [
          { kind: "yes" },
          { kind: "no" },
          { kind: "no" },
          { kind: "no" },
        ],
      },
      {
        feature: "Enquiries deep-linked from shop-front into CRM",
        cells: [
          { kind: "yes" },
          { kind: "no" },
          { kind: "no" },
          { kind: "no" },
        ],
      },
    ],
  },
  {
    label: "Operations · Run your practice",
    rows: [
      {
        feature: "Lead pipeline (profile, IG, website)",
        cells: [
          { kind: "yes" },
          { kind: "partial", note: "Basic CRM" },
          { kind: "partial", note: "Basic CRM" },
          { kind: "partial", note: "Basic CRM" },
        ],
      },
      {
        feature: "Bookings + deposits + Stripe payouts",
        cells: [
          { kind: "yes", note: "Deposits, subs, payouts" },
          { kind: "partial", note: "Payments add-on" },
          { kind: "yes" },
          { kind: "yes" },
        ],
      },
      {
        feature: "Clients CRM (one record per client)",
        cells: [
          { kind: "yes" },
          { kind: "partial", note: "Basic" },
          { kind: "partial", note: "Basic" },
          { kind: "partial", note: "Basic" },
        ],
      },
      {
        feature: "Focused inbox + quiet hours",
        cells: [
          { kind: "yes" },
          { kind: "partial", note: "Chat only" },
          { kind: "partial", note: "Chat only" },
          { kind: "partial", note: "Chat only" },
        ],
      },
    ],
  },
  {
    label: "Coaching · Deliver the work",
    rows: [
      {
        feature: "Programme builder + video library",
        cells: [{ kind: "yes" }, { kind: "yes" }, { kind: "yes" }, { kind: "yes" }],
      },
      {
        feature: "Nutrition planning + food database",
        cells: [
          { kind: "yes", note: "Replaces MyFitnessPal" },
          { kind: "partial", note: "Paid add-on" },
          { kind: "partial", note: "Macros only" },
          { kind: "yes" },
        ],
      },
      {
        feature: "Weekly check-ins with photos & metrics",
        cells: [
          { kind: "yes" },
          { kind: "yes" },
          { kind: "partial", note: "AI is paid add-on" },
          { kind: "yes" },
        ],
      },
      {
        feature: "Branded client portal (web + mobile)",
        cells: [
          { kind: "yes", note: "Included" },
          { kind: "partial", note: "Branded app is add-on" },
          { kind: "partial", note: "Branded app $95 add-on" },
          { kind: "partial", note: "From Pro tier" },
        ],
      },
    ],
  },
  {
    label: "AI · The operating layer",
    rows: [
      {
        feature: "AI Business Command Centre",
        cells: [{ kind: "yes" }, { kind: "no" }, { kind: "no" }, { kind: "no" }],
      },
      {
        feature: "Weekly 'next move' growth card",
        cells: [{ kind: "yes" }, { kind: "no" }, { kind: "no" }, { kind: "no" }],
      },
      {
        feature: "AI programme writer",
        cells: [
          { kind: "yes" },
          { kind: "partial", note: "AI Workout Builder" },
          { kind: "no" },
          { kind: "yes", note: "AI Program Builder" },
        ],
      },
      {
        feature: "AI nutrition planner",
        cells: [
          { kind: "yes" },
          { kind: "no" },
          { kind: "no" },
          { kind: "yes", note: "Smart Meal Planner" },
        ],
      },
      {
        feature: "AI check-in summariser",
        cells: [
          { kind: "yes" },
          { kind: "no" },
          { kind: "partial", note: "Check-Ins AI $12/mo add-on" },
          { kind: "no" },
        ],
      },
      {
        feature: "AI lead scoring + reply drafts",
        cells: [{ kind: "yes" }, { kind: "no" }, { kind: "no" }, { kind: "no" }],
      },
      {
        feature: "AI client risk & plateau alerts",
        cells: [{ kind: "yes" }, { kind: "no" }, { kind: "no" }, { kind: "no" }],
      },
      {
        feature: "AI content studio (posts, captions, lead magnets)",
        cells: [{ kind: "yes" }, { kind: "no" }, { kind: "no" }, { kind: "no" }],
      },
    ],
  },
  {
    label: "Pricing · What you actually pay",
    rows: [
      {
        feature: "Every feature included in your tier — no paid add-ons",
        cells: [
          { kind: "yes", note: "No add-on stack" },
          { kind: "no", note: "5 paid add-ons" },
          { kind: "no", note: "5 paid add-ons" },
          { kind: "partial", note: "Per-client charges" },
        ],
      },
      {
        feature: "No platform commission on bookings",
        cells: [
          { kind: "yes", note: "REPs takes no booking commission" },
          { kind: "partial", note: "Stripe Payments is an add-on" },
          { kind: "yes" },
          { kind: "yes" },
        ],
      },
      {
        feature: "No per-client charges",
        cells: [
          { kind: "yes" },
          { kind: "partial", note: "Tiered slider" },
          { kind: "yes" },
          { kind: "no", note: "$1.60-$6 per extra client" },
        ],
      },
    ],
  },
  {
    label: "Growth · Compound the practice",
    rows: [
      {
        feature: "Revenue & retention insights",
        cells: [
          { kind: "yes" },
          { kind: "partial", note: "Basic reports" },
          { kind: "partial", note: "Basic reports" },
          { kind: "partial", note: "Basic reports" },
        ],
      },
      {
        feature: "Automated client follow-ups & win-backs",
        cells: [{ kind: "yes" }, { kind: "no" }, { kind: "no" }, { kind: "no" }],
      },
      {
        feature: "Renewal forecasting & churn risk",
        cells: [{ kind: "yes" }, { kind: "no" }, { kind: "no" }, { kind: "no" }],
      },
    ],
  },
];
