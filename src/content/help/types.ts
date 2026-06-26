import type { ComponentType } from "react";

export type HelpTier = "verified" | "pro" | "studio";

export type HelpCategorySlug =
  | "getting-started"
  | "verification"
  | "public-profile"
  | "enquiries-reviews"
  | "account-billing"
  | "trust-safety"
  | "troubleshooting";

export interface HelpCategory {
  slug: HelpCategorySlug;
  title: string;
  description: string;
  /** Lucide icon name kept loose — components map to actual icons */
  icon: string;
  order: number;
}

export interface HelpDeepLink {
  label: string;
  /** Internal route */
  to: string;
  /** Optional action token consumed by the destination route */
  action?: string;
}

export interface HelpArticle {
  slug: string;
  category: HelpCategorySlug;
  title: string;
  summary: string;
  tier: HelpTier[];
  lastReviewed: string; // ISO date
  author: string;
  tags: string[];
  /** Hide from public nav (still routable). Used for Pro/Studio drafts. */
  hidden?: boolean;
  deepLink?: HelpDeepLink;
  related?: string[]; // "category/slug" identifiers
  Body: ComponentType;
  /** Inline FAQ block emitted as FAQPage JSON-LD */
  faqs?: { q: string; a: string }[];
}

export type HelpArticleSummary = Omit<HelpArticle, "Body">;
