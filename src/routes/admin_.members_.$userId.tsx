// Admin Member 360 — sticky header, action bar, 7-tab workbench.
// Restyled to match the REPs dark admin palette (panel/40 surfaces,
// border-reps-border, reps-orange accents) rather than shadcn defaults.

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ExternalLink,
  Eye,
  Mail,
  ShieldCheck,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Pencil,
} from "lucide-react";
import { adminUpdateMemberEmail } from "@/lib/admin/member-email.functions";
import { startImpersonation } from "@/lib/admin/impersonation.functions";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { getMemberSessions, type MemberSessionRow } from "@/lib/admin/member-sessions.functions";
import { DntGpcBadge } from "@/components/admin/DntGpcBadge";

import { getMemberTimeline } from "@/lib/ops/timeline.functions";
import { getMemberPasswordResetInfo, adminSetMemberPassword, type PasswordResetInfo } from "@/lib/admin/password-reset.functions";
import {
  closeMembership,
  type CancelReason,
  type CloseMode,
} from "@/lib/admin/billing-actions.functions";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import { SourcePill, SOURCE_DOT_CLASSES } from "@/components/ops/source-pill";
import { ProviderProfileMirror } from "@/components/admin/providers/ProviderProfileMirror";
import { suspendProvider, republishProvider } from "@/lib/admin/providers.functions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EyeOff } from "lucide-react";

