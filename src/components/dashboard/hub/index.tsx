import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Copy,
  ExternalLink,
  GraduationCap,
  Inbox,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

import { PCard, PPanel, SectionHeader } from "@/components/dashboard/primitives";
import {
  DashboardBadge,
  DashboardButton,
  DashboardEmpty,
  DashboardEmptyDescription,
  DashboardEmptyIcon,
  DashboardEmptyTitle,
} from "@/components/dashboard/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import {
  getMyDashboardProfile,
  type DashboardProfile,
} from "@/lib/profile/dashboard-profile.functions";
import {
  getMyReadiness,
  verificationSummary,
  type ReadinessResult,
} from "@/lib/dashboard/readiness.functions";
import {
  getProviderReadiness,
  type ProviderReadinessResult,
} from "@/lib/dashboard/provider-readiness.functions";
import { SECTION_ATTENTION_COPY } from "@/lib/dashboard/website-sections";
import {
  getEnquiryStats,
  listMyEnquiries,
  type EnquiryDTO,
} from "@/lib/enquiries/enquiries.functions";
import {
  getMyReviewKpis,
  listMyReviews,
  type ReviewDTO,
  type ReviewKpis,
} from "@/lib/reviews/reviews.functions";
import { getMyWebsite, type ServiceDTO } from "@/lib/website/website.functions";
import { getTrustState, type TrustState } from "@/lib/verification/trust.functions";
import { useReviewsUnread } from "@/hooks/useReviewsUnread";
import { useMySupportUnread } from "@/hooks/useMySupportUnread";

/* ------------------------------------------------------------------ */
/* Welcome banner                                                     */
/* ------------------------------------------------------------------ */

