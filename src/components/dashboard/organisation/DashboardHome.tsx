import * as React from "react";
import { Link , getRouteApi } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Inbox, MessageCircleQuestion, Star } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DashboardButton } from "@/components/dashboard/ui";
import { KpiTile } from "@/components/dashboard/primitives";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";
import { TIERS } from "@/lib/billing";
import { getDashboardStatus } from "@/lib/dashboard/dashboard.functions";
import { syncMySubscription } from "@/lib/billing/billing.functions";
import { getStripeEnvironment } from "@/lib/billing/stripe-client";


import {
  ActivityTimeline,
  CompletenessCard,
  CpdMini,
  NeedsAttention,
  ProviderNeedsAttention,
  ProviderReadinessCard,
  ProUpsellStrip,
  ReviewsSnapshot,
  VerificationStatusCard,
  WelcomeBanner,
  useHubData,
} from "@/components/dashboard/hub";
import { ProviderWelcomeBanner } from "@/components/dashboard/organisation/ProviderWelcomeBanner";

import { DashboardVerificationBanner } from "@/components/dashboard/DashboardVerificationBanner";


const routeApi = getRouteApi("/_authenticated/_professional/dashboard");

export function ProviderDashboardHome() {
  const tier = useTrainerTier();
  const fetchStatus = useServerFn(getDashboardStatus);
  const syncSub = useServerFn(syncMySubscription);
  const qc = useQueryClient();
  const { billing } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();

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
      navigate({ search: { billing: undefined } as any, replace: true });
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

  const isOrganisation =
    data?.accountType === "training_provider" || tier === "training_provider";
  const tierLabel = isOrganisation
    ? "Training provider"
    : hasPaidTier
      ? (TIERS[subTier as "verified" | "pro"]?.label ?? subTier)
      : "No plan";
  const tradingName =
    (data?.identity?.full_name && data.identity.full_name.trim()) || "REPS member";
  const verifiedName =
    (data?.profile as { identity_verified_name?: string | null } | null | undefined)
      ?.identity_verified_name?.trim() || null;
  const identityApproved =
    (data?.profile as { identity_status?: string | null } | null | undefined)
      ?.identity_status === "approved";
  const memberName = tradingName;
  // Provider greeting: trading name until Stripe Identity is approved,
  // then swap to the first name from the verified legal name.
  const greetName =
    identityApproved && verifiedName
      ? verifiedName.split(/\s+/)[0]
      : tradingName;

  const enqStats = hub.enqStats.data;
  const reviewKpis = hub.reviewKpis.data;

  const greeting = useGreeting();

  return (
    <DashboardShell
      role="trainer"
      active="Dashboard"
      title={`${greeting}, ${firstName}`}
      subtitle={hasProAccess ? "Your business overview." : "Your REPS command center."}
      tier={tier}
      member={{
        name: memberName,
        avatarUrl: data?.identity?.avatar_url,
        headline: data?.website?.tagline ?? null,
        tierLabel,
      }}

      actions={
        isOrganisation ? null : (
          <div className="flex items-center gap-2">
            {slug ? (
              <DashboardButton asChild size="sm" variant="ghost">
                <Link to="/c/$slug" params={{ slug }} target="_blank">
                  View public profile
                  <ExternalLink className="ml-1.5 size-4" />
                </Link>
              </DashboardButton>
            ) : null}
            <DashboardButton asChild size="sm" variant="primary">
              <Link to="/dashboard/reviews">Request a review</Link>
            </DashboardButton>
          </div>
        )
      }
    >
      {status.isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-[110px] w-full rounded-[22px]" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[100px] rounded-[16px]" />
            ))}
          </div>
          <Skeleton className="h-[260px] w-full rounded-[22px]" />
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
      ) : isOrganisation ? (
        <div className="flex flex-col gap-4">
          <ProviderWelcomeBanner
            name={memberName}
            avatarUrl={data?.identity?.avatar_url}
            headline={data?.website?.tagline ?? null}
            tierLabel={tierLabel}
            isPublished={isPublished}
            slug={slug}
            trust={hub.trust.data ?? null}
            heroUrl={hub.website.data?.website?.hero_image_url ?? null}
          />

          <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
            <div className="min-h-[340px] xl:col-span-8">
              <ProviderNeedsAttention
                unreadEnquiries={enqStats?.unread ?? 0}
                pendingReviewReplies={hub.pendingReviewReplies}
                unreadSupport={hub.supportUnread}
                providerReadiness={hub.providerReadiness.data ?? null}
              />
            </div>
            <div className="min-h-[340px] xl:col-span-4">
              <ProviderReadinessCard providerReadiness={hub.providerReadiness.data ?? null} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* ROW 0 — Verification banner */}
          <DashboardVerificationBanner />

          {/* ROW 1 — Welcome */}
          <WelcomeBanner
            name={memberName}
            avatarUrl={data?.identity?.avatar_url}
            headline={data?.website?.tagline ?? null}
            tierLabel={tierLabel}
            isPublished={isPublished}
            slug={slug}
            trust={hub.trust.data ?? null}
          />

          {/* ROW 2 — KPI strip */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiTile
              label="New enquiries"
              value={enqStats ? String(enqStats.this_month_count) : "—"}
              delta={enqStats ? `${enqStats.unread} unread` : undefined}
              trend={enqStats && enqStats.unread > 0 ? "up" : "flat"}
              icon={Inbox}
            />
            <KpiTile
              label="Reply rate (30d)"
              value={enqStats?.reply_rate_pct != null ? `${enqStats.reply_rate_pct}%` : "—"}
              delta={
                enqStats?.reply_time_avg_hours != null
                  ? `${enqStats.reply_time_avg_hours.toFixed(1)}h avg`
                  : undefined
              }
              icon={MessageCircleQuestion}
            />
            <KpiTile
              label="Avg rating"
              value={
                reviewKpis && reviewKpis.review_count > 0
                  ? reviewKpis.avg_rating.toFixed(1)
                  : "—"
              }
              delta={
                reviewKpis ? `${reviewKpis.review_count} total` : undefined
              }
              icon={Star}
            />
            <KpiTile
              label="Last 30 days"
              value={reviewKpis ? String(reviewKpis.last_30d_count) : "—"}
              delta={
                reviewKpis && reviewKpis.last_30d_count > 0
                  ? `${reviewKpis.last_30d_avg.toFixed(1)} avg`
                  : "no new reviews"
              }
              trend={reviewKpis && reviewKpis.last_30d_count > 0 ? "up" : "flat"}
              icon={Star}
            />
          </div>

          {/* ROW 3 — Needs attention + Completeness */}
          <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
            <div className="min-h-[340px] xl:col-span-8">
              <NeedsAttention
                unreadEnquiries={enqStats?.unread ?? 0}
                pendingReviewReplies={hub.pendingReviewReplies}
                unreadSupport={hub.supportUnread}
                insuranceExpiringDays={insuranceExpiringDays}
                insuranceExpired={insuranceExpired}
                readiness={hub.readiness.data ?? null}
                trust={hub.trust.data ?? null}
              />
            </div>
            <div className="min-h-[340px] xl:col-span-4">
              <CompletenessCard readiness={hub.readiness.data ?? null} />
            </div>
          </div>

          {/* ROW 4 — Activity + Verification */}
          <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
            <div className="min-h-[320px] xl:col-span-8">
              {hub.enquiries.isLoading || hub.reviews.isLoading ? (
                <Skeleton className="h-full w-full rounded-[22px]" />
              ) : (
                <ActivityTimeline
                  enquiries={hub.enquiries.data ?? []}
                  reviews={hub.reviews.data ?? []}
                />
              )}
            </div>
            <div className="min-h-[320px] xl:col-span-4">
              <VerificationStatusCard trust={hub.trust.data ?? null} />
            </div>
          </div>

          {/* ROW 5 — CPD + Reviews snapshot */}
          <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
            <div className="min-h-[300px] xl:col-span-8">
              <CpdMini
                qualUploaded={hasQualifications}
                uploadedAt={data?.profile?.cert_uploaded_at ?? null}
                trust={hub.trust.data ?? null}
              />
            </div>
            <div className="min-h-[300px] xl:col-span-4">
              <ReviewsSnapshot kpis={reviewKpis} />
            </div>
          </div>


          {/* ROW 6 — Pro upsell (Verified only) */}
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
