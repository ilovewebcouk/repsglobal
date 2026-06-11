/**
 * Single source of truth for the feature deep-dive pages and the 5 sales
 * pillars surfaced on /for-professionals, /features and the For Professionals
 * dropdown in the public header.
 *
 * AI is its own pillar with a separate `AI_FEATURES` array (14 cards). The
 * core `FEATURES` array drives the existing /features/$slug deep-dives and
 * the four pillar deep-dives (visibility/operations/coaching/growth).
 */
import {
  AlertTriangle,
  Apple,
  BadgeCheck,
  Brain,
  Calendar,
  ClipboardCheck,
  CreditCard,
  Dumbbell,
  FilePenLine,
  Globe,
  Inbox,
  LineChart,
  ListChecks,
  MailQuestion,
  MessageSquare,
  PenTool,
  ScanLine,
  Send,
  Sparkles,
  TrendingUp,
  Users,
  Wand2,
  type LucideIcon,
} from "lucide-react";

export type FeatureGroupKey =
  | "visibility"
  | "shopfront"
  | "operations"
  | "coaching"
  | "ai"
  | "growth";

export type FeatureLink = {
  slug:
    | "profile-and-reviews"
    | "shop-front"
    | "bookings"
    | "payments"
    | "clients"
    | "programmes"
    | "check-ins"
    | "messaging"
    | "leads"
    | "insights";
  label: string;
  tag: string;
  oneLiner: string;
  icon: LucideIcon;
  group: FeatureGroupKey;
  /** Other pillar groups this feature should also surface under (cross-listed tiles). */
  crossList?: FeatureGroupKey[];
  /** Override the default `/features/$slug` deep-dive href (e.g. for static pillar pages). */
  customHref?: string;
  /** Tier keys (from pricing-data) this feature is included in. */
  includedIn: ("verified" | "pro" | "business" | "studio")[];
};

export const FEATURES: FeatureLink[] = [
  {
    slug: "profile-and-reviews",
    label: "Verified profile & reviews",
    tag: "Profile",
    oneLiner: "Show up trustworthy. Reviews on the record.",
    icon: BadgeCheck,
    group: "visibility",
    includedIn: ["verified", "pro", "business", "studio"],
  },
  {
    slug: "shop-front",
    label: "Personalised shop-front",
    tag: "Shop-front",
    oneLiner: "Your own page at /c/your-name — your photo, your method, your tiers.",
    icon: Globe,
    group: "shopfront",
    crossList: ["visibility"],
    customHref: "/features/shop-front",
    includedIn: ["pro", "business", "studio"],
  },
  {
    slug: "leads",
    label: "Lead pipeline",
    tag: "Leads",
    oneLiner: "Every enquiry tracked from first touch to first session.",
    icon: Inbox,
    group: "operations",
    includedIn: ["pro", "business", "studio"],
  },
  {
    slug: "bookings",
    label: "Bookings & calendar",
    tag: "Bookings",
    oneLiner: "Two-way sync, deposits and reminders that kill no-shows.",
    icon: Calendar,
    group: "operations",
    includedIn: ["pro", "business", "studio"],
  },
  {
    slug: "payments",
    label: "Payments & subscriptions",
    tag: "Payments",
    oneLiner: "Stripe payouts, packages, memberships. No chasing invoices.",
    icon: CreditCard,
    group: "operations",
    includedIn: ["pro", "business", "studio"],
  },
  {
    slug: "clients",
    label: "Clients CRM",
    tag: "CRM",
    oneLiner: "One record per client. Sessions, notes, payments, programmes.",
    icon: Users,
    group: "operations",
    includedIn: ["pro", "business", "studio"],
  },
  {
    slug: "messaging",
    label: "Client messaging",
    tag: "Messages",
    oneLiner: "Focused inbox, separate from your personal phone.",
    icon: MessageSquare,
    group: "operations",
    includedIn: ["pro", "business", "studio"],
  },
  {
    slug: "programmes",
    label: "Programmes",
    tag: "Programmes",
    oneLiner: "Build, deliver and update training plans with video demos.",
    icon: Dumbbell,
    group: "coaching",
    includedIn: ["pro", "business", "studio"],
  },
  {
    slug: "check-ins",
    label: "Check-ins & progress",
    tag: "Check-ins",
    oneLiner: "Weekly forms, photos and metrics in one tidy timeline.",
    icon: ListChecks,
    group: "coaching",
    includedIn: ["pro", "business", "studio"],
  },
  {
    slug: "insights",
    label: "Insights & retention",
    tag: "Insights",
    oneLiner: "Revenue, retention and the next move to grow this month.",
    icon: LineChart,
    group: "growth",
    includedIn: ["business", "studio"],
  },
];

export type AIFeature = {
  slug: string;
  label: string;
  oneLiner: string;
  icon: LucideIcon;
  includedIn: ("pro" | "business" | "studio")[];
};

