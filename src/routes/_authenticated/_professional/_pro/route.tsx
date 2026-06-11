import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { UpgradePanel } from "@/components/dashboard/primitives";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";

/* ---------------------------------------------------------------- *
 * Pro-tier route gate.
 *
 * The parent `_authenticated/_professional` layout has already ensured
 * the user is a signed-in professional with an active paid subscription
 * and stashed their resolved tier on router context.
 *
 * If the tier is "pro" or "studio", we render the child route normally.
 *
 * If the tier is "verified", we keep the URL intact (so deep links keep
 * working) and render an in-shell upgrade panel explaining the Pro
 * feature behind this route with a CTA to /pricing — instead of the
 * silent redirect to /dashboard/profile-edit that we did before.
 * ---------------------------------------------------------------- */

export const Route = createFileRoute("/_authenticated/_professional/_pro")({
  ssr: false,
  component: ProGate,
});

function ProGate() {
  const tier = useTrainerTier();
  if (tier === "pro" || tier === "studio") {
    return <Outlet />;
  }
  return <ProUpgradeScreen />;
}

type UpgradeCopy = {
  active: Parameters<typeof DashboardShell>[0]["active"];
  title: string;
  feature: string;
  description: string;
  bullets: string[];
};

const FALLBACK: UpgradeCopy = {
  active: "Dashboard",
  title: "Pro feature",
  feature: "This is a Pro feature",
  description:
    "Upgrade to Pro to unlock the full REPs workspace — leads, bookings, clients, programs, payments and more.",
  bullets: [
    "Lead inbox & enquiry routing",
    "Bookings, deposits & payments",
    "Client profiles & check-ins",
    "Programs & nutrition delivery",
    "Reports & business tools",
  ],
};

