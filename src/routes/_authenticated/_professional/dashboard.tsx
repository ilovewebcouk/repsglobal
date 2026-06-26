import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DashboardButton } from "@/components/dashboard/ui";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";
import { TIERS } from "@/lib/billing";
import { getDashboardStatus } from "@/lib/dashboard/dashboard.functions";
import { syncMySubscription } from "@/lib/billing/billing.functions";
import { getStripeEnvironment } from "@/lib/billing/stripe-client";
import { profileCompleteness } from "@/lib/dashboard/profileCompleteness";

import {
  ActivityTimeline,
  CompletenessCard,
  CpdMini,
  KpiStrip,
  NeedsAttentionHero,
  ProUpsellStrip,
  ReviewsSnapshot,
  ServicesStrip,
  VerificationStatusCard,
  WelcomeBanner,
  useHubData,
} from "@/components/dashboard/hub";

export const Route = createFileRoute("/_authenticated/_professional/dashboard")({
  validateSearch: (raw: Record<string, unknown>) => ({
    billing: typeof raw.billing === "string" ? raw.billing : undefined,
  }),
  head: () => ({ meta: [{ title: "Dashboard — REPS" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const tier = useTrainerTier();
  const fetchStatus = useServerFn(getDashboardStatus);
  const syncSub = useServerFn(syncMySubscription);
  const qc = useQueryClient();
  const { billing } = Route.useSearch();
  const navigate = Route.useNavigate();

  const status = useQuery({
    queryKey: ["dashboard-status"],
    queryFn: () => fetchStatus(),
  });

  const syncMutation = useMutation({
    mutationFn: () => syncSub({ data: { environment: getStripeEnvironment() } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard-status"] }),
  });

  React.useEffect(() => {
    if (billing === "success") {
      syncMutation.mutate();
      navigate({ search: { billing: undefined }, replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billing]);

  const data = status.data;
  const enabled = !!data;
  const hub = useHubData(enabled);

  const subTier = data?.subscription?.tier ?? "free";
  const hasPaidTier = subTier === "verified" || subTier === "pro" || subTier === "studio";

  const isPublished = data?.profile?.is_published ?? false;
  const hasProAccess = data?.entitlement.hasProAccess ?? false;
  const slug = data?.profile?.slug ?? null;
  const insuranceUntil = data?.profile?.insurance_valid_until ?? null;
  const hasQualifications = !!data?.profile?.cert_uploaded_at;

  const insuranceDays = React.useMemo(() => {
    if (!insuranceUntil) return null;
    const diff = +new Date(insuranceUntil) - Date.now();
    return Math.ceil(diff / 86_400_000);
  }, [insuranceUntil]);
  const insuranceExpired = insuranceDays !== null && insuranceDays < 0;
  const insuranceExpiringDays =
    insuranceDays !== null && insuranceDays >= 0 ? insuranceDays : null;

  const tierLabel = hasPaidTier
    ? (TIERS[subTier as "verified" | "pro"]?.label ?? subTier)
    : "No plan";
  const memberName =
    data?.identity?.full_name ?? data?.identity?.business_name ?? "REPS member";
  const firstName = memberName.split(" ")[0];

  const enqStats = hub.enqStats.data;
  const profilePct = hub.profile.data ? profileCompleteness(hub.profile.data).pct : 0;
  const reviewKpis = hub.reviewKpis.data;
  const services = hub.shopFront.data?.services ?? [];
  const enquiries = hub.enquiries.data ?? [];
  const reviews = hub.reviews.data ?? [];
  const hasActivity = enquiries.length + reviews.length > 0;
  const publicUrl = slug ? `/pro/${slug}` : null;

  const greeting = useGreeting();

  return (
    <DashboardShell
      role="trainer"
      active="Dashboard"
      title={`${greeting}, ${firstName}`}
      subtitle="Your REPS public presence — at a glance."
      tier={tier}
      member={{
        name: memberName,
        avatarUrl: data?.identity?.avatar_url,
        headline: data?.profile?.headline,
        tierLabel,
      }}
      actions={
        <div className="flex items-center gap-2">
          <DashboardButton asChild size="sm" variant="primary">
            <Link to="/dashboard/reviews">Request a review</Link>
          </DashboardButton>
        </div>
      }
    >
      {status.isLoading ? (
        <div className="flex flex-col gap-5">
          <Skeleton className="h-[120px] w-full rounded-[22px]" />
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
            <Skeleton className="h-[260px] rounded-[22px] xl:col-span-8" />
            <Skeleton className="h-[260px] rounded-[22px] xl:col-span-4" />
          </div>
        </div>
      ) : status.isError ? (
        <Alert className="border-reps-border bg-reps-panel">
          <AlertDescription className="flex items-center justify-between gap-4">
            We couldn't load your dashboard.
            <DashboardButton variant="ghost" size="sm" onClick={() => status.refetch()}>
              Try again
            </DashboardButton>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="flex flex-col gap-5">
          {/* 1 — Profile status (hero) */}
          <WelcomeBanner
            name={memberName}
            avatarUrl={data?.identity?.avatar_url}
            headline={data?.profile?.headline}
            tierLabel={tierLabel}
            isPublished={isPublished}
            slug={slug}
            trust={hub.trust.data ?? null}
            dailyViews={hub.discoverability.data?.daily_views ?? null}
          />

          {/* 2 — Main fold: Needs Attention (left, hero) + Trust rail (right) */}
          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-12">
            <div className="flex flex-col gap-5 xl:col-span-8">
              <NeedsAttentionHero
                unreadEnquiries={enqStats?.unread ?? 0}
                pendingReviewReplies={hub.pendingReviewReplies}
                unreadSupport={hub.supportUnread}
                insuranceExpiringDays={insuranceExpiringDays}
                insuranceExpired={insuranceExpired}
                profilePct={profilePct}
                isPublished={isPublished}
                trust={hub.trust.data ?? null}
                hasServices={services.length > 0}
                reviewsCount={reviewKpis?.review_count ?? 0}
                publicUrl={publicUrl}
              />

              {/* KPI strip — hidden entirely when all zero */}
              <KpiStrip
                enqStats={enqStats}
                reviewKpis={reviewKpis}
                discoverability={hub.discoverability.data ?? null}
              />
            </div>

            {/* Trust rail */}
            <aside className="flex flex-col gap-5 xl:col-span-4">
              <CompletenessCard profile={hub.profile.data ?? null} />
              <VerificationStatusCard trust={hub.trust.data ?? null} />
              {(reviewKpis?.review_count ?? 0) > 0 ? (
                <ReviewsSnapshot kpis={reviewKpis} />
              ) : null}
              {(hub.trust.data?.qualifications.count ?? 0) > 0 || hasQualifications ? (
                <CpdMini
                  qualUploaded={hasQualifications}
                  uploadedAt={data?.profile?.cert_uploaded_at ?? null}
                  trust={hub.trust.data ?? null}
                />
              ) : null}
            </aside>
          </div>

          {/* 3 — Lower sections (only when there's something real to show) */}
          {services.length > 0 ? <ServicesStrip services={services} /> : null}
          {hasActivity ? (
            <ActivityTimeline enquiries={enquiries} reviews={reviews} />
          ) : null}

          {/* 4 — Quiet Pro upsell (Verified only) */}
          {!hasProAccess ? <ProUpsellStrip /> : null}
        </div>
      )}
    </DashboardShell>
  );
}

function useGreeting() {
  const h = new Date().getHours();
  if (h < 5) return "Hello";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
