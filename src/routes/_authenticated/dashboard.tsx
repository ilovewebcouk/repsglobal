import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  CheckCircle2,
  Circle,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserPen,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RepsWordmark } from "@/components/brand/RepsWordmark";
import { TIERS } from "@/lib/billing";
import { getDashboardStatus } from "@/lib/dashboard/dashboard.functions";
import {
  createPortalSession,
  syncMySubscription,
} from "@/lib/billing/billing.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: (raw: Record<string, unknown>) => ({
    billing: typeof raw.billing === "string" ? raw.billing : undefined,
  }),
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
  const fetchStatus = useServerFn(getDashboardStatus);
  const openPortal = useServerFn(createPortalSession);
  const syncSub = useServerFn(syncMySubscription);
  const queryClient = useQueryClient();
  const { billing } = Route.useSearch();
  const navigate = Route.useNavigate();

  const status = useQuery({
    queryKey: ["dashboard-status"],
    queryFn: () => fetchStatus(),
  });

  const portalMutation = useMutation({
    mutationFn: () => openPortal({ data: undefined }),
    onSuccess: (res) => {
      if (res?.url) window.location.href = res.url;
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => syncSub({ data: undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-status"] });
    },
  });

  // Recovery path: if the user just returned from Stripe Checkout and the
  // webhook hasn't landed yet, sync the subscription from Stripe directly.
  React.useEffect(() => {
    if (billing === "success") {
      syncMutation.mutate();
      navigate({ search: { billing: undefined }, replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      cta: { label: hasPaidTier ? "Manage billing" : "Choose plan", to: "/dashboard/start" },
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

  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <header className="border-b border-reps-border/40">
        <div className="mx-auto flex h-[72px] max-w-[1100px] items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <RepsWordmark className="h-[24px] text-white" />
          </Link>
          <div className="flex items-center gap-3 text-sm text-white/60">
            <Link to="/dashboard-demo" className="hover:text-white">
              Demo dashboard
            </Link>
            {data?.isAdmin && (
              <Link to="/admin" className="hover:text-white">
                Admin
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[920px] px-6 py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[32px] leading-[1.05] text-white">
              Welcome to REPS
            </h1>
            <p className="mt-2 text-[15px] text-white/65">
              {hasPaidTier
                ? "Let's get your profile live."
                : "Choose a plan to start the onboarding."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={
                isVerified
                  ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                  : "border-reps-border bg-reps-panel/20 text-white/60"
              }
            >
              {isVerified ? (
                <>
                  <BadgeCheck className="size-3.5" /> Verified
                </>
              ) : submissionStatus === "submitted" ? (
                <>
                  <Clock className="size-3.5" /> In review
                </>
              ) : (
                "Not verified"
              )}
            </Badge>
            <Badge
              className={
                hasPaidTier
                  ? "border-reps-orange/40 bg-reps-orange/15 text-reps-orange"
                  : "border-reps-border bg-reps-panel/20 text-white/60"
              }
            >
              {hasPaidTier ? TIERS[subTier as "verified" | "pro"]?.label ?? subTier : "No plan"}
            </Badge>
          </div>
        </div>

        {status.isLoading ? (
          <div className="flex items-center gap-2 text-white/60">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : (
          <ol className="space-y-3">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <li key={step.key}>
                  <Card
                    className={`rounded-[18px] border ${
                      step.current
                        ? "border-reps-orange/40 bg-reps-panel/30"
                        : step.done
                          ? "border-emerald-400/20 bg-reps-panel/15"
                          : "border-reps-border bg-reps-panel/10"
                    }`}
                  >
                    <CardContent className="flex items-center gap-4 p-5">
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                          step.done
                            ? "bg-emerald-500/15 text-emerald-300"
                            : step.current
                              ? "bg-reps-orange/15 text-reps-orange"
                              : "bg-reps-panel/30 text-white/40"
                        }`}
                      >
                        {step.done ? (
                          <CheckCircle2 className="size-5" />
                        ) : (
                          <Icon className="size-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] uppercase tracking-wider text-white/40">
                            Step {i + 1}
                          </span>
                          {step.done && (
                            <Badge className="border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
                              Done
                            </Badge>
                          )}
                        </div>
                        <h2 className="mt-1 font-display text-[18px] text-white">
                          {step.title}
                        </h2>
                        <p className="mt-1 text-[13.5px] text-white/60">{step.desc}</p>
                      </div>
                      <Button
                        asChild
                        variant={step.current ? "default" : "outline"}
                        size="sm"
                      >
                        <Link to={step.cta.to}>{step.cta.label}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ol>
        )}

        {data?.profile?.slug && isPublished && (
          <div className="mt-8 flex items-center justify-between rounded-[18px] border border-emerald-400/20 bg-emerald-500/5 px-5 py-4">
            <div>
              <p className="text-[14px] text-white">Your public page is live.</p>
              <p className="text-[12.5px] text-white/55">reps.uk/pro/{data.profile.slug}</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link
                to="/pro/$slug"
                params={{ slug: data.profile.slug }}
                target="_blank"
              >
                Visit <ExternalLink className="size-3.5" />
              </Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
