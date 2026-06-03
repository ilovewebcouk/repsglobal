/**
 * Long-form editorial content for /compare/reps-vs-* head-to-head pages.
 *
 * Framing rule: comparison pages compare REPs Pro (£59/mo, founding,
 * was £79/mo) head-to-head against the competitor's full software plan.
 * Verified (£99/yr) is a public register listing, not coaching software,
 * and is mentioned at most as a one-line aside. Studio only appears on
 * pages that explicitly discuss teams or studios.
 *
 * Pro includes the full software platform: directory profile, verification,
 * CRM, bookings, payments, programmes, check-ins, nutrition, client portal
 * and REPs AI. No paid add-on stack and no per-client charges.
 */

import type { Competitor } from "@/data/competitor-data";

export type DayInTheLifeRow = {
  task: string;
  reps: string;
  competitor: string;
  /** Optional flag to mark something the competitor charges extra for. */
  addOnFlag?: string;
};

export type Scenario = {
  persona: string;
  detail: string;
  clientCount: number;
  repsCost: string;
  competitorCost: string;
  winner: "reps" | "competitor" | "tie";
  summary: string;
};

export type ScorecardRow = {
  criterion: string;
  weight: number; // percent, sums to 100 across the array
  reps: number; // 1-5
  competitor: number; // 1-5
  note: string;
};

export type MigrationStep = {
  title: string;
  body: string;
};

export type Editorial = {
  /** 3-bullet "verdict in 30 seconds" callout under the hero. */
  verdictBullets: string[];
  /** Long-form intro paragraphs (~250-350 words total). */
  intro: string[];
  /** Long-form prose for the hidden-cost section (~250-350 words). */
  costStory: string[];
  /** 4 daily PT jobs, two-column comparison. */
  dayInTheLife: DayInTheLifeRow[];
  /** 3 scenario cards. */
  scenarios: Scenario[];
  /** 6-7 weighted criteria. */
  scorecard: ScorecardRow[];
  /** 5 migration steps. */
  migration: MigrationStep[];
  /** Expanded FAQ — replaces the 4-5 on the Competitor type. */
  faqs: { q: string; a: string }[];
};

const REPS_PRO_LINE =
  "REPs Pro is £59/mo (founding, was £79/mo) and includes the full software platform — directory profile, verification, CRM, bookings, payments, programmes, check-ins, nutrition, client portal and REPs AI. No paid add-on stack or per-client charges.";

const VERIFIED_ASIDE =
  "Verified (£99/yr) is a separate public register listing, not coaching software, and is not included in this comparison.";

