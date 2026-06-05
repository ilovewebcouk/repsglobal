// Shared pricing data for /pricing and /for-professionals.
// Single source of truth — no duplication across routes.
//
// REPs 3-tier ladder: Verified / Pro / Studio. The current Pro tier is what
// was previously called Business (same price, same features, same Founding
// lock). The old £29 Pro tier and the Free tier are retired.

export type Billing = "monthly" | "annual";

export type PriceView = { price: string; was?: string; period: string; meta?: string };

export type PlanTierKey = "verified" | "pro" | "studio";

export type PlanCard = {
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

export const PLANS: PlanCard[] = [
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
    desc: "Run and scale your whole coaching practice.",
    cta: "Start free trial",
    ctaHref: "/signup",
    founding: true,
    featured: true,
    features: [
      "30-day free trial",
      "Everything in Verified",
      "Personalised shop-front page (/c/your-name)",
      "Leads CRM & client management",
      "Bookings, calendar & payments",
      "Programmes & advanced nutrition",
      "Advanced check-ins",
      "AI across the platform",
      "Automations & content studio",
      "Enhanced directory placement",
    ],
    pricing: {
      monthly: { price: "£59", was: "£79", period: "per month", meta: "Billed monthly · 30-day free trial" },
      annual: { price: "£49", was: "£66", period: "per month", meta: "£590 billed yearly · 2 months free · 30-day free trial" },
    },
  },
  {
    tier: "Studio",
    tierKey: "studio",
    desc: "Teams, gyms and multi-coach businesses.",
    cta: "Start Studio",
    ctaHref: "/signup",
    features: [
      "Everything in Pro",
      "Personalised shop-front (team accent options)",
      "Multi-coach roles & seats",
      "Organisation profile",
      "Shared clients across coaches",
      "Multiple locations",
      "Reporting",
      "Account manager",
    ],
    pricing: {
      monthly: { price: "£149", period: "per month", meta: "Billed monthly" },
      annual: { price: "£124", period: "per month", meta: "£1,490 billed yearly · 2 months free" },
    },
  },
];

export type TierKey = PlanTierKey;
export type CellValue = boolean | string;

export type CompareGroup = {
  title: string;
  rows: { label: string; verified: CellValue; pro: CellValue; studio: CellValue }[];
};

