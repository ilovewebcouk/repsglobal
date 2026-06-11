import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  ShieldCheck,
  Sparkles,
  UserPen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { TIERS } from "@/lib/billing";
import { getDashboardStatus } from "@/lib/dashboard/dashboard.functions";
import { syncMySubscription } from "@/lib/billing/billing.functions";
import { ManageBillingButton } from "@/components/billing/ManageBillingButton";

import {
  KpiRow,
  ScheduleAndAi,
  PerformanceRow,
  RevenueRow,
  SpotlightRow,
  BottomRow,
  DashboardFooter
} from "@/components/dashboard/DashboardDemoContent";

export const Route = createFileRoute("/_authenticated/_professional/dashboard")({
  validateSearch: (raw: Record<string, unknown>) => ({
    billing: typeof raw.billing === "string" ? raw.billing : undefined,
  }),
  // Auth + professional-role + paid-tier are all enforced by the parent
  // _authenticated and _professional layouts. No child gate needed.
  head: () => ({ meta: [{ title: "Dashboard — REPS" }] }),
  component: DashboardPage,
});

type Step = {
  key: string;
  title: string;
  desc: string;
  done: boolean;
  current: boolean;
  cta: { label: string; to: string };
  icon: typeof BadgeCheck;
};

function DashboardPage() {
  const tier = useTrainerTier();
  const fetchStatus = useServerFn(getDashboardStatus);
  const syncSub = useServerFn(syncMySubscription);
  const queryClient = useQueryClient();
  const { billing } = Route.useSearch();
  const navigate = Route.useNavigate();

  const status = useQuery({
    queryKey: ["dashboard-status"],
    queryFn: () => fetchStatus(),
  });

  const syncMutation = useMutation({
    mutationFn: () => syncSub({ data: undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-status"] });
    },
  });

  React.useEffect(() => {
    if (billing === "success") {
      syncMutation.mutate();
      navigate({ search: { billing: undefined }, replace: true });
    }
  }, [billing]);

  const data = status.data;
  const subTier = data?.subscription?.tier ?? "free";
  const hasPaidTier = subTier === "verified" || subTier === "pro" || subTier === "studio";
  const verificationStatus = data?.profile?.verification_status ?? "pending";
  const isVerified = verificationStatus === "verified";
  const submissionStatus = data?.lastSubmission?.status;
  const hasSubmission = !!data?.lastSubmission;
  const profileComplete = data?.profileComplete ?? false;
  const isPublished = data?.profile?.is_published ?? false;
  const hasProAccess = data?.entitlement.hasProAccess ?? false;

  const sub = data?.subscription;
  const renewsAt = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const steps: Step[] = [
    {
      key: "plan",
      title: "Choose your plan",
      desc: "Pick Verified or Pro Founding to unlock your listing.",
      done: hasPaidTier,
      current: !hasPaidTier,
      cta: { label: hasPaidTier ? "Manage billing" : "Choose plan", to: "/pricing" },
      icon: Sparkles,
    },
    {
      key: "profile",
      title: "Complete your profile",
      desc: "Name, headline, bio, specialisms, city — what clients see.",
      done: profileComplete,
      current: hasPaidTier && !profileComplete,
      cta: { label: profileComplete ? "Edit profile" : "Fill in profile", to: "/dashboard/profile-edit" },
      icon: UserPen,
    },
    {
      key: "credentials",
      title: "Submit credentials",
      desc: "Upload your qualifications so we can verify you.",
      done: isVerified,
      current: hasPaidTier && profileComplete && !isVerified,
      cta: {
        label: hasSubmission ? "View submission" : "Submit credentials",
        to: "/dashboard/verification",
      },
      icon: FileText,
    },
    {
      key: "publish",
      title: "Publish your listing",
      desc: "Go live on the REPS register so clients can find you.",
      done: isPublished,
      current: isVerified && !isPublished,
      cta: { label: isPublished ? "View live page" : "Publish profile", to: "/dashboard/profile-edit" },
      icon: ShieldCheck,
    },
  ];

  const completedCount = steps.filter((step) => step.done).length;
  const [onboardingOpen, setOnboardingOpen] = React.useState(false);
  React.useEffect(() => {
    if (!data || data.onboarding.complete) return;
    const key = `reps-onboarding-dismissed:${data.userId}`;
    setOnboardingOpen(sessionStorage.getItem(key) !== "1");
  }, [data]);

  const closeOnboarding = (open: boolean) => {
    setOnboardingOpen(open);
    if (!open && data && !data.onboarding.complete) {
      sessionStorage.setItem(`reps-onboarding-dismissed:${data.userId}`, "1");
    }
  };

  const tierLabel = hasPaidTier ? TIERS[subTier as "verified" | "pro"]?.label ?? subTier : "No plan";
  const memberName = data?.identity?.full_name ?? data?.profile?.trading_name ?? "REPS member";

  const statusData = {
    isVerified,
    hasInsurance: !!data?.profile?.insurance_valid_until,
    insuranceDetail: data?.profile?.insurance_valid_until ? `Valid until ${new Date(data.profile.insurance_valid_until).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : "Not uploaded",
    qualCount: data?.profile?.cert_uploaded_at ? "Uploaded" : "Not uploaded"
  };

  return (
    <DashboardShell role="trainer"
      active="Dashboard"
      title={`Welcome back, ${memberName.split(" ")[0]}`}
      subtitle={hasProAccess ? "Your business overview." : "Your professional status and Pro workspace preview."}
      tier={tier}
      member={{ name: memberName, avatarUrl: data?.identity?.avatar_url, headline: data?.profile?.headline, tierLabel }}
      actions={data && !data.onboarding.complete ? (
        <Button variant="outline" size="sm" onClick={() => setOnboardingOpen(true)}>
          <CheckCircle2 className="mr-2 h-4 w-4" /> Finish setup · {completedCount}/4
        </Button>
      ) : undefined}
    >
      {status.isLoading ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-32 rounded-[16px]" />)}
          </div>
          <Skeleton className="h-[400px] w-full rounded-[16px]" />
        </div>
      ) : status.isError ? (
        <Alert className="border-reps-border bg-reps-panel">
          <AlertDescription className="flex items-center justify-between gap-4">
            We couldn’t load your dashboard status.
            <Button variant="outline" size="sm" onClick={() => status.refetch()}>Try again</Button>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatusCard label="Membership" value={tierLabel} detail={renewsAt ? `Renews ${renewsAt}` : sub?.status ?? "Choose a plan"} icon={CreditCard} />
            <StatusCard label="Verification" value={isVerified ? "Verified" : submissionStatus === "submitted" ? "In review" : "Not verified"} detail={data?.profile?.reps_level?.replace("_", " ") ?? "Credentials pending"} icon={BadgeCheck} positive={isVerified} />
            <StatusCard label="Public listing" value={isPublished ? "Live" : "Draft"} detail={data?.profile?.slug ? `/pro/${data.profile.slug}` : "Complete your profile"} icon={ShieldCheck} positive={isPublished} />
            <StatusCard label="Setup progress" value={`${completedCount} of 4`} detail={data?.onboarding.complete ? "Complete" : "Finish setup to go live"} icon={CheckCircle2} positive={data?.onboarding.complete} />
          </div>

          <KpiRow isLocked />
          <ScheduleAndAi isLocked statusData={statusData} />
          <PerformanceRow isLocked />
          <RevenueRow isLocked />
          <SpotlightRow isLocked />
          <BottomRow isLocked />

          {data?.profile?.slug && isPublished ? (
            <Alert className="mt-4 border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
              <AlertDescription className="flex items-center justify-between gap-4">
                Your public page is live.
                <Button asChild variant="outline" size="sm"><Link to="/pro/$slug" params={{ slug: data.profile.slug }} target="_blank">Visit <ExternalLink className="ml-2 h-4 w-4" /></Link></Button>
              </AlertDescription>
            </Alert>
          ) : null}

          <DashboardFooter />
        </div>
      )}

      <Dialog open={onboardingOpen} onOpenChange={closeOnboarding}>
        <DialogContent className="max-w-[620px] rounded-[22px] border-reps-border bg-reps-midnight text-reps-text">
          <DialogHeader>
            <DialogTitle className="font-display text-[24px] text-white">Finish setting up REPS</DialogTitle>
            <DialogDescription>{completedCount} of 4 steps complete. You can close this and return from the dashboard header.</DialogDescription>
          </DialogHeader>
          <ol className="flex flex-col gap-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isManageBilling = step.key === "plan" && hasPaidTier;
              return (
                <li key={step.key} className="flex items-center gap-4 rounded-[16px] border border-reps-border bg-reps-panel p-4">
                  <div className={step.done ? "flex size-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300" : "flex size-10 items-center justify-center rounded-full bg-reps-orange-soft text-reps-orange"}>
                    {step.done ? <CheckCircle2 /> : <Icon />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-wider text-white/45">Step {index + 1}</p>
                    <h2 className="font-display text-[16px] text-white">{step.title}</h2>
                    <p className="text-[12.5px] text-white/55">{step.desc}</p>
                  </div>
                  {isManageBilling ? (
                    <ManageBillingButton size="sm" label="Manage billing" />
                  ) : (
                    <Button asChild variant={step.current ? "default" : "outline"} size="sm"><Link to={step.cta.to}>{step.cta.label}</Link></Button>
                  )}
                </li>
              );
            })}
          </ol>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

function StatusCard({ label, value, detail, icon: Icon, positive = false }: { label: string; value: string; detail: string; icon: typeof BadgeCheck; positive?: boolean }) {
  return (
    <Card className="rounded-[16px] border-reps-border bg-reps-panel shadow-none">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-white/55">{label}</p>
          <Icon className={positive ? "size-4 text-emerald-300" : "size-4 text-reps-orange"} />
        </div>
        <p className="mt-3 font-display text-[22px] text-white">{value}</p>
        <p className="mt-1 text-[11px] text-white/45">{detail}</p>
      </CardContent>
    </Card>
  );
}