export const EDITORIAL: Record<Competitor["slug"], Editorial> = {
  trainerize: {
    verdictBullets: [
      "REPs Pro is the UK-built operating system for personal trainers — Trainerize is a delivery app you bring your own clients to.",
      "REPs Pro is £59/mo and includes payments, branded experience, nutrition and AI; Trainerize charges for Stripe Payments, Custom Branded App and Advanced Nutrition as paid add-ons on top of a base tier.",
      "Pick Trainerize if you're a multi-location studio already on Studio Plus and ABC Fitness. Pick REPs Pro for everyone else in the UK.",
    ],
    intro: [
      "Trainerize — now ABC Trainerize, after the 2021 acquisition by ABC Fitness — is one of the oldest and most widely used personal training apps in the world. Founded in Vancouver in 2010, it built its reputation as a clean, reliable workout-delivery app and went on to power coaching programmes for tens of thousands of trainers, particularly across North America. If you've worked in any larger commercial gym in the last decade, there's a good chance someone in the building was using it.",
      "The product itself is mature. The mobile experience is genuinely good, the workout builder is fast, and habits, messaging, video coaching and a meal-planning module are all available. ABC's gym-management ecosystem (Glofox, Mindbody, IGNITE) sits underneath it, which is why Studio Plus exists and why multi-location franchises lean towards it.",
      "What Trainerize is not — and has never set out to be — is a register. You don't get found on Trainerize. There's no public profile a prospect can search, no credential to display, no UK-built consumer-side discovery. Trainerize assumes you already have clients. Once they're yours, it gives you a place to deliver to them.",
      "REPs is the opposite shape. We start from the register — the verified, public-facing place clients search — and build the operations, coaching delivery and AI layer around it. " +
        REPS_PRO_LINE +
        " " +
        VERIFIED_ASIDE,
    ],
    costStory: [
      "Trainerize's headline pricing is misleading on purpose. The Grow tier is $9/month (up to 2 clients), which looks competitive — until you realise that on Grow you cannot take card payments without buying the Stripe Integrated Payments add-on, you cannot offer a properly branded app to your clients without the Custom Branded App add-on, and the Smart Meal Planner sits inside the Advanced Nutrition Coaching add-on. Each of those is normal-coach-needs-day-one, not edge-case.",
      "A working example. The Pro tier uses a client-count slider that starts at $23/mo for 5 clients and scales up — a coach with ~30 clients lands around $49/month before add-ons. Add payments, add nutrition, add the branded app — typical lands well above $100/month. Add video coaching for premium clients and you're past $120. None of that is hidden — it's all on the pricing page if you click through every link — but the slider sticker is much lower than the all-in bill.",
      "REPs Pro is a single £59/month bill. Payments, nutrition, programmes, check-ins, the client portal and REPs AI across the platform are all included — plus your verified directory profile on the public REPs register. You don't assemble it from add-ons on top of a base plan.",
      "Use the calculator below to see the curve. The further you scale on Trainerize, the more add-ons get loaded onto a single base tier. REPs Pro stays at £59/mo whether you have 5 clients or 500.",
    ],
    dayInTheLife: [
      {
        task: "A prospect finds you",
        reps: "They search the public REPs register, filter by location and specialism, see your verified profile, and book an enquiry.",
        competitor: "They don't, unless you've already driven them to your own website or Instagram. Trainerize has no public-facing discovery.",
      },
      {
        task: "Onboarding a new client",
        reps: "Send a branded REPs invite. Client picks a package, pays through the integrated checkout, and lands in their portal with a programme draft ready to confirm.",
        competitor: "Send a Trainerize invite, then collect payment via the Stripe Integrated Payments add-on if you've bought it, or chase them through a separate checkout if you haven't.",
        addOnFlag: "Payments = paid add-on on Trainerize",
      },
      {
        task: "Building & delivering a programme",
        reps: "AI drafts a programme from the intake form, you edit, assign in two clicks. Client sees it in the branded REPs app with progress logging built in.",
        competitor: "Strong workout builder, mature delivery app. Auto-progression and AI Workout Builder are good. Branded client experience is the Custom Branded App add-on.",
        addOnFlag: "Branded app = paid add-on outside Studio Plus",
      },
      {
        task: "Weekly check-in",
        reps: "Client logs photos, weight, mood and adherence. AI summarises the week, flags churn risk, drafts your reply. Done in two minutes.",
        competitor: "Client logs metrics in-app. Reviewing and replying is mostly manual. There's no equivalent AI check-in summariser bundled in the base tier.",
      },
    ],
    scenarios: [
      {
        persona: "Solo PT, just starting online",
        detail: "10 clients, needs payments + nutrition guidance + a place to be found",
        clientCount: 10,
        repsCost: "REPs Pro £59/mo",
        competitorCost: "≈ $30/mo (Grow + Payments + Nutrition add-ons)",
        winner: "reps",
        summary: "Trainerize's add-on stack is cheaper on paper at this size, but REPs Pro is a single bill with payments, nutrition, AI and a verified public profile on the register included. Discoverability from day one is the wedge.",
      },
      {
        persona: "Online coach scaling up",
        detail: "30 clients, branded experience, taking weekly check-ins seriously",
        clientCount: 30,
        repsCost: "REPs Pro £59/mo",
        competitorCost: "≈ $148/mo (Pro + Payments + Nutrition + Branded App)",
        winner: "reps",
        summary: "This is the sweet spot. The Trainerize add-on stack adds up fast at 30 clients. REPs Pro ships the same capability — branded, paid-in, nutrition, AI — for £59/mo flat, with no bolt-on bill.",
      },
      {
        persona: "Multi-trainer studio",
        detail: "200+ clients across 3 trainers, deep gym-management integrations",
        clientCount: 200,
        repsCost: "REPs Pro £59/mo per coach",
        competitorCost: "$248/mo Studio Plus (branded app included)",
        winner: "competitor",
        summary: "If you're already in the ABC ecosystem (Glofox, Mindbody) and need deep gym-management integration, Studio Plus is a serious product. For multi-coach REPs setups, ask us about Studio — but Pro covers everything an individual coach needs at £59/mo each.",
      },
    ],
    scorecard: [
      { criterion: "Price transparency", weight: 15, reps: 5, competitor: 2, note: "One Pro price vs base + 5 add-ons" },
      { criterion: "Public discoverability", weight: 20, reps: 5, competitor: 1, note: "Verified register vs no public profile" },
      { criterion: "AI as operating layer", weight: 15, reps: 5, competitor: 3, note: "Cross-platform AI vs AI Workout Builder only" },
      { criterion: "Coaching delivery depth", weight: 15, reps: 4, competitor: 5, note: "Trainerize app is genuinely best-in-class" },
      { criterion: "Payments included", weight: 10, reps: 5, competitor: 2, note: "Included in REPs Pro vs Stripe Payments paid add-on" },
      { criterion: "UK fit (GBP, GDPR, register)", weight: 10, reps: 5, competitor: 2, note: "UK-built around REPs register" },
      { criterion: "Cost curve as you scale", weight: 15, reps: 5, competitor: 3, note: "REPs Pro stays £59/mo vs more add-ons on bigger tier" },
    ],
    migration: [
      { title: "Export your Trainerize client list", body: "Trainerize lets you export client details from the Clients dashboard as a CSV. Grab names, emails, phone numbers and any active package notes." },
      { title: "Import to REPs in one upload", body: "Drop the CSV into the REPs onboarding importer. We'll auto-match fields, deduplicate, and create draft profiles. Clients won't be notified until you say go." },
      { title: "Port your programmes and templates", body: "Export your Trainerize programme PDFs or screenshots. Use the REPs AI Programme Builder to recreate them from the source — it's faster than rebuilding block by block." },
      { title: "Redirect your booking link", body: "Update the link in your Instagram bio, website, and email signature to your REPs profile. Keep the Trainerize booking page live for two weeks as a buffer." },
      { title: "Cancel Trainerize at the end of the billing cycle", body: "Run both in parallel for one week — confirm every client has accepted the REPs invite, then cancel Trainerize and any paid add-ons (Stripe Payments, Branded App, Nutrition)." },
    ],
    faqs: [
      { q: "Is Trainerize available in the UK?", a: "Yes — Trainerize works globally. Pricing is in USD and payment add-ons go through Stripe. REPs is UK-built around the public REPs register, which Trainerize doesn't offer." },
      { q: "How much does Trainerize actually cost with add-ons?", a: "The listed tier ($10–$248/mo) is the base. A coach with 30 clients who needs payments, nutrition and a branded app typically lands at ≈ $148/mo once add-ons are added. " + REPS_PRO_LINE },
      { q: "What's the best Trainerize alternative for UK personal trainers?", a: "If you want to be found by clients searching the public register and avoid the stack of payments + nutrition + AI add-ons, REPs Pro is built specifically for UK PTs at £59/mo (founding). MyPTHub and PT Distinction are also alternatives if public discoverability isn't a priority." },
      { q: "Does Trainerize have a free plan?", a: "Yes — a free Basic plan for 1 client. Paid plans start at $10/mo, with most coaches landing on Pro / Small Business at $79/mo before add-ons. REPs Pro is £59/mo founding (was £79/mo), with the full software platform included." },
      { q: "Does Trainerize include AI?", a: "Trainerize has an AI Workout Builder and some automated messaging. REPs ships AI through the whole platform: programme drafts, nutrition planning, check-in summaries, lead scoring, content drafting, churn-risk alerts — included in Pro." },
      { q: "Can I migrate from Trainerize to REPs without losing my clients?", a: "Yes. Export your client list as CSV, import to REPs, run both in parallel for a week while clients accept invites, then cancel Trainerize. We've documented the full 5-step migration above." },
      { q: "Is Trainerize good for studios?", a: "Genuinely yes. Studio Plus is built for multi-location facilities and integrates with the ABC Fitness ecosystem (Glofox, Mindbody). If you're a multi-trainer studio already on ABC, stay. REPs is built around the individual verified trainer." },
      { q: "Does Trainerize charge transaction fees?", a: "Card payments require the Stripe Integrated Payments add-on, and Stripe's standard processing fees apply on top. REPs does not charge a platform fee or commission on bookings; your payment processor's standard fees still apply." },
    ],
  },

  mypthub: {
    verdictBullets: [
      "REPs Pro is the UK-built operating system on the verified public register — MyPTHub is private coaching software clients have to already be yours.",
      "REPs Pro is £59/mo and includes the branded app, AI and automation; MyPTHub charges $95 for a branded app, $12/mo for Check-Ins AI, $10/mo per extra trainer and $19/mo for Zapier on top of a base plan.",
      "Pick MyPTHub if you've got a full roster and just want the cheapest entry-level coaching app. Pick REPs Pro if discoverability and AI matter.",
    ],
    intro: [
      "MyPTHub is the cleaner, friendlier-feeling cousin in this comparison. UK-aware in its tone (their team is partly UK-based), simpler to onboard than Trainerize, and with one of the cheapest entry-level tiers in the category at $25/month for the Starter plan. It's a likeable product.",
      "Where MyPTHub sits in the market is as an all-in-one client management and coaching app for individual trainers and small teams. You get programme delivery, habits, messaging, basic nutrition, and a perfectly serviceable mobile experience. If you mostly need to deliver workouts and track adherence, the base product holds up.",
      "What it isn't is a place clients find you. There's no public-facing register, no verified credential displayed on a profile prospects can search. MyPTHub assumes you've already built your client list — through Instagram, word-of-mouth, your existing gym, your website. The app is for delivery, not discovery.",
      "It's also priced as a base product with a stack of add-ons sitting next to it. The branded app is $95 one-time, the Check-Ins AI module is $12/month, extra trainers are $10/month each, Zapier is $19/month. None of that is hidden, but the bill at the end of the year for a coach who uses all of them is meaningfully bigger than the sticker. " +
        REPS_PRO_LINE +
        " " +
        VERIFIED_ASIDE,
    ],
    costStory: [
      "MyPTHub deserves some credit here: their headline pricing is much cleaner than Trainerize's. The Premium tier at $59/month gives you unlimited clients with payments and nutrition included in the base. If you genuinely don't need a branded app, don't need AI, and don't need automation, $59 is a fair price for what you get.",
      "The wedge is everywhere else. The custom-branded app — the thing your clients actually open every day, with your logo on the home screen — is a $95 one-time payment per platform on top of your subscription. Their AI feature, Check-Ins AI, is a $12/month add-on. Want a second trainer in the account? $10/month per seat. Want Zapier so leads from your website land automatically? $19/month.",
      "A coach with 20 clients who wants the branded app, the AI module, and Zapier — none of those are unreasonable things to want — lands at roughly $90/month. A coach with 40 clients running two trainers is around $99/month. REPs Pro covers all of that for £59/mo flat, with the public register profile on the front.",
      "The calculator below shows the curve. MyPTHub stays competitive on the base tier; the moment you reach for the add-ons that make a serious modern practice work, REPs pulls ahead.",
    ],
    dayInTheLife: [
      {
        task: "A prospect finds you",
        reps: "Your REPs-verified profile is the result of someone searching their postcode + specialism. They book an enquiry without leaving the register.",
        competitor: "They don't, unless you've already brought them to your MyPTHub booking link from somewhere else. MyPTHub has no public register surface.",
      },
      {
        task: "Onboarding a new client",
        reps: "Branded REPs invite, integrated checkout, programme drafted by AI from the intake form. Client lands in their portal with a first session ready.",
        competitor: "MyPTHub invite, client downloads the app (your branded version if you've bought it), fills in the intake. Onboarding is clean — just manual.",
        addOnFlag: "Branded app = $95 one-time on MyPTHub",
      },
      {
        task: "Building & delivering a programme",
        reps: "AI drafts the programme, you edit, assign. Client sees it in the branded REPs app with progress logging and form-cue videos built in.",
        competitor: "Good programme builder with exercise library. Reliable mobile delivery. Programme creation is fully manual — there's no AI builder bundled.",
      },
      {
        task: "Weekly check-in",
        reps: "AI summarises the week, flags risk, drafts your reply. Included in REPs Pro.",
        competitor: "Check-Ins AI is genuinely useful — and it's a $12/month add-on. Without it, check-in review is fully manual.",
        addOnFlag: "Check-Ins AI = $12/mo add-on on MyPTHub",
      },
    ],
    scenarios: [
      {
        persona: "Solo PT on a tight budget",
        detail: "3 clients, no branded app, no AI — just delivery",
        clientCount: 3,
        repsCost: "REPs Pro £59/mo",
        competitorCost: "$25/mo Starter",
        winner: "competitor",
        summary: "If you're brand new, on the Starter plan, and don't care about being found yet, MyPTHub's $25/mo is hard to beat on price alone. REPs Pro wins the moment you want AI, automations or a public-facing profile.",
      },
      {
        persona: "Established online coach",
        detail: "20 clients, wants a branded app, AI check-ins, and automated lead capture",
        clientCount: 20,
        repsCost: "REPs Pro £59/mo",
        competitorCost: "≈ $90/mo (Premium + Check-Ins AI + Zapier + amortised branded app)",
        winner: "reps",
        summary: "This is where MyPTHub's add-on bill catches up. REPs Pro ships the same capability — branded, AI check-ins, automation — for £59/mo, and adds public discoverability on top.",
      },
      {
        persona: "Two-trainer practice",
        detail: "40 clients across 2 trainers with full add-on stack",
        clientCount: 40,
        repsCost: "REPs Pro £59/mo per coach",
        competitorCost: "≈ $99/mo (Premium + AI + branded app + extra trainer)",
        winner: "reps",
        summary: "Per-trainer charges and the AI add-on stack up. Each REPs Pro coach gets their own verified public profile and the full software platform for £59/mo — no per-seat add-ons.",
      },
    ],
    scorecard: [
      { criterion: "Price transparency", weight: 15, reps: 5, competitor: 3, note: "Cleaner than Trainerize, but still 4 add-ons" },
      { criterion: "Public discoverability", weight: 20, reps: 5, competitor: 1, note: "Verified register vs no public profile" },
      { criterion: "AI as operating layer", weight: 15, reps: 5, competitor: 2, note: "Cross-platform AI vs Check-Ins AI add-on only" },
      { criterion: "Coaching delivery depth", weight: 15, reps: 4, competitor: 4, note: "Both solid; MyPTHub very polished for individuals" },
      { criterion: "Payments included", weight: 10, reps: 5, competitor: 5, note: "Both include payments in base" },
      { criterion: "UK fit (GBP, GDPR, register)", weight: 10, reps: 5, competitor: 3, note: "UK-aware vs UK-built around REPs register" },
      { criterion: "Cost curve as you scale", weight: 15, reps: 5, competitor: 3, note: "Pro stays £59/mo vs base + per-trainer + AI + branded app" },
    ],
    migration: [
      { title: "Export your MyPTHub client list", body: "From the Clients screen, export your full list as CSV — names, emails, package notes, programme assignments." },
      { title: "Import to REPs in one upload", body: "Drop the CSV into REPs' onboarding importer. Auto-matches fields, deduplicates, drafts client profiles. Nothing sends to your clients until you publish." },
      { title: "Port your programmes", body: "Pull your MyPTHub programmes into REPs using the AI Programme Builder. Paste in the programme structure and it rebuilds in seconds — usually faster than copying it block by block." },
      { title: "Move your booking link", body: "Replace your MyPTHub booking link with your REPs profile URL on Instagram, your website, email signature, and Google Business. Keep the old link live for two weeks as a safety net." },
      { title: "Cancel MyPTHub at month-end", body: "Run both in parallel for one billing week. Confirm every client has accepted the REPs invite. Cancel MyPTHub and any active add-ons (Check-Ins AI, branded app renewal, extra trainers, Zapier)." },
    ],
    faqs: [
      { q: "What's the difference between REPs and MyPTHub?", a: "MyPTHub is private coaching software — clients have to already be yours. REPs is a verified public register clients search to find a PT, plus the operations and AI layer to run your practice. Different category." },
      { q: "Is MyPTHub's pricing transparent?", a: "The headline pricing is — but the branded app ($95 one-time), Check-Ins AI ($12/mo), additional trainers ($10/mo each), and Zapier ($19/mo) are all add-ons. A coach using all of them ends up north of $90/mo. " + REPS_PRO_LINE },
      { q: "Does MyPTHub include AI?", a: "Their Check-Ins AI is a paid $12/month add-on. REPs ships AI through the whole platform — programmes, nutrition, check-ins, leads, content, risk alerts — included in Pro." },
      { q: "Best MyPTHub alternative for UK trainers?", a: "If you want to be found by clients and avoid the stack of paid add-ons, REPs Pro is built for UK PTs at £59/mo founding. Other alternatives include Trainerize and PT Distinction." },
      { q: "Does MyPTHub charge per client?", a: "No — Premium ($59/mo) and above are unlimited clients. Starter is capped at 3. The cost creeps in via the add-on stack rather than per-client charges." },
      { q: "Is MyPTHub good for new trainers?", a: "Yes — the $25/mo Starter is one of the cheapest entry tiers on the market and the app is genuinely easy to learn. The trade-off is no public-facing register, so you still need to drive your own leads." },
      { q: "Can I migrate from MyPTHub to REPs?", a: "Yes. Export your client CSV, import to REPs, run both in parallel for a week, then cancel MyPTHub. See the 5-step migration guide above." },
      { q: "Does MyPTHub have a free trial?", a: "30-day free trial, no card required — generous and fair. REPs Pro is £59/mo founding (was £79/mo), with the full software platform included." },
    ],
  },

  "pt-distinction": {
    verdictBullets: [
      "REPs Pro is the UK-built operating system on the verified public register; PT Distinction is private coaching software for established coaches.",
      "PT Distinction charges $6/mo per extra client above the cap. A coach with 30 clients on Basic pays $19.90 + 27×$6 ≈ $182/mo. REPs Pro is £59/mo flat with no per-client fee.",
      "Pick PT Distinction if your roster is stable and sits inside a tier cap. Pick REPs Pro if you want one price for the full platform with public discoverability on the front.",
    ],
    intro: [
      "PT Distinction has, for years, been the connoisseur's choice in online coaching apps. Built in the UK, with a feature set that genuinely outstrips most competitors — AI Program Builder, Smart Meal Planner and AI Assistant are all included from the $19.90 Basic tier — it's the platform a lot of experienced online coaches quietly recommend when nobody's paying them to.",
      "The product depth is real. The exercise library, periodisation tools, habit tracking, video coaching, integrations with wearables and the breadth of customisation are all category-leading. If you've been online coaching for five years and you want the most powerful pure-coaching app on the market, PT Distinction is hard to argue with on features alone.",
      "Where it gets interesting is the pricing model. Every tier comes with a client cap — 3 on Basic, 25 on Pro, 50 on Master. Above the cap, you pay per client per month: $6 each on Basic, $2.40 on Pro, $1.60 on Master. It's transparent — printed right on the pricing page — but it's also a tax on growth. The faster you grow, the more often you're upgrading tiers or paying per-head.",
      REPS_PRO_LINE +
        " No per-client fee, plus a verified public profile on the register clients actually search. PT Distinction wins on raw coaching depth; REPs Pro wins on discoverability, AI breadth, and a cost curve that doesn't penalise scale. " +
        VERIFIED_ASIDE,
    ],
    costStory: [
      "Credit where due: PT Distinction's add-on bill is the simplest of the three platforms on this page. There's no separate branded-app fee, no AI add-on, no payments add-on. Extra trainers are genuinely free. The base tier already includes the AI Program Builder, Smart Meal Planner and AI Assistant.",
      "The wedge is the per-client charge. On Basic ($19.90/mo), every client beyond the third costs $6/month. A coach with 10 clients pays $19.90 + 7 × $6 = $61.90. A coach with 30 clients on Basic pays $19.90 + 27 × $6 = $181.90. The natural move is to upgrade — but Pro ($59.90) caps at 25 and then charges $2.40 per extra, and Master ($89.90) caps at 50 and charges $1.60.",
      "It's a fair model in the sense that you only pay for the clients you actually have. But it means every time you sign a new client, you do mental arithmetic. And it means the platform's incentive — and your incentive — are slightly misaligned.",
      "REPs Pro doesn't add a per-client fee. Whether you have 5 clients or 500 on REPs Pro, the price is £59/mo. Use the calculator below to see exactly where the lines cross.",
    ],
    dayInTheLife: [
      {
        task: "A prospect finds you",
        reps: "Searches the REPs register, filters by location and specialism, lands on your verified profile, books an enquiry.",
        competitor: "They don't — PT Distinction has no public register. Lead generation is entirely your problem.",
      },
      {
        task: "Onboarding a new client",
        reps: "Branded REPs invite, integrated checkout, AI-drafted programme ready before they finish their intake form. Your monthly bill doesn't change.",
        competitor: "Excellent onboarding flow with custom forms, automated welcome sequences, and habit setup. Your monthly bill goes up by $6 (Basic), $2.40 (Pro), or $1.60 (Master).",
        addOnFlag: "Each new client = recurring monthly charge",
      },
      {
        task: "Building & delivering a programme",
        reps: "AI drafts programme from intake. You edit, assign. Client sees it in branded REPs app.",
        competitor: "Best-in-class programme builder. AI Program Builder is genuinely good and is in the base tier. Periodisation, deload weeks, auto-progression — all polished.",
      },
      {
        task: "Weekly check-in",
        reps: "AI summarises, flags churn risk, drafts reply. Included in REPs Pro.",
        competitor: "Customisable check-in forms, photo and biometric comparisons, AI Assistant for messaging help. Strong feature set in the base tier.",
      },
    ],
    scenarios: [
      {
        persona: "Small specialist roster",
        detail: "10 clients on Basic, deep coaching app needed",
        clientCount: 10,
        repsCost: "REPs Pro £59/mo",
        competitorCost: "$61.90/mo (Basic + 7 × $6 extra-client fee)",
        winner: "reps",
        summary: "The Basic tier's $19.90 sticker is misleading at this client count. Seven extra clients at $6 each pushes it past $60/mo. REPs Pro is £59/mo flat, with a verified public profile included.",
      },
      {
        persona: "Online coach at Pro cap",
        detail: "25 clients, sitting exactly at the Pro tier cap",
        clientCount: 25,
        repsCost: "REPs Pro £59/mo",
        competitorCost: "$59.90/mo Pro (at cap, no extras)",
        winner: "tie",
        summary: "If your roster is stable and fits cleanly inside the Pro cap, $59.90 for a feature-dense app is competitive. Pick PT Distinction if discoverability isn't the bottleneck; pick REPs Pro if you want the verified register profile on the front.",
      },
      {
        persona: "Scaling above the Pro cap",
        detail: "50 clients on Pro tier",
        clientCount: 50,
        repsCost: "REPs Pro £59/mo (no per-client fee)",
        competitorCost: "$119.90/mo (Pro + 25 × $2.40)",
        winner: "reps",
        summary: "Above the cap, the per-client charge bites again. REPs Pro stays at £59/mo, plus your verified register profile keeps bringing in new enquiries instead of just managing the ones you already have.",
      },
    ],
    scorecard: [
      { criterion: "Price transparency", weight: 15, reps: 5, competitor: 4, note: "PT Distinction is honest, but per-client maths is real" },
      { criterion: "Public discoverability", weight: 20, reps: 5, competitor: 1, note: "Verified register vs no public profile" },
      { criterion: "AI as operating layer", weight: 15, reps: 5, competitor: 4, note: "Cross-platform AI vs strong but contained AI suite" },
      { criterion: "Coaching delivery depth", weight: 15, reps: 4, competitor: 5, note: "PT Distinction is best-in-class for pure coaching" },
      { criterion: "Payments included", weight: 10, reps: 5, competitor: 5, note: "Both include payments with no separate platform fee" },
      { criterion: "UK fit (GBP, GDPR, register)", weight: 10, reps: 5, competitor: 4, note: "Both UK-built; REPs is the register" },
      { criterion: "Cost curve as you scale", weight: 15, reps: 5, competitor: 2, note: "Pro stays £59/mo vs per-client fee above cap" },
    ],
    migration: [
      { title: "Export your PT Distinction client list", body: "From the client area, export your client list as CSV. Capture names, emails, package details and current programme assignments." },
      { title: "Import to REPs in one upload", body: "Drop the CSV into REPs' onboarding importer. Auto-match, deduplicate, draft profiles. Nothing notifies your clients until you publish." },
      { title: "Port your programmes via AI", body: "Use the REPs AI Programme Builder — paste in your PT Distinction programme structure and it recreates it in seconds. Much faster than rebuilding manually." },
      { title: "Move your booking surface", body: "Replace your PT Distinction booking link with your REPs profile URL across Instagram, your site, email signature and Google Business. Keep the old link live for a fortnight." },
      { title: "Cancel PT Distinction", body: "Run both in parallel for one billing week. Confirm every client has accepted the REPs invite, then cancel. No add-ons to unwind — extras for trainers are free on PT Distinction." },
    ],
    faqs: [
      { q: "How does PT Distinction's per-client pricing work?", a: "Each tier includes a client cap (3 on Basic, 25 on Pro, 50 on Master). Beyond that you pay per extra client — $6, $2.40 or $1.60/month depending on tier. A coach with 50 clients on Pro pays $59.90 + 25 × $2.40 = $119.90/month. REPs Pro is £59/mo flat with no per-client fee." },
      { q: "REPs vs PT Distinction — which is better for UK PTs?", a: "PT Distinction is the more feature-dense private coaching app. REPs Pro is a verified public register plus operations and AI in one platform at £59/mo. If clients finding you matters, REPs wins. If you're roster-full and want pure feature density, PT Distinction is reasonable." },
      { q: "Does PT Distinction include AI?", a: "Yes — AI Program Builder, Smart Meal Planner and AI Assistant are included on the Basic tier. REPs ships AI across more surfaces (lead scoring, content, churn risk, weekly growth cards) and includes them in Pro." },
      { q: "Best PT Distinction alternative in the UK?", a: "REPs Pro is the UK-built alternative that combines public discovery, verified credential, operations, coaching delivery and AI in one platform at £59/mo — without per-client charges." },
      { q: "Does PT Distinction have transaction fees?", a: "No separate platform fee on payments. Standard payment-processor fees still apply through Stripe. REPs is the same — no platform commission on payments, and no commission on bookings either." },
      { q: "Are extra trainers really free on PT Distinction?", a: "Yes — adding more trainer logins is genuinely free, which is unusual in this category. On REPs, multi-coach setups can run as separate Pro seats; ask us about Studio if you need shared clients and reporting across coaches." },
      { q: "Can I migrate from PT Distinction to REPs?", a: "Yes. Export your CSV, import to REPs, run in parallel for a week, then cancel. See the 5-step migration guide above. No add-ons to unwind on the PT Distinction side." },
      { q: "Does PT Distinction have a free trial?", a: "Yes — a full 1-month free trial on every plan. REPs Pro is £59/mo founding (was £79/mo), with the full software platform included." },
    ],
  },
};
