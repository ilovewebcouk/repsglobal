// Centralised nav config for PublicHeader mega-menus.
// Goals / professions / locations / topics are static for Phase 1.

import {
  Flame,
  Dumbbell,
  Activity,
  Baby,
  HeartPulse,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export const TRAIN_GOALS: {
  slug: string;
  label: string;
  outcome: string;
  icon: LucideIcon;
}[] = [
  { slug: "fat-loss", label: "Lose body fat", outcome: "Sustainable cuts, no crash plans", icon: Flame },
  { slug: "strength", label: "Get stronger", outcome: "Programmed lifting + progression", icon: Dumbbell },
  { slug: "mobility", label: "Move better", outcome: "Mobility, posture, longevity", icon: Activity },
  { slug: "pre-post-natal", label: "Pre & post-natal", outcome: "Safe coaching through pregnancy", icon: Baby },
  { slug: "rehab", label: "Return from injury", outcome: "Rehab-aware coaches", icon: HeartPulse },
  { slug: "sport", label: "Sport-specific", outcome: "Performance for your sport", icon: Trophy },
];

export const TOP_PROFESSIONS: { slug: string; label: string }[] = [
  { slug: "personal-trainer", label: "Personal Trainer" },
  { slug: "pilates-instructor", label: "Pilates Instructor" },
  { slug: "yoga-teacher", label: "Yoga Teacher" },
  { slug: "nutritionist", label: "Nutritionist" },
  { slug: "strength-coach", label: "Strength Coach" },
  { slug: "online-coach", label: "Online Coach" },
];

export const TOP_LOCATIONS: { slug: string; label: string }[] = [
  { slug: "london", label: "London" },
  { slug: "manchester", label: "Manchester" },
  { slug: "birmingham", label: "Birmingham" },
  { slug: "edinburgh", label: "Edinburgh" },
  { slug: "glasgow", label: "Glasgow" },
  { slug: "bristol", label: "Bristol" },
];

// Kept for footer use; no longer surfaced in header nav.
export const ABOUT_LINKS = [
  { to: "/about", label: "About REPs", sub: "Who we are and what we stand for" },
  { to: "/standards", label: "Our Standards", sub: "The bar every professional clears" },
  { to: "/verify", label: "Verification", sub: "How the Verified badge works" },
  { to: "/reviews", label: "Reviews", sub: "Verified client feedback, on the record" },
  { to: "/complaints", label: "Complaints", sub: "Raise an issue with our standards team" },
] as const;

export const RESOURCE_TOPICS: { category: string; label: string }[] = [
  { category: "Find a Professional", label: "Find a Professional" },
  { category: "Verification & Standards", label: "Verification & Standards" },
  { category: "Coaching & Client Management", label: "Coaching & Clients" },
  { category: "Fitness Business", label: "Fitness Business" },
  { category: "CPD & Education", label: "CPD & Education" },
  { category: "Platform Updates", label: "Platform Updates" },
];

// Editorial-only Resources dropdown — institutional links live under About REPs.
export const RESOURCE_QUICK_LINKS: { to: "/resources"; label: string }[] = [];

// For Professionals — supplementary links surfaced below pricing/compare/features.
export const PRO_RESOURCES = [
  { to: "/education" as const, label: "Education" },
  { to: "/specialisms" as const, label: "Specialisms explained" },
];

// About REPs mega-menu — 3 columns of institutional, trust and support pages.
export const ABOUT_GROUPS: {
  heading: string;
  links: { to: "/about" | "/careers" | "/press" | "/contact" | "/standards" | "/verify" | "/reviews" | "/complaints" | "/help" | "/faq"; label: string }[];
}[] = [
  {
    heading: "Organisation",
    links: [
      { to: "/about", label: "About REPs" },
      { to: "/careers", label: "Careers" },
      { to: "/press", label: "Press" },
      { to: "/contact", label: "Contact" },
    ],
  },
  {
    heading: "Standards & trust",
    links: [
      { to: "/standards", label: "Our Standards" },
      { to: "/verify", label: "How verification works" },
      { to: "/reviews", label: "Reviews" },
      { to: "/complaints", label: "Complaints" },
    ],
  },
  {
    heading: "Support",
    links: [
      { to: "/help", label: "Help Centre" },
      { to: "/faq", label: "FAQ" },
    ],
  },
];
