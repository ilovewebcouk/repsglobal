// Admin v2 — Member 360.
//
// 3-col grid inside the v2 sidebar shell: identity + actions on the sides,
// Stripe-mirror snapshot + activity timeline in the centre.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Copy, ExternalLink, Mail, RefreshCw, UserCircle } from "lucide-react";

import { requireRole } from "@/lib/route-gates";
import { MemberSnapshotCard } from "@/components/admin/v2/MemberSnapshotCard";
import { Monogram } from "@/components/directory/Monogram";
import {
  SourcePill,
  SOURCE_DOT_CLASSES,
  ALL_TIMELINE_SOURCES,
} from "@/components/ops/source-pill";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";

import { getMember360 } from "@/lib/admin/member360.functions";
import { getMemberTimeline, type TimelineSource } from "@/lib/ops/timeline.functions";

export const Route = createFileRoute("/admin_/v2/members/$userId")({
  head: () => ({ meta: [{ title: "Member 360 — REPs Admin v2" }] }),
  component: Member360Page,
});

function Member360Page() {
  const { userId } = Route.useParams();
  const get360 = useServerFn(getMember360);
  const getTimeline = useServerFn(getMemberTimeline);

  const snap = useQuery({
    queryKey: ["admin-v2-member-360", userId],
    queryFn: () => get360({ data: { user_id: userId } }),
  });
  const timeline = useQuery({
    queryKey: ["admin-v2-member-timeline", userId],
    queryFn: () => getTimeline({ data: { user_id: userId, limit: 500 } }),
  });

  const [enabled, setEnabled] = useState<Set<TimelineSource>>(new Set(ALL_TIMELINE_SOURCES));
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!timeline.data) return [];
    const s = search.trim().toLowerCase();
    return timeline.data.events.filter(
      (e) =>
        enabled.has(e.source) &&
        (!s ||
          e.summary.toLowerCase().includes(s) ||
          e.type.toLowerCase().includes(s) ||
          (e.entityId ?? "").toLowerCase().includes(s)),
    );
  }, [timeline.data, enabled, search]);

  const groups = useMemo(() => {
    const m = new Map<string, typeof filtered>();
    for (const e of filtered) {
      const day = e.ts.slice(0, 10);
      if (!m.has(day)) m.set(day, []);
      m.get(day)!.push(e);
    }
    return [...m.entries()];
  }, [filtered]);

  function toggle(s: TimelineSource) {
    const next = new Set(enabled);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    setEnabled(next);
  }

  function copy(text: string | null | undefined) {
    if (!text) return;
    void navigator.clipboard.writeText(text);
  }

  const name = snap.data?.full_name ?? snap.data?.email ?? "Member";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">{name}</h1>
        <p className="text-sm text-muted-foreground">
          {snap.data?.email ?? "Loading member identity…"}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr_240px]">
        {/* Identity column */}
        <Card className="rounded-[18px] shadow-none">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
              Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 text-center">
            <Monogram name={name} size={72} />
            <div className="flex flex-col gap-0.5">
              <div className="font-display text-base font-semibold">{name}</div>
              <div className="break-all text-xs text-muted-foreground">
                {snap.data?.email ?? "—"}
              </div>
            </div>
            <Separator />
            <div className="flex w-full flex-col gap-2 text-left">
              <IdRow label="User id" value={userId} onCopy={() => copy(userId)} />
              {snap.data?.snapshot?.customer_id && (
                <IdRow
                  label="Stripe customer"
                  value={snap.data.snapshot.customer_id}
                  onCopy={() => copy(snap.data?.snapshot?.customer_id)}
                />
              )}
              {snap.data?.snapshot?.subscription_id && (
                <IdRow
                  label="Subscription"
                  value={snap.data.snapshot.subscription_id}
                  onCopy={() => copy(snap.data?.snapshot?.subscription_id)}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Centre column */}
        <div className="flex flex-col gap-6">
          {snap.isLoading && <Skeleton className="h-64 w-full" />}
          {snap.error && (
            <Alert variant="destructive">
              <AlertTitle>Failed to load member snapshot</AlertTitle>
              <AlertDescription>{(snap.error as Error).message}</AlertDescription>
            </Alert>
          )}
          {snap.data && <MemberSnapshotCard snapshot={snap.data} />}

          <Card className="rounded-[16px] shadow-none">
            <CardHeader>
              <CardTitle>Activity timeline</CardTitle>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search summary, type, or id…"
                  className="max-w-sm"
                />
                <div className="ml-auto flex flex-wrap gap-1">
                  {ALL_TIMELINE_SOURCES.map((s) => (
                    <SourcePill
                      key={s}
                      source={s}
                      as="button"
                      active={enabled.has(s)}
                      onClick={() => toggle(s)}
                    />
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {timeline.isLoading && <Skeleton className="h-40 w-full" />}
              {timeline.error && (
                <Alert variant="destructive">
                  <AlertTitle>Failed to load timeline</AlertTitle>
                  <AlertDescription>{(timeline.error as Error).message}</AlertDescription>
                </Alert>
              )}
              {groups.map(([day, evs]) => (
                <section key={day} className="flex flex-col gap-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    {new Date(day).toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                  <ol className="ml-4 border-l border-border">
                    {evs.map((e, i) => (
                      <li key={`${e.ts}-${i}`} className="relative py-2 pl-4">
                        <span
                          className={`absolute -left-[5px] top-3 size-2 rounded-full ${SOURCE_DOT_CLASSES[e.source]}`}
                        />
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {e.ts.slice(11, 19)}
                          </span>
                          <SourcePill source={e.source} />
                          <span className="font-mono text-xs text-muted-foreground">{e.type}</span>
                          {e.status && (
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              {e.status}
                            </span>
                          )}
                          {e.externalUrl && (
                            <a
                              href={e.externalUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              ↗
                            </a>
                          )}
                        </div>
                        <div className="mt-0.5 text-sm">{e.summary}</div>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
              {timeline.data && filtered.length === 0 && (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>No events match</EmptyTitle>
                    <EmptyDescription>
                      Try widening the filters or clearing the search.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
              {timeline.data?.truncated && (
                <div className="text-xs text-muted-foreground">
                  Showing first 500 events. Use filters to narrow down.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <Card className="rounded-[18px] shadow-none">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
              Quick actions
            </CardTitle>
            <CardDescription>Phase C2 wires the real handlers.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {snap.data?.snapshot?.customer_id && (
              <Button asChild variant="outline" className="justify-start rounded-[10px] shadow-none">
                <a
                  href={`https://dashboard.stripe.com/customers/${snap.data.snapshot.customer_id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink data-icon="inline-start" />
                  Open in Stripe
                </a>
              </Button>
            )}
            {snap.data?.email && (
              <Button asChild variant="outline" className="justify-start rounded-[10px] shadow-none">
                <a href={`mailto:${snap.data.email}`}>
                  <Mail data-icon="inline-start" />
                  Send email
                </a>
              </Button>
            )}
            <Button asChild variant="outline" className="justify-start rounded-[10px] shadow-none">
              <Link to="/admin/ops/member/$userId" params={{ userId }}>
                <UserCircle data-icon="inline-start" />
                Legacy ops view
              </Link>
            </Button>
            <Button
              variant="outline"
              className="justify-start rounded-[10px] shadow-none"
              onClick={() => {
                void snap.refetch();
                void timeline.refetch();
              }}
            >
              <RefreshCw data-icon="inline-start" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function IdRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <code className="flex-1 truncate rounded-[6px] bg-muted px-1.5 py-0.5 font-mono text-[11px]">
          {value}
        </code>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 shadow-none"
          onClick={onCopy}
          aria-label={`Copy ${label}`}
        >
          <Copy className="size-3" />
        </Button>
      </div>
    </div>
  );
}
