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
  Eye,
  ExternalLink,
  GraduationCap,
  Inbox,
  Loader2,
  MessageCircle,
  MousePointerClick,
  Search as SearchIcon,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
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
import { profileCompleteness } from "@/lib/dashboard/profileCompleteness";
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
import { getMyShopFront, type ServiceDTO } from "@/lib/shop-front/shop-front.functions";
import { getTrustState, type TrustState } from "@/lib/verification/trust.functions";
import { useReviewsUnread } from "@/hooks/useReviewsUnread";
import { useMySupportUnread } from "@/hooks/useMySupportUnread";

import {
  getDiscoverabilityKpis,
  type DiscoverabilityKpis,
} from "@/lib/discoverability/kpis.functions";
import { HeaderSparkline } from "./HeaderSparkline";

/* ------------------------------------------------------------------ */
/* Motion helpers                                                     */
/* ------------------------------------------------------------------ */

function usePrefersReducedMotion() {
  const [reduce, setReduce] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduce(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduce;
}

function useCountUp(target: number, duration = 600) {
  const reduce = usePrefersReducedMotion();
  const [value, setValue] = React.useState(reduce ? target : 0);
  React.useEffect(() => {
    if (reduce || target === 0) {
      setValue(target);
      return;
    }
    if (typeof window === "undefined") {
      setValue(target);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduce]);
  return value;
}

function usePulseOnIncrease(value: number, duration = 2000) {
  const prev = React.useRef(value);
  const [pulse, setPulse] = React.useState(false);
  React.useEffect(() => {
    if (value > prev.current) {
      setPulse(true);
      const t = window.setTimeout(() => setPulse(false), duration);
      return () => window.clearTimeout(t);
    }
    prev.current = value;
  }, [value, duration]);
  React.useEffect(() => {
    prev.current = value;
  }, [value]);
  return pulse;
}


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
  dailyViews,
}: {
  name: string;
  avatarUrl: string | null | undefined;
  headline: string | null | undefined;
  tierLabel: string;
  isPublished: boolean;
  slug: string | null | undefined;
  trust: TrustState | null | undefined;
  dailyViews?: Array<{ date: string; count: number }> | null;
}) {

  const initials = name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const publicUrl = slug ? `/pro/${slug}` : null;

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
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-white/65">
              <span className="inline-flex items-center gap-2">
                <span
                  className={cn(
                    "inline-block size-2 rounded-full",
                    isPublished ? "bg-emerald-400" : "bg-amber-400",
                  )}
                  aria-hidden
                />
                {isPublished ? "Live on REPS" : "Draft — complete your profile to go live"}
              </span>
              {isPublished ? (
                <>
                  <span className="hidden h-3 w-px bg-white/10 sm:inline-block" aria-hidden />
                  <HeaderSparkline data={dailyViews ?? null} />
                </>
              ) : null}
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
              <Link to="/dashboard/profile">Finish profile</Link>
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
  profilePct,
  isPublished,
  trust,
}: {
  unreadEnquiries: number;
  pendingReviewReplies: number;
  unreadSupport: number;
  insuranceExpiringDays: number | null;
  insuranceExpired: boolean;
  profilePct: number;
  isPublished: boolean;
  trust: TrustState | null | undefined;
}) {
  // Single source of truth — same 3-of-3 ticks the header badge uses.
  const isVerified =
    !!trust && trust.ticks.identity && trust.ticks.insurance && trust.ticks.qualifications;

  const items: Attention[] = [];

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
      tone: "neutral",
      title: `${pendingReviewReplies} ${pendingReviewReplies === 1 ? "review" : "reviews"} need a response`,
      detail: "Replies show prospects you're engaged.",
      to: "/dashboard/reviews",
      cta: "Reply",
    });
  }
  if (!isVerified) {
    items.push({
      key: "verify",
      icon: ShieldCheck,
      tone: "warn",
      title: "Complete your verification",
      detail: "Identity, insurance and qualifications unlock your REPS Verified badge.",
      to: "/dashboard/verification",
      cta: "Verify",
    });
  }
  if (!isPublished) {
    items.push({
      key: "publish",
      icon: ShieldCheck,
      tone: "warn",
      title: "Your listing is still a draft",
      detail: "Publish to appear on the REPS directory.",
      to: "/dashboard/profile",
      cta: "Publish",
    });
  }
  if (profilePct < 100) {
    items.push({
      key: "profile",
      icon: Sparkles,
      tone: "neutral",
      title: `Your profile is ${profilePct}% complete`,
      detail: "A complete profile ranks higher and gets more enquiries.",
      to: "/dashboard/profile",
      cta: "Polish",
    });
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


  const visible = items.slice(0, 6);

  return (
    <PPanel className="flex flex-col p-5">
      <SectionHeader
        title="Needs your attention"
        description="Live signals from across your dashboard."
        icon={CheckCircle2}
      />
      {visible.length === 0 ? (
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
      ) : (
        <ul className="flex flex-col gap-2">
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
/* Profile completeness card                                          */
/* ------------------------------------------------------------------ */

export function CompletenessCard({ profile }: { profile: DashboardProfile | null }) {
  const { pct, checklist } = profileCompleteness(profile);
  return (
    <PPanel className="flex flex-col p-5">

      <SectionHeader title="Profile completeness" icon={Sparkles} />
      <div className="flex items-center gap-4">
        <Ring value={pct} />
        <div className="min-w-0">
          <p className="font-display text-[22px] font-semibold text-white">{pct}%</p>
          <p className="text-[12px] text-white/55">
            {pct === 100 ? "Looking great." : "Finish the last steps to boost ranking."}
          </p>
        </div>
      </div>
      <ul className="mt-4 flex flex-col gap-1.5">
        {checklist.map((c) => (
          <li
            key={c.label}
            className="flex items-center gap-2 text-[12.5px] text-white/75"
          >
            <CheckCircle2
              className={cn(
                "size-3.5 shrink-0",
                c.done ? "text-emerald-400" : "text-white/25",
              )}
            />
            <span className={cn(c.done ? "text-white/75" : "text-white/55")}>{c.label}</span>
          </li>
        ))}
      </ul>
      <DashboardButton asChild size="sm" variant="ghost" className="mt-4 w-full">
        <Link to="/dashboard/profile">Edit profile</Link>
      </DashboardButton>
    </PPanel>
  );
}

function Ring({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width={64} height={64} viewBox="0 0 64 64" aria-label={`${value}% complete`}>
      <circle cx={32} cy={32} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={6} fill="none" />
      <circle
        cx={32}
        cy={32}
        r={r}
        stroke="var(--reps-orange)"
        strokeWidth={6}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 32 32)"
      />
    </svg>
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
    <PPanel className="flex flex-col p-5">

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
        <ul className="flex flex-col">
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
                  <Icon className="size-3.5 shrink-0 text-white/45" />
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

  // Qualifications — driven by approved verification_submissions count, not row existence.
  const qualCount = trust?.qualifications.count ?? 0;
  const qualificationsRow: RowStatus =
    qualCount > 0
      ? { tone: "ok", label: `${qualCount} approved` }
      : { tone: "warn", label: "In review" };
  // If nothing has ever been submitted, show "Not started" instead of "In review".
  // We can't tell from TrustState alone whether a submission exists, so fall back to
  // generic "In review" only when at least one tick is in flight elsewhere — otherwise
  // just show muted.
  const anyActivity = idStatus !== "none" || insStatus !== "none";
  const qualificationsRowFinal: RowStatus =
    qualCount === 0 && !anyActivity ? { tone: "muted", label: "Not started" } : qualificationsRow;

  const rows: Array<{ label: string; status: RowStatus; detail?: string }> = [
    { label: "Identity verified", status: identityRow },
    { label: "Insurance on file", status: insuranceRow, detail: insuranceDetail },
    { label: "Qualifications", status: qualificationsRowFinal },
  ];
  return (
    <PPanel className="flex flex-col p-5">
      <SectionHeader title="Verification" icon={ShieldCheck} />
      <ul className="flex flex-col gap-2.5">

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
  if (top.length === 0) {
    return (
      <Link
        to="/dashboard/services"
        className="group flex items-center justify-between gap-3 rounded-[16px] border border-dashed border-reps-border bg-reps-panel-soft/30 px-4 py-3 transition-colors hover:border-reps-orange/40 hover:bg-reps-panel-soft/60"
      >
        <div className="flex items-center gap-3 text-[13px] text-white/70">
          <Sparkles className="size-4 text-white/45" />
          <span>Add at least one service so clients know what to book.</span>
        </div>
        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-white/65 group-hover:text-reps-orange">
          Add a service
          <ChevronRight className="size-3.5" />
        </span>
      </Link>
    );
  }
  return (
    <PPanel className="p-5">
      <SectionHeader
        title="Your services"
        description="Shown on your public listing and enquiry form."
        icon={Sparkles}
        action={
          <DashboardButton asChild size="sm" variant="ghost">
            <Link to="/dashboard/services">Manage services</Link>
          </DashboardButton>
        }
      />
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
/* Discoverability strip — views, impressions, position, CTR (30d)    */
/* ------------------------------------------------------------------ */

export function DiscoverabilityStrip({
  data,
  isLoading,
}: {
  data: DiscoverabilityKpis | null | undefined;
  isLoading?: boolean;
}) {
  const tiles: Array<{
    label: string;
    value: string;
    delta: string;
    trend: "up" | "down" | "flat";
    icon: React.ComponentType<{ className?: string }>;
  }> = React.useMemo(() => {
    if (!data) {
      return [
        { label: "Profile views", value: "0", delta: "last 30 days", trend: "flat", icon: Eye },
        { label: "Search impressions", value: "0", delta: "last 30 days", trend: "flat", icon: SearchIcon },
        { label: "Avg search position", value: "—", delta: "no data yet", trend: "flat", icon: TrendingUp },
        { label: "CTR", value: "—", delta: "views ÷ impressions", trend: "flat", icon: MousePointerClick },
      ];
    }
    const dPct = data.views_delta_pct;
    const deltaCopy =
      dPct === null
        ? "vs prior 30d"
        : dPct === 0
          ? "no change vs prior 30d"
          : `${dPct > 0 ? "+" : ""}${dPct}% vs prior 30d`;
    const deltaTrend: "up" | "down" | "flat" = dPct == null ? "flat" : dPct > 0 ? "up" : dPct < 0 ? "down" : "flat";
    return [
      {
        label: "Profile views",
        value: String(data.views_30d),
        delta: deltaCopy,
        trend: deltaTrend,
        icon: Eye,
      },
      {
        label: "Search impressions",
        value: String(data.impressions_30d),
        delta: "last 30 days",
        trend: "flat",
        icon: SearchIcon,
      },
      {
        label: "Avg search position",
        value: data.avg_position != null ? `#${data.avg_position}` : "—",
        delta: data.avg_position != null ? "lower is better" : "no impressions yet",
        trend: "flat",
        icon: TrendingUp,
      },
      {
        label: "CTR",
        value: data.ctr_pct != null ? `${data.ctr_pct}%` : "—",
        delta: "views ÷ impressions",
        trend: "flat",
        icon: MousePointerClick,
      },
    ];
  }, [data]);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {tiles.map((t) => {
        const Icon = t.icon;
        const TrendIcon = t.trend === "up" ? TrendingUp : t.trend === "down" ? TrendingDown : null;
        const trendCls =
          t.trend === "up" ? "text-emerald-300" : "text-white/55";
        return (
          <div
            key={t.label}
            className="rounded-[16px] border border-reps-border bg-reps-panel p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/55">
                {t.label}
              </span>
              <Icon className="h-4 w-4 text-white/45" />
            </div>
            <div className="mt-2 font-display text-[24px] font-bold leading-none text-white">
              {isLoading && !data ? "—" : t.value}
            </div>
            <div className={cn("mt-2 flex items-center gap-1 text-[12px] font-medium", trendCls)}>
              {TrendIcon ? <TrendIcon className="h-3.5 w-3.5" /> : null}
              <span>{t.delta}</span>
            </div>
          </div>
        );
      })}
    </div>
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
  const fetchShopFront = useServerFn(getMyShopFront);
  const fetchTrust = useServerFn(getTrustState);
  const fetchDiscoverability = useServerFn(getDiscoverabilityKpis);

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
  const shopFront = useQuery({
    queryKey: ["shop-front", "mine"],
    queryFn: () => fetchShopFront(),
    enabled,
  });
  const trust = useQuery({
    queryKey: ["my-trust-state"],
    queryFn: () => fetchTrust(),
    enabled,
  });
  const discoverability = useQuery({
    queryKey: ["my-discoverability-kpis"],
    queryFn: () => fetchDiscoverability(),
    enabled,
    staleTime: 60_000,
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
    shopFront,
    trust,
    discoverability,
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