const UPGRADE_BY_PATH: Record<string, UpgradeCopy> = {
  "/dashboard/leads": {
    active: "Leads",
    title: "Leads",
    feature: "Lead inbox & enquiry routing",
    description:
      "Every enquiry from your REPs profile lands in one structured inbox with status, source, owner and follow-up — no more lost DMs.",
    bullets: [
      "Unified inbox for every enquiry",
      "Status, owner & follow-up tracking",
      "Source attribution from REPs profile",
      "Auto-reply & reminder cadences",
    ],
  },
  "/dashboard/clients": {
    active: "Clients",
    title: "Clients",
    feature: "Client records & check-ins",
    description:
      "Keep every active client in one place: contact, history, goals, sessions, payments and notes.",
    bullets: [
      "Full client timeline",
      "Goals, measurements & history",
      "Linked sessions, programs & payments",
      "Private notes & tags",
    ],
  },
  "/dashboard/calendar": {
    active: "Calendar",
    title: "Calendar",
    feature: "Scheduling & calendar",
    description:
      "Run your week from a single calendar — sessions, blocks, holidays and availability synced to the public booking page.",
    bullets: [
      "Personal & team availability",
      "Drag-and-drop sessions",
      "Sync with Google / Apple",
      "Public booking respects your blocks",
    ],
  },
  "/dashboard/bookings": {
    active: "Bookings",
    title: "Bookings & payments",
    feature: "Bookings, deposits & payments",
    description:
      "Take real bookings and deposits from your REPs profile with secure payments paid directly to you.",
    bullets: [
      "Public booking page wired to availability",
      "Deposits, packages & memberships",
      "Direct payouts via Stripe",
      "Automatic receipts & reminders",
    ],
  },
  "/dashboard/messages": {
    active: "Messages",
    title: "Messages",
    feature: "Client messaging",
    description:
      "Reply to clients and leads inside REPs — every conversation linked to the right record.",
    bullets: [
      "Threaded conversations per client",
      "Attachments & quick replies",
      "Read receipts & typing",
      "Linked to bookings & programs",
    ],
  },
  "/dashboard/programs": {
    active: "Programs",
    title: "Programs",
    feature: "Programme delivery",
    description:
      "Build and deliver training programmes to clients with templates, progressions and check-ins.",
    bullets: [
      "Reusable templates & blocks",
      "Auto-progressions & deload weeks",
      "Client-facing app view",
      "Compliance & adherence tracking",
    ],
  },
  "/dashboard/nutrition": {
    active: "Nutrition",
    title: "Nutrition",
    feature: "Nutrition coaching",
    description:
      "Macros, meal plans and check-ins for clients — connected to their programme and goals.",
    bullets: [
      "Macro targets per client",
      "Meal templates & swaps",
      "Photo & weight check-ins",
      "Trends linked to goals",
    ],
  },
  "/dashboard/check-ins": {
    active: "Check-Ins",
    title: "Check-Ins",
    feature: "Weekly client check-ins",
    description:
      "Structured weekly check-ins that surface what's working, what's not and what to change.",
    bullets: [
      "Custom check-in forms",
      "Photo, weight & measurement trends",
      "Coach reply threads",
      "Auto-reminders",
    ],
  },
  "/dashboard/reviews": {
    active: "Reviews",
    title: "Reviews",
    feature: "Reviews & reputation",
    description:
      "Collect verified client reviews after sessions and show them on your public REPs profile.",
    bullets: [
      "Post-session review prompts",
      "Verified-client badges",
      "Show on public profile",
      "Respond publicly",
    ],
  },
  "/dashboard/reports": {
    active: "Reports",
    title: "Reports",
    feature: "Business reports",
    description:
      "See how your business is performing — revenue, retention, lead conversion, adherence.",
    bullets: [
      "Revenue & MRR",
      "Lead → client conversion",
      "Retention & churn",
      "Adherence by programme",
    ],
  },
  "/dashboard/content": {
    active: "Content Studio",
    title: "Content Studio",
    feature: "Content studio",
    description:
      "Publish posts, articles and updates to your REPs profile and segmented client lists.",
    bullets: [
      "Posts on your public profile",
      "Newsletters to clients",
      "Segment by tag or programme",
      "Schedule ahead",
    ],
  },
  "/dashboard/community": {
    active: "Community",
    title: "Community",
    feature: "Community space",
    description:
      "A private community space for your clients — threads, announcements and challenges.",
    bullets: [
      "Private to your clients",
      "Announcements & threads",
      "Challenges & leaderboards",
      "Linked to your programmes",
    ],
  },
  "/dashboard/cpd": {
    active: "Education & CPD",
    title: "Education & CPD",
    feature: "Education & CPD library",
    description:
      "Curated CPD modules and a logbook to keep your registration current.",
    bullets: [
      "Curated CPD library",
      "Personal CPD logbook",
      "Certificates & evidence storage",
      "Reminder when renewal nears",
    ],
  },
  "/dashboard/payments": {
    active: "Payments",
    title: "Payments",
    feature: "Payments & payouts",
    description:
      "All payments, payouts, refunds and invoices in one place — fully reconciled to clients.",
    bullets: [
      "Stripe payouts direct to your bank",
      "Refunds & disputes",
      "Per-client invoicing",
      "Tax-ready exports",
    ],
  },
  "/dashboard/business": {
    active: "Business Tools",
    title: "Business Tools",
    feature: "Business tools",
    description:
      "Forms, waivers, contracts, packages and the small operational pieces that keep your business compliant.",
    bullets: [
      "Custom intake forms",
      "Waivers & contracts",
      "Packages & memberships",
      "Compliance reminders",
    ],
  },
};

function ProUpgradeScreen() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Match the most specific known prefix.
  const copy =
    Object.entries(UPGRADE_BY_PATH).find(([k]) => pathname.startsWith(k))?.[1] ??
    FALLBACK;

  return (
    <DashboardShell
      role="trainer"
      tier="verified"
      active={copy.active}
      title={copy.title}
      subtitle="Available on the Pro plan."
    >
      <UpgradePanel
        feature={copy.feature}
        description={copy.description}
        bullets={copy.bullets}
      />
    </DashboardShell>
  );
}
