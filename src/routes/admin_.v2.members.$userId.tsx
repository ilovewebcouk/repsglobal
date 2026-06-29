// Admin v2 — Member 360 page.
//
// Composes the Stripe-mirror snapshot (canonical billing) with the existing
// event timeline. Single URL per member; safe to deep-link from /admin/v2
// surfaces and from Stripe webhooks.

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MemberFinder } from "@/components/ops/MemberFinder";
import { MemberSnapshotCard } from "@/components/admin/v2/MemberSnapshotCard";
import {
  SourcePill,
  SOURCE_DOT_CLASSES,
  ALL_TIMELINE_SOURCES,
} from "@/components/ops/source-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { getMember360 } from "@/lib/admin/member360.functions";
import { getMemberTimeline, type TimelineSource } from "@/lib/ops/timeline.functions";

export const Route = createFileRoute("/admin_/v2/members/$userId")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({ meta: [{ title: "Member 360 — REPS Admin v2" }] }),
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

  const subtitle = snap.data
    ? `${snap.data.full_name ?? "Unnamed"} · ${snap.data.email ?? "no email"}`
    : "Loading…";

  return (
    <DashboardShell
      role="admin"
      active="Operations"
      title="Member 360"
      subtitle={subtitle}
    >
      <div className="flex flex-col gap-6 p-6">
        <MemberFinder target="/admin/v2/members/$userId" placeholder="Find another member by email, id, cus_, sub_, BD id…" />

        {snap.isLoading && <Skeleton className="h-64 w-full" />}
        {snap.error && (
          <Alert variant="destructive">
            <AlertTitle>Failed to load member snapshot</AlertTitle>
            <AlertDescription>{(snap.error as Error).message}</AlertDescription>
          </Alert>
        )}
        {snap.data && <MemberSnapshotCard snapshot={snap.data} />}

        <Card>
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
              <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                No events match the current filters.
              </div>
            )}
            {timeline.data?.truncated && (
              <div className="text-xs text-muted-foreground">
                Showing first 500 events. Use filters to narrow down.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
