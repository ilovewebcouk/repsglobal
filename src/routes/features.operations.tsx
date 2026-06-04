import { createFileRoute } from "@tanstack/react-router";

import { PillarPage, type PillarFeature } from "@/components/features/PillarPage";
import heroOperations from "@/assets/hero-operations-bg.jpg.asset.json";

import {
  BookingsMockup,
  ClientsCrmMockup,
  LeadsMockup,
  MessagesMockup,
  PaymentsMockup,
} from "@/components/mockups/PlatformMockups";

const FEATURES: PillarFeature[] = [
  {
    tag: "Leads",
    title: "Every enquiry, tracked from first touch to first session.",
    body:
      "No more enquiries lost in Instagram DMs and the bottom of your inbox. Every lead lands in one pipeline with source, intent and the right next step — already drafted.",
    bullets: [
      "One inbox for web, profile, referral and DM enquiries",
      "AI-scored on intent so hot leads never wait",
      "First-reply drafts in your tone of voice",
      "Convert-to-client in a single click — record carries over",
    ],
    mockup: <LeadsMockup />,
    learnMoreSlug: "leads",
  },
  {
    tag: "Bookings",
    title: "Bookings that fill themselves — no Calendly tab required.",
    body:
      "Two-way calendar sync, deposits at booking, automated reminders. Clients self-serve from your REPs profile; you keep your week shaped the way you want it.",
    bullets: [
      "Two-way sync with Google, Apple and Outlook calendars",
      "Take deposits at booking to kill no-shows",
      "Automated SMS + email reminders included",
      "Group classes, 1:1s, intro calls — all in one view",
    ],
    mockup: <BookingsMockup />,
    learnMoreSlug: "bookings",
  },
  {
    tag: "Payments",
    title: "Stripe payouts, packages and memberships — without the chasing.",
    body:
      "Sell blocks of sessions, monthly memberships or one-offs. Failed cards retried, dunning emails sent, payouts in your account on the same schedule as Stripe.",
    bullets: [
      "Packages, memberships and one-off invoicing in one place",
      "Failed-payment retries and dunning emails handled",
      "MRR, next payout and active subscriptions on one card",
      "Stripe payouts on your usual schedule — no REPs cut on top",
    ],
    mockup: <PaymentsMockup />,
    learnMoreSlug: "payments",
  },
  {
    tag: "CRM",
    title: "One record per client. The whole client.",
    body:
      "Goals, programme, last check-in, next session, lifetime value, outstanding invoice — on one screen. The CRM the coaching apps don't have, wired to the coaching tools the CRMs don't have.",
    bullets: [
      "Full client record with adherence and progress",
      "Programme and nutrition snapshot at the top",
      "Notes, bookings and payments in the same view",
      "Lifetime value and renewal date surfaced",
    ],
    mockup: <ClientsCrmMockup />,
    learnMoreSlug: "clients",
  },
  {
    tag: "Messages",
    title: "A focused client inbox — separate from your personal phone.",
    body:
      "WhatsApp is for friends. REPs Messages is for clients: threaded, searchable, attached to the client record, with AI draft replies ready when you open it.",
    bullets: [
      "Threaded conversations tied to the client record",
      "AI-drafted replies in your tone of voice",
      "Attach programmes, invoices and check-ins inline",
      "Read receipts and reply-time targets — your call",
    ],
    mockup: <MessagesMockup />,
    learnMoreSlug: "messaging",
  },
];

export const Route = createFileRoute("/features/operations")({
  head: () => ({
    meta: [
      { title: "Operations — Run your practice in one place · REPs" },
      {
        name: "description",
        content:
          "Bookings, payments, leads, CRM and messaging — replaces Calendly, Stripe, Mailchimp and a CRM with one tool built for fitness.",
      },
      { property: "og:title", content: "Operations — REPs for Professionals" },
      {
        property: "og:description",
        content: "The operating system for a modern coaching practice.",
      },
      { property: "og:url", content: "https://repsglobal.lovable.app/features/operations" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/features/operations" }],
  }),
  component: () => (
    <PillarPage
      groupKey="operations"
      heroLead="Not just bookings."
      heroAccent="An operating system for your whole practice."
      heroImage={{
        src: heroOperations.url,
        alt: "Trainer reviewing the day's schedule on a tablet at a boutique studio reception desk",
      }}
      features={FEATURES}
    />
  ),
});
