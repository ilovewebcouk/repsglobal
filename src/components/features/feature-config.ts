/**
 * Single source of truth for the 9 feature deep-dive pages.
 * Used by:
 *  - Header mega-menu
 *  - /features hub
 *  - Cross-links between feature sub-pages
 *  - /for-professionals platform showcase
 */
import {
  BadgeCheck,
  Calendar,
  CreditCard,
  Dumbbell,
  Inbox,
  LineChart,
  ListChecks,
  MessageSquare,
  Users,
  type LucideIcon,
} from "lucide-react";

export type FeatureGroupKey = "visibility" | "operations" | "growth";

export type FeatureLink = {
  slug:
    | "profile-and-reviews"
    | "bookings"
    | "payments"
    | "clients"
    | "programmes"
    | "check-ins"
    | "messaging"
    | "leads"
    | "insights";
  label: string;
  tag: string;
  oneLiner: string;
  icon: LucideIcon;
  group: FeatureGroupKey;
  /** Tier keys (from pricing-data) this feature is included in. */
  includedIn: ("verified" | "pro" | "business" | "studio")[];
};

export const FEATURES: FeatureLink[] = [
  {
    slug: "profile-and-reviews",
    label: "Verified profile & reviews",
    tag: "Profile",
    oneLiner: "Show up trustworthy. Reviews on the record.",
    icon: BadgeCheck,
    group: "visibility",
    includedIn: ["verified", "pro", "business", "studio"],
  },
  {
    slug: "leads",
    label: "Lead pipeline",
    tag: "Leads",
    oneLiner: "Every enquiry tracked from first touch to first session.",
    icon: Inbox,
    group: "visibility",
    includedIn: ["pro", "business", "studio"],
  },
  {
    slug: "bookings",
    label: "Bookings & calendar",
    tag: "Bookings",
    oneLiner: "Two-way sync, deposits and reminders that kill no-shows.",
    icon: Calendar,
    group: "operations",
    includedIn: ["pro", "business", "studio"],
  },
  {
    slug: "payments",
    label: "Payments & subscriptions",
    tag: "Payments",
    oneLiner: "Stripe payouts, packages, memberships. No chasing invoices.",
    icon: CreditCard,
    group: "operations",
    includedIn: ["pro", "business", "studio"],
  },
  {
    slug: "clients",
    label: "Clients CRM",
    tag: "CRM",
    oneLiner: "One record per client. Sessions, notes, payments, programmes.",
    icon: Users,
    group: "operations",
    includedIn: ["pro", "business", "studio"],
  },
  {
    slug: "programmes",
    label: "Programmes",
    tag: "Programmes",
    oneLiner: "Build, deliver and update training plans with video demos.",
    icon: Dumbbell,
    group: "operations",
    includedIn: ["pro", "business", "studio"],
  },
  {
    slug: "check-ins",
    label: "Check-ins & progress",
    tag: "Check-ins",
    oneLiner: "Weekly forms, photos and metrics in one tidy timeline.",
    icon: ListChecks,
    group: "operations",
    includedIn: ["pro", "business", "studio"],
  },
  {
    slug: "messaging",
    label: "Client messaging",
    tag: "Messages",
    oneLiner: "Focused inbox, separate from your personal phone.",
    icon: MessageSquare,
    group: "operations",
    includedIn: ["pro", "business", "studio"],
  },
  {
    slug: "insights",
    label: "Insights & AI",
    tag: "Insights",
    oneLiner: "Revenue, retention and the next move to grow this month.",
    icon: LineChart,
    group: "growth",
    includedIn: ["business", "studio"],
  },
];

export const FEATURE_GROUPS: { key: FeatureGroupKey; label: string; desc: string }[] = [
  {
    key: "visibility",
    label: "Visibility",
    desc: "Get discovered by the right clients.",
  },
  {
    key: "operations",
    label: "Operations",
    desc: "Run your whole practice in one place.",
  },
  {
    key: "growth",
    label: "Growth",
    desc: "Compound the practice you've built.",
  },
];

export function featureBySlug(slug: FeatureLink["slug"]) {
  return FEATURES.find((f) => f.slug === slug)!;
}
