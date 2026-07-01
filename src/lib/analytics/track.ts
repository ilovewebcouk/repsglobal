// Typed public analytics event helpers.
// All calls funnel through capturePublic which is consent-gated + no-ops
// off-consent, off-public-surface, or when PostHog isn't loaded.
//
// Property whitelist per event — never include IP, email, password, or raw
// PII. Keep `q` (search query) only if not personal.

import { capturePublic } from "@/hooks/usePublicAnalyticsBeacon";

export type PlanTier = "core" | "pro" | "studio" | string;

export const track = {
  profileView(props: { slug: string; professional_id?: string | null; path?: string }) {
    void capturePublic("profile_view", props);
  },
  profileCtaClick(props: {
    slug: string;
    cta: "enquire" | "book" | "message" | "call" | "website" | string;
    professional_id?: string | null;
  }) {
    void capturePublic("profile_cta_click", props);
  },
  directorySearch(props: {
    q: string;
    result_count: number;
    location?: string | null;
    profession?: string | null;
  }) {
    void capturePublic("directory_search", props);
  },
  directoryNoResults(props: {
    q: string;
    location?: string | null;
    profession?: string | null;
  }) {
    void capturePublic("directory_no_results", props);
  },
  directoryResultClick(props: {
    q?: string | null;
    clicked_result_slug: string;
    position?: number;
  }) {
    void capturePublic("directory_result_click", props);
  },
  enquiryStart(props: { slug: string; professional_id?: string | null }) {
    void capturePublic("enquiry_start", props);
  },
  enquirySubmit(props: { slug: string; professional_id?: string | null }) {
    void capturePublic("enquiry_submit", props);
  },
  signupStart(props: { plan?: PlanTier | null; path?: string } = {}) {
    void capturePublic("signup_start", props);
  },
  signupComplete(props: { plan?: PlanTier | null } = {}) {
    void capturePublic("signup_complete", props);
  },
  checkoutStarted(props: { plan: PlanTier; interval?: "monthly" | "yearly" | null }) {
    void capturePublic("checkout_started", props);
  },
};