export const Route = createFileRoute("/admin_/members_/$userId")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }, { title: "Member 360 — REPS Admin" }] }),
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
  const getSessions = useServerFn(getMemberSessions);

  const snap = useQuery({
    queryKey: ["admin-member-360", userId],
    queryFn: () => getSnap({ data: { user_id: userId } }),
  });

  const timeline = useQuery({
    queryKey: ["admin-member-timeline", userId],
    queryFn: () => getTimeline({ data: { user_id: userId, limit: 200 } }),
  });

  const sessions = useQuery({
    queryKey: ["admin-member-sessions", userId],
    queryFn: () => getSessions({ data: { user_id: userId, limit: 20 } }),
    staleTime: 30_000,
  });

  const getReset = useServerFn(getMemberPasswordResetInfo);
  const resetInfo = useQuery({
    queryKey: ["admin-member-password-reset", userId],
    queryFn: () => getReset({ data: { user_id: userId } }),
    staleTime: 30_000,
  });

  const isProvider = snap.data?.account_type === "organisation";

  return (
    <DashboardShell role="admin" active="Members" title={isProvider ? "Provider 360" : "Member 360"} subtitle="One workbench for every member action.">
      <div className="flex flex-col gap-6 p-6">
        <StickyHeader userId={userId} snapshot={snap.data} loading={snap.isLoading} />

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
                { v: "sessions", l: "Sessions" },
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
            <PasswordResetPane data={resetInfo.data} loading={resetInfo.isLoading} userId={userId} />
          </TabsContent>

          <TabsContent value="billing" className="flex flex-col gap-4">
            {snap.data ? <BillingPane snapshot={snap.data} userId={userId} /> : <PaneSkeleton />}
          </TabsContent>

          <TabsContent value="verification" className="flex flex-col gap-4">
            {snap.data ? <VerificationPane snapshot={snap.data} /> : <PaneSkeleton />}
          </TabsContent>

          <TabsContent value="profile">
            {isProvider && snap.data ? (
              <ProviderProfileMirror userId={userId} snapshot={snap.data} />
            ) : (
              <SoonEmpty
                title="Inline profile editing"
                description="Edit name, slug, bio, services and avatar in place — without leaving the workbench."
              />
            )}
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

          <TabsContent value="sessions" className="flex flex-col gap-4">
            <SessionsPane data={sessions.data} loading={sessions.isLoading} error={sessions.error as Error | null} />
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



function StickyHeader({ userId, snapshot, loading }: { userId: string; snapshot: Member360Snapshot | undefined; loading: boolean }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const startFn = useServerFn(startImpersonation);
  const [viewAsBusy, setViewAsBusy] = useState(false);

  async function handleViewAs() {
    if (viewAsBusy) return;
    setViewAsBusy(true);
    try {
      await startFn({ data: { professional_id: userId } });
      await qc.invalidateQueries({ queryKey: ["impersonation-status"] });
      navigate({ to: "/dashboard" });
    } catch (e) {
      console.error("startImpersonation failed", e);
      toast.error((e as Error).message ?? "Could not start view-as session");
      setViewAsBusy(false);
    }
  }

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

  const { full_name, email, slug, verification, subscription, avatar_url, profession, account_type } = snapshot;
  const sub = subscription;
  const tierLbl = sub.tier_label;
  const status = sub.status;
  const isProvider = account_type === "organisation";
  const displayName = isProvider ? (full_name ?? "Unnamed provider") : (full_name ?? "Unnamed member");
  const publicHref = slug ? (isProvider ? `/t/${slug}` : `/c/${slug}`) : null;
  const isSuspended = isProvider && (snapshot.professional_suspended_at ?? null) != null;

  return (
    <div className="sticky top-0 z-20 -mx-6 border-b border-reps-border bg-reps-ink/85 px-6 py-4 backdrop-blur-md shadow-[0_8px_24px_-12px_rgba(0,0,0,0.55)]">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar className="size-14 ring-1 ring-reps-border">
          {avatar_url && <AvatarImage src={avatar_url} alt={displayName} />}
          <AvatarFallback className="bg-reps-orange/15 text-base font-semibold text-reps-orange">
            {initialsOf(displayName, email)}
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <h2 className="truncate text-lg font-semibold text-white">{displayName}</h2>
            {isProvider ? (
              <span className="truncate font-mono text-[12px] text-white/45">/t/{slug ?? "—"}</span>
            ) : (
              profession && <span className="truncate text-sm text-white/55">{profession}</span>
            )}
          </div>
          <div className="truncate text-[13px] text-white/45">{email ?? "no email on file"}</div>
          <div className="flex flex-wrap items-center gap-1.5">
            {isProvider && (
              <span className="inline-flex items-center rounded-full border border-sky-400/30 bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-300">
                Training provider
              </span>
            )}
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
            {isSuspended && (
              <span className="inline-flex items-center rounded-full border border-red-400/30 bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold text-red-300">
                Suspended
              </span>
            )}
          </div>
        </div>


        <div className="flex flex-wrap items-center gap-2">
          {publicHref && (
            <Button asChild size="sm" className="h-9 rounded-[10px] bg-reps-orange text-white hover:bg-reps-orange-hover">
              <a href={publicHref} target="_blank" rel="noreferrer">
                <ExternalLink data-icon="inline-start" /> View public {isProvider ? "page" : "profile"}
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
                search={{ compose: "1", to: email, name: displayName, inbox: "pros" }}
              >
                <Mail data-icon="inline-start" /> Send email
              </Link>
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleViewAs}
            disabled={viewAsBusy}
            className="h-9 rounded-[10px] border-reps-border bg-white/5 text-white hover:bg-reps-panel-soft hover:text-white"
          >
            <Eye data-icon="inline-start" /> {viewAsBusy ? "Opening…" : "View as"}
          </Button>
          {isProvider && (
            <ProviderVisibilityAction userId={userId} suspended={isSuspended} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Provider visibility action ───────────────────────── */

function ProviderVisibilityAction({ userId, suspended }: { userId: string; suspended: boolean }) {
  const qc = useQueryClient();
  const suspendFn = useServerFn(suspendProvider);
  const republishFn = useServerFn(republishProvider);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitSuspend() {
    if (busy || !reason.trim()) return;
    setBusy(true);
    try {
      await suspendFn({ data: { user_id: userId, reason: reason.trim() } });
      toast.success("Provider suspended");
      await qc.invalidateQueries({ queryKey: ["admin-member-360", userId] });
      setOpen(false);
      setReason("");
    } catch (e) {
      toast.error((e as Error).message ?? "Suspend failed");
    } finally {
      setBusy(false);
    }
  }

  async function submitRepublish() {
    if (busy) return;
    setBusy(true);
    try {
      await republishFn({ data: { user_id: userId, reason: null } });
      toast.success("Provider republished");
      await qc.invalidateQueries({ queryKey: ["admin-member-360", userId] });
    } catch (e) {
      toast.error((e as Error).message ?? "Republish failed");
    } finally {
      setBusy(false);
    }
  }

  if (suspended) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={submitRepublish}
        disabled={busy}
        className="h-9 rounded-[10px] border-emerald-400/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 hover:text-emerald-100"
      >
        <Eye data-icon="inline-start" /> {busy ? "Republishing…" : "Republish"}
      </Button>
    );
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-9 rounded-[10px] border-red-400/40 bg-red-500/10 text-red-200 hover:bg-red-500/20 hover:text-red-100"
      >
        <EyeOff data-icon="inline-start" /> Suspend
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-reps-border bg-reps-ink text-white">
          <DialogHeader>
            <DialogTitle>Suspend provider</DialogTitle>
            <DialogDescription className="text-white/60">
              Hides the public /t/&lt;slug&gt; page. Reversible via Republish. Does not
              cancel billing or delete the account.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label>Reason (required)</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              onClick={submitSuspend}
              disabled={busy || !reason.trim()}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {busy ? "Suspending…" : "Suspend"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ───────────────────────── Panes ───────────────────────── */

function PanelHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className={cn(PANEL_HEADER, actions && "flex items-start justify-between gap-3")}>
      <div>
        <h3 className={PANEL_TITLE}>{title}</h3>
        {description && <p className={PANEL_DESC}>{description}</p>}
      </div>
      {actions}
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
      <section className={cn(PANEL, "flex flex-col items-center gap-4 px-6 py-10 text-center")}>
        <h3 className={PANEL_TITLE}>No active subscription</h3>
        <p className="max-w-md text-sm text-white/55">
          This member isn't on a paid plan right now.
        </p>
        <div className="w-full max-w-xl text-left">
          <BillingActions
            userId={userId}
            memberName={snapshot.full_name ?? snapshot.email ?? ""}
            status="canceled"
            isTrialing={false}
            cancelAtPeriodEnd={false}
          />
        </div>
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
            Stripe and our copy disagree on: {sub.discrepancies.join(", ").replace(/_/g, "")}. Open in Stripe to reconcile.
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

type Strategy = "end_trial" | "cancel_now";

const STRATEGY_TO_MODE: Record<Strategy, CloseMode> = {
  end_trial: "end_now_delete",
  cancel_now: "end_now_delete",
};

const STRATEGY_TO_REASON: Record<Strategy, CancelReason> = {
  end_trial: "admin_end_trial",
  cancel_now: "admin_cancel_immediate",
};

const STRATEGY_LABEL: Record<Strategy, { title: string; detail: string }> = {
  end_trial: {
    title: "End trial now",
    detail: "Stops the trial today, no charge. Profile removed, account deleted, email archived.",
  },
  cancel_now: {
    title: "Cancel immediately and delete",
    detail:
      "Cancels Stripe now, removes the profile, deletes the account, archives the email. No refund. REPS does not offer a grace period.",
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
  const closeFn = useServerFn(closeMembership);

  const hasLiveSub = status !== "canceled" && status !== "incomplete_expired";
  void cancelAtPeriodEnd;
  const defaultStrategy: Strategy = isTrialing ? "end_trial" : "cancel_now";

  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [notes, setNotes] = useState("");
  const [typedName, setTypedName] = useState("");
  const [strategy, setStrategy] = useState<Strategy>(defaultStrategy);

  // Every remaining strategy is destructive under the immediate-cancel policy.
  const isDestructive = true;

  // Require the typed-name confirmation for every close.
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
      const mode: CloseMode = hasLiveSub
        ? STRATEGY_TO_MODE[strategy]
        : "delete_only";
      const reason: CancelReason = hasLiveSub
        ? STRATEGY_TO_REASON[strategy]
        : "admin_delete";
      const res = await closeFn({
        data: {
          user_id: userId,
          mode,
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
            <AlertDialogTitle>Close this member's account?</AlertDialogTitle>
            <AlertDialogDescription>
              {!hasLiveSub
                ? "Subscription is already cancelled. This removes the profile, sends a confirmation email, and archives the email. This can't be undone."
                : "This cancels Stripe immediately, removes the profile, deletes the account, and archives the email. No refund. REPS does not offer a grace period. This can't be undone."}
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
                  {(["end_trial", "cancel_now"] as Strategy[])
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

            {isDestructive && (
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
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Back</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending || !nameMatches}
              onClick={(e) => {
                e.preventDefault();
                run();
              }}
              className={cn(
                isDestructive
                  ? "bg-rose-500 text-white hover:bg-rose-600"
                  : "bg-reps-orange text-white hover:bg-reps-orange/90",
              )}
            >
              {pending
                ? isDestructive
                  ? "Closing…"
                  : "Scheduling…"
                : isDestructive
                  ? "Delete account"
                  : "Schedule cancellation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ───────────────────────── Password reset ───────────────────────── */

const STATUS_STYLES: Record<string, string> = {
  sent: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
  pending: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  failed: "border-rose-400/30 bg-rose-500/10 text-rose-200",
  dlq: "border-rose-400/30 bg-rose-500/10 text-rose-200",
  suppressed: "border-white/10 bg-white/5 text-white/70",
};

function fmtDateTimeGB(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function PasswordResetPane({ data, loading, userId }: { data: PasswordResetInfo | undefined; loading: boolean; userId: string }) {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);
  const setPassword = useServerFn(adminSetMemberPassword);

  const generate = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let out = "";
    const bytes = new Uint32Array(16);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < 16; i++) out += chars[bytes[i] % chars.length];
    setPw(out);
    setShow(true);
  };

  const submit = async () => {
    if (pw.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setPending(true);
    try {
      await setPassword({ data: { user_id: userId, password: pw } });
      await navigator.clipboard.writeText(pw).catch(() => {});
      toast.success("Password updated — copied to clipboard");
      setOpen(false);
      setPw("");
      setShow(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to set password");
    } finally {
      setPending(false);
    }
  };

  return (
    <section className={PANEL}>
      <PanelHeader
        title="Password reset"
        description="Whether the member has requested a reset and whether the email actually left the platform."
        actions={
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-[10px] border-reps-border bg-reps-panel/60 text-[12.5px] text-white hover:bg-reps-panel"
            onClick={() => setOpen(true)}
          >
            Set new password
          </Button>
        }
      />
      <div className={cn(PANEL_BODY, "flex flex-col gap-4")}>
        <div className="grid gap-2.5 md:grid-cols-2">
          <div className="flex flex-col gap-1 rounded-[12px] border border-reps-border/60 bg-reps-panel/60 px-3 py-2.5">
            <span className={LABEL}>Last reset requested</span>
            <span className="text-sm font-medium text-white">
              {loading ? "…" : fmtDateTimeGB(data?.recovery_sent_at)}
            </span>
            <span className="text-[11px] text-white/45">from Supabase auth (recovery_sent_at)</span>
          </div>
          <div className="flex flex-col gap-1 rounded-[12px] border border-reps-border/60 bg-reps-panel/60 px-3 py-2.5">
            <span className={LABEL}>Recent send attempts</span>
            <span className="text-sm font-medium text-white">
              {loading ? "…" : (data?.attempts.length ?? 0)}
            </span>
            <span className="text-[11px] text-white/45">from email_send_log · template = recovery</span>
          </div>
        </div>

        {!loading && data && data.attempts.length === 0 && (
          <div className="rounded-[12px] border border-reps-border bg-reps-panel/40 px-4 py-3 text-sm text-white/70">
            No recovery emails have been dispatched via the queue for this address.
            {data.recovery_sent_at
              ? " Supabase recorded a reset request but no queue attempt landed — check the auth webhook."
              : " No reset request has been recorded either."}
          </div>
        )}

        {data && data.attempts.length > 0 && (
          <ol className="flex flex-col gap-2">
            {data.attempts.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-reps-border/60 bg-reps-panel/40 px-3 py-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-[8px] border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
                      STATUS_STYLES[a.status] ?? "border-white/10 bg-white/5 text-white/70",
                    )}
                  >
                    {a.status}
                  </span>
                  <span className="text-[12.5px] tabular-nums text-white/70">
                    {fmtDateTimeGB(a.created_at)}
                  </span>
                </div>
                {a.error_message && (
                  <span className="max-w-full text-[11.5px] text-rose-200 md:max-w-[60%]">
                    {a.error_message}
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
        <DialogContent className="border-reps-border bg-reps-panel text-white sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Set new password</DialogTitle>
            <DialogDescription className="text-white/60">
              Immediately replaces this member's password. They will not be notified. Use only when the member has requested this or you are logging in as them for support.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Label className="text-[12.5px] text-white/70">New password</Label>
            <div className="relative">
              <Input
                type={show ? "text" : "password"}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="min. 8 characters"
                className="pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generate}
              className="h-8 self-start rounded-[10px] border-reps-border bg-reps-panel/60 text-[12.5px] text-white hover:bg-reps-panel"
            >
              Generate strong password
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
            <Button onClick={submit} disabled={pending || pw.length < 8}>
              {pending ? "Saving…" : "Set password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
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

/* ───────────────────────── Sessions ───────────────────────── */

type SessionsBundle = Awaited<ReturnType<typeof getMemberSessions>>;

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function fmtDuration(fromIso: string, toIso: string) {
  const ms = Math.max(0, new Date(toIso).getTime() - new Date(fromIso).getTime());
  const mins = Math.round(ms / 60_000);
  if (mins < 1) return "< 1 min";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function SessionsPane({ data, loading, error }: { data: SessionsBundle | undefined; loading: boolean; error: Error | null }) {
  if (loading) return <PaneSkeleton />;
  if (error) {
    return (
      <section className={cn(PANEL, "px-5 py-6 text-sm text-rose-200")}>
        Could not load sessions: {error.message}
      </section>
    );
  }
  if (!data || data.sessions.length === 0) {
    return (
      <SoonEmpty
        title="No sessions captured yet"
        description="Sessions appear here once the member signs in and browses. Anonymous, admin, and impersonation traffic is excluded by design."
      />
    );
  }

  return (
    <section className={cn(PANEL, "flex flex-col gap-4 p-5")}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-white">Recent sessions</h3>
          <p className={PANEL_DESC}>
            Showing {data.sessions.length} of {data.total}. Admin and impersonation sessions are filtered out. No raw IPs are stored — only salted hashes.
          </p>
        </div>
      </div>

      <ol className="flex flex-col gap-3">
        {data.sessions.map((s: MemberSessionRow) => (
          <li key={s.session_id} className="rounded-[14px] border border-reps-border bg-reps-panel/40 p-4">
            <header className="flex flex-wrap items-center gap-2">
              {s.is_active ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  Active now
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-reps-border bg-reps-panel-soft/60 px-2 py-0.5 text-[11px] font-medium text-white/65">
                  Ended
                </span>
              )}
              <span className="text-[12.5px] tabular-nums text-white/70">{fmtDateTime(s.started_at)}</span>
              <span className="text-[11px] text-white/40">·</span>
              <span className="text-[12px] text-white/55">{fmtDuration(s.started_at, s.ended_at ?? s.last_seen_at)}</span>
              <span className="ml-auto text-[11px] font-mono text-white/35">{s.session_id.slice(0, 8)}</span>
            </header>

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px] md:grid-cols-4">
              <div>
                <div className={LABEL}>Device</div>
                <div className="text-white/85">{s.device ?? "—"}{s.os ? ` · ${s.os}` : ""}</div>
              </div>
              <div>
                <div className={LABEL}>Browser</div>
                <div className="text-white/85">{s.browser ?? "—"}</div>
              </div>
              <div>
                <div className={LABEL}>Country</div>
                <div className="text-white/85">
                  {s.country_code ?? "—"}
                  {s.city ? <span className="text-white/55"> · {s.city}</span> : null}
                </div>
              </div>
              <div>
                <div className={LABEL}>Pages viewed</div>
                <div className="text-white/85">{s.pages_viewed}</div>
              </div>
            </div>

            {s.limited_detail && (
              <div className="mt-3">
                <DntGpcBadge />
              </div>
            )}

            {s.page_trail.length > 0 && (
              <div className="mt-3">
                <div className={cn(LABEL, "mb-1.5")}>Page trail</div>
                <ol className="flex flex-col gap-1 rounded-[10px] border border-reps-border/60 bg-reps-ink/40 p-2">
                  {s.page_trail.map((p, i) => (
                    <li key={`${p.ts}-${i}`} className="flex items-baseline gap-2 text-[12px]">
                      <span className="tabular-nums text-white/45">{p.ts.slice(11, 19)}</span>
                      <span className="truncate font-mono text-white/85">{p.path}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {s.auth_events.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {s.auth_events.map((a, i) => (
                  <span
                    key={`${a.ts}-${i}`}
                    className="inline-flex items-center gap-1 rounded-full border border-reps-border bg-reps-panel-soft/60 px-2 py-0.5 text-[11px] text-white/70"
                  >
                    <span className="font-mono">{a.event}</span>
                    <span className="text-white/40">·</span>
                    <span className="tabular-nums">{a.ts.slice(11, 16)}</span>
                  </span>
                ))}
              </div>
            )}

            {s.ip_hash_prefix && (
              <div className="mt-2 text-[10.5px] text-white/35">
                IP hash · <span className="font-mono">{s.ip_hash_prefix}…</span> (salted SHA-256, first 8 chars)
              </div>
            )}
          </li>
        ))}
      </ol>
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
