import ctaBand from "@/assets/cta-band.jpg";
import heroCoaching from "@/assets/hero-coaching-moment.jpg";
import heroTrainer from "@/assets/hero-trainer.jpg";

export const RESOURCE_CATEGORIES = [
  "Find a Professional",
  "Verification & Standards",
  "Fitness Business",
  "Coaching & Client Management",
  "CPD & Education",
  "Platform Updates",
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export interface ResourceArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: ResourceCategory;
  author: string;
  authorRole: string;
  authorBio: string;
  date: string; // ISO
  dateLabel: string;
  readTime: string;
  cover: string;
  featured?: boolean;
  body: Array<
    | { type: "p"; text: string }
    | { type: "h2"; text: string }
    | { type: "ul"; items: string[] }
    | { type: "quote"; text: string; cite?: string }
  >;
}

export const RESOURCE_ARTICLES: ResourceArticle[] = [
  {
    slug: "how-reps-verifies-a-fitness-professional",
    title: "How REPs verifies a fitness professional",
    excerpt:
      "A behind-the-badge look at the checks every REPs Verified Professional clears before they appear in the public directory.",
    category: "Verification & Standards",
    author: "The REPs Standards Team",
    authorRole: "Standards & Verification",
    authorBio:
      "The REPs Standards Team is responsible for the verification framework, complaints process and the public register.",
    date: "2026-05-12",
    dateLabel: "12 May 2026",
    readTime: "6 min read",
    cover: ctaBand,
    featured: true,
    body: [
      {
        type: "p",
        text: "The REPs badge isn't a logo — it's a promise. When you see a professional marked as Verified on REPs, they have cleared a documented set of checks that the public can rely on. This guide walks through exactly what those checks are, how often they're renewed, and what happens when a professional falls below the bar.",
      },
      { type: "h2", text: "The four pillars of verification" },
      {
        type: "p",
        text: "Every verified professional on REPs has cleared four independent checks before their profile becomes searchable.",
      },
      {
        type: "ul",
        items: [
          "Recognised qualification — a Level 2, Level 3 or higher fitness qualification from an awarding body we accept.",
          "Insurance — current public liability and professional indemnity cover, validated against the insurer's records.",
          "Identity — government-issued photo ID matched to the qualification certificate.",
          "Safeguarding — an active enhanced DBS check (or equivalent) where the professional works with under-18s or vulnerable adults.",
        ],
      },
      { type: "h2", text: "How often it's checked" },
      {
        type: "p",
        text: "Insurance and DBS are checked annually, with automated reminders 60 and 30 days before expiry. If a professional's insurance lapses, their profile is automatically moved to an unverified state until they re-submit valid documents — the public never sees a Verified badge backed by expired cover.",
      },
      { type: "h2", text: "What happens when standards slip" },
      {
        type: "p",
        text: "Verification isn't a one-off. Every complaint logged through the REPs complaints process is reviewed by our standards team. Substantiated complaints can result in a public note on the profile, suspension of the Verified badge, or — in serious cases — removal from the register entirely. The full process is published openly on our standards page so both clients and professionals know exactly where they stand.",
      },
      {
        type: "quote",
        text: "If you can't tell the public exactly what your verification means, it doesn't mean anything.",
        cite: "REPs Standards Charter",
      },
    ],
  },
  {
    slug: "choosing-the-right-personal-trainer",
    title: "Choosing the right personal trainer: what to look for",
    excerpt:
      "A plain-English checklist for anyone hiring a personal trainer for the first time — covering qualifications, chemistry and the questions that actually matter.",
    category: "Find a Professional",
    author: "Sophie Marshall",
    authorRole: "Editor, REPs",
    authorBio:
      "Sophie writes the REPs consumer guides and has covered the UK fitness industry for over a decade.",
    date: "2026-04-28",
    dateLabel: "28 April 2026",
    readTime: "5 min read",
    cover: heroCoaching,
    body: [
      {
        type: "p",
        text: "Hiring a personal trainer is one of the most personal purchases you can make. You're buying time, expertise and trust — often with someone you've never met. This guide gives you a simple framework for choosing the right person the first time.",
      },
      { type: "h2", text: "Start with verification, not Instagram" },
      {
        type: "p",
        text: "A polished Instagram grid tells you about marketing, not coaching. Before you look at anything else, confirm the trainer is verified on a register like REPs. That single step covers qualifications, insurance and identity — the three things that protect you legally and physically.",
      },
      { type: "h2", text: "Match the speciality to your goal" },
      {
        type: "p",
        text: "A trainer who specialises in postnatal recovery is rarely the right pick for a powerlifting meet. On REPs, every professional lists their specialisms, the populations they work with, and the settings they coach in. Filter ruthlessly — the right specialist will get you further in eight weeks than a generalist will in six months.",
      },
      {
        type: "ul",
        items: [
          "Define your goal in one sentence before you contact anyone.",
          "Filter by specialism, location and setting (gym, home, online).",
          "Shortlist three professionals and read every review on their profile.",
          "Send the same enquiry to all three and judge them on the reply, not the rate.",
        ],
      },
      { type: "h2", text: "Questions worth asking on the consultation" },
      {
        type: "p",
        text: "Most trainers offer a free 20-minute consultation. Use it. Ask how they structure the first six weeks, how they measure progress, what happens if you don't see results, and how they handle injury or illness. A good professional will have clear, calm answers — not a sales pitch.",
      },
      {
        type: "quote",
        text: "Pay attention to how the trainer listens during the consultation. The best coaches ask more questions than they answer.",
      },
    ],
  },
  {
    slug: "grow-your-pt-business-in-2026",
    title: "5 ways to grow your PT business in 2026",
    excerpt:
      "The marketing tactics, pricing models and client systems that are working for REPs-verified professionals right now.",
    category: "Fitness Business",
    author: "James Carter",
    authorRole: "Head of Professional Growth, REPs",
    authorBio:
      "James works directly with hundreds of REPs-verified pros on pricing, positioning and client retention.",
    date: "2026-04-14",
    dateLabel: "14 April 2026",
    readTime: "7 min read",
    cover: heroTrainer,
    body: [
      {
        type: "p",
        text: "The professionals winning in 2026 aren't the loudest on social media — they're the most systematic. After a year of working with hundreds of REPs-verified pros, these are the five things the top earners have in common.",
      },
      { type: "h2", text: "1. Productise your offer" },
      {
        type: "p",
        text: "Selling 'personal training' is selling a commodity. Selling '12-week return-to-running for over-40s' is selling a result. The pros who package their work into named, time-boxed programmes convert two to three times more enquiries than those who quote an hourly rate.",
      },
      { type: "h2", text: "2. Charge for outcomes, not hours" },
      {
        type: "p",
        text: "Hourly pricing caps your income at the number of hours in a week. Programme pricing — a fixed fee for a defined outcome — lets you charge for the value of the result, not the time it takes. The top quartile of REPs pros price every offer this way.",
      },
      { type: "h2", text: "3. Build a referral engine" },
      {
        type: "p",
        text: "Roughly 60% of new clients on REPs come through referral from existing clients. Make it easy: ask at week six, give a written incentive, and follow up once. That's it.",
      },
      {
        type: "ul",
        items: [
          "Define one signature programme and price it as a package.",
          "Move all new enquiries to a 20-minute consultation, not a price-list reply.",
          "Ask every client for a referral at week six and at programme completion.",
          "Send a monthly client newsletter — even five paragraphs is enough.",
          "Block 90 minutes a week for business work, before you book any sessions.",
        ],
      },
      { type: "h2", text: "4. Use your REPs profile as your sales page" },
      {
        type: "p",
        text: "Most pros treat their REPs profile like a CV. The top earners treat it like a landing page — clear specialism, three real outcomes, named programmes with prices, and a short personal video. Every enquiry you receive has already read it; make sure it does the selling for you.",
      },
      { type: "h2", text: "5. Protect 90 minutes a week for the business" },
      {
        type: "p",
        text: "The single biggest difference between full and struggling pros is whether they ring-fence time to work on the business — not just in it. Ninety minutes a week, in the diary, non-negotiable. Use it for client follow-ups, content, pricing reviews and admin.",
      },
      {
        type: "quote",
        text: "Hourly rate is what beginners charge. Programme price is what professionals charge.",
        cite: "Head of Professional Growth, REPs",
      },
    ],
  },
];

export function getArticle(slug: string): ResourceArticle | undefined {
  return RESOURCE_ARTICLES.find((a) => a.slug === slug);
}

export function getRelated(slug: string, category: ResourceCategory, limit = 3): ResourceArticle[] {
  const sameCat = RESOURCE_ARTICLES.filter((a) => a.slug !== slug && a.category === category);
  if (sameCat.length >= limit) return sameCat.slice(0, limit);
  const others = RESOURCE_ARTICLES.filter((a) => a.slug !== slug && a.category !== category);
  return [...sameCat, ...others].slice(0, limit);
}
