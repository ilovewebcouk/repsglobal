// Admin Member 360 — sticky header, action bar, 7-tab workbench.
// Restyled to match the REPs dark admin palette (panel/40 surfaces,
// border-reps-border, reps-orange accents) rather than shadcn defaults.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ExternalLink,
  Mail,
  ShieldCheck,
  User as UserIcon,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  CalendarX,
  Ban,
  Undo2,
} from "lucide-react";

import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

import { getMember360, type Member360Snapshot } from "@/lib/admin/member360.functions";

import { getMemberTimeline } from "@/lib/ops/timeline.functions";
import {
  endMemberTrialNow,
  setMemberCancelAtPeriodEnd,
  cancelMemberSubscriptionNow,
} from "@/lib/admin/billing-actions.functions";
import { SourcePill, SOURCE_DOT_CLASSES } from "@/components/ops/source-pill";

export const Route = createFileRoute("/admin_/members/$userId")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({ meta: [{ title: "Member 360 — REPS Admin" }] }),
  component: MemberPage,
});

/* ───────────────────────── Tokens ───────────────────────── */

const PANEL = "rounded-[18px] border border-reps-border bg-reps-panel/40";
const PANEL_HEADER = "px-5 pt-5 pb-3";
const PANEL_BODY = "px-5 pb-5";
const PANEL_TITLE = "text-[15px] font-semibold text-white";
const PANEL_DESC = "mt-1 text-[13px] text-white/55";
const LABEL = "text-[11px] uppercase tracking-wide text-white/50";

/* ───────────────────────── Helpers ───────────────────────── */