export function WelcomeBanner({
  name,
  avatarUrl,
  headline,
  tierLabel,
  isPublished,
  slug,
  trust,
}: {
  name: string;
  avatarUrl: string | null | undefined;
  headline: string | null | undefined;
  tierLabel: string;
  isPublished: boolean;
  slug: string | null | undefined;
  trust: TrustState | null | undefined;
}) {
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const publicUrl = slug ? `/c/${slug}` : null;

  const [copied, setCopied] = React.useState(false);
  const copyUrl = React.useCallback(async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(window.location.origin + publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }, [publicUrl]);

  // Single source of truth for the badge: 3-of-3 trust state, not the tier.
  const fullyVerified =
    !!trust && trust.ticks.identity && trust.ticks.insurance && trust.ticks.qualifications;

  return (
    <PPanel className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="size-14 rounded-[12px] border border-reps-border">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
            <AvatarFallback className="rounded-[12px] bg-reps-panel-soft text-white">
              {initials || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate font-display text-[20px] font-semibold text-white">
                {name}
              </h1>
              {fullyVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  <BadgeCheck className="size-3" />
                  REPS Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.05] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/60">
                  Unverified
                </span>
              )}
              <span className="inline-flex items-center rounded-full border border-reps-border bg-reps-panel-soft/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/55">
                {tierLabel} plan
              </span>
            </div>
            {headline ? (
              <p className="mt-1 truncate text-[13px] text-white/55">{headline}</p>
            ) : null}
            <div className="mt-2 flex items-center gap-2 text-[12px] text-white/65">
              <span
                className={cn(
                  "inline-block size-2 rounded-full",
                  isPublished ? "bg-emerald-400" : "bg-amber-400",
                )}
                aria-hidden
              />
              {isPublished ? (
                <span>Your listing is live on REPS</span>
              ) : (
                <span>Draft — complete your profile to go live</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {publicUrl ? (
            <>
              <DashboardButton
                size="sm"
                variant="ghost"
                onClick={copyUrl}
                title="Copy public URL"
              >
                {copied ? (
                  <>
                    <BadgeCheck className="mr-1.5 size-4 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 size-4" /> Copy link
                  </>
                )}
              </DashboardButton>
              <DashboardButton asChild size="sm" variant="primary">
                <Link to={publicUrl as any} target="_blank">
                  View public profile
                  <ExternalLink className="ml-1.5 size-4" />
                </Link>
              </DashboardButton>
            </>
          ) : (
            <DashboardButton asChild size="sm" variant="primary">
              <Link to="/dashboard/website">Finish profile</Link>
            </DashboardButton>
          )}
        </div>
      </div>
    </PPanel>
  );
}

/* ------------------------------------------------------------------ */
/* Needs Attention                                                    */
/* ------------------------------------------------------------------ */

type Attention = {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "orange" | "warn" | "danger" | "success" | "neutral";
  title: string;
  detail?: string;
  to: string;
  cta: string;
};

export function NeedsAttention({
  unreadEnquiries,
  pendingReviewReplies,
  unreadSupport,
  insuranceExpiringDays,
  insuranceExpired,
  readiness,
  trust,
}: {
  unreadEnquiries: number;
  pendingReviewReplies: number;
  unreadSupport: number;
  insuranceExpiringDays: number | null;
  insuranceExpired: boolean;
  readiness: ReadinessResult | null | undefined;
  trust: TrustState | null | undefined;
}) {
  // Single source of truth — same 3-of-3 ticks the header badge uses.
  const isVerified =
    !!trust && trust.ticks.identity && trust.ticks.insurance && trust.ticks.qualifications;

  const items: Attention[] = [];

  if (unreadEnquiries > 0) {
    items.push({
      key: "enquiries",
      icon: Inbox,
      tone: "orange",
      title: `${unreadEnquiries} new ${unreadEnquiries === 1 ? "enquiry" : "enquiries"} awaiting reply`,
      detail: "Reply from your inbox to keep response time strong.",
      to: "/dashboard/enquiries",
      cta: "Open",
    });
  }
  if (pendingReviewReplies > 0) {
    items.push({
      key: "reviews",
      icon: Star,
      tone: "orange",
      title: `${pendingReviewReplies} ${pendingReviewReplies === 1 ? "review" : "reviews"} need a response`,
      detail: "Replies show prospects you're engaged.",
      to: "/dashboard/reviews",
      cta: "Reply",
    });
  }
  if (insuranceExpired) {
    items.push({
      key: "insurance-expired",
      icon: AlertTriangle,
      tone: "danger",
      title: "Your insurance has expired",
      detail: "Upload your renewal to keep your Insured layer.",
      to: "/dashboard/verification",
      cta: "Upload",
    });
  } else if (insuranceExpiringDays !== null && insuranceExpiringDays <= 30) {
    items.push({
      key: "insurance-soon",
      icon: AlertTriangle,
      tone: "warn",
      title: `Insurance expires in ${insuranceExpiringDays} ${insuranceExpiringDays === 1 ? "day" : "days"}`,
      detail: "Upload your renewal so you stay covered on REPS.",
      to: "/dashboard/verification",
      cta: "Update",
    });
  }
  if (!isVerified) {
    items.push({
      key: "verify",
      icon: ShieldCheck,
      tone: "orange",
      title: "Complete your verification",
      detail: "Identity, insurance and qualifications unlock your REPS Verified badge.",
      to: "/dashboard/verification",
      cta: "Verify",
    });
  }

  // Website publish state — uses the real websites.published_at + has_unpublished_changes,
  // NOT professionals.is_published (which is set at signup by legacy defaults).
  if (readiness) {
    if (!readiness.website.everPublished) {
      items.push({
        key: "publish-first",
        icon: ShieldCheck,
        tone: "warn",
        title: "Your website has never been published",
        detail: "Publish to appear on the REPS directory.",
        to: "/dashboard/website",
        cta: "Publish",
      });
    } else if (readiness.website.hasUnpublishedChanges) {
      items.push({
        key: "publish-changes",
        icon: ShieldCheck,
        tone: "warn",
        title: "You have unpublished website changes",
        detail: "Review and publish so the public page matches.",
        to: "/dashboard/website",
        cta: "Publish",
      });
    }

    // Per-section attention rows — cap at 3 to avoid a wall of noise.
    const incomplete = readiness.website.sections.filter((s) => s.status !== "done");
    const shown = incomplete.slice(0, 3);
    shown.forEach((s) => {
      const copy = SECTION_ATTENTION_COPY[s.id];
      items.push({
        key: `section-${s.id}`,
        icon: Sparkles,
        tone: "neutral",
        title: s.status === "partial" ? copy.partial : copy.empty,
        detail: `Website section: ${s.status === "partial" ? "in progress" : "not started"}`,
        to: "/dashboard/website",
        cta: "Fix",
      });
    });
    if (incomplete.length > shown.length) {
      const rest = incomplete.length - shown.length;
      items.push({
        key: "section-more",
        icon: Sparkles,
        tone: "neutral",
        title: `${rest} more website ${rest === 1 ? "section" : "sections"} to finish`,
        detail: "Open the editor to complete them.",
        to: "/dashboard/website",
        cta: "Open",
      });
    }

    if (!readiness.education.hasCert) {
      items.push({
        key: "education",
        icon: GraduationCap,
        tone: "neutral",
        title: "Upload a qualification certificate",
        detail: "Adds your REPS Qualifications tick and improves ranking.",
        to: "/dashboard/verification",
        cta: "Upload",
      });
    }
  }

  if (unreadSupport > 0) {
    items.push({
      key: "support",
      icon: MessageCircle,
      tone: "neutral",
      title: `${unreadSupport} support ${unreadSupport === 1 ? "reply" : "replies"} waiting`,
      detail: "REPS Support replied to a ticket.",
      to: "/dashboard/support",
      cta: "View",
    });
  }

  const visible = items.slice(0, 8);

  return (
    <PPanel className="flex h-full flex-col p-5">
      <SectionHeader
        title="Needs your attention"
        description="Live signals from across your dashboard."
        icon={CheckCircle2}
      />
      {visible.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <DashboardEmpty>
            <DashboardEmptyIcon>
              <CheckCircle2 />
            </DashboardEmptyIcon>
            <DashboardEmptyTitle>All caught up</DashboardEmptyTitle>
            <DashboardEmptyDescription>
              Nothing needs your attention right now. We'll surface enquiries, reviews
              and renewals here as they come in.
            </DashboardEmptyDescription>
          </DashboardEmpty>
        </div>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
          {visible.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <Link
                  to={item.to as any}
                  className="group flex items-center gap-3 rounded-[12px] border border-reps-border bg-reps-panel-soft/40 p-3 transition-colors hover:border-reps-orange/40 hover:bg-reps-panel-soft"
                >
                  <DashboardBadge
                    variant={item.tone}
                    className="size-7 justify-center rounded-[10px] p-0 [&_svg]:size-3.5"
                  >
                    <Icon />
                  </DashboardBadge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-white">{item.title}</p>
                    {item.detail ? (
                      <p className="truncate text-[12px] text-white/55">{item.detail}</p>
                    ) : null}
                  </div>
                  <span className="hidden items-center gap-1 text-[12px] font-medium text-white/65 group-hover:text-reps-orange sm:inline-flex">
                    {item.cta}
                    <ChevronRight className="size-3.5" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </PPanel>
  );
}

/* ------------------------------------------------------------------ */
/* Readiness card (Website / Verification / Education)                */
/* ------------------------------------------------------------------ */

export function CompletenessCard({
  readiness,
}: {
  readiness: ReadinessResult | null | undefined;
}) {
  const pct = readiness?.pct ?? 0;
  const websitePct = readiness?.website.pct ?? 0;
  const verificationPct = readiness?.verification.pct ?? 0;
  const educationPct = readiness?.education.pct ?? 0;

  const websiteLine = readiness
    ? readiness.website.done === readiness.website.total
      ? readiness.website.everPublished && !readiness.website.hasUnpublishedChanges
        ? "All sections done and published"
        : readiness.website.everPublished
          ? "All sections done — publish latest changes"
          : "All sections done — publish to go live"
      : `${readiness.website.done} of ${readiness.website.total} sections done`
    : "Loading…";

  const verificationLine = readiness
    ? verificationSummary(readiness.verification)
    : "Loading…";

  const educationLine = readiness
    ? readiness.education.hasCert
      ? "Certificate on file"
      : "Upload at least one qualification"
    : "Loading…";

  const rows = [
    {
      key: "website",
      label: "Website",
      pct: websitePct,
      detail: websiteLine,
      to: "/dashboard/website",
    },
    {
      key: "verification",
      label: "Verification",
      pct: verificationPct,
      detail: verificationLine,
      to: "/dashboard/verification",
    },
    {
      key: "education",
      label: "Education",
      pct: educationPct,
      detail: educationLine,
      to: "/dashboard/verification",
    },
  ] as const;

  return (
    <PPanel className="flex h-full flex-col p-5">
      <SectionHeader title="Your REPS readiness" icon={Sparkles} />
      <div className="flex items-center gap-4">
        <Ring value={pct} />
        <div className="min-w-0">
          <p
            className={cn(
              "font-display text-[22px] font-semibold",
              pct === 100 ? "text-emerald-300" : "text-white",
            )}
          >
            {pct}%
          </p>
          <p className="text-[12px] text-white/55">
            {pct === 100
              ? "Your public page is ready."
              : "Website, verification and education roll up here."}
          </p>
        </div>
      </div>
      <ul className="mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {rows.map((r) => (
          <li key={r.key}>
            <Link
              to={r.to as any}
              className="group flex items-center gap-3 rounded-[12px] border border-reps-border bg-reps-panel-soft/40 p-2.5 transition-colors hover:border-reps-orange/40 hover:bg-reps-panel-soft"
            >
              <MiniRing value={r.pct} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-white">{r.label}</p>
                <p className="truncate text-[12px] text-white/55">{r.detail}</p>
              </div>
              <ChevronRight className="size-3.5 shrink-0 text-white/45 group-hover:text-reps-orange" />
            </Link>
          </li>
        ))}
      </ul>
      <DashboardButton asChild size="sm" variant="ghost" className="mt-4 w-full">
        <Link to="/dashboard/website">Open website editor</Link>
      </DashboardButton>
    </PPanel>
  );
}

