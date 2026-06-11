/**
 * Content for the 9 /features/$slug pages.
 * One entry per FeatureLink slug. Visuals reference the shared mockup components.
 */
import {
  BookingsMockup,
  CheckInsMockup,
  ClientsCrmMockup,
  DashboardMockup,
  InsightsMockup,
  LeadsMockup,
  MessagesMockup,
  PaymentsMockup,
  ProfileMockup,
  ProgrammesMockup,
} from "@/components/mockups/PlatformMockups";

import proJames from "@/assets/pro-james.jpg";
import proSophie from "@/assets/pro-sophie.jpg";
import proLaura from "@/assets/pro-laura.jpg";
import proDaniel from "@/assets/pro-daniel.jpg";

import type { FeaturePageProps } from "./FeaturePageLayout";
import type { FeatureLink } from "./feature-config";

type Content = Omit<FeaturePageProps, "slug">;

export const FEATURE_CONTENT: Record<Exclude<FeatureLink["slug"], "shop-front">, Content> = {
  "profile-and-reviews": {
    hero: {
      eyebrow: "Verified profile",
      title: "A profile clients can trust on sight.",
      sub: "Your REPS profile shows verified qualifications, insurance and reviews from real clients — checked by our team, on the public register since 2002.",
      visual: <ProfileMockup />,
    },
    pillars: [
      { title: "Verified badge", body: "Credentials checked once, displayed forever." },
      { title: "Real reviews", body: "Only clients who've booked can review — no fakes." },
      { title: "Found in directory", body: "Rank in city, discipline and goal search." },
    ],
    sections: [
      {
        eyebrow: "Trust",
        title: "Verification done properly.",
        body: "Upload your qualifications, insurance and CPD once. Our standards team reviews within 24 hours and the Verified badge appears on your profile — visible everywhere REPS shows up.",
        bullets: [
          "Credentials checked by humans, not bots",
          "Insurance expiry tracked, reminders sent",
          "CPD logged automatically against your record",
        ],
        visual: <ProfileMockup />,
      },
      {
        eyebrow: "Reviews",
        title: "Reviews that mean something.",
        body: "Only clients with a booking on REPS can leave a review. No anonymous burner accounts. No fake five-stars from cousins. Just a real, public, on-the-record reputation.",
        bullets: [
          "One client = one review per coach",
          "Public reply lets you respond on the record",
          "Review average shown on every search card",
        ],
      },
    ],
    quote: {
      quote:
        "Within two months of joining REPS I was fully booked. Clients arrive ready to commit because they already trust the badge.",
      name: "James Carter",
      role: "Level 4 PT · London",
      img: proJames,
    },
    related: ["leads", "clients", "bookings"],
  },

  leads: {
    hero: {
      eyebrow: "Lead pipeline",
      title: "Never lose another enquiry.",
      sub: "Every enquiry from your REPS profile lands in a structured pipeline — New, Qualified, Booked — with the context you need to reply fast and convert.",
      visual: <LeadsMockup />,
    },
    pillars: [
      { title: "Single inbox", body: "Profile, website, referrals — all in one pipeline." },
      { title: "Context attached", body: "Goal, budget, availability captured upfront." },
      { title: "Reply faster", body: "Templated replies + AI quick replies on Business." },
    ],
    sections: [
      {
        eyebrow: "Capture",
        title: "Enquiry forms that qualify.",
        body: "Your REPS profile asks the right questions up front — goal, frequency, location, budget — so the leads you receive are ready to book, not tyre-kickers.",
        bullets: [
          "Custom intake questions per service",
          "Auto-tag by discipline and goal",
          "Spam and bot filtering built in",
        ],
        visual: <LeadsMockup />,
      },
      {
        eyebrow: "Convert",
        title: "Move leads through the pipeline.",
        body: "Drag from New to Qualified to Booked. See response-time stats. Replies inside 24 hours convert 2.4× more often — and REPS nudges you when one is going cold.",
        bullets: [
          "Response time benchmarks per coach",
          "Auto-archive after 30 days of no reply",
          "One click to send a booking link",
        ],
      },
    ],
    quote: {
      quote:
        "I used to lose leads in Instagram DMs. Now everything's in one place and I can see exactly who I owe a reply.",
      name: "Sophie Williams",
      role: "Pilates Instructor · Manchester",
      img: proSophie,
    },
    related: ["profile-and-reviews", "messaging", "bookings"],
  },

  bookings: {
    hero: {
      eyebrow: "Bookings & calendar",
      title: "A calendar that fills itself.",
      sub: "Two-way sync with Google and Apple, deposits that kill no-shows, and reminders your clients actually act on — booking the gym out has never been less admin.",
      visual: <BookingsMockup />,
    },
    pillars: [
      { title: "Two-way sync", body: "Google, Apple, Outlook — your real availability." },
      { title: "Deposits", body: "Take a deposit at booking. No-shows drop ~70%." },
      { title: "Reminders", body: "Email + SMS, cadence you control." },
    ],
    sections: [
      {
        eyebrow: "Availability",
        title: "Your real schedule, always.",
        body: "Connect Google, Apple or Outlook and REPS respects every meeting, school run and dentist appointment. Set rolling availability windows by service.",
        bullets: [
          "Per-service availability rules",
          "Buffer time before / after sessions",
          "Lead-time and max-bookings-per-day caps",
        ],
        visual: <BookingsMockup />,
      },
      {
        eyebrow: "No-shows",
        title: "Deposits that work.",
        body: "Take a £10–£60 deposit when a client books. We hold it on Stripe and release it to you after the session. Cancellation rate drops, your week is yours.",
        bullets: [
          "Configurable deposit and cancellation window",
          "Auto-refund inside grace period",
          "Forfeit applied automatically after no-show",
        ],
      },
    ],
    quote: {
      quote:
        "The deposit-at-booking flow alone has paid for my whole subscription five times over. No-shows are basically zero now.",
      name: "Laura Mitchell",
      role: "Nutritionist · Online",
      img: proLaura,
    },
    related: ["payments", "messaging", "clients"],
  },

  payments: {
    hero: {
      eyebrow: "Payments",
      title: "Get paid without the admin.",
      sub: "Take card payments, packages, memberships and deposits. Stripe-powered payouts, automatic VAT-ready invoices, and a single source of truth for your revenue.",
      visual: <PaymentsMockup />,
    },
    pillars: [
      { title: "Stripe payouts", body: "Next-day payouts to your bank." },
      { title: "Subscriptions", body: "Memberships, blocks of 10, monthly plans." },
      { title: "Auto invoicing", body: "VAT-ready PDFs sent on every charge." },
    ],
    sections: [
      {
        eyebrow: "Stripe-powered",
        title: "The payment stack you'd build if you had to.",
        body: "REPS uses Stripe under the hood — the same infrastructure trusted by Apple, Amazon and Shopify. PCI compliance, 3D Secure, fraud protection. All built in.",
        bullets: [
          "Cards, Apple Pay, Google Pay, BACS",
          "Next-day payouts in 30+ currencies",
          "Stripe Tax integration for UK / EU VAT",
        ],
        visual: <PaymentsMockup />,
      },
      {
        eyebrow: "Subscriptions",
        title: "Recurring revenue, properly handled.",
        body: "Sell monthly memberships, blocks of 10 or seasonal programmes. Failed payments retry intelligently. Clients can update their card from their own portal.",
        bullets: [
          "Dunning emails for failed cards",
          "Pause, cancel, upgrade in self-serve portal",
          "MRR and churn shown on your dashboard",
        ],
      },
    ],
    quote: {
      quote:
        "I switched from manual bank transfers and it was an immediate upgrade. The MRR chart alone is addictive to look at.",
      name: "Daniel Pereira",
      role: "Strength Coach · Bristol",
      img: proDaniel,
    },
    related: ["bookings", "clients", "insights"],
  },

  clients: {
    hero: {
      eyebrow: "Clients CRM",
      title: "One record per client. For everything.",
      sub: "Sessions, notes, payments, programmes, check-ins, messages — every interaction stitched to one client record. No more rifling through six apps.",
      visual: <ClientsCrmMockup />,
    },
    pillars: [
      { title: "Single record", body: "Everything about every client, in one place." },
      { title: "Session notes", body: "Quick notes from your phone, post-session." },
      { title: "LTV & adherence", body: "See who's thriving and who needs a nudge." },
    ],
    sections: [
      {
        eyebrow: "History",
        title: "Every session, on the record.",
        body: "Every booking, payment, message and programme is automatically attached to the client. Type a note from your phone the moment a session ends — it's there forever.",
        bullets: [
          "Auto-history from bookings + payments",
          "Voice-to-text session notes on mobile",
          "Tag clients (e.g. injury, pre-natal, VIP)",
        ],
        visual: <ClientsCrmMockup />,
      },
      {
        eyebrow: "Health",
        title: "Spot who needs you, before they ghost.",
        body: "Adherence, LTV and last-session dates are surfaced front-and-centre. Clients who haven't booked in 14 days get flagged so you can reach out before they drift.",
        bullets: [
          "At-risk clients flagged automatically",
          "Birthdays and milestones surfaced",
          "Filter by goal, tag or programme",
        ],
      },
    ],
    quote: {
      quote:
        "Knowing exactly when a client last booked has changed my retention. I reach out before they think about leaving.",
      name: "James Carter",
      role: "Level 4 PT · London",
      img: proJames,
    },
    related: ["check-ins", "messaging", "programmes"],
  },

  programmes: {
    hero: {
      eyebrow: "Programmes",
      title: "Build once, deliver forever.",
      sub: "Drag-and-drop programme builder with a 600-exercise library, video demos and progression schemes. Send a 12-week block in 10 minutes.",
      visual: <ProgrammesMockup />,
    },
    pillars: [
      { title: "Exercise library", body: "600+ exercises with video demos." },
      { title: "Templates", body: "Save your blocks. Re-use forever." },
      { title: "Mobile delivery", body: "Clients log sets in our app." },
    ],
    sections: [
      {
        eyebrow: "Build",
        title: "Drag, drop, programme.",
        body: "Weeks across the top, days down the side. Drop in exercises with sets, reps, RPE and tempo. Save templates per goal so you're never starting from scratch.",
        bullets: [
          "Block periodisation built in",
          "Auto-progress weights week on week",
          "Supersets, circuits, drop sets — all native",
        ],
        visual: <ProgrammesMockup />,
      },
      {
        eyebrow: "Deliver",
        title: "Clients log sets, you see the data.",
        body: "Clients tick off sets in the REPS app, log RPE and PRs. You see adherence and weights moving in real time — no chasing screenshots over WhatsApp.",
        bullets: [
          "Adherence shown per programme",
          "PR detection across exercises",
          "Push notifications for missed sessions",
        ],
      },
    ],
    quote: {
      quote:
        "I deliver 14 clients on programmes now. Before REPS that would've been one Google sheet per person — chaos.",
      name: "Daniel Pereira",
      role: "Strength Coach · Bristol",
      img: proDaniel,
    },
    related: ["check-ins", "clients", "messaging"],
  },

  "check-ins": {
    hero: {
      eyebrow: "Check-ins & progress",
      title: "Weekly check-ins, no admin.",
      sub: "Custom forms, progress photos, body metrics and habit streaks — collected on a cadence you set, surfaced in a timeline you can scroll in seconds.",
      visual: <CheckInsMockup />,
    },
    pillars: [
      { title: "Custom forms", body: "Ask exactly what matters per client." },
      { title: "Photos & metrics", body: "Side-by-side comparison, week 1 vs now." },
      { title: "Trends", body: "Weight, sleep, energy charted automatically." },
    ],
    sections: [
      {
        eyebrow: "Capture",
        title: "Forms clients actually fill in.",
        body: "Build a check-in form once with the questions you care about. Push it weekly. Clients complete in 90 seconds on their phone — no friction, no excuses.",
        bullets: [
          "Photo uploads with built-in comparison",
          "Body metrics (weight, waist, sleep)",
          "Free-text and 1–10 scale questions",
        ],
        visual: <CheckInsMockup />,
      },
      {
        eyebrow: "Coach",
        title: "Reply in two clicks, on the record.",
        body: "Every check-in lands in a queue. Read the form, look at the photos, leave a written or voice reply. It's all stitched to the client's record forever.",
        bullets: [
          "Voice replies up to 3 min",
          "Mark check-ins as actioned",
          "Notification when a check-in is overdue",
        ],
      },
    ],
    quote: {
      quote:
        "Check-ins were my biggest pain. Now they take me 20 minutes for 14 clients on a Monday morning.",
      name: "Laura Mitchell",
      role: "Nutritionist · Online",
      img: proLaura,
    },
    related: ["programmes", "clients", "messaging"],
  },

  messaging: {
    hero: {
      eyebrow: "Client messaging",
      title: "Client chat, off your personal phone.",
      sub: "A focused inbox just for clients. Threaded conversations, voice notes, file sharing — and on Business, AI quick-replies for when you're slammed.",
      visual: <MessagesMockup />,
    },
    pillars: [
      { title: "Focused inbox", body: "No mum, no Amazon updates, just clients." },
      { title: "Voice notes", body: "Reply with voice, audio plays in-app." },
      { title: "AI quick replies", body: "Three smart drafts ready to send." },
    ],
    sections: [
      {
        eyebrow: "Boundaries",
        title: "Reclaim your personal phone.",
        body: "Move client chats off WhatsApp. Open them when you choose. Set quiet hours so messages outside 7am–8pm don't ping you — but still arrive in the morning.",
        bullets: [
          "Per-coach quiet hours",
          "Auto-reply outside working hours",
          "Push, email, or silent — your choice",
        ],
        visual: <MessagesMockup />,
      },
      {
        eyebrow: "AI",
        title: "Three smart drafts, every time (Business).",
        body: "REPS reads the conversation context — the client's programme, their last check-in, the last 5 messages — and suggests three replies you can send with one tap.",
        bullets: [
          "Tone-matched to your past replies",
          "Never sends without your approval",
          "Saves an average of 18 min per day",
        ],
      },
    ],
    quote: {
      quote:
        "I get my evenings back. Quiet hours kick in at 8pm and I'm not staring at my phone any more.",
      name: "Sophie Williams",
      role: "Pilates Instructor · Manchester",
      img: proSophie,
    },
    related: ["clients", "check-ins", "insights"],
  },

  insights: {
    hero: {
      eyebrow: "Insights & AI",
      title: "Know exactly what to do next.",
      sub: "Revenue, retention, lead conversion and adherence — charted, trended, benchmarked. With an AI 'next move' card that tells you the one thing to do this week.",
      visual: <InsightsMockup />,
    },
    pillars: [
      { title: "Revenue tracking", body: "MRR, ARR, churn, LTV — all live." },
      { title: "Retention", body: "See cohort retention by month signed up." },
      { title: "AI next move", body: "One actionable insight per week." },
    ],
    sections: [
      {
        eyebrow: "Numbers",
        title: "Your practice, by the numbers.",
        body: "Stop guessing. Revenue trends, client retention, lead-to-book rate, programme adherence — every number a coaching business should know, charted for you.",
        bullets: [
          "Compare any period to the one before it",
          "Benchmark against REPS averages",
          "Export to CSV for your accountant",
        ],
        visual: <InsightsMockup />,
      },
      {
        eyebrow: "AI",
        title: "The one thing to do this week.",
        body: "REPS reads your data and surfaces the highest-leverage action — 'reply to 3 cold leads', 'check in on Marcus, 14 days since last session', 'raise prices on intro pack — 92% conversion'. One card. One action.",
        bullets: [
          "Updated every Monday morning",
          "Dismissible — only the things you'd actually do",
          "Tracks impact of the moves you make",
        ],
      },
    ],
    quote: {
      quote:
        "The Monday 'next move' card has become my morning ritual. It's like having a business coach on tap.",
      name: "Daniel Pereira",
      role: "Strength Coach · Bristol",
      img: proDaniel,
    },
    related: ["payments", "leads", "clients"],
  },
};
