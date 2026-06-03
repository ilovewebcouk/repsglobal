import ctaBand from "@/assets/cta-band.jpg";
import heroCoaching from "@/assets/hero-coaching-moment.jpg";
import heroTrainer from "@/assets/hero-trainer.jpg";

import coverOnlineVsInPerson from "@/assets/resources/online-vs-in-person-coaching.jpg";
import coverRedFlags from "@/assets/resources/red-flags-hiring-personal-trainer.jpg";
import coverPtCost from "@/assets/resources/personal-trainer-cost-uk-2026.jpg";
import coverVerifiedMeans from "@/assets/resources/what-reps-verified-actually-means.jpg";
import coverComplain from "@/assets/resources/how-to-complain-about-fitness-professional.jpg";
import coverPrice12Week from "@/assets/resources/how-to-price-12-week-programme.jpg";
import coverConsultScript from "@/assets/resources/consultation-script-paying-client.jpg";
import coverCancellation from "@/assets/resources/cancellation-policies-protect-time.jpg";
import coverFirst30Days from "@/assets/resources/first-30-days-new-client.jpg";
import coverNotGettingResults from "@/assets/resources/client-not-getting-results.jpg";
import coverProgrammesFollow from "@/assets/resources/programmes-clients-actually-follow.jpg";
import coverLevel4 from "@/assets/resources/choosing-level-4-specialism.jpg";
import coverFreeVsPaidCpd from "@/assets/resources/free-vs-paid-cpd-2026.jpg";
import coverWhatsNew from "@/assets/resources/whats-new-reps-q2-2026.jpg";
import coverRoadmap from "@/assets/resources/reps-roadmap-next.jpg";

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

// Author personas (kept consistent across articles)
const SOPHIE = {
  author: "Sophie Marshall",
  authorRole: "Editor, REPs",
  authorBio:
    "Sophie writes the REPs consumer guides and has covered the UK fitness industry for over a decade.",
};
const STANDARDS = {
  author: "The REPs Standards Team",
  authorRole: "Standards & Verification",
  authorBio:
    "The REPs Standards Team is responsible for the verification framework, complaints process and the public register.",
};
const JAMES = {
  author: "James Carter",
  authorRole: "Head of Professional Growth, REPs",
  authorBio:
    "James works directly with hundreds of REPs-verified pros on pricing, positioning and client retention.",
};
const PRIYA = {
  author: "Dr Priya Shah",
  authorRole: "Head of Coaching Practice, REPs",
  authorBio:
    "Priya leads coaching standards at REPs and has spent fifteen years coaching and mentoring coaches across the UK.",
};
const MARK = {
  author: "Mark Ellis",
  authorRole: "Head of CPD & Education, REPs",
  authorBio:
    "Mark sets the REPs CPD framework and reviews course providers seeking REPs-endorsed status.",
};