function MiniRing({ value }: { value: number }) {
  const r = 14;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const offset = c - (v / 100) * c;
  const done = v >= 100;
  return (
    <svg width={36} height={36} viewBox="0 0 36 36" aria-hidden="true" className="shrink-0">
      <circle cx={18} cy={18} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={4} fill="none" />
      <circle
        cx={18}
        cy={18}
        r={r}
        stroke={done ? "rgb(52 211 153)" : "var(--reps-orange)"}
        strokeWidth={4}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 18 18)"
      />
      {done ? (
        <path
          d="M12 18.5l4 4 8-8"
          fill="none"
          stroke="rgb(52 211 153)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </svg>
  );
}

function Ring({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const offset = c - (v / 100) * c;
  const done = v >= 100;
  return (
    <svg width={64} height={64} viewBox="0 0 64 64" aria-label={`${value}% complete`}>
      <circle cx={32} cy={32} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={6} fill="none" />
      <circle
        cx={32}
        cy={32}
        r={r}
        stroke={done ? "rgb(52 211 153)" : "var(--reps-orange)"}
        strokeWidth={6}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 32 32)"
      />
      {done ? (
        <path
          d="M22 32.5l7 7 13-14"
          fill="none"
          stroke="rgb(52 211 153)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Provider — Needs Attention + Readiness                             */
/* ------------------------------------------------------------------ */

export function ProviderNeedsAttention({
  unreadEnquiries,
  pendingReviewReplies,
  unreadSupport,
  providerReadiness,
}: {
  unreadEnquiries: number;
  pendingReviewReplies: number;
  unreadSupport: number;
  providerReadiness: ProviderReadinessResult | null | undefined;
}) {
  const items: Attention[] = [];

  if (unreadEnquiries > 0) {
    items.push({
      key: "enquiries",
      icon: Inbox,
      tone: "orange",
      title: `${unreadEnquiries} new ${unreadEnquiries === 1 ? "enquiry" : "enquiries"} awaiting reply`,
      detail: "Reply from your inbox to keep response time strong.",
      to: "/dashboard/enquiries",
      cta: "Open",
    });
  }
  if (pendingReviewReplies > 0) {
    items.push({
      key: "reviews",
      icon: Star,
      tone: "orange",
      title: `${pendingReviewReplies} ${pendingReviewReplies === 1 ? "review" : "reviews"} need a response`,
      detail: "Replies show prospects you're engaged.",
      to: "/dashboard/reviews",
      cta: "Reply",
    });
  }

  const r = providerReadiness ?? null;

  if (r) {
    /* ------------------------- Provider verification ------------------------ */
    const v = r.verification;
    if (!v.identityDone) {
      items.push({
        key: "provider-identity",
        icon: ShieldCheck,
        tone: "orange",
        title: "Verify your identity",
        detail:
          v.identityStatus === "pending"
            ? "Stripe Identity check in progress — we'll update this when it's approved."
            : "Run the Stripe Identity check to unlock the next verification step.",
        to: "/dashboard/verification",
        cta: v.identityStatus === "pending" ? "View" : "Verify",
      });
    }
    if (!v.nameLocked) {
      items.push({
        key: "provider-name",
        icon: ShieldCheck,
        tone: "orange",
        title: "Lock in your provider name",
        detail: "This becomes your public /t/<name> URL — permanent once submitted.",
        to: "/dashboard/verification",
        cta: "Lock in",
      });
    }
    if (!v.domainDone) {
      const domainDetail =
        v.domainStatus === "unstarted"
          ? "Confirm an email on your provider domain so we can approve it."
          : v.domainStatus === "email_sent"
            ? "Check your inbox and click the confirmation link we sent."
            : v.domainStatus === "email_confirmed" ||
                v.domainStatus === "pending_admin_review"
              ? "Email confirmed — our team is reviewing your domain."
              : v.domainStatus === "rejected"
                ? "Domain rejected — start again with a different provider email."
                : "Confirm your provider email domain.";
      items.push({
        key: "provider-domain",
        icon: ShieldCheck,
        tone:
          v.domainStatus === "rejected"
            ? "danger"
            : v.domainStatus === "email_confirmed" ||
                v.domainStatus === "pending_admin_review"
              ? "warn"
              : "orange",
        title: "Confirm your provider email domain",
        detail: domainDetail,
        to: "/dashboard/verification",
        cta: "Open",
      });
    }

    /* -------------------------- Branding & listing -------------------------- */
    const b = r.branding;
    if (!b.hasLogo) {
      items.push({
        key: "provider-logo",
        icon: Sparkles,
        tone: "neutral",
        title: "Add your provider logo",
        detail: "Shows on your directory card, provider page and certificates.",
        to: "/dashboard",
        cta: "Add",
      });
    }
    if (!b.hasCover) {
      items.push({
        key: "provider-cover",
        icon: Sparkles,
        tone: "neutral",
        title: "Add a cover image for your listing",
        detail: "Sits behind your provider card and the /t/ page hero.",
        to: "/dashboard",
        cta: "Add",
      });
    }
    if (!b.hasCertLogo) {
      items.push({
        key: "provider-cert-logo",
        icon: GraduationCap,
        tone: "warn",
        title: "Upload your certificate logo (160 × 60 px)",
        detail: "Required before you can issue your first REPs certificate.",
        to: "/dashboard/students",
        cta: "Upload",
      });
    }
    if (!b.hasTagline) {
      items.push({
        key: "provider-tagline",
        icon: Sparkles,
        tone: "neutral",
        title: "Write a short tagline for your provider page",
        detail: "One line that sums up what you deliver.",
        to: "/dashboard/website",
        cta: "Write",
      });
    }
    if (!b.hasBio) {
      items.push({
        key: "provider-bio",
        icon: Sparkles,
        tone: "neutral",
        title: "Add an about section for your provider page",
        detail: "Give learners the context they need before enrolling.",
        to: "/dashboard/website",
        cta: "Write",
      });
    }

    /* --------------------------- Provider page ------------------------------ */
    const p = r.providerPage;
    if (!p.everPublished) {
      items.push({
        key: "provider-publish-first",
        icon: ShieldCheck,
        tone: "warn",
        title: "Your provider page has never been published",
        detail: "Publish it so you appear on the REPs training-provider directory.",
        to: "/dashboard/website",
        cta: "Publish",
      });
    } else if (p.hasUnpublishedChanges) {
      items.push({
        key: "provider-publish-changes",
        icon: ShieldCheck,
        tone: "warn",
        title: "You have unpublished changes on your provider page",
        detail: "Review and publish so the public page matches your dashboard.",
        to: "/dashboard/website",
        cta: "Publish",
      });
    }

    /* ---------------------- Endorsement + first certificate ---------------- */
    const a = r.adoption;
    if (a.accreditedCourseCount === 0) {
      items.push({
        key: "provider-first-endorsement",
        icon: GraduationCap,
        tone: "orange",
        title: "Get your first qualification endorsed",
        detail: "Submit a qualification for REPs endorsement to start issuing certificates.",
        to: "/dashboard/qualifications",
        cta: "Submit",
      });
    } else if (a.issuedCertificateCount === 0) {
      // Only surface this once endorsement is in place and branding is ready
      // to actually issue — nudges the next real step.
      const canIssue =
        v.identityDone && v.nameLocked && v.domainDone && b.hasCertLogo;
      if (canIssue) {
        items.push({
          key: "provider-first-certificate",
          icon: GraduationCap,
          tone: "orange",
          title: "Issue your first REPs certificate",
          detail: "Register a learner, mark them passed, and we'll issue the certificate.",
          to: "/dashboard/students",
          cta: "Start",
        });
      }
    }
  }

  if (unreadSupport > 0) {
    items.push({
      key: "support",
      icon: MessageCircle,
      tone: "neutral",
      title: `${unreadSupport} support ${unreadSupport === 1 ? "reply" : "replies"} waiting`,
      detail: "REPS Support replied to a ticket.",
      to: "/dashboard/support",
      cta: "View",
    });
  }

  const visible = items.slice(0, 8);

  return (
    <PPanel className="flex h-full flex-col p-5">
      <SectionHeader
        title="Needs your attention"
        description="Live signals across verification, branding, endorsements and certificates."
        icon={CheckCircle2}
      />
      {visible.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <DashboardEmpty>
            <DashboardEmptyIcon>
              <CheckCircle2 />
            </DashboardEmptyIcon>
            <DashboardEmptyTitle>All caught up</DashboardEmptyTitle>
            <DashboardEmptyDescription>
              Nothing needs your attention right now. We'll surface enquiries,
              domain reviews, endorsements and certificate work here as it comes in.
            </DashboardEmptyDescription>
          </DashboardEmpty>
        </div>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
          {visible.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <Link
                  to={item.to as any}
                  className="group flex items-center gap-3 rounded-[12px] border border-reps-border bg-reps-panel-soft/40 p-3 transition-colors hover:border-reps-orange/40 hover:bg-reps-panel-soft"
                >
                  <DashboardBadge
                    variant={item.tone}
                    className="size-7 justify-center rounded-[10px] p-0 [&_svg]:size-3.5"
                  >
                    <Icon />
                  </DashboardBadge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-white">{item.title}</p>
                    {item.detail ? (
                      <p className="truncate text-[12px] text-white/55">{item.detail}</p>
                    ) : null}
                  </div>
                  <span className="hidden items-center gap-1 text-[12px] font-medium text-white/65 group-hover:text-reps-orange sm:inline-flex">
                    {item.cta}
                    <ChevronRight className="size-3.5" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </PPanel>
  );
}

export function ProviderReadinessCard({
  providerReadiness,
}: {
  providerReadiness: ProviderReadinessResult | null | undefined;
}) {
  const r = providerReadiness ?? null;
  const pct = r?.pct ?? 0;

  const verificationLine = r
    ? r.verification.done === 3
      ? "Identity, name and domain verified"
      : `${r.verification.done} of 3 verification steps done`
    : "Loading…";

  const brandingLine = r
    ? r.branding.done === r.branding.total
      ? "Logo, cover, certificate logo, tagline and bio ready"
      : `${r.branding.done} of ${r.branding.total} branding items ready`
    : "Loading…";

  const pageLine = r
    ? !r.providerPage.everPublished
      ? "Publish your provider page to go live"
      : r.providerPage.hasUnpublishedChanges
        ? "Unpublished changes on your provider page"
        : "Provider page is live and up to date"
    : "Loading…";

  const adoptionLine = r
    ? r.adoption.accreditedCourseCount === 0
      ? "Get your first qualification endorsed"
      : r.adoption.issuedCertificateCount === 0
        ? "Issue your first REPs certificate"
        : `${r.adoption.accreditedCourseCount} endorsed · ${r.adoption.issuedCertificateCount} issued`
    : "Loading…";

  const rows = [
    {
      key: "verification",
      label: "Verification",
      pct: r?.verification.pct ?? 0,
      detail: verificationLine,
      to: "/dashboard/verification",
    },
    {
      key: "branding",
      label: "Branding & listing",
      pct: r?.branding.pct ?? 0,
      detail: brandingLine,
      to: "/dashboard",
    },
    {
      key: "page",
      label: "Provider page",
      pct: r?.providerPage.pct ?? 0,
      detail: pageLine,
      to: "/dashboard/website",
    },
    {
      key: "adoption",
      label: "Endorsements & certificates",
      pct: r?.adoption.pct ?? 0,
      detail: adoptionLine,
      to:
        r && r.adoption.accreditedCourseCount === 0
          ? "/dashboard/qualifications"
          : "/dashboard/students",
    },
  ] as const;

  return (
    <PPanel className="flex h-full flex-col p-5">
      <SectionHeader title="Your REPS readiness" icon={Sparkles} />
      <div className="flex items-center gap-4">
        <Ring value={pct} />
        <div className="min-w-0">
          <p
            className={cn(
              "font-display text-[22px] font-semibold",
              pct === 100 ? "text-emerald-300" : "text-white",
            )}
          >
            {pct}%
          </p>
          <p className="text-[12px] text-white/55">
            {pct === 100
              ? "Provider dashboard fully set up."
              : "Verification, branding, page and adoption roll up here."}
          </p>
        </div>
      </div>
      <ul className="mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {rows.map((row) => (
          <li key={row.key}>
            <Link
              to={row.to as any}
              className="group flex items-center gap-3 rounded-[12px] border border-reps-border bg-reps-panel-soft/40 p-2.5 transition-colors hover:border-reps-orange/40 hover:bg-reps-panel-soft"
            >
              <MiniRing value={row.pct} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-white">{row.label}</p>
                <p className="truncate text-[12px] text-white/55">{row.detail}</p>
              </div>
              <ChevronRight className="size-3.5 shrink-0 text-white/45 group-hover:text-reps-orange" />
            </Link>
          </li>
        ))}
      </ul>
    </PPanel>
  );
}

/* ------------------------------------------------------------------ */

/* Activity timeline                                                  */
/* ------------------------------------------------------------------ */

type TimelineEvent = {
  key: string;
  at: string;
  icon: React.ComponentType<{ className?: string }>;
  text: React.ReactNode;
  to: string;
};

export function ActivityTimeline({
  enquiries,
  reviews,
}: {
  enquiries: EnquiryDTO[];
  reviews: ReviewDTO[];
}) {
  const events: TimelineEvent[] = React.useMemo(() => {
    const e: TimelineEvent[] = [];
    enquiries.slice(0, 10).forEach((r) => {
      e.push({
        key: `enq:${r.id}`,
        at: r.created_at,
        icon: Inbox,
        text: (
          <>
            New enquiry from <span className="text-white">{r.sender_name || "a client"}</span>
          </>
        ),
        to: "/dashboard/enquiries",
      });
    });
    reviews.slice(0, 10).forEach((r) => {
      e.push({
        key: `rev:${r.id}`,
        at: r.created_at,
        icon: Star,
        text: (
          <>
            {r.rating}★ review from{" "}
            <span className="text-white">{r.client_name || "a client"}</span>
          </>
        ),
        to: "/dashboard/reviews",
      });
    });
    return e.sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 10);
  }, [enquiries, reviews]);

  return (
    <PPanel className="flex h-full flex-col p-5">
      <SectionHeader
        title="Recent activity"
        description="The last 10 events across enquiries and reviews."
        icon={Sparkles}
      />
      {events.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <DashboardEmpty>
            <DashboardEmptyIcon>
              <Sparkles />
            </DashboardEmptyIcon>
            <DashboardEmptyTitle>No activity yet</DashboardEmptyTitle>
            <DashboardEmptyDescription>
              When clients enquire or leave reviews, you'll see the activity stream here.
            </DashboardEmptyDescription>
          </DashboardEmpty>
        </div>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
          {events.map((ev, i) => {
            const Icon = ev.icon;
            return (
              <li key={ev.key}>
                <Link
                  to={ev.to as any}
                  className={cn(
                    "flex items-center gap-3 py-2.5 text-[13px] text-white/70 hover:text-white",
                    i < events.length - 1 && "border-b border-reps-border/60",
                  )}
                >
                  <Icon className="size-3.5 shrink-0 text-reps-orange" />
                  <span className="flex-1 truncate">{ev.text}</span>
                  <time className="shrink-0 text-[11px] text-white/45">{relTime(ev.at)}</time>
                  <ArrowUpRight className="size-3.5 shrink-0 text-white/35" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </PPanel>
  );
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/* ------------------------------------------------------------------ */
/* Verification status card                                           */
/* ------------------------------------------------------------------ */

type StatusTone = "ok" | "warn" | "fail" | "muted";
type RowStatus = { tone: StatusTone; label: string };

function fmtDate(d: string | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function VerificationStatusCard({ trust }: { trust: TrustState | null | undefined }) {
  // Identity — driven by professionals.identity_status (Stripe webhook source of truth).
  const idStatus = trust?.identity.status ?? "none";
  const identityRow: RowStatus =
    idStatus === "approved"
      ? { tone: "ok", label: "Verified" }
      : idStatus === "pending"
        ? { tone: "warn", label: "In review" }
        : idStatus === "rejected"
          ? { tone: "fail", label: "Rejected" }
          : idStatus === "needs_more_info"
            ? { tone: "warn", label: "More info needed" }
            : idStatus === "expired"
              ? { tone: "fail", label: "Expired" }
              : { tone: "muted", label: "Not started" };

  // Insurance — driven by insurance_policies.status + expiry comparison.
  const insStatus = trust?.insurance.status ?? "none";
  const insuranceRow: RowStatus =
    insStatus === "active"
      ? { tone: "ok", label: "In date" }
      : insStatus === "pending"
        ? { tone: "warn", label: "In review" }
        : insStatus === "expired"
          ? { tone: "fail", label: "Expired" }
          : insStatus === "rejected"
            ? { tone: "fail", label: "Rejected" }
            : { tone: "muted", label: "Not started" };
  const insuranceDetail =
    insStatus === "active" && trust?.insurance.expiryDate
      ? `Valid until ${fmtDate(trust.insurance.expiryDate)}`
      : insStatus === "expired" && trust?.insurance.expiryDate
        ? `Lapsed ${fmtDate(trust.insurance.expiryDate)} — upload a renewed certificate`
        : insStatus === "expired"
          ? "Your certificate has lapsed — upload a renewed one"
          : insStatus === "pending"
            ? "Admin is reviewing your certificate"
            : insStatus === "rejected"
              ? "Rejected — upload a new certificate"
              : undefined;

  // Qualifications — drive label off real submission state, not "activity elsewhere".
  // pendingCount > 0 means a certificate is genuinely sat with admin. Anything else
  // with qualCount === 0 is "Not started" — we must not lie and say "In review"
  // when nothing has been submitted (that's what blew up Charlotte Evans).
  const qualCount = trust?.qualifications.count ?? 0;
  const qualPending = trust?.qualifications.pendingCount ?? 0;
  const qualChanges = trust?.qualifications.changesRequestedCount ?? 0;
  const qualRejected = trust?.qualifications.rejectedCount ?? 0;
  const qualificationsRowFinal: RowStatus =
    qualCount > 0
      ? { tone: "ok", label: `${qualCount} approved` }
      : qualPending > 0
        ? { tone: "warn", label: "In review" }
        : qualChanges > 0
          ? { tone: "warn", label: "Changes requested" }
          : qualRejected > 0
            ? { tone: "warn", label: "Rejected" }
            : { tone: "muted", label: "Not started" };


  const rows: Array<{ label: string; status: RowStatus; detail?: string }> = [
    { label: "Identity verified", status: identityRow },
    { label: "Insurance on file", status: insuranceRow, detail: insuranceDetail },
    { label: "Qualifications", status: qualificationsRowFinal },
  ];
  return (
    <PPanel className="flex h-full flex-col p-5">
      <SectionHeader title="Verification" icon={ShieldCheck} />
      <ul className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
        {rows.map((r) => {
          const done = r.status.tone === "ok";
          return (
            <li key={r.label} className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-[8px] border",
                  done
                    ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                    : r.status.tone === "fail"
                      ? "border-red-400/30 bg-red-500/15 text-red-300"
                      : r.status.tone === "warn"
                        ? "border-amber-400/30 bg-amber-500/15 text-amber-300"
                        : "border-reps-border bg-reps-panel-soft/40 text-white/45",
                )}
              >
                {done ? <CheckCircle2 className="size-3.5" /> : <span className="size-2 rounded-full bg-current" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-white">{r.label}</p>
                {r.detail ? <p className="text-[11.5px] text-white/55">{r.detail}</p> : null}
              </div>
              {!done ? (
                <DashboardBadge
                  variant={r.status.tone === "fail" ? "danger" : r.status.tone === "warn" ? "warn" : "neutral"}
                  className="shrink-0"
                >
                  {r.status.label}
                </DashboardBadge>
              ) : null}
            </li>
          );
        })}
      </ul>
      <DashboardButton asChild size="sm" variant="ghost" className="mt-4 w-full">
        <Link to="/dashboard/verification">Manage verification</Link>
      </DashboardButton>
    </PPanel>
  );
}

/* ------------------------------------------------------------------ */
/* Reviews snapshot                                                   */
/* ------------------------------------------------------------------ */

export function ReviewsSnapshot({ kpis }: { kpis: ReviewKpis | undefined }) {
  return (
    <PCard className="flex h-full flex-col">
      <SectionHeader
        title="Reviews"
        icon={Star}
        action={
          <DashboardButton asChild size="sm" variant="link" className="h-7 px-0 text-[12px]">
            <Link to="/dashboard/reviews">All reviews</Link>
          </DashboardButton>
        }
      />
      <div className="flex items-baseline gap-2">
        <span className="font-display text-[28px] font-semibold text-white">
          {kpis?.avg_rating?.toFixed(1) ?? "—"}
        </span>
        <span className="text-[12px] text-white/55">
          {kpis?.review_count ?? 0} {kpis?.review_count === 1 ? "review" : "reviews"}
        </span>
      </div>
      <div className="mt-3 flex min-h-0 flex-1 flex-col justify-center gap-1.5">
        {(kpis?.breakdown ?? []).map((b) => (
          <div key={b.stars} className="flex items-center gap-2 text-[11.5px] text-white/70">
            <span className="w-4 shrink-0 text-right">{b.stars}</span>
            <Star className="size-3 shrink-0 text-reps-orange" />
            <Progress value={b.pct} className="h-1.5 flex-1 bg-white/[0.06]" />
            <span className="w-8 shrink-0 text-right tabular-nums text-white/55">{b.count}</span>
          </div>
        ))}
      </div>
    </PCard>
  );
}

/* ------------------------------------------------------------------ */
/* CPD mini                                                           */
/* ------------------------------------------------------------------ */

export function CpdMini({
  qualUploaded,
  uploadedAt,
  trust,
}: {
  qualUploaded: boolean;
  uploadedAt: string | null;
  trust?: TrustState | null;
}) {
  const certCount = trust?.qualifications.count ?? 0;
  const pendingCount = trust?.qualifications.pendingCount ?? 0;
  const titles = trust?.qualifications.titles ?? [];
  const primaryTitle = trust?.qualifications.primaryTitle ?? null;
  const secondaryTitle = trust?.qualifications.secondaryTitle ?? null;
  const latestAt = trust?.qualifications.latestApprovedAt ?? uploadedAt ?? null;
  const titleCount = titles.length;
  const hasApproved = titleCount > 0 || certCount > 0;
  const showUploaded = hasApproved || qualUploaded;

  // titles already arrives primary-first, secondary-second from trust.functions.ts
  const orderedTitles = titles;

  const formattedDate = latestAt
    ? new Date(latestAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;

  const certLine =
    certCount > 0
      ? `${certCount} certificate${certCount === 1 ? "" : "s"} on file`
      : null;

  return (
    <PCard className="flex h-full flex-col">
      <SectionHeader
        title="Education & CPD"
        icon={GraduationCap}
        action={
          <DashboardButton asChild size="sm" variant="link" className="h-7 px-0 text-[12px]">
            <Link to="/dashboard/cpd">Open CPD</Link>
          </DashboardButton>
        }
      />
      <div className="flex items-center gap-4">
        <Ring value={showUploaded ? 100 : 0} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[18px] font-semibold text-white">
            {titleCount > 0
              ? `Qualified to deliver ${titleCount} title${titleCount === 1 ? "" : "s"}`
              : showUploaded
                ? "Qualifications uploaded"
                : "No certificates yet"}
          </p>
          <p className="text-[12px] text-white/55">
            {[certLine, formattedDate ? `last update ${formattedDate}` : null, pendingCount > 0 ? `${pendingCount} pending review` : null]
              .filter(Boolean)
              .join(" · ") || "Add certificates to earn the Qualified layer."}
          </p>
        </div>
      </div>
      {orderedTitles.length > 0 ? (
        <ul className="mt-4 flex min-h-0 flex-1 flex-col divide-y divide-white/5 overflow-y-auto rounded-[12px] border border-white/8 bg-white/[0.02]">
          {orderedTitles.map((t) => {
            const isPrimary = t === primaryTitle;
            const isSecondary = !isPrimary && t === secondaryTitle;
            return (
              <li key={t} className="flex items-center gap-2.5 px-3 py-2">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-400" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-white">{t}</span>
                {isPrimary ? (
                  <span className="inline-flex items-center rounded-md border border-emerald-400/30 bg-emerald-500/15 px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wide text-emerald-300">
                    Primary
                  </span>
                ) : isSecondary ? (
                  <span className="inline-flex items-center rounded-md border border-reps-orange-border bg-reps-orange-soft px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wide text-reps-orange">
                    Secondary
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-4 flex-1" />
      )}
    </PCard>
  );
}

/* ------------------------------------------------------------------ */
/* Services strip                                                     */
/* ------------------------------------------------------------------ */

export function ServicesStrip({ services }: { services: ServiceDTO[] }) {
  const top = services.slice(0, 4);
  return (
    <PPanel className="p-5">
      <SectionHeader
        title="Your services"
        description="Shown on your public listing and enquiry form."
        icon={Sparkles}
        action={
          <DashboardButton asChild size="sm" variant="ghost">
            <Link to="/dashboard/website" hash="specialisms">Manage services</Link>
          </DashboardButton>
        }
      />
      {top.length === 0 ? (
        <DashboardEmpty>
          <DashboardEmptyIcon>
            <Sparkles />
          </DashboardEmptyIcon>
          <DashboardEmptyTitle>No services yet</DashboardEmptyTitle>
          <DashboardEmptyDescription>
            Add at least one service so clients know what to book.
          </DashboardEmptyDescription>
        </DashboardEmpty>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {top.map((s) => (
            <div
              key={s.id}
              className="rounded-[16px] border border-reps-border bg-reps-panel-soft/40 p-4"
            >
              <p className="truncate text-[13.5px] font-semibold text-white">{s.title}</p>
              <p className="mt-1 text-[12px] text-white/55">
                {s.price_pence != null
                  ? `£${(s.price_pence / 100).toFixed(0)}`
                  : (s.price_label ?? "Price on enquiry")}
                {s.duration_minutes ? ` · ${s.duration_minutes} min` : ""}
              </p>
              {!s.is_published ? (
                <DashboardBadge variant="warn" className="mt-2">Draft</DashboardBadge>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </PPanel>
  );
}

/* ------------------------------------------------------------------ */
/* Pro upsell strip                                                   */
/* ------------------------------------------------------------------ */

export function ProUpsellStrip() {
  return (
    <PPanel className="bg-gradient-to-br from-reps-orange-soft/40 via-reps-panel to-reps-panel p-5">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-reps-orange-border bg-reps-orange-soft px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-reps-orange">
            <Sparkles className="size-3" /> Pro Founding · £59/mo
          </div>
          <h3 className="font-display text-[18px] font-semibold text-white">
            Grow your business inside REPS
          </h3>
          <p className="mt-1 text-[13px] text-white/65">
            Clients, calendar, bookings, deposits, AI-drafted replies, lead pipeline and
            in-app messaging — every Pro feature, no add-ons.
          </p>
        </div>
        <DashboardButton asChild size="sm" variant="primary" className="shrink-0">
          <Link to="/pricing">See Pro features</Link>
        </DashboardButton>
      </div>
    </PPanel>
  );
}

/* ------------------------------------------------------------------ */
/* Hub data hook                                                      */
/* ------------------------------------------------------------------ */

export function useHubData(enabled: boolean) {
  const fetchProfile = useServerFn(getMyDashboardProfile);
  const fetchEnqStats = useServerFn(getEnquiryStats);
  const fetchEnqList = useServerFn(listMyEnquiries);
  const fetchReviewKpis = useServerFn(getMyReviewKpis);
  const fetchReviews = useServerFn(listMyReviews);
  const fetchWebsite = useServerFn(getMyWebsite);
  const fetchTrust = useServerFn(getTrustState);
  const fetchReadiness = useServerFn(getMyReadiness);
  const fetchProviderReadiness = useServerFn(getProviderReadiness);

  const profile = useQuery({
    queryKey: ["my-dashboard-profile"],
    queryFn: () => fetchProfile(),
    enabled,
  });
  const enqStats = useQuery({
    queryKey: ["enquiries", "stats"],
    queryFn: () => fetchEnqStats(),
    enabled,
  });
  const enquiries = useQuery({
    queryKey: ["enquiries", "list"],
    queryFn: () => fetchEnqList(),
    enabled,
  });
  const reviewKpis = useQuery({
    queryKey: ["reviews", "kpis"],
    queryFn: () => fetchReviewKpis(),
    enabled,
  });
  const reviews = useQuery({
    queryKey: ["reviews", "list"],
    queryFn: () => fetchReviews(),
    enabled,
  });
  const website = useQuery({
    queryKey: ["website", "mine"],
    queryFn: () => fetchWebsite(),
    enabled,
  });
  const trust = useQuery({
    queryKey: ["my-trust-state"],
    queryFn: () => fetchTrust(),
    enabled,
  });
  const readiness = useQuery({
    queryKey: ["my-readiness"],
    queryFn: () => fetchReadiness(),
    enabled,
  });
  const providerReadiness = useQuery({
    queryKey: ["my-provider-readiness"],
    queryFn: () => fetchProviderReadiness(),
    enabled,
  });


  const reviewsUnread = useReviewsUnread({ enabled });
  const supportUnread = useMySupportUnread({ enabled });

  const pendingReviewReplies = (reviews.data ?? []).filter(
    (r) => r.status === "published" && !r.response,
  ).length;

  return {
    profile,
    enqStats,
    enquiries,
    reviewKpis,
    reviews,
    website,
    trust,
    readiness,
    providerReadiness,
    reviewsUnread: reviewsUnread.unread,
    supportUnread: supportUnread.unread,
    pendingReviewReplies,
  };
}

export const HubLoader = () => (
  <div className="flex h-[400px] items-center justify-center text-white/50">
    <Loader2 className="size-5 animate-spin" />
  </div>
);