export const AI_FEATURES: AIFeature[] = [
  {
    slug: "command-centre",
    label: "AI Business Command Centre",
    oneLiner: "Your whole business — revenue, retention, risks — read by AI every morning.",
    icon: Brain,
    includedIn: ["business", "studio"],
  },
  {
    slug: "next-move",
    label: "Weekly Next Move Cards",
    oneLiner: "The single highest-leverage action this week, ranked by impact.",
    icon: Sparkles,
    includedIn: ["business", "studio"],
  },
  {
    slug: "programme-writer",
    label: "AI Programme Writer",
    oneLiner: "Describe the client. Get a 12-week plan with video demos in seconds.",
    icon: Dumbbell,
    includedIn: ["pro", "business", "studio"],
  },
  {
    slug: "nutrition-planner",
    label: "AI Nutrition Planner",
    oneLiner: "Macros and meal plans from goal, allergies and food preferences.",
    icon: Apple,
    includedIn: ["pro", "business", "studio"],
  },
  {
    slug: "check-in-summariser",
    label: "AI Check-in Summariser",
    oneLiner: "Six check-ins read for you. Headline, change to make, who needs you.",
    icon: ClipboardCheck,
    includedIn: ["pro", "business", "studio"],
  },
  {
    slug: "reply-drafts",
    label: "AI Coach Reply Drafts",
    oneLiner: "First-draft replies in your tone of voice. Approve and send.",
    icon: FilePenLine,
    includedIn: ["pro", "business", "studio"],
  },
  {
    slug: "lead-scoring",
    label: "AI Lead Scoring",
    oneLiner: "Every enquiry scored on intent — so hot leads never wait.",
    icon: ScanLine,
    includedIn: ["pro", "business", "studio"],
  },
  {
    slug: "lead-reply",
    label: "AI Lead Reply Assistant",
    oneLiner: "Personalised first reply drafted for every new enquiry.",
    icon: MailQuestion,
    includedIn: ["pro", "business", "studio"],
  },
  {
    slug: "risk-alerts",
    label: "AI Client Risk Alerts",
    oneLiner: "Spots clients whose adherence is sliding — before they ghost.",
    icon: AlertTriangle,
    includedIn: ["business", "studio"],
  },
  {
    slug: "revenue-insights",
    label: "AI Revenue & Retention Insights",
    oneLiner: "Cohort revenue, churn risk and renewal forecasting at a glance.",
    icon: TrendingUp,
    includedIn: ["business", "studio"],
  },
  {
    slug: "content-studio",
    label: "AI Content Studio",
    oneLiner: "On-brand posts, captions and lead magnets from a one-line brief.",
    icon: PenTool,
    includedIn: ["business", "studio"],
  },
  {
    slug: "plateau-detection",
    label: "AI Client Plateau Detection",
    oneLiner: "Flags clients whose progress has stalled — and what to change.",
    icon: LineChart,
    includedIn: ["business", "studio"],
  },
  {
    slug: "adherence-analysis",
    label: "AI Adherence Analysis",
    oneLiner: "Programme and check-in adherence read across your whole roster.",
    icon: ListChecks,
    includedIn: ["business", "studio"],
  },
  {
    slug: "follow-up",
    label: "AI Follow-up Suggestions",
    oneLiner: "Win-back, renewal and check-in nudges drafted at the right moment.",
    icon: Send,
    includedIn: ["pro", "business", "studio"],
  },
];

export type FeatureGroupMeta = {
  key: FeatureGroupKey;
  label: string;
  /** Short pillar headline used on hub + dropdown. */
  desc: string;
  /** Long pillar positioning used on the group deep-dive page hero. */
  hero: { eyebrow: string; title: string; sub: string };
  icon: LucideIcon;
  /** Visually emphasise this pillar (AI). */
  highlight?: boolean;
};

export const FEATURE_GROUPS: FeatureGroupMeta[] = [
  {
    key: "visibility",
    label: "Visibility",
    desc: "Get discovered by the right clients.",
    hero: {
      eyebrow: "Visibility",
      title: "Be found. Be trusted. Be booked.",
      sub: "Your verified REPS profile is the one place the public already searches for a trusted pro — built to convert browsers into clients.",
    },
    icon: BadgeCheck,
  },
  {
    key: "shopfront",
    label: "Shop-front",
    desc: "Your own page. Your brand. One link.",
    hero: {
      eyebrow: "Personalised shop-front",
      title: "A page that sells you while you sleep.",
      sub: "More than a directory profile — a full single-page site at /c/your-name. Your photo, your method, your tiers, your proof, your accent colour. Every CTA drops straight into your REPS enquiry inbox.",
    },
    icon: Globe,
  },
  {
    key: "operations",
    label: "Operations",
    desc: "Run your whole practice in one place.",
    hero: {
      eyebrow: "Operations",
      title: "Bookings, payments, CRM — without juggling six apps.",
      sub: "The operating system for a modern coaching practice. Calendly, Stripe, Mailchimp and a CRM, replaced by one tool built for fitness.",
    },
    icon: Calendar,
  },
  {
    key: "coaching",
    label: "Coaching",
    desc: "Deliver the actual coaching.",
    hero: {
      eyebrow: "Coaching delivery",
      title: "Programmes, nutrition, check-ins — built for coaches.",
      sub: "The Trainerize-class coaching stack, wired into the same client record as your bookings, payments and messages.",
    },
    icon: Dumbbell,
  },
  {
    key: "ai",
    label: "REPS AI",
    desc: "The AI operating layer for your business.",
    hero: {
      eyebrow: "REPS AI Operating System",
      title: "Not just AI features. An AI operating layer.",
      sub: "Trainerize, MyPTHub and PT Distinction bolt AI on. REPS runs your business on it — programmes drafted, check-ins summarised, leads scored, risks flagged, next moves ranked.",
    },
    icon: Wand2,
    highlight: true,
  },
  {
    key: "growth",
    label: "Growth",
    desc: "Compound the practice you've built.",
    hero: {
      eyebrow: "Growth",
      title: "The one move to grow this month.",
      sub: "Revenue, retention, churn risk and renewal forecasting — surfaced as a Monday-morning card, not a dashboard you have to read.",
    },
    icon: TrendingUp,
  },
];

export function featureBySlug(slug: FeatureLink["slug"]) {
  return FEATURES.find((f) => f.slug === slug)!;
}

export function groupBySlug(key: FeatureGroupKey) {
  return FEATURE_GROUPS.find((g) => g.key === key)!;
}
