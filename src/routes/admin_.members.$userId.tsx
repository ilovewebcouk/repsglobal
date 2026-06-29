// Admin Member 360 — sticky header, action bar, 7-tab workbench.
// Restyled to match the REPs dark admin palette (panel/40 surfaces,
// border-reps-border, reps-orange accents) rather than shadcn defaults.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import {
  ExternalLink,
  Mail,
  ShieldCheck,
  User as UserIcon,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
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
import { cn } from "@/lib/utils";

import { getMember360, type Member360Snapshot } from "@/lib/admin/member360.functions";
import { getMemberTimeline } from "@/lib/ops/timeline.functions";
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
            {snap.data ? <BillingPane snapshot={snap.data} /> : <PaneSkeleton />}
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

  const { full_name, email, slug, verification, is_published, subscription, avatar_url, profession } = snapshot;
  const tier = subscription?.tier ?? null;
  const status = subscription?.status ?? null;
  const trialEnd = subscription?.trial_end ?? null;
  const cancelAt = subscription?.cancel_at_period_end ? subscription.current_period_end : null;
  const publicHref = slug ? `/c/${slug}` : null;
  const mailtoHref = email ? `mailto:${email}` : null;

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
            {verification === "verified" && (
              <Badge variant="outline" className="h-6 border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
                <ShieldCheck data-icon="inline-start" /> Verified
              </Badge>
            )}
            {tier && (
              <Badge variant="outline" className="h-6 border-reps-orange-border bg-reps-orange/10 text-reps-orange capitalize">
                {tier}
              </Badge>
            )}
            {status && (
              <Badge
                variant="outline"
                className={cn(
                  "h-6 capitalize",
                  status === "active" && "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
                  status === "trialing" && "border-sky-400/30 bg-sky-500/15 text-sky-300",
                  status === "past_due" && "border-amber-400/30 bg-amber-500/15 text-amber-300",
                  (status === "canceled" || status === "unpaid") && "border-rose-400/30 bg-rose-500/15 text-rose-300",
                  ![
                    "active",
                    "trialing",
                    "past_due",
                    "canceled",
                    "unpaid",
                  ].includes(status) && "border-reps-border bg-reps-panel/60 text-white/70",
                )}
              >
                {status.replace(/_/g, " ")}
              </Badge>
            )}
            {status === "trialing" && trialEnd && (
              <Badge variant="outline" className="h-6 border-sky-400/30 bg-sky-500/10 text-sky-200">
                Trial ends {fmtDate(trialEnd)}
              </Badge>
            )}
            {cancelAt && (
              <Badge variant="outline" className="h-6 border-rose-400/30 bg-rose-500/10 text-rose-200">
                Cancels {fmtDate(cancelAt)}
              </Badge>
            )}
            {!subscription && (
              <Badge variant="outline" className="h-6 border-reps-border bg-reps-panel/60 text-white/55">
                No subscription
              </Badge>
            )}
            {!is_published && (
              <Badge variant="outline" className="h-6 border-reps-border bg-reps-panel/60 text-white/55">
                Unpublished
              </Badge>
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
  const stats: { label: string; value: React.ReactNode; sub?: string }[] = [
    { label: "Tier", value: <span className="capitalize">{sub?.tier ?? "—"}</span>, sub: sub ? sub.status : "no subscription" },
    { label: "Price", value: fmtMoney(sub?.unit_amount_pence, sub?.currency), sub: sub?.interval ? `per ${sub.interval}` : undefined },
    { label: "Next renewal", value: fmtDate(sub?.current_period_end), sub: sub?.cancel_at_period_end ? "cancels at period end" : undefined },
    { label: "Trial ends", value: fmtDate(sub?.trial_end), sub: sub?.trial_end ? undefined : "no trial" },
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
            value={sub?.id ?? null}
            href={sub?.id ? `https://dashboard.stripe.com/subscriptions/${sub.id}` : undefined}
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


function BillingPane({ snapshot }: { snapshot: Member360Snapshot }) {
  const sub = snapshot.subscription;

  if (!sub) {
    return (
      <section className={cn(PANEL, "flex flex-col items-center gap-2 px-6 py-10 text-center")}>
        <h3 className={PANEL_TITLE}>No active subscription</h3>
        <p className="max-w-md text-sm text-white/55">
          This member isn't on a paid plan in the live Stripe environment.
        </p>
      </section>
    );
  }

  const status = sub.status;
  const statusClass = cn(
    "h-6 capitalize",
    status === "active" && "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
    status === "trialing" && "border-sky-400/30 bg-sky-500/15 text-sky-300",
    status === "past_due" && "border-amber-400/30 bg-amber-500/15 text-amber-300",
    (status === "canceled" || status === "unpaid") && "border-rose-400/30 bg-rose-500/15 text-rose-300",
  );

  const stats: { label: string; value: React.ReactNode; sub?: string }[] = [
    { label: "Plan", value: <span className="capitalize">{sub.tier ?? "—"}</span>, sub: sub.price_lookup_key ?? undefined },
    { label: "Price", value: fmtMoney(sub.unit_amount_pence, sub.currency), sub: sub.interval ? `per ${sub.interval}` : undefined },
    { label: "Current period end", value: fmtDate(sub.current_period_end), sub: sub.cancel_at_period_end ? "cancels at period end" : undefined },
    { label: "Trial end", value: fmtDate(sub.trial_end), sub: sub.trial_end ? undefined : "no trial" },
  ];

  return (
    <section className={PANEL}>
      <div className={cn(PANEL_HEADER, "flex flex-wrap items-start justify-between gap-3")}>
        <div>
          <h3 className={PANEL_TITLE}>Current Stripe subscription</h3>
          <p className={PANEL_DESC}>Live Stripe mirror — the source of truth for billing.</p>
        </div>
        <Badge variant="outline" className={statusClass}>{status.replace(/_/g, " ")}</Badge>
      </div>
      <div className={cn(PANEL_BODY, "flex flex-col gap-4")}>
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
            value={sub.id}
            href={`https://dashboard.stripe.com/subscriptions/${sub.id}`}
          />
          <IdRow
            label="Price id"
            value={sub.price_id}
            href={sub.price_id ? `https://dashboard.stripe.com/prices/${sub.price_id}` : undefined}
          />
        </div>
      </div>
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