function initialsOf(name: string | null, email: string | null) {
  const src = (name?.trim() || email?.split("@")[0] || "?").trim();
  return src
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtMoney(pence: number | null | undefined, currency: string | null | undefined) {
  if (pence == null) return "—";
  const sym = currency?.toLowerCase() === "gbp" ? "£" : (currency?.toUpperCase() ?? "");
  return `${sym}${(pence / 100).toFixed(2)}`;
}

/* ───────────────────────── Page ───────────────────────── */

function MemberPage() {
  const { userId } = Route.useParams();
  const getSnap = useServerFn(getMember360);
  const getTimeline = useServerFn(getMemberTimeline);

  const snap = useQuery({
    queryKey: ["admin-member-360", userId],
    queryFn: () => getSnap({ data: { user_id: userId } }),
  });

  const timeline = useQuery({
    queryKey: ["admin-member-timeline", userId],
    queryFn: () => getTimeline({ data: { user_id: userId, limit: 200 } }),
  });

  return (
    <DashboardShell role="admin" active="Professionals" title="Member 360" subtitle="One workbench for every member action.">
      <div className="flex flex-col gap-6 p-6">
        <StickyHeader snapshot={snap.data} loading={snap.isLoading} />

        <Tabs defaultValue="overview" className="flex flex-col gap-5">
          <div className="sticky top-[112px] z-10 -mx-6 border-b border-reps-border bg-reps-ink/85 px-6 py-2 backdrop-blur-md">
            <TabsList className="flex h-10 w-full flex-wrap justify-start gap-1 rounded-[12px] border border-reps-border bg-reps-panel/40 p-1">
              {[
                { v: "overview", l: "Overview" },
                { v: "billing", l: "Billing" },
                { v: "verification", l: "Verification" },
                { v: "profile", l: "Profile" },
                { v: "reviews", l: "Reviews" },
                { v: "activity", l: "Activity" },
                { v: "notes", l: "Notes" },
              ].map(({ v, l }) => (
                <TabsTrigger
                  key={v}
                  value={v}
                  className="h-8 rounded-[10px] px-3 text-[13px] font-medium text-white/65 data-[state=active]:bg-reps-panel-soft data-[state=active]:text-white"
                >
                  {l}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="overview" className="flex flex-col gap-4">
            {snap.data ? <OverviewPane snapshot={snap.data} /> : <PaneSkeleton />}
          </TabsContent>

          <TabsContent value="billing" className="flex flex-col gap-4">
            {snap.data ? <BillingPane snapshot={snap.data} userId={userId} /> : <PaneSkeleton />}
          </TabsContent>

          <TabsContent value="verification" className="flex flex-col gap-4">
            {snap.data ? <VerificationPane snapshot={snap.data} /> : <PaneSkeleton />}
          </TabsContent>

          <TabsContent value="profile">
            <SoonEmpty
              title="Inline profile editing"
              description="Edit name, slug, bio, services and avatar in place — without leaving the workbench."
            />
          </TabsContent>

          <TabsContent value="reviews">
            <SoonEmpty
              title="Reviews for this member"
              description="See every review they've received, their average rating, and any pending moderation."
            />
          </TabsContent>

          <TabsContent value="activity" className="flex flex-col gap-4">
            <ActivityPane data={timeline.data} loading={timeline.isLoading} />
          </TabsContent>

          <TabsContent value="notes">
            <SoonEmpty
              title="Internal admin notes"
              description="Pin context for the next admin who looks at this member — visible only to the team."
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}


/* ───────────────────────── Sticky header ───────────────────────── */



function StickyHeader({ snapshot, loading }: { snapshot: Member360Snapshot | undefined; loading: boolean }) {
  if (loading || !snapshot) {
    return (
      <div className="sticky top-0 z-20 -mx-6 border-b border-reps-border bg-reps-ink/85 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Skeleton className="size-14 rounded-full bg-reps-panel/60" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-48 bg-reps-panel/60" />
            <Skeleton className="h-4 w-72 bg-reps-panel/60" />
          </div>
        </div>
      </div>
    );
  }

  const { full_name, email, slug, verification, subscription, avatar_url, profession } = snapshot;
  const sub = subscription;
  const tierLbl = sub.tier_label;
  const status = sub.status;
  const publicHref = slug ? `/c/${slug}` : null;
  // "Send email" routes through /admin/campaigns so outbound is tracked
  // end-to-end (drafts, schedule, delivery). Never use `mailto:` — that
  // bypasses Mailgun, tracking, tone-locked templates, and audit trail.

  

  return (
    <div className="sticky top-0 z-20 -mx-6 border-b border-reps-border bg-reps-ink/85 px-6 py-4 backdrop-blur-md shadow-[0_8px_24px_-12px_rgba(0,0,0,0.55)]">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar className="size-14 ring-1 ring-reps-border">
          {avatar_url && <AvatarImage src={avatar_url} alt={full_name ?? "Member avatar"} />}
          <AvatarFallback className="bg-reps-orange/15 text-base font-semibold text-reps-orange">
            {initialsOf(full_name, email)}
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <h2 className="truncate text-lg font-semibold text-white">{full_name ?? "Unnamed member"}</h2>
            {profession && <span className="truncate text-sm text-white/55">{profession}</span>}
          </div>
          <div className="truncate text-[13px] text-white/45">{email ?? "no email on file"}</div>
          <div className="flex flex-wrap items-center gap-1.5">
            {tierLbl && (
              <span className="inline-flex items-center rounded-full border border-reps-orange-border bg-reps-orange/10 px-2 py-0.5 text-[11px] font-semibold text-reps-orange">
                {tierLbl}
              </span>
            )}
            {status === "trialing" && (
              <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                Trial{sub.trial_days_left != null ? ` · ${sub.trial_days_left}d left` : ""}
              </span>
            )}
            {verification === "verified" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-reps-border bg-reps-panel/60 px-2 py-0.5 text-[11px] font-semibold text-white/65">
                Unverified
              </span>
            )}
          </div>
        </div>


        <div className="flex flex-wrap items-center gap-2">
          {publicHref && (
            <Button asChild size="sm" className="h-9 rounded-[10px] bg-reps-orange text-white hover:bg-reps-orange-hover">
              <a href={publicHref} target="_blank" rel="noreferrer">
                <ExternalLink data-icon="inline-start" /> View public profile
              </a>
            </Button>
          )}
          {mailtoHref && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-9 rounded-[10px] border-reps-border bg-white/5 text-white hover:bg-reps-panel-soft hover:text-white"
            >
              <a href={mailtoHref}>
                <Mail data-icon="inline-start" /> Send email
              </a>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                aria-label="More actions"
                className="size-9 rounded-[10px] border-reps-border bg-white/5 p-0 text-white hover:bg-reps-panel-soft hover:text-white"
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-reps-border bg-reps-panel text-white">
              <DropdownMenuLabel className="text-white/55">Member actions</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-reps-border" />
              <DropdownMenuItem disabled>Login as member (soon)</DropdownMenuItem>
              <DropdownMenuItem disabled>Edit status (soon)</DropdownMenuItem>
              <DropdownMenuItem disabled>Comp this member (soon)</DropdownMenuItem>
              <DropdownMenuItem disabled>Refund last charge (soon)</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-reps-border" />
              <DropdownMenuItem disabled className="text-rose-300 focus:text-rose-200">
                Permanently delete (soon)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Panes ───────────────────────── */

function PanelHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className={PANEL_HEADER}>
      <h3 className={PANEL_TITLE}>{title}</h3>
      {description && <p className={PANEL_DESC}>{description}</p>}
    </div>
  );
}

function OverviewPane({ snapshot }: { snapshot: Member360Snapshot }) {
  const sub = snapshot.subscription;
  const hasSub = sub.source !== "none";
  const stats: { label: string; value: React.ReactNode; sub?: string }[] = [
    { label: "Tier", value: sub.tier_label ?? "—", sub: hasSub ? sub.display_status_label : "no subscription" },
    { label: "Price", value: fmtMoney(sub.unit_amount_pence, sub.currency), sub: sub.interval ? `per ${sub.interval}` : undefined },
    {
      label: sub.is_scheduled_renewal ? "Scheduled renewal" : "Next renewal",
      value: fmtDate(sub.renewal_at),
      sub: sub.cancel_at_period_end ? "cancels at period end" : undefined,
    },
    ...(sub.trial_days_left != null
      ? [{ label: "Trial", value: `${sub.trial_days_left}d left` as React.ReactNode }]
      : []),
    { label: "Joined", value: fmtDate(snapshot.created_at) },
    { label: "Last sign-in", value: fmtDate(snapshot.last_sign_in_at) },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className={PANEL}>
        <PanelHeader title="Snapshot" description="The 30-second read on this member." />
        <div className={cn(PANEL_BODY)}>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex flex-col gap-1 rounded-[12px] border border-reps-border/60 bg-reps-panel/60 px-3 py-2.5"
              >
                <span className={LABEL}>{s.label}</span>
                <span className="text-sm font-medium text-white">{s.value}</span>
                {s.sub && <span className="text-[11px] text-white/45">{s.sub}</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={PANEL}>
        <PanelHeader title="Identifiers" description="Cross-reference into Stripe and the database." />
        <div className={cn(PANEL_BODY, "flex flex-col gap-2")}>
          <IdRow label="User id" value={snapshot.user_id} />
          <IdRow
            label="Stripe customer"
            value={snapshot.stripe_customer_id}
            href={snapshot.stripe_customer_id ? `https://dashboard.stripe.com/customers/${snapshot.stripe_customer_id}` : undefined}
          />
          <IdRow
            label="Stripe subscription"
            value={sub.stripe_subscription_id}
            href={sub.stripe_subscription_id ? `https://dashboard.stripe.com/subscriptions/${sub.stripe_subscription_id}` : undefined}
          />
          <IdRow label="Public slug" value={snapshot.slug} href={snapshot.slug ? `/c/${snapshot.slug}` : undefined} internal />
        </div>
      </section>
    </div>
  );
}

function IdRow({ label, value, href, internal }: { label: string; value: string | null; href?: string; internal?: boolean }) {
  const chipClass = "rounded-[8px] bg-reps-panel-soft/70 px-2 py-1 font-mono text-[11.5px] text-reps-orange hover:bg-reps-panel-soft";
  return (
    <div className="flex items-center justify-between gap-3 rounded-[10px] px-1 py-1.5">
      <span className={LABEL}>{label}</span>
      {value ? (
        href ? (
          internal ? (
            <Link to={href} className={chipClass}>{value}</Link>
          ) : (
            <a href={href} target="_blank" rel="noreferrer" className={cn(chipClass, "inline-flex items-center gap-1")}>
              <span className="truncate">{value}</span> ↗
            </a>
          )
        ) : (
          <code className="rounded-[8px] bg-reps-panel-soft/70 px-2 py-1 text-[11.5px] text-white/80">{value}</code>
        )
      ) : (
        <span className="text-xs text-white/40">—</span>
      )}
    </div>
  );
}


function BillingPane({ snapshot, userId }: { snapshot: Member360Snapshot; userId: string }) {
  const sub = snapshot.subscription;

  if (sub.source === "none") {
    return (
      <section className={cn(PANEL, "flex flex-col items-center gap-2 px-6 py-10 text-center")}>
        <h3 className={PANEL_TITLE}>No active subscription</h3>
        <p className="max-w-md text-sm text-white/55">
          This member isn't on a paid plan right now.
        </p>
      </section>
    );
  }

  const status = sub.status ?? "unknown";
  const statusClass = cn(
    "h-6",
    sub.has_active_entitlement && status === "active" && "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
    sub.has_active_entitlement && status === "trialing" && "border-sky-400/30 bg-sky-500/15 text-sky-200",
    status === "past_due" && "border-amber-400/30 bg-amber-500/15 text-amber-300",
    (status === "canceled" || status === "unpaid") && "border-rose-400/30 bg-rose-500/15 text-rose-300",
  );

  const stats: { label: string; value: React.ReactNode; sub?: string }[] = [
    { label: "Plan", value: sub.tier_label ?? "—", sub: sub.price_lookup_key ?? undefined },
    { label: "Price", value: fmtMoney(sub.unit_amount_pence, sub.currency), sub: sub.interval ? `per ${sub.interval}` : undefined },
    {
      label: sub.is_scheduled_renewal ? "Scheduled renewal" : "Current period end",
      value: fmtDate(sub.renewal_at),
      sub: sub.cancel_at_period_end ? "cancels at period end" : undefined,
    },
    ...(sub.trial_days_left != null
      ? [{ label: "Trial", value: `${sub.trial_days_left}d left` as React.ReactNode }]
      : []),
  ];

  return (
    <section className={PANEL}>
      <div className={cn(PANEL_HEADER, "flex flex-wrap items-start justify-between gap-3")}>
        <div>
          <h3 className={PANEL_TITLE}>Current subscription</h3>
          <p className={PANEL_DESC}>The live billing position for this member.</p>
        </div>
        <Badge variant="outline" className={statusClass}>{sub.display_status_label}</Badge>
      </div>
      <div className={cn(PANEL_BODY, "flex flex-col gap-4")}>
        {sub.discrepancies.length > 0 && (
          <div className="rounded-[12px] border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[12.5px] text-amber-200">
            Stripe and our copy disagree on: {sub.discrepancies.join(", ").replace(/_/g, " ")}. Open in Stripe to reconcile.
          </div>
        )}
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col gap-1 rounded-[12px] border border-reps-border/60 bg-reps-panel/60 px-3 py-2.5"
            >
              <span className={LABEL}>{s.label}</span>
              <span className="text-sm font-medium text-white">{s.value}</span>
              {s.sub && <span className="text-[11px] text-white/45">{s.sub}</span>}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <IdRow
            label="Stripe customer"
            value={snapshot.stripe_customer_id}
            href={snapshot.stripe_customer_id ? `https://dashboard.stripe.com/customers/${snapshot.stripe_customer_id}` : undefined}
          />
          <IdRow
            label="Stripe subscription"
            value={sub.stripe_subscription_id}
            href={sub.stripe_subscription_id ? `https://dashboard.stripe.com/subscriptions/${sub.stripe_subscription_id}` : undefined}
          />
          <IdRow
            label="Price id"
            value={sub.price_id}
            href={sub.price_id ? `https://dashboard.stripe.com/prices/${sub.price_id}` : undefined}
          />
        </div>
        <BillingActions
          userId={userId}
          status={status}
          cancelAtPeriodEnd={sub.cancel_at_period_end}
          isTrialing={status === "trialing"}
          renewalAt={sub.renewal_at}
        />
      </div>
    </section>
  );
}

/* ─────────────── Billing actions ─────────────── */

type ActionKind = "end_trial" | "schedule_cancel" | "resume" | "cancel_now" | null;

function BillingActions({
  userId,
  status,
  cancelAtPeriodEnd,
  isTrialing,
  renewalAt,
}: {
  userId: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  isTrialing: boolean;
  renewalAt: string | null;
}) {
  const qc = useQueryClient();
  const endTrial = useServerFn(endMemberTrialNow);
  const setCancel = useServerFn(setMemberCancelAtPeriodEnd);
  const cancelNow = useServerFn(cancelMemberSubscriptionNow);

  const [pending, setPending] = useState<ActionKind>(null);
  const [confirm, setConfirm] = useState<ActionKind>(null);

  const canAct = status !== "canceled";
  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["admin-member-360", userId] });
    await qc.invalidateQueries({ queryKey: ["admin-member-timeline", userId] });
  };

  const run = async (kind: Exclude<ActionKind, null>) => {
    setPending(kind);
    try {
      if (kind === "end_trial") {
        await endTrial({ data: { user_id: userId } });
        toast.success("Trial ended — Stripe will attempt the first charge now.");
      } else if (kind === "schedule_cancel") {
        await setCancel({ data: { user_id: userId, cancel: true } });
        toast.success("Cancellation scheduled for period end.");
      } else if (kind === "resume") {
        await setCancel({ data: { user_id: userId, cancel: false } });
        toast.success("Cancellation removed — subscription will renew.");
      } else if (kind === "cancel_now") {
        await cancelNow({ data: { user_id: userId } });
        toast.success("Subscription canceled immediately.");
      }
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Action failed");
    } finally {
      setPending(null);
      setConfirm(null);
    }
  };

  if (!canAct) {
    return (
      <div className="rounded-[12px] border border-reps-border/60 bg-reps-panel/40 px-3 py-2 text-[12.5px] text-white/55">
        Subscription is canceled — no further billing actions available here.
      </div>
    );
  }

  const confirmCopy: Record<Exclude<ActionKind, null>, { title: string; body: string; cta: string; destructive?: boolean }> = {
    end_trial: {
      title: "End trial now?",
      body: "Stripe will end the trial immediately and attempt the first invoice on the member's default payment method.",
      cta: "End trial now",
    },
    schedule_cancel: {
      title: "Schedule cancellation?",
      body: renewalAt
        ? `The subscription will stay active until ${new Date(renewalAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} and then cancel.`
        : "The subscription will cancel at the end of the current period.",
      cta: "Schedule cancellation",
    },
    resume: {
      title: "Remove scheduled cancellation?",
      body: "Stripe will resume normal billing — the subscription will renew on its next cycle.",
      cta: "Resume subscription",
    },
    cancel_now: {
      title: "Cancel immediately?",
      body: "This ends billing right now and revokes entitlement at once. No refund is issued. This cannot be undone — they will need a fresh checkout to come back.",
      cta: "Cancel now",
      destructive: true,
    },
  };

  return (
    <>
      <div className="flex flex-col gap-2 rounded-[12px] border border-reps-border/60 bg-reps-panel/40 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-white">Subscription actions</span>
          <span className="text-[11px] text-white/45">Writes go straight to Stripe and mirror back here.</span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {isTrialing && (
            <Button
              size="sm"
              variant="outline"
              disabled={pending !== null}
              onClick={() => setConfirm("end_trial")}
              className="h-9 rounded-[10px] border-reps-border bg-white/5 text-white hover:bg-reps-panel-soft hover:text-white"
            >
              <Zap data-icon="inline-start" /> End trial now
            </Button>
          )}
          {cancelAtPeriodEnd ? (
            <Button
              size="sm"
              variant="outline"
              disabled={pending !== null}
              onClick={() => setConfirm("resume")}
              className="h-9 rounded-[10px] border-emerald-400/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 hover:text-emerald-100"
            >
              <Undo2 data-icon="inline-start" /> Resume subscription
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={pending !== null}
              onClick={() => setConfirm("schedule_cancel")}
              className="h-9 rounded-[10px] border-reps-border bg-white/5 text-white hover:bg-reps-panel-soft hover:text-white"
            >
              <CalendarX data-icon="inline-start" /> Cancel at period end
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={pending !== null}
            onClick={() => setConfirm("cancel_now")}
            className="h-9 rounded-[10px] border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 hover:text-rose-100"
          >
            <Ban data-icon="inline-start" /> Cancel immediately
          </Button>
        </div>
      </div>

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && pending === null && setConfirm(null)}>
        <AlertDialogContent>
          {confirm && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{confirmCopy[confirm].title}</AlertDialogTitle>
                <AlertDialogDescription>{confirmCopy[confirm].body}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pending !== null}>Back</AlertDialogCancel>
                <AlertDialogAction
                  disabled={pending !== null}
                  onClick={(e) => {
                    e.preventDefault();
                    run(confirm);
                  }}
                  className={cn(
                    confirmCopy[confirm].destructive && "bg-rose-600 text-white hover:bg-rose-500",
                  )}
                >
                  {pending === confirm ? "Working…" : confirmCopy[confirm].cta}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function VerificationPane({ snapshot }: { snapshot: Member360Snapshot }) {
  const v = snapshot.verification ?? "missing";
  const tone: "emerald" | "amber" | "rose" | "muted" =
    v === "verified" ? "emerald" :
    v === "pending" ? "amber" :
    v === "rejected" ? "rose" : "muted";

  const toneStrip = {
    emerald: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
    amber: "border-amber-400/30 bg-amber-500/10 text-amber-200",
    rose: "border-rose-400/30 bg-rose-500/10 text-rose-200",
    muted: "border-reps-border bg-reps-panel/60 text-white/70",
  }[tone];

  return (
    <section className={PANEL}>
      <PanelHeader
        title="Verification status"
        description="The 3-pillar gate (ID · Qualification · Insurance) computed by the platform trigger."
      />
      <div className={cn(PANEL_BODY, "flex flex-col gap-4")}>
        <div className={cn("flex items-center gap-3 rounded-[12px] border px-4 py-3", toneStrip)}>
          {tone === "emerald" && <CheckCircle2 className="size-5" />}
          {tone === "amber" && <Clock className="size-5" />}
          {tone === "rose" && <XCircle className="size-5" />}
          {tone === "muted" && <Clock className="size-5" />}
          <span className="text-sm">
            Overall: <span className="font-semibold capitalize">{v}</span>
          </span>
        </div>
        <p className="text-sm text-white/55">
          Per-pillar drill-down and inline approve / reject lands in the next pass. For now, manage at the dedicated workspace.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-9 rounded-[10px] border-reps-border bg-reps-panel/40 text-white hover:bg-reps-panel-soft hover:text-white"
          >
            <Link to="/admin/verification">
              <ShieldCheck data-icon="inline-start" /> Open verification workspace
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

type TimelineBundle = Awaited<ReturnType<typeof getMemberTimeline>>;
type TimelineEvent = TimelineBundle["events"][number];

function ActivityPane({ data, loading }: { data: TimelineBundle | undefined; loading: boolean }) {
  const groups = useMemo<[string, TimelineEvent[]][]>(() => {
    if (!data) return [];
    const m = new Map<string, TimelineEvent[]>();
    for (const e of data.events) {
      const day = e.ts.slice(0, 10);
      if (!m.has(day)) m.set(day, []);
      m.get(day)!.push(e);
    }
    return [...m.entries()];
  }, [data]);

  if (loading) return <PaneSkeleton />;
  if (!data) return null;
  if (data.events.length === 0) {
    return (
      <SoonEmpty
        title="No events yet"
        description="As this member moves through billing, verification, support and reviews, every event lands here."
      />
    );
  }

  return (
    <section className={cn(PANEL, "flex flex-col gap-5 p-5")}>
      {groups.map(([day, evs]) => (
        <div key={day} className="flex flex-col gap-2">
          <div className="inline-flex w-fit items-center rounded-[8px] bg-reps-panel-soft/60 px-2 py-1 text-[11px] uppercase tracking-wide text-white/70">
            {new Date(day).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
          </div>
          <ol className="ml-3 border-l border-reps-border/40">
            {evs.map((e, i) => (
              <li
                key={`${e.ts}-${i}`}
                className="relative rounded-[10px] py-2 pl-4 pr-2 transition-colors hover:bg-white/[0.03]"
              >
                <span className={cn("absolute -left-[5px] top-3.5 size-2 rounded-full", SOURCE_DOT_CLASSES[e.source])} />
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-[11.5px] tabular-nums text-white/55">{e.ts.slice(11, 19)}</span>
                  <SourcePill source={e.source} />
                  <span className="font-mono text-[11.5px] text-white/70">{e.type}</span>
                  {e.status && <span className="text-[10px] uppercase tracking-wide text-white/45">{e.status}</span>}
                  {e.externalUrl && (
                    <a href={e.externalUrl} target="_blank" rel="noreferrer" className="text-xs text-reps-orange hover:underline">↗</a>
                  )}
                </div>
                <div className="mt-0.5 text-sm text-white/85">{e.summary}</div>
              </li>
            ))}
          </ol>
        </div>
      ))}
      {data.truncated && <div className="text-xs text-white/45">Showing first 200 events.</div>}
    </section>
  );
}

/* ───────────────────────── Helpers ───────────────────────── */

function PaneSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-24 w-full rounded-[18px] bg-reps-panel/60" />
      <Skeleton className="h-24 w-full rounded-[18px] bg-reps-panel/60" />
    </div>
  );
}

function SoonEmpty({ title, description }: { title: string; description: string }) {
  return (
    <section className={cn(PANEL, "flex flex-col items-center gap-3 px-6 py-10 text-center")}>
      <div className="flex size-12 items-center justify-center rounded-[14px] bg-reps-orange/10 text-reps-orange">
        <UserIcon className="size-6" />
      </div>
      <h3 className="text-[15px] font-semibold text-white">{title}</h3>
      <p className="max-w-md text-sm text-white/55">{description}</p>
      <Badge variant="outline" className="mt-1 border-reps-border bg-reps-panel/60 text-white/65">
        Shipping in the next pass
      </Badge>
    </section>
  );
}
