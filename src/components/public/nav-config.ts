// Centralised nav config for PublicHeader mega-menus.
// Top professions + locations are static for Phase 1.

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

export const ABOUT_LINKS: { to: string; label: string; sub: string }[] = [
  { to: "/about", label: "About REPs", sub: "Who we are and what we stand for" },
  { to: "/standards", label: "Our Standards", sub: "The bar every professional clears" },
  { to: "/verify", label: "Verification", sub: "How the Verified badge works" },
  { to: "/reviews", label: "Reviews", sub: "Verified client feedback, on the record" },
  { to: "/complaints", label: "Complaints", sub: "Raise an issue with our standards team" },
];

export const RESOURCE_TOPICS: { category: string; label: string }[] = [
  { category: "Find a Professional", label: "Find a Professional" },
  { category: "Fitness Business", label: "Fitness Business" },
  { category: "Verification & Standards", label: "Verification & Standards" },
];