export const RESOURCE_ARTICLES: ResourceArticle[] = [
  {
    slug: "how-reps-verifies-a-fitness-professional",
    title: "How REPs verifies a fitness professional",
    excerpt:
      "A behind-the-badge look at the checks every REPs Verified Professional clears before they appear in the public directory.",
    category: "Verification & Standards",
    ...STANDARDS,
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
    ...SOPHIE,
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
    ...JAMES,
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

  // ---------- NEW: Find a Professional ----------
  {
    slug: "online-vs-in-person-coaching",
    title: "Online vs in-person coaching: which actually gets you results?",
    excerpt:
      "Cost, accountability, technique work — an honest comparison of online and in-person coaching, and how to decide which one suits you.",
    category: "Find a Professional",
    ...SOPHIE,
    date: "2026-06-09",
    dateLabel: "9 June 2026",
    readTime: "7 min read",
    cover: coverOnlineVsInPerson,
    body: [
      {
        type: "p",
        text: "Ten years ago the choice was simple: you hired a personal trainer at your local gym, or you didn't have a coach at all. Today the same money can buy you weekly one-to-one sessions in a studio, a fully programmed online package with daily check-ins, or a hybrid of the two. The right answer depends less on which is 'better' and more on what you actually need help with.",
      },
      { type: "h2", text: "What you're really paying for" },
      {
        type: "p",
        text: "In-person coaching is mostly time. You're buying an hour of an experienced person standing next to you, watching, coaching technique in real time, and removing every decision from your morning. Online coaching is mostly attention. You're buying programme design, weekly check-ins, video reviews, and a coach in your pocket between sessions. Both are valid — but they sell different things, and they don't compete on like-for-like cost.",
      },
      { type: "h2", text: "When in-person wins" },
      {
        type: "p",
        text: "If you've never lifted before, if you're returning from injury, if you have a complex condition (post-surgery, hypermobility, chronic pain), or if you simply will not exercise unless someone is in the room with you — pay for in-person. The compounding cost of a year of bad technique, or a year of cancelling on yourself, is far higher than the difference in monthly fees.",
      },
      { type: "h2", text: "When online wins" },
      {
        type: "p",
        text: "If you have basic gym confidence, a goal that depends on consistency over weeks (fat loss, marathon prep, getting your first pull-up), and you respond well to written check-ins, online coaching often beats in-person hour-for-hour. You get more coaching attention per pound — because the coach isn't selling you a one-hour slot, they're selling you a whole week of structure.",
      },
      {
        type: "ul",
        items: [
          "Just starting out, or coming back from injury → in-person, at least for the first 8–12 weeks.",
          "Confident in the gym, want accountability and a smarter plan → online.",
          "Specialist goal that needs hands-on coaching (powerlifting meet, technique reset) → in-person or hybrid.",
          "Travel a lot, train in different gyms or hotels → online beats in-person every time.",
        ],
      },
      { type: "h2", text: "Hybrid is the quiet winner" },
      {
        type: "p",
        text: "The fastest-growing model on REPs is hybrid: one in-person session a fortnight to coach technique and reset the plan, plus a full online programme between sessions. You get the eyes-on coaching that fixes problems early, and the day-in-day-out structure that actually produces results. If a coach you like offers a hybrid tier, that's usually the smartest spend.",
      },
      {
        type: "quote",
        text: "In-person is what gets you doing it correctly. Online is what gets you doing it consistently. Most people need both.",
      },
    ],
  },
  {
    slug: "red-flags-hiring-personal-trainer",
    title: "Red flags when hiring a personal trainer (and how to spot them in 60 seconds)",
    excerpt:
      "A vetting checklist you can run on any trainer's profile or DMs before you part with a penny.",
    category: "Find a Professional",
    ...SOPHIE,
    date: "2026-05-26",
    dateLabel: "26 May 2026",
    readTime: "6 min read",
    cover: coverRedFlags,
    body: [
      {
        type: "p",
        text: "Almost every bad personal-training experience could have been avoided in the first message. The signs are nearly always there — they just look like normal marketing if you don't know what to look for. Here is the 60-second vetting routine we recommend to every first-time client on REPs.",
      },
      { type: "h2", text: "Red flag 1 — no public proof of qualification" },
      {
        type: "p",
        text: "A professional should make their qualifications and insurance obvious, not optional. If their profile doesn't say which awarding body they trained with, which level qualification they hold, or who insures them, ask before you do anything else. A confident coach answers within minutes; a chancer goes quiet.",
      },
      { type: "h2", text: "Red flag 2 — guarantees of results" },
      {
        type: "p",
        text: "Any coach who guarantees a specific outcome — '10kg in 8 weeks', 'a six-pack in 12' — is either inexperienced or selling you something. Results depend on you as much as them. The right phrase from a serious coach is closer to 'here is what's typical for people in your situation, and here is what we control'.",
      },
      { type: "h2", text: "Red flag 3 — pressure to pay upfront for long packages" },
      {
        type: "p",
        text: "A 12-week package is fine. A 12-month package paid in full upfront, with no break clause, is a red flag — especially if they need an answer today. Walk away from urgency. The real coaches you want are usually a few weeks out and happy to wait.",
      },
      {
        type: "ul",
        items: [
          "Can you see their qualification, level and insurer on their profile?",
          "Did they reply to your enquiry inside 24 hours?",
          "Did the first reply ask about you — or quote you a price?",
          "Are reviews recent (last 12 months) and specific (not just 'great trainer')?",
          "Is there a no-fault cancellation policy written down somewhere?",
        ],
      },
      { type: "h2", text: "Red flag 4 — vague specialism" },
      {
        type: "p",
        text: "If the profile says 'fat loss, muscle gain, strength, mobility, postnatal, rehab, sports performance, mental health and nutrition', they specialise in nothing. Trust the coaches who name one or two populations they're brilliant with — and tell you who they're not the right fit for.",
      },
      { type: "h2", text: "Red flag 5 — they're not on a public register" },
      {
        type: "p",
        text: "It costs nothing to claim to be qualified. It costs something — money, time, paperwork — to keep an active listing on a public register. A trainer who avoids registers is telling you they don't want their standing held up to outside scrutiny. That is, by itself, the answer to whether you should hire them.",
      },
      {
        type: "quote",
        text: "If you ask a serious question and the answer is a sales pitch, you've already learned what you needed to learn.",
      },
    ],
  },
  {
    slug: "personal-trainer-cost-uk-2026",
    title: "How much should a personal trainer cost in the UK in 2026?",
    excerpt:
      "Real UK price ranges for in-person, online and hybrid coaching — plus the five things that actually move the number.",
    category: "Find a Professional",
    ...SOPHIE,
    date: "2026-05-19",
    dateLabel: "19 May 2026",
    readTime: "7 min read",
    cover: coverPtCost,
    body: [
      {
        type: "p",
        text: "Personal training in the UK in 2026 is more expensive than most people expect, and the gap between the cheapest and most expensive coaches in the same city is enormous. The good news: the price difference almost always lines up with one or two specific things, and once you know what they are you can pick the right tier for what you need.",
      },
      { type: "h2", text: "What you should expect to pay" },
      {
        type: "p",
        text: "These are the typical ranges we see on REPs across the UK in 2026. They are not minimums or maximums — they are the middle 60% of verified coaches.",
      },
      {
        type: "ul",
        items: [
          "In-person 1:1 session, regional UK: £45–£75",
          "In-person 1:1 session, London / major cities: £75–£140",
          "Block of 10 in-person sessions, regional: £400–£650",
          "Online coaching (monthly, fully programmed): £120–£300",
          "Hybrid (one in-person per fortnight + online): £250–£500/month",
          "Specialist coaching (post-natal, rehab, sports performance): add 20–40%",
        ],
      },
      { type: "h2", text: "Five things that move the number" },
      {
        type: "p",
        text: "Two coaches in the same gym can charge very different rates. It's almost always one of five things: location and overheads (private studios cost more than gym floors); years of experience and reputation; specialism (working post-natal or with a chronic condition is a longer training pathway); whether the price includes programming and check-ins between sessions; and whether you're paying for a single session or a committed block.",
      },
      { type: "h2", text: "How to judge value, not price" },
      {
        type: "p",
        text: "A £40 session that you cancel half the time is more expensive than a £90 session you never miss. The most useful question to ask is not 'how much per hour' but 'what does a typical month cost me, all-in, and what does that include between sessions?' Once you frame it that way, the cheapest option often stops looking like the cheapest.",
      },
      { type: "h2", text: "Where you can sensibly save" },
      {
        type: "p",
        text: "Most clients overpay for two things and underpay for one. They overpay for prestige gyms and for short-block 'taster' packages with no real plan behind them. They underpay for proper programming and accountability between sessions — which is where almost all of your progress actually happens. Spend less on the room, more on the structure.",
      },
      {
        type: "quote",
        text: "The price you pay should reflect the result you want, not the postcode you're standing in.",
      },
    ],
  },

  // ---------- NEW: Verification & Standards ----------
  {
    slug: "what-reps-verified-actually-means",
    title: "What \"REPs Verified\" actually means — and what it doesn't",
    excerpt:
      "The badge is specific, not magic. Here's exactly what we've checked, what we haven't, and why that distinction matters.",
    category: "Verification & Standards",
    ...STANDARDS,
    date: "2026-05-05",
    dateLabel: "5 May 2026",
    readTime: "6 min read",
    cover: coverVerifiedMeans,
    body: [
      {
        type: "p",
        text: "Verification only works if everyone — clients and professionals — knows precisely what it covers. We see two failure modes in our complaints inbox: clients who assumed REPs Verified meant we had personally trained with the coach, and professionals who thought the badge was an endorsement of their coaching style. Neither is true, and pretending otherwise would damage the register. This is what the badge actually means.",
      },
      { type: "h2", text: "What \"Verified\" guarantees" },
      {
        type: "p",
        text: "Three things, with no asterisks: the professional holds a recognised UK fitness qualification at Level 2 or above from an awarding body we accept; they hold current public liability and professional indemnity insurance, validated against the insurer's records; and the human you see in the photo and the qualification certificate is the same human, confirmed against government-issued ID. Where they work with under-18s or vulnerable adults, an enhanced DBS check is added on top.",
      },
      { type: "h2", text: "What \"Verified\" does not guarantee" },
      {
        type: "p",
        text: "It is not a quality rating. It is not a comment on their coaching method, their personality, their pricing, their results, or whether they're the right fit for you. Two coaches with identical Verified badges can be wildly different in how they coach — that's healthy, and it's why we built reviews and specialism filters on top.",
      },
      {
        type: "ul",
        items: [
          "Verified ≠ best in the area — it's a baseline, not a ranking.",
          "Verified ≠ endorsed by REPs — we check standards, we don't recommend individuals.",
          "Verified ≠ permanent — it can be suspended or removed after a substantiated complaint.",
          "Verified ≠ a substitute for your own consultation — always meet first.",
        ],
      },
      { type: "h2", text: "Why we keep the scope narrow" },
      {
        type: "p",
        text: "A register that promises too much is worth less, not more. The moment we start grading coaches on style, we become a magazine — and our standards work becomes opinion. By keeping verification to checkable facts — qualification, insurance, identity, safeguarding — we can defend every Verified badge in writing and revoke it cleanly when the underlying fact changes.",
      },
      { type: "h2", text: "How to use the badge sensibly" },
      {
        type: "p",
        text: "Treat Verified as a pass/fail gate, not a recommendation. Filter to verified professionals first, then evaluate them like you would any other big-ticket service: read recent reviews, match specialism to your goal, take a consultation, and judge them on the conversation. The badge gets you to a clean shortlist; the consultation tells you which person on that list is right for you.",
      },
      {
        type: "quote",
        text: "Verification is the floor we hold every professional to. Choosing the right one is still your decision.",
        cite: "REPs Standards Charter",
      },
    ],
  },
  {
    slug: "how-to-complain-about-fitness-professional",
    title: "How to make a complaint about a fitness professional",
    excerpt:
      "A step-by-step guide to what we can and can't act on, what evidence to gather, and how the REPs complaints process actually works.",
    category: "Verification & Standards",
    ...STANDARDS,
    date: "2026-04-21",
    dateLabel: "21 April 2026",
    readTime: "7 min read",
    cover: coverComplain,
    body: [
      {
        type: "p",
        text: "If something went wrong with a professional you found on REPs, telling us is the right thing to do — for you, and for everyone who might book the same coach next. This is exactly how the complaints process works, what we can act on, and what evidence makes a complaint we can investigate properly.",
      },
      { type: "h2", text: "What we can act on" },
      {
        type: "p",
        text: "We can investigate anything that touches the standards we verify: working without current insurance, misrepresenting qualifications, identity issues, safeguarding failures, breaches of the REPs code of conduct (which includes safe practice, scope of practice, and how clients are treated), and refusal to honour clearly written terms.",
      },
      { type: "h2", text: "What we can't act on" },
      {
        type: "p",
        text: "We are not a small-claims court and we don't grade coaching style. We can't force a refund on a dispute over results, we can't decide who was right in a personality clash, and we can't intervene in private legal matters. What we can do in those cases is record the complaint, share it with the professional, and make sure it's visible if a pattern emerges.",
      },
      {
        type: "ul",
        items: [
          "Write down what happened, with dates, and stick to facts you can evidence.",
          "Keep messages, contracts, payment receipts, and any policy documents the professional sent you.",
          "If safety was involved, note exactly what was said or done, by whom, and where.",
          "Try to raise it with the professional first in writing — most issues resolve there.",
          "If it doesn't resolve, submit the complaint to REPs via the complaints page.",
        ],
      },
      { type: "h2", text: "What happens after you submit" },
      {
        type: "p",
        text: "Every complaint is logged the day it's received and reviewed by a member of the standards team within five working days. The professional is contacted and given the opportunity to respond in writing. Where the complaint touches a verification fact (insurance, qualification, DBS), the badge can be suspended while we investigate. Where it touches conduct, we may ask both sides for further information before deciding.",
      },
      { type: "h2", text: "Possible outcomes" },
      {
        type: "p",
        text: "An investigation can end in one of four ways: no case to answer (recorded internally only); informal advice to the professional (recorded, not public); a formal warning with conditions (visible internally, repeat issues escalate); or suspension or removal of Verified status (visible publicly). We publish anonymised outcomes annually so the register's standards stay accountable to the people who rely on it.",
      },
      {
        type: "quote",
        text: "The complaints process is not punishment. It's how a register stays trustworthy.",
        cite: "REPs Standards Charter",
      },
    ],
  },

  // ---------- NEW: Fitness Business ----------
  {
    slug: "how-to-price-12-week-programme",
    title: "How to price a 12-week coaching programme",
    excerpt:
      "A working framework for pricing your signature programme without underselling, overselling, or copying the coach down the road.",
    category: "Fitness Business",
    ...JAMES,
    date: "2026-04-07",
    dateLabel: "7 April 2026",
    readTime: "8 min read",
    cover: coverPrice12Week,
    body: [
      {
        type: "p",
        text: "Pricing is the single decision that has the biggest effect on your year — bigger than which gym you work in, bigger than which app you use, bigger than how often you post. And almost every coach I work with sets it the same way: they look at what the trainer next to them charges, take £5 off, and call it a day. There is a better way, and it takes about an hour.",
      },
      { type: "h2", text: "Start from your annual income target" },
      {
        type: "p",
        text: "Decide what you want to earn in the next 12 months — not what's modest, what you actually need. Subtract realistic costs (insurance, CPD, software, rent, tax). Divide by the number of programme slots you can comfortably run at a time. That gives you the revenue per client per programme. Everything else is just packaging that number so it sells.",
      },
      { type: "h2", text: "Anchor with three tiers, sell the middle" },
      {
        type: "p",
        text: "Don't show one price. Show three. A self-paced tier (programme + group support), the signature tier (programme + weekly 1:1 check-in + one in-person/month), and a premium tier (everything in signature + unlimited messaging + bi-weekly in-person). The signature tier is the one most people pick — but it only feels reasonable because there's something cheaper below it and something more expensive above it.",
      },
      {
        type: "ul",
        items: [
          "Self-paced tier: typically 35–45% of signature price.",
          "Signature tier: this is your actual target price — set the others around it.",
          "Premium tier: typically 1.6–2× signature price.",
          "Always show monthly equivalent and total — clients comparison-shop both.",
          "Review pricing every 6 months. Raise prices on new clients first, never mid-programme.",
        ],
      },
      { type: "h2", text: "Real UK price ranges" },
      {
        type: "p",
        text: "From the verified pros on REPs in 2026, a 12-week signature programme typically lands between £600 and £1,800 depending on city, format (online, hybrid, in-person), and specialism. Online-only signature programmes from experienced coaches cluster around £900–£1,200. Hybrid sits at £1,200–£1,800. In-person 2× per week for 12 weeks usually exceeds £2,000. If you're at the bottom of that band with five years' experience and a full client list, you're underpriced.",
      },
      { type: "h2", text: "What to do if no one's buying" },
      {
        type: "p",
        text: "If enquiries dry up after you raise prices, the problem is almost never the number — it's the offer. Tighten the specialism (one outcome, one population), strengthen the proof on your profile (three named outcomes with first names and weeks-to-result), and move every enquiry to a consultation. If those three are in place and people still aren't buying, then revisit price — but in that order.",
      },
      {
        type: "quote",
        text: "Set the price you need to earn what you said you wanted. Then make the offer worth it.",
        cite: "Head of Professional Growth, REPs",
      },
    ],
  },
  {
    slug: "consultation-script-paying-client",
    title: "Turning a free consultation into a paying client: a 20-minute script",
    excerpt:
      "The exact agenda, questions and close that the highest-converting REPs pros use in their free consultations.",
    category: "Fitness Business",
    ...JAMES,
    date: "2026-03-31",
    dateLabel: "31 March 2026",
    readTime: "7 min read",
    cover: coverConsultScript,
    body: [
      {
        type: "p",
        text: "The free consultation is the single highest-leverage 20 minutes in a coaching business. Done well, it converts 60–80% of enquiries into clients. Done badly — which usually means turned into a tour of the gym or a sales pitch — it converts under 20%. The good news is the difference is almost entirely structural. Here is the script.",
      },
      { type: "h2", text: "Minutes 0–3: rapport and frame" },
      {
        type: "p",
        text: "Don't open with 'so, tell me about your goals'. Open with the agenda. 'Thanks for coming in. The next 20 minutes is just three things: I'll ask you about what you want, I'll tell you honestly whether I'm the right person, and if we both think it's a fit we'll talk about how it would work. Sound good?' That single sentence relaxes everyone in the room.",
      },
      { type: "h2", text: "Minutes 3–12: the real questions" },
      {
        type: "p",
        text: "Spend almost two-thirds of the consultation here, in questions. The goal is not to sell — it's to understand. The best coaches ask very few questions, but each one earns a long answer. Listen for the gap between what they say they want and what they actually mean.",
      },
      {
        type: "ul",
        items: [
          "What made you book this call today, not three months ago?",
          "If we worked together for 12 weeks and it went brilliantly, what would be different?",
          "What's tried not worked before — and what did you learn from it?",
          "Outside of the gym, what does a hard week look like for you?",
          "Be honest: how committed are you, on a scale of 1 to 10, this month?",
        ],
      },
      { type: "h2", text: "Minutes 12–17: tell them what you'd do" },
      {
        type: "p",
        text: "Now reflect back. 'Here's what I'm hearing: you want X, the biggest blocker is Y, and you've got Z hours a week realistically. Based on that, here's what I'd suggest…' Describe the programme structure, the format, the check-in cadence, and one specific thing you'd do in week one. Confident, specific, calm.",
      },
      { type: "h2", text: "Minutes 17–20: the close" },
      {
        type: "p",
        text: "Don't ask 'do you want to sign up?' Ask 'does that sound like what you were hoping for?' If yes, walk them through the next step — 'Brilliant. I've got two slots opening next week. I'll send you the welcome pack and the payment link now. Which day works better for our first session?' Always end with a specific calendar question; never end with 'have a think about it'.",
      },
      {
        type: "quote",
        text: "Most coaches sell with their mouths. The best ones sell with their questions.",
        cite: "Head of Professional Growth, REPs",
      },
    ],
  },
  {
    slug: "cancellation-policies-protect-time",
    title: "Cancellation policies that protect your time without losing clients",
    excerpt:
      "Sample policies, exact wording, and the edge cases — from genuine illness to chronic no-shows — that every coach needs to think through once.",
    category: "Fitness Business",
    ...JAMES,
    date: "2026-03-24",
    dateLabel: "24 March 2026",
    readTime: "6 min read",
    cover: coverCancellation,
    body: [
      {
        type: "p",
        text: "Almost every coach I meet has been burned by the same thing: a client cancels at 7am, the 8am slot goes unfilled, that's £80 gone, and the conversation about the policy never happens because it feels awkward. The fix isn't a tougher policy — it's a clear policy, agreed once, in writing, before there's ever a problem.",
      },
      { type: "h2", text: "The core policy" },
      {
        type: "p",
        text: "Keep it short enough that a client could repeat it back to you. Three numbers and one principle. Numbers: notice required to reschedule without charge (we recommend 24 hours), notice required to avoid losing the session entirely (we recommend 12 hours), and how many late cancels you'll absorb in a programme (we recommend one). Principle: 'You're paying for the slot, not just the session.' Once that's said, almost no one argues.",
      },
      { type: "h2", text: "Suggested wording" },
      {
        type: "p",
        text: "Steal this directly. 'Sessions are bookable in your tier. If you need to reschedule, please give 24 hours' notice and I'll move the slot at no charge. With less than 24 hours, the session may be rescheduled inside the same week if I have space. With less than 12 hours, or a no-show, the session is forfeited. As a goodwill gesture, the first late cancel in any programme is on me — after that the policy applies.'",
      },
      {
        type: "ul",
        items: [
          "Put the policy in your welcome pack and your booking confirmation — twice is fine.",
          "Read it out loud at the consultation, not after the first cancellation.",
          "Be consistent — applying the policy unevenly is what damages client trust.",
          "Build in one 'on me' cancel per programme — it removes 90% of the awkwardness.",
          "If illness is involved, use judgment. The policy is your floor, not your ceiling.",
        ],
      },
      { type: "h2", text: "The hard cases" },
      {
        type: "p",
        text: "Genuine illness or family emergency? Reschedule, no question. Chronic patterns of last-minute cancellation? Have the conversation directly, in writing, before the next renewal: 'I love working with you, and I notice we've had four late cancels this block. The way the policy is written, those slots are forfeit, but more importantly it tells me the timing isn't working — let's restructure.' That conversation, calmly handled, rescues more clients than it loses.",
      },
      { type: "h2", text: "What to never do" },
      {
        type: "p",
        text: "Don't invoice for missed sessions silently. Don't apply the policy to one client and not another. Don't make exceptions you wouldn't make twice. Cancellation policies fail not because they're too tough or too soft — they fail because they're inconsistent. Pick a policy you can apply with a straight face every time and stop apologising for it.",
      },
      {
        type: "quote",
        text: "The right policy is the one you'll actually use. The wrong one is the one you only mention when you're already angry.",
        cite: "Head of Professional Growth, REPs",
      },
    ],
  },

  // ---------- NEW: Coaching & Client Management ----------
  {
    slug: "first-30-days-new-client",
    title: "The first 30 days with a new client: a week-by-week playbook",
    excerpt:
      "What to do in week 1, 2, 3 and 4 to convert a new signup into a 90-day client — and a referrer.",
    category: "Coaching & Client Management",
    ...PRIYA,
    date: "2026-03-17",
    dateLabel: "17 March 2026",
    readTime: "8 min read",
    cover: coverFirst30Days,
    body: [
      {
        type: "p",
        text: "Retention is built in the first month, not the third. The clients who quit at week 10 almost always show the warning signs in week two or three — they were just never asked about them. This is the playbook our highest-retention coaches use across week one to week four.",
      },
      { type: "h2", text: "Week 1 — make them feel chosen" },
      {
        type: "p",
        text: "Before the first session: a welcome pack (what to expect, your cancellation policy, how to message you), a short personal video — 60 seconds, phone camera, recorded once and reused — and a 15-minute pre-call to confirm the programme and answer questions. First session is mostly conversation, baseline movement screen, and one short, achievable workout. Goal: they leave thinking 'this person actually listened'.",
      },
      { type: "h2", text: "Week 2 — set the rhythm" },
      {
        type: "p",
        text: "By now they should know exactly how the week works. Same training days, same check-in day, same time you reply to messages. Predictability is what builds the habit. End of week 2: a short, written progress note — not a workout summary, a coaching note. 'Here's what I noticed this week. Here's what we're doing next week. Here's the one thing I want you to focus on.'",
      },
      { type: "h2", text: "Week 3 — the dip" },
      {
        type: "p",
        text: "Week 3 is where motivation evaporates for almost everyone. The honeymoon's over, results aren't visible yet, life pushed back. This is the week to over-communicate, shorten the workouts if needed, and openly name the dip: 'Week 3 is the hardest week of the whole programme, and you've shown up for both sessions. That's the win.' Don't ignore the dip — coach into it.",
      },
      {
        type: "ul",
        items: [
          "Day 1 — welcome pack and short personal video.",
          "Day 7 — first written progress note (coaching, not workout summary).",
          "Day 14 — confirm cadence is working; small win to celebrate.",
          "Day 21 — name the dip; offer one practical adjustment.",
          "Day 28 — 15-minute review call, recommit goals for next 30 days.",
        ],
      },
      { type: "h2", text: "Week 4 — the recommit call" },
      {
        type: "p",
        text: "End the month with a 15-minute review. Look back at where they were on day one (have the numbers ready), name the wins, name what didn't work, and decide together what changes in the next 30 days. This call is also where 90% of long-term clients are made — not by selling, but by asking the question 'Are you up for going harder in month two, or staying steady?' Either answer is fine; getting the answer is what matters.",
      },
      { type: "h2", text: "What this is really about" },
      {
        type: "p",
        text: "The first 30 days isn't a programming question — it's a coaching one. The training plan can be roughly the same for everyone. What changes the retention number is the structure of the relationship: the cadence, the predictability, the written check-ins, the named dip, the recommit call. Get the structure right, and the programme on top works for almost anyone.",
      },
      {
        type: "quote",
        text: "Clients quit relationships, not programmes. Build the relationship in month one and the rest follows.",
        cite: "Head of Coaching Practice, REPs",
      },
    ],
  },
  {
    slug: "client-not-getting-results",
    title: "How to handle a client who isn't getting results",
    excerpt:
      "A diagnostic flow, a conversation script, and a clear rule for when to stay the course versus when to part ways.",
    category: "Coaching & Client Management",
    ...PRIYA,
    date: "2026-03-10",
    dateLabel: "10 March 2026",
    readTime: "7 min read",
    cover: coverNotGettingResults,
    body: [
      {
        type: "p",
        text: "Every coach with more than a year of experience has had this client: showing up, doing the work in front of you, but the numbers aren't moving. Before you change the programme — and before you blame the client — work through this diagnostic in order.",
      },
      { type: "h2", text: "Step 1 — separate adherence from execution" },
      {
        type: "p",
        text: "Are they doing the plan you wrote, the way you wrote it? Or are they doing 70% of it, missing the conditioning, and quietly under-eating four days a week? You can't programme around a phantom. Pull the data — sessions logged, sleep tracker if you have one, food log, weekend honestly — and look at the actual inputs before changing anything.",
      },
      { type: "h2", text: "Step 2 — check the measurement window" },
      {
        type: "p",
        text: "Fat loss, strength, hypertrophy, conditioning — each has its own honest measurement window. Below those windows you are looking at noise, not progress. Trying to read fat loss off two weeks of scale weight is a mistake even experienced coaches make. Step back and look at a four- to six-week window before deciding the plan isn't working.",
      },
      {
        type: "ul",
        items: [
          "Fat loss: 4–6 weeks minimum, with weekly averages — not daily readings.",
          "Strength: 6–8 weeks for clear progression on a programmed lift.",
          "Conditioning: 4 weeks of consistent sessions before re-testing.",
          "Body composition by photo: 8 weeks, same lighting, same time of day.",
        ],
      },
      { type: "h2", text: "Step 3 — have the conversation" },
      {
        type: "p",
        text: "If after honest diagnosis the answer is still 'we should be seeing more', have the conversation directly and without blame. 'I've been looking at the last six weeks and the progress isn't where I expected it. I want to walk you through what I'm seeing, and I'd love your read on it.' Then listen. Sometimes you learn the client is doing exactly what you wrote and you need to change the plan. Sometimes you learn they're cancelling on themselves at the weekend and didn't want to say.",
      },
      { type: "h2", text: "Step 4 — change one thing at a time" },
      {
        type: "p",
        text: "When something does need to change, change one variable. Either training volume or calories or sleep target or session frequency — not all four. If you change everything, you'll never know what worked. Give the new variable its honest measurement window and look again.",
      },
      { type: "h2", text: "When to part ways" },
      {
        type: "p",
        text: "Some clients aren't ready, no matter how good the coaching. If you've diagnosed honestly, changed variables, had the conversation twice, and the same pattern continues — it's kinder to end the relationship cleanly than to keep taking the money. 'I don't think I'm the right coach for where you are right now. Here's what I think would actually help, and I'd love to revisit when you're ready.' Said well, that conversation often brings the client back, on the right footing, six months later.",
      },
      {
        type: "quote",
        text: "Diagnose the inputs before you change the plan, and have the conversation before you change the client.",
        cite: "Head of Coaching Practice, REPs",
      },
    ],
  },
  {
    slug: "programmes-clients-actually-follow",
    title: "Writing programmes that clients actually follow",
    excerpt:
      "Adherence beats optimisation. The format, length and language choices that turn a brilliant plan into one your client will actually do.",
    category: "Coaching & Client Management",
    ...PRIYA,
    date: "2026-03-03",
    dateLabel: "3 March 2026",
    readTime: "7 min read",
    cover: coverProgrammesFollow,
    body: [
      {
        type: "p",
        text: "There is a programme that is theoretically optimal for your client, and there is a programme they will actually do this week. The first one impresses other coaches. The second one is the one that produces results. Most of the time these are not the same programme.",
      },
      { type: "h2", text: "Length: shorter than you think" },
      {
        type: "p",
        text: "If your average session takes a serious adult 75 minutes to complete properly, almost no one will do it three times a week. Aim for 45–55 minute sessions that include warm-up and cool-down. If you can't fit it, the right answer is fewer exercises, not less rest. Adherence quietly destroys volume; volume rarely survives a missed week.",
      },
      { type: "h2", text: "Format: written for a tired human" },
      {
        type: "p",
        text: "Your client will open this programme on their phone, at 6am, in a busy gym. They are not reading carefully. The format must survive that: large heading per session, exercise name as a bold first line, sets and reps unmistakable, every cue under five words, video link tap-friendly. If your programme requires a key or a legend, you've already lost.",
      },
      {
        type: "ul",
        items: [
          "One session per screen — never scroll within a session.",
          "Bold the exercise; sub-text the sets/reps in plain language ('3 sets of 8, leave 2 in the tank').",
          "Video link on every movement, not just the new ones — they forget.",
          "Replace 'AMRAP', 'EMOM' and other jargon with one-line plain-English instructions.",
          "Include a 'if you only have 30 minutes' shorter version of each session.",
        ],
      },
      { type: "h2", text: "Language: directive, not optional" },
      {
        type: "p",
        text: "Compare two cues. 'Aim for around 8–10 reps if it feels okay' versus 'Do 8 reps. The last 2 should be hard but clean — stop if form breaks.' The second one is a coaching decision the client can execute. The first is a vague suggestion they'll silently misinterpret. Write programmes the way you'd talk to a client in the room: with authority, with a single clear instruction, and with permission to bail if needed.",
      },
      { type: "h2", text: "Buffer: build in failure-tolerant weeks" },
      {
        type: "p",
        text: "Every four weeks should include a planned lighter week — not a deload disguised as a holiday, an actual lighter week the client sees on the calendar. Adherence improves when the client knows there's a breather coming. The coaches with the highest 12-week completion rates are almost universally the ones who programme in less, not more.",
      },
      {
        type: "quote",
        text: "The best programme on paper is worthless. The second-best programme done four days a week is everything.",
        cite: "Head of Coaching Practice, REPs",
      },
    ],
  },

  // ---------- NEW: CPD & Education ----------
  {
    slug: "choosing-level-4-specialism",
    title: "Choosing a Level 4 specialism: a decision framework",
    excerpt:
      "Match the specialism to the client base you actually want — not the one that's trending — using a four-question framework.",
    category: "CPD & Education",
    ...MARK,
    date: "2026-04-14",
    dateLabel: "14 April 2026",
    readTime: "7 min read",
    cover: coverLevel4,
    body: [
      {
        type: "p",
        text: "A Level 4 specialism is a serious commitment — six to twelve months of study, real money, and a re-positioning of your whole practice. The mistake we see most often is coaches picking the qualification that looks most impressive on paper rather than the one that fits the clients they actually want to work with for the next five years.",
      },
      { type: "h2", text: "Question 1 — who do you actually want to coach?" },
      {
        type: "p",
        text: "Forget what's trending. Picture your perfect client. Are they post-natal women in their 30s? Office workers in their 50s with back pain? Recreational runners chasing their first sub-4 marathon? Older adults rebuilding strength? Once you can name the population in a single sentence, the right qualification is usually obvious — and you've eliminated 80% of the options.",
      },
      { type: "h2", text: "Question 2 — does the local market actually want it?" },
      {
        type: "p",
        text: "A brilliant qualification with no demand in your area is an expensive hobby. Spend a week looking at REPs profiles in a 10-mile radius. Count how many coaches already specialise in your candidate area, how many enquiries that population generates, and what the going price point looks like. Specialism + unmet local demand is where the best Level 4 outcomes happen.",
      },
      {
        type: "ul",
        items: [
          "Lower back pain / chronic pain — high demand, modest competition, premium pricing.",
          "Post-natal — high demand, growing supply, strong word-of-mouth referrals.",
          "Older adults / strength for ageing — significant demand, low supply, very loyal clients.",
          "Sports performance (amateur athletes) — concentrated demand in clubs, requires network.",
          "Nutrition coaching (where regulated) — often pairs well with an existing PT specialism rather than standing alone.",
        ],
      },
      { type: "h2", text: "Question 3 — does it change what you can charge?" },
      {
        type: "p",
        text: "Not every specialism shifts your price point. The ones that do are typically the ones where clients have already tried generic coaching and need something more careful — rehab, chronic pain, post-natal, older adults. If the specialism doesn't materially change either the price or the referrals, you may not need a Level 4 at all — a strong CPD pathway might do the job for a tenth of the cost.",
      },
      { type: "h2", text: "Question 4 — can you sustain it for five years?" },
      {
        type: "p",
        text: "A specialism is a marriage, not a date. You'll be writing programmes, marketing, doing CPD and joining communities in this area for years. Make sure you'd actually enjoy spending the next five years in the specialism you choose. If the honest answer is 'I'd like the price tag but not the population', pick a different one.",
      },
      {
        type: "quote",
        text: "Pick the qualification that fits the clients you want to work with for the next five years — not the next five months.",
        cite: "Head of CPD & Education, REPs",
      },
    ],
  },
  {
    slug: "free-vs-paid-cpd-2026",
    title: "Free vs paid CPD in 2026: where the real value is",
    excerpt:
      "What to skip, what's worth £500+, and how to build a year-long CPD plan that actually improves your coaching.",
    category: "CPD & Education",
    ...MARK,
    date: "2026-03-31",
    dateLabel: "31 March 2026",
    readTime: "6 min read",
    cover: coverFreeVsPaidCpd,
    body: [
      {
        type: "p",
        text: "There has never been more free coaching education available, and almost none of it makes coaches better. There is also more high-quality paid CPD than ever, and most of it is genuinely worth the money. The hard part is telling them apart and building a plan that actually moves you forward over a year.",
      },
      { type: "h2", text: "What free CPD is actually good for" },
      {
        type: "p",
        text: "Free CPD — podcasts, YouTube, social posts, free webinars — is brilliant for exposure to new ideas, for keeping up with the conversation, and for finding people whose work is worth investing in later. It is almost never deep enough to change how you coach. Treat it as a curation tool, not as a development plan.",
      },
      { type: "h2", text: "What paid CPD is worth" },
      {
        type: "p",
        text: "Paid CPD earns its money when it does one of three things: gives you structured assessment of your current coaching (a mentor reviewing your programming and sessions); takes you significantly deeper into a specific area with a built-in feedback loop; or unlocks a qualification or specialism that materially changes what you can sell. Anything that doesn't do at least one of those three is probably entertainment.",
      },
      {
        type: "ul",
        items: [
          "Skip — generic 'business of PT' courses with no implementation support.",
          "Skip — short courses that just repackage free content into a PDF.",
          "Worth it — mentorship from a coach 5–10 years ahead of you in your specialism.",
          "Worth it — small-group CPD with assessed practice (1:1 review, not slides).",
          "Worth it — Level 4 specialisms where you've already chosen the population.",
        ],
      },
      { type: "h2", text: "A simple annual plan" },
      {
        type: "p",
        text: "We recommend coaches budget one significant paid investment per year — typically £400–£2,000 — and combine it with a structured free habit. The free habit is: one technical podcast or paper per week, one practical short-form source (Instagram or newsletter) followed deliberately, and one written reflection per month on what changed in your coaching. The paid investment fills the gap that habit alone can't.",
      },
      { type: "h2", text: "How to evaluate before you buy" },
      {
        type: "p",
        text: "Before any paid CPD, ask three questions: who has done this and is now visibly better at the thing it teaches? What's the assessment or feedback mechanism? What will I be able to do in three months that I can't do now? If a course can't answer those clearly, walk away — there's almost always a better-structured equivalent for the same money.",
      },
      {
        type: "quote",
        text: "The most expensive CPD is the cheap CPD you do every year and never apply.",
        cite: "Head of CPD & Education, REPs",
      },
    ],
  },

  // ---------- NEW: Platform Updates ----------
  {
    slug: "whats-new-reps-q2-2026",
    title: "What's new on REPs — Q2 2026",
    excerpt:
      "The updates we shipped to the directory, verification and professional profiles between April and June 2026.",
    category: "Platform Updates",
    ...STANDARDS,
    date: "2026-06-02",
    dateLabel: "2 June 2026",
    readTime: "5 min read",
    cover: coverWhatsNew,
    body: [
      {
        type: "p",
        text: "A short, dated changelog of the public-facing things that landed on REPs in the second quarter of 2026. We publish these every quarter so the people who rely on the register — clients, professionals, and partner organisations — can see exactly what's changed and why.",
      },
      { type: "h2", text: "Search and discovery" },
      {
        type: "p",
        text: "The directory now supports filtering by specialism, setting (in-person, online, hybrid) and verification tier in a single step, with the filter state preserved when you open a profile and come back. The result cards have been redesigned to surface specialism, hourly range, location and verification badge at a glance, and the photo aspect ratio has been standardised across the directory.",
      },
      { type: "h2", text: "Professional profiles" },
      {
        type: "p",
        text: "Profiles now have a horizontal services row at the top — three named programmes with price ranges and a single enquire action — so prospective clients can see exactly what's on offer without scrolling. The reviews section has been moved up the page and supports verified-purchase reviews from clients who booked through REPs.",
      },
      { type: "h2", text: "Verification" },
      {
        type: "p",
        text: "Insurance and DBS expiry reminders have moved from 30-day to 60-day-and-30-day notice. The Verified badge now displays the date of last successful check on hover, and lapsed-insurance suspensions are now automatic within 24 hours of the expiry date.",
      },
      {
        type: "ul",
        items: [
          "Directory: combined-filter UI, preserved filter state, redesigned result cards.",
          "Profiles: horizontal services row, repositioned reviews, verified-purchase reviews.",
          "Verification: 60-day expiry reminders, last-check-date on badge hover, automatic suspension on lapse.",
          "Standards: anonymised complaints summary published for the previous year.",
          "Public register: faster search, accessibility improvements across keyboard and screen-reader navigation.",
        ],
      },
      { type: "h2", text: "Standards and the public register" },
      {
        type: "p",
        text: "We published the anonymised complaints summary for the previous year on the standards page — total complaints, outcomes by category, and average time to resolution. We've also made the public register itself faster and improved accessibility across keyboard and screen-reader navigation.",
      },
      {
        type: "quote",
        text: "Trust is built in public. A register that doesn't publish its updates isn't a register — it's a database.",
        cite: "REPs Standards Charter",
      },
    ],
  },
  {
    slug: "reps-roadmap-next",
    title: "The REPs roadmap: what we're building next",
    excerpt:
      "A public look at what's coming to REPs in the next two quarters — what we've committed to, what we're exploring, and what we won't be doing.",
    category: "Platform Updates",
    ...STANDARDS,
    date: "2026-05-26",
    dateLabel: "26 May 2026",
    readTime: "5 min read",
    cover: coverRoadmap,
    body: [
      {
        type: "p",
        text: "We believe a public register should also have a public roadmap. This is what's committed for the next two quarters, what we're actively exploring, and — just as important — what we're choosing not to build, so professionals and clients know what to expect.",
      },
      { type: "h2", text: "Committed for the next quarter" },
      {
        type: "p",
        text: "Three things are funded and in build. First, a redesigned client-side enquiry flow that lets people request a consultation directly from a profile without leaving REPs. Second, an updated complaints submission interface with structured evidence upload and clearer status tracking for both parties. Third, a refreshed standards page with the full audited verification framework published in plain English.",
      },
      { type: "h2", text: "Committed for the quarter after" },
      {
        type: "p",
        text: "Three more things are scoped and on the timeline. A verified-client reviews system that ties reviews to confirmed bookings; a CPD-tracking surface for professionals that shows their progress against an annual plan; and an organisation account for clubs and studios that lets a venue manage a team of verified professionals under one roof.",
      },
      {
        type: "ul",
        items: [
          "Q3 2026 — direct enquiry flow on profiles.",
          "Q3 2026 — redesigned complaints submission and status tracking.",
          "Q3 2026 — public standards page with the full framework in plain English.",
          "Q4 2026 — verified-client reviews tied to bookings.",
          "Q4 2026 — CPD-tracking surface for professionals.",
          "Q4 2026 — organisation accounts for clubs and studios.",
        ],
      },
      { type: "h2", text: "What we're exploring" },
      {
        type: "p",
        text: "A few things sit in research, not in build. A specialism-led discovery experience for clients who know their goal but not the right type of coach. A safe-practice resource library for professionals that pairs with the standards framework. And a structured pathway for BD-registered professionals to migrate their existing profile into REPs without losing their history. These are not commitments — but they are the questions we're spending serious time on.",
      },
      { type: "h2", text: "What we're not building" },
      {
        type: "p",
        text: "We are not building paid promotion of individual professionals over others. We are not building a workout app or wearable. We are not adding paid 'featured' placements in the directory — verification is the only thing that affects ranking on REPs and that will not change. Saying these out loud matters; a roadmap is also a contract about what won't happen.",
      },
      {
        type: "quote",
        text: "A roadmap is a promise about both what we'll build and what we won't. Both halves matter.",
        cite: "REPs Standards Charter",
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
