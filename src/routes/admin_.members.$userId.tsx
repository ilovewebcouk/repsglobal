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
  Trash2,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
  cancelAndDeleteMember,
  type CancelReason,
} from "@/lib/admin/billing-actions.functions";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useNavigate } from "@tanstack/react-router";
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
          {email && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-9 rounded-[10px] border-reps-border bg-white/5 text-white hover:bg-reps-panel-soft hover:text-white"
            >
              <Link
                to="/admin/campaigns"
                search={{ compose: "1", to: email, name: full_name ?? undefined, inbox: "pros" }}
              >
                <Mail data-icon="inline-start" /> Send email
              </Link>
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
          memberName={snapshot.full_name ?? snapshot.email ?? ""}
          status={status}
          isTrialing={status === "trialing"}
          cancelAtPeriodEnd={sub.cancel_at_period_end}
        />
      </div>
    </section>
  );
}

type Strategy = "end_trial" | "cancel_period_end" | "cancel_now";

const STRATEGY_TO_REASON: Record<Strategy, CancelReason> = {
  end_trial: "admin_end_trial",
  cancel_period_end: "admin_cancel_period_end",
  cancel_now: "admin_cancel_immediate",
};

const STRATEGY_LABEL: Record<Strategy, { title: string; detail: string }> = {
  end_trial: {
    title: "End trial now",
    detail: "Stops the trial today, no charge. Profile removed, email archived.",
  },
  cancel_period_end: {
    title: "Cancel at period end",
    detail:
      "Lets the current paid period run out, then closes the account. Recommended for paying members.",
  },
  cancel_now: {
    title: "Cancel immediately",
    detail: "Cancels Stripe now. No refund is issued.",
  },
};

function BillingActions({
  userId,
  memberName,
  status,
  isTrialing,
  cancelAtPeriodEnd,
}: {
  userId: string;
  memberName: string;
  status: string;
  isTrialing: boolean;
  cancelAtPeriodEnd: boolean;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const closeAccount = useServerFn(cancelAndDeleteMember);

  const hasLiveSub = status !== "canceled" && status !== "incomplete_expired";
  const defaultStrategy: Strategy = isTrialing
    ? "end_trial"
    : cancelAtPeriodEnd
      ? "cancel_now"
      : "cancel_period_end";

  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [notes, setNotes] = useState("");
  const [typedName, setTypedName] = useState("");
  const [strategy, setStrategy] = useState<Strategy>(defaultStrategy);

  const nameMatches =
    typedName.trim().toLowerCase() === (memberName ?? "").trim().toLowerCase();

  const reset = () => {
    setOpen(false);
    setNotes("");
    setTypedName("");
    setStrategy(defaultStrategy);
  };

  const run = async () => {
    setPending(true);
    try {
      const reason: CancelReason = hasLiveSub
        ? STRATEGY_TO_REASON[strategy]
        : "admin_delete";
      const res = await closeAccount({
        data: {
          user_id: userId,
          reason,
          notes: notes.trim() || undefined,
        },
      });
      toast.success(
        res.emailSent
          ? "Account closed. Confirmation email sent."
          : `Account closed. (Email skipped${res.emailError ? `: ${res.emailError}` : ""})`,
      );
      await qc.invalidateQueries({ queryKey: ["admin-member-360", userId] });
      navigate({ to: "/admin/members" });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not close account");
      setPending(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2 rounded-[12px] border border-reps-border/60 bg-reps-panel/40 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold text-white">Close member account</span>
            <span className="text-[11.5px] text-white/55">
              REPS doesn't keep accounts without a subscription. This cancels Stripe,
              removes the profile, and archives the email.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setStrategy(defaultStrategy);
              setOpen(true);
            }}
            className="h-9 shrink-0 rounded-[10px] border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 hover:text-rose-100"
          >
            <Trash2 data-icon="inline-start" /> Delete account
          </Button>
        </div>
      </div>

      <AlertDialog open={open} onOpenChange={(o) => !o && !pending && reset()}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this member's account?</AlertDialogTitle>
            <AlertDialogDescription>
              {hasLiveSub
                ? "Choose how to wind down the Stripe subscription. The profile is removed, a confirmation email is sent, and the email is archived in the mailing list. This can't be undone."
                : "Subscription is already cancelled. This removes the profile, sends a confirmation email, and archives the email. This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-3 py-1">
            {hasLiveSub && (
              <div>
                <Label className="text-[12.5px] text-white/70">Cancellation strategy</Label>
                <RadioGroup
                  value={strategy}
                  onValueChange={(v) => setStrategy(v as Strategy)}
                  className="mt-2 flex flex-col gap-2"
                >
                  {(
                    ["end_trial", "cancel_period_end", "cancel_now"] as Strategy[]
                  )
                    .filter((s) => (s === "end_trial" ? isTrialing : true))
                    .map((s) => (
                      <label
                        key={s}
                        htmlFor={`strat-${s}`}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-[10px] border border-reps-border/60 bg-reps-panel/40 px-3 py-2.5",
                          strategy === s && "border-reps-orange/60 bg-reps-orange/5",
                        )}
                      >
                        <RadioGroupItem id={`strat-${s}`} value={s} className="mt-0.5" />
                        <div className="flex flex-col">
                          <span className="text-[13px] font-semibold text-white">
                            {STRATEGY_LABEL[s].title}
                          </span>
                          <span className="text-[12px] text-white/60">
                            {STRATEGY_LABEL[s].detail}
                          </span>
                        </div>
                      </label>
                    ))}
                </RadioGroup>
              </div>
            )}

            <div>
              <Label htmlFor="close-notes" className="text-[12.5px] text-white/70">
                Reason / notes (saved to audit log)
              </Label>
              <Textarea
                id="close-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Member asked to cancel via support ticket TKT-1234"
                className="mt-1 min-h-[72px]"
                disabled={pending}
              />
            </div>

            <div>
              <Label htmlFor="close-confirm" className="text-[12.5px] text-white/70">
                Type <span className="font-semibold text-white">{memberName || "the member's name"}</span> to confirm
              </Label>
              <Input
                id="close-confirm"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                className="mt-1"
                disabled={pending}
                autoComplete="off"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Back</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending || !nameMatches}
              onClick={(e) => {
                e.preventDefault();
                run();
              }}
              className="bg-rose-500 text-white hover:bg-rose-600"
            >
              {pending ? "Closing…" : "Delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
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
