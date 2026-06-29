// Admin Member 360 — sticky header, action bar, 7-tab workbench.
// Step 1 of the world-class admin rebuild. Wires Overview / Billing /
// Activity from existing read APIs and stubs Verification / Profile /
// Reviews / Notes with honest "coming next" empty states.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { getMember360, type Member360Snapshot } from "@/lib/admin/member360.functions";
import { getMemberTimeline } from "@/lib/ops/timeline.functions";
import { MemberSnapshotCard } from "@/components/admin/v2/MemberSnapshotCard";
import { SourcePill, SOURCE_DOT_CLASSES } from "@/components/ops/source-pill";

export const Route = createFileRoute("/admin_/members/$userId")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({ meta: [{ title: "Member 360 — REPS Admin" }] }),
  component: MemberPage,
});

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
      <div className="space-y-6 p-6">
        <StickyHeader snapshot={snap.data} loading={snap.isLoading} />

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex w-full flex-wrap justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {snap.data ? <OverviewPane snapshot={snap.data} /> : <PaneSkeleton />}
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            {snap.data ? <MemberSnapshotCard snapshot={snap.data} /> : <PaneSkeleton />}
          </TabsContent>

          <TabsContent value="verification" className="space-y-4">
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

          <TabsContent value="activity" className="space-y-4">
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
      <div className="sticky top-0 z-20 -mx-6 border-b border-reps-border bg-reps-ink/95 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
      </div>
    );
  }

  const { full_name, email, slug, verification, is_published, subscription } = snapshot;
  const tier = subscription?.tier ?? null;
  const status = subscription?.status ?? null;
  const publicHref = slug ? `/c/${slug}` : null;
  const mailtoHref = email ? `mailto:${email}` : null;

  return (
    <div className="sticky top-0 z-20 -mx-6 border-b border-reps-border bg-reps-ink/95 px-6 py-4 backdrop-blur">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar className="size-12 border border-reps-border">
          <AvatarFallback className="bg-reps-panel text-sm font-semibold text-white">
            {initialsOf(full_name, email)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-semibold text-white">{full_name ?? "Unnamed member"}</h2>
            {verification === "verified" && (
              <Badge variant="outline" className="border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
                <ShieldCheck data-icon="inline-start" /> Verified
              </Badge>
            )}
            {tier && <Badge variant="secondary">{tier}</Badge>}
            {status && <Badge variant={status === "active" ? "default" : status === "trialing" ? "secondary" : "outline"}>{status}</Badge>}
            {!is_published && <Badge variant="outline">Unpublished</Badge>}
          </div>
          <div className="mt-1 truncate text-sm text-white/60">{email ?? "no email on file"}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {publicHref && (
            <Button asChild size="sm" variant="outline">
              <a href={publicHref} target="_blank" rel="noreferrer">
                <ExternalLink data-icon="inline-start" /> View public profile
              </a>
            </Button>
          )}
          {mailtoHref && (
            <Button asChild size="sm" variant="outline">
              <a href={mailtoHref}>
                <Mail data-icon="inline-start" /> Send email
              </a>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" aria-label="More actions">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Member actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>Login as member (soon)</DropdownMenuItem>
              <DropdownMenuItem disabled>Edit status (soon)</DropdownMenuItem>
              <DropdownMenuItem disabled>Comp this member (soon)</DropdownMenuItem>
              <DropdownMenuItem disabled>Refund last charge (soon)</DropdownMenuItem>
              <DropdownMenuSeparator />
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

function OverviewPane({ snapshot }: { snapshot: Member360Snapshot }) {
  const sub = snapshot.subscription;
  const stats: { label: string; value: React.ReactNode; sub?: string }[] = [
    { label: "Tier", value: sub?.tier ?? "—", sub: sub ? sub.status : "no subscription" },
    { label: "Price", value: fmtMoney(sub?.unit_amount_pence, sub?.currency), sub: sub?.interval ? `per ${sub.interval}` : undefined },
    { label: "Next renewal", value: fmtDate(sub?.current_period_end), sub: sub?.cancel_at_period_end ? "cancels at period end" : undefined },
    { label: "Trial ends", value: fmtDate(sub?.trial_end), sub: sub?.trial_end ? undefined : "no trial" },
    { label: "Joined", value: fmtDate(snapshot.created_at) },
    { label: "Last sign-in", value: fmtDate(snapshot.last_sign_in_at) },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Snapshot</CardTitle>
          <CardDescription>The 30-second read on this member.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-white/55">{s.label}</span>
                <span className="text-sm text-white">{s.value}</span>
                {s.sub && <span className="text-xs text-white/45">{s.sub}</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identifiers</CardTitle>
          <CardDescription>Cross-reference into Stripe and the database.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <IdRow label="User id" value={snapshot.user_id} />
          <Separator />
          <IdRow label="Stripe customer" value={snapshot.stripe_customer_id} href={snapshot.stripe_customer_id ? `https://dashboard.stripe.com/customers/${snapshot.stripe_customer_id}` : undefined} />
          <Separator />
          <IdRow label="Stripe subscription" value={sub?.id ?? null} href={sub?.id ? `https://dashboard.stripe.com/subscriptions/${sub.id}` : undefined} />
          <Separator />
          <IdRow label="Public slug" value={snapshot.slug} href={snapshot.slug ? `/c/${snapshot.slug}` : undefined} internal />
        </CardContent>
      </Card>
    </div>
  );
}

function IdRow({ label, value, href, internal }: { label: string; value: string | null; href?: string; internal?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs uppercase tracking-wide text-white/55">{label}</span>
      {value ? (
        href ? (
          internal ? (
            <Link to={href} className="font-mono text-xs text-reps-orange hover:underline">{value}</Link>
          ) : (
            <a href={href} target="_blank" rel="noreferrer" className="font-mono text-xs text-reps-orange hover:underline">
              {value} ↗
            </a>
          )
        ) : (
          <code className="text-xs text-white/80">{value}</code>
        )
      ) : (
        <span className="text-xs text-white/45">—</span>
      )}
    </div>
  );
}

function VerificationPane({ snapshot }: { snapshot: Member360Snapshot }) {
  const v = snapshot.verification ?? "missing";
  const tone =
    v === "verified" ? "emerald" :
    v === "pending" ? "amber" :
    v === "rejected" ? "rose" : "muted";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Verification status</CardTitle>
        <CardDescription>
          The 3-pillar gate (ID · Qualification · Insurance) computed by the platform trigger.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          {tone === "emerald" && <CheckCircle2 className="text-emerald-300" />}
          {tone === "amber" && <Clock className="text-amber-300" />}
          {tone === "rose" && <XCircle className="text-rose-300" />}
          {tone === "muted" && <Clock className="text-white/50" />}
          <span className="text-sm text-white">Overall: <span className="font-semibold capitalize">{v}</span></span>
        </div>
        <Separator />
        <p className="text-sm text-white/60">
          Per-pillar drill-down and inline approve / reject lands in the next pass. For now, manage at the dedicated workspace.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/verification">
              <ShieldCheck data-icon="inline-start" /> Open verification workspace
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityPane({ data, loading }: { data: Awaited<ReturnType<typeof getMemberTimeline>> | undefined; loading: boolean }) {
  const groups = useMemo(() => {
    if (!data) return [] as [string, typeof data.events][];
    const m = new Map<string, typeof data.events>();
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
    <div className="space-y-6">
      {groups.map(([day, evs]) => (
        <section key={day}>
          <div className="mb-2 text-xs uppercase tracking-wide text-white/55">
            {new Date(day).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
          </div>
          <ol className="ml-4 border-l border-reps-border/60">
            {evs.map((e, i) => (
              <li key={`${e.ts}-${i}`} className="relative py-2 pl-4">
                <span className={`absolute -left-[5px] top-3 size-2 rounded-full ${SOURCE_DOT_CLASSES[e.source]}`} />
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-xs tabular-nums text-white/55">{e.ts.slice(11, 19)}</span>
                  <SourcePill source={e.source} />
                  <span className="font-mono text-xs text-white/70">{e.type}</span>
                  {e.status && <span className="text-[10px] uppercase tracking-wide text-white/45">{e.status}</span>}
                  {e.externalUrl && (
                    <a href={e.externalUrl} target="_blank" rel="noreferrer" className="text-xs text-reps-orange hover:underline">↗</a>
                  )}
                </div>
                <div className="mt-0.5 text-sm text-white/85">{e.summary}</div>
              </li>
            ))}
          </ol>
        </section>
      ))}
      {data.truncated && (
        <div className="text-xs text-white/45">Showing first 200 events.</div>
      )}
    </div>
  );
}

/* ───────────────────────── Helpers ───────────────────────── */

function PaneSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

function SoonEmpty({ title, description }: { title: string; description: string }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UserIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Badge variant="outline">Shipping in the next pass</Badge>
      </EmptyContent>
    </Empty>
  );
}