export const COMPARE_GROUPS: CompareGroup[] = [
  {
    title: "Billing",
    rows: [
      { label: "Monthly price", verified: "£12", pro: "£59", studio: "£149" },
      { label: "Annual price (per month)", verified: "£8.25", pro: "£49", studio: "£124" },
      { label: "Save with annual", verified: "2 months free", pro: "2 months free", studio: "2 months free" },
    ],
  },
  {
    title: "Visibility & trust",
    rows: [
      { label: "Public directory listing (/pro/your-name)", verified: true, pro: true, studio: true },
      { label: "Verified badge", verified: true, pro: true, studio: true },
      { label: "Reviews on the record", verified: true, pro: true, studio: true },
      { label: "Enquiries inbox", verified: true, pro: true, studio: true },
      { label: "Enhanced directory placement", verified: false, pro: true, studio: true },
      { label: "Organisation profile", verified: false, pro: false, studio: true },
      { label: "Multiple locations", verified: false, pro: false, studio: true },
    ],
  },
  {
    title: "Your shop-front (/c/your-name)",
    rows: [
      { label: "Personalised shop-front page", verified: false, pro: true, studio: true },
      { label: "Custom accent colour + hero photo", verified: false, pro: true, studio: true },
      { label: "Three-tier services with 'Most popular' highlight", verified: false, pro: true, studio: true },
      { label: "Methodology / signature method section", verified: false, pro: true, studio: true },
      { label: "Transformations & proof cards", verified: false, pro: true, studio: true },
      { label: "Sticky section nav + mobile CTA bar", verified: false, pro: true, studio: true },
      { label: "Deep-linked enquiry routing", verified: false, pro: true, studio: true },
      { label: "Team / studio accent options", verified: false, pro: false, studio: true },
    ],
  },
  {
    title: "Business operations",
    rows: [
      { label: "Leads CRM", verified: false, pro: true, studio: true },
      { label: "Client management (CRM)", verified: false, pro: true, studio: true },
      { label: "Bookings & calendar", verified: false, pro: true, studio: true },
      { label: "Payments & subscriptions (Stripe)", verified: false, pro: true, studio: true },
      { label: "Messaging inbox", verified: false, pro: true, studio: true },
      { label: "Shared clients across coaches", verified: false, pro: false, studio: true },
    ],
  },
  {
    title: "Coaching delivery",
    rows: [
      { label: "Programmes & exercise library", verified: false, pro: true, studio: true },
      { label: "Nutrition planner", verified: false, pro: "Advanced", studio: "Advanced" },
      { label: "Check-ins & progress", verified: false, pro: "Advanced", studio: "Advanced" },
      { label: "Client portal (web + mobile)", verified: false, pro: true, studio: true },
    ],
  },
  {
    title: "REPs AI",
    rows: [
      { label: "AI Programme Writer", verified: false, pro: true, studio: true },
      { label: "AI Nutrition Planner", verified: false, pro: true, studio: true },
      { label: "AI Check-in Summariser", verified: false, pro: true, studio: true },
      { label: "AI Coach Reply Drafts", verified: false, pro: true, studio: true },
      { label: "AI Lead Scoring", verified: false, pro: true, studio: true },
      { label: "AI Lead Reply Assistant", verified: false, pro: true, studio: true },
      { label: "AI Follow-up Suggestions", verified: false, pro: true, studio: true },
      { label: "AI Business Command Centre", verified: false, pro: true, studio: true },
      { label: "Weekly Next Move Cards", verified: false, pro: true, studio: true },
      { label: "AI Client Risk Alerts", verified: false, pro: true, studio: true },
      { label: "AI Revenue & Retention Insights", verified: false, pro: true, studio: true },
      { label: "AI Content Studio", verified: false, pro: true, studio: true },
      { label: "AI Client Plateau Detection", verified: false, pro: true, studio: true },
      { label: "AI Adherence Analysis", verified: false, pro: true, studio: true },
    ],
  },
  {
    title: "Growth & scale",
    rows: [
      { label: "Automations", verified: false, pro: true, studio: true },
      { label: "Insights & retention dashboard", verified: false, pro: true, studio: true },
      { label: "Multi-coach roles", verified: false, pro: false, studio: true },
      { label: "Coach seats included", verified: "—", pro: "1", studio: "5" },
      { label: "Reporting", verified: false, pro: false, studio: true },
    ],
  },
  {
    title: "Admin & support",
    rows: [
      { label: "Verification speed", verified: "Standard", pro: "Priority", studio: "Priority" },
      { label: "Account manager", verified: false, pro: false, studio: true },
    ],
  },
];

export const TIER_META: Record<TierKey, { label: string; price: string }> = {
  verified: { label: "Verified", price: "£99/yr" },
  pro: { label: "Pro", price: "£59/mo" },
  studio: { label: "Studio", price: "£149/mo" },
};

export const FAQ: { q: string; a: string }[] = [
  {
    q: "Is there a free trial?",
    a: "Yes — Pro includes a 30-day free trial. You can cancel anytime during the trial from your dashboard. Verified and Studio don't currently include a trial.",
  },
  {
    q: "What's the difference between Verified and Pro?",
    a: "Verified is about trust and visibility — credentials, reviews, enhanced directory profile. Pro adds the full operating system to run your practice: bookings, CRM, programmes, advanced nutrition and check-ins, messaging, automations and AI across the platform.",
  },
  {
    q: "How does verification work?",
    a: "Upload your qualifications, insurance and any CPD. Our team reviews within 24 hours. You'll see a Verified badge on your profile once approved.",
  },
  {
    q: "Does REPs take a commission on bookings?",
    a: "No. REPs does not charge a booking commission or per-booking fee. You pay for your tier (Verified, Pro or Studio) and keep what your clients pay you. Standard payment-processor fees from your payment provider still apply on whatever checkout you use.",
  },
  {
    q: "Will founding pricing stay forever?",
    a: "Yes. Founding member pricing on Pro is locked for the lifetime of your subscription — but it's only available before public launch and to a limited number of professionals.",
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
