import type { HelpCategory } from "./types";

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    slug: "getting-started",
    title: "Getting started",
    description: "Create your account, choose Verified, and go live in under an hour.",
    icon: "Rocket",
    order: 1,
  },
  {
    slug: "verification",
    title: "Verification",
    description: "Identity, qualifications and insurance — exactly what we check and why.",
    icon: "ShieldCheck",
    order: 2,
  },
  {
    slug: "public-profile",
    title: "Your public profile",
    description: "Slug, photo, services, locations, in-person vs online.",
    icon: "User",
    order: 3,
  },
  {
    slug: "enquiries-reviews",
    title: "Enquiries & reviews",
    description: "Receive enquiries, reply to clients, request and manage reviews.",
    icon: "MessageSquare",
    order: 4,
  },
  {
    slug: "account-billing",
    title: "Account & billing",
    description: "Plans, invoices, cancellations and data exports.",
    icon: "CreditCard",
    order: 5,
  },
  {
    slug: "trust-safety",
    title: "Trust & safety",
    description: "Code of conduct, complaints, and the grounds we'll remove a listing on.",
    icon: "Scale",
    order: 6,
  },
  {
    slug: "troubleshooting",
    title: "Troubleshooting",
    description: "Sign-in, email delivery, uploads, QR codes and badges.",
    icon: "Wrench",
    order: 7,
  },
];

export function getCategory(slug: string): HelpCategory | undefined {
  return HELP_CATEGORIES.find((c) => c.slug === slug);
}
