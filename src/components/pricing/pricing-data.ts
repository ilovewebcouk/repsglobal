// Shared pricing data for /for-professionals and (redirected) /pricing.
// Single source of truth — no duplication across routes.

export type Billing = "monthly" | "annual";

export type PriceView = { price: string; was?: string; period: string; meta?: string };

export type PlanTierKey = "free" | "verified" | "pro" | "business";

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

export const STUDIO_PRICING: Record<Billing, PriceView> = {
  monthly: { price: "£149", period: "per month", meta: "Billed monthly" },
  annual: { price: "£124", period: "per month", meta: "£1,490 billed yearly · 2 months free" },
};

export type TierKey = "verified" | "pro" | "business" | "studio";
export type CellValue = boolean | string;

export type CompareGroup = {
  title: string;
  rows: { label: string; verified: CellValue; pro: CellValue; business: CellValue; studio: CellValue }[];
};

export const COMPARE_GROUPS: CompareGroup[] = [
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

export const TIER_META: Record<TierKey, { label: string; price: string }> = {
  verified: { label: "Verified", price: "£99/yr" },
  pro: { label: "Pro", price: "£29/mo" },
  business: { label: "Business", price: "£59/mo" },
  studio: { label: "Studio", price: "£149/mo" },
};

export const FAQ: { q: string; a: string }[] = [
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
