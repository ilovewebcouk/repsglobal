import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMemberTimeline, type TimelineSource } from "@/lib/ops/timeline.functions";
import {
  SourcePill,
  SOURCE_DOT_CLASSES,
  ALL_TIMELINE_SOURCES,
} from "@/components/ops/source-pill";

export const Route = createFileRoute("/admin_/ops/member/$userId")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({ meta: [{ title: "Member timeline — REPS Ops" }] }),
  component: MemberPage,
});

function MemberPage() {
  const { userId } = Route.useParams();
  const getFn = useServerFn(getMemberTimeline);
  const q = useQuery({
    queryKey: ["ops-member-timeline", userId],
    queryFn: () => getFn({ data: { user_id: userId, limit: 500 } }),
  });
  const [enabled, setEnabled] = useState<Set<TimelineSource>>(new Set(ALL_TIMELINE_SOURCES));
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!q.data) return [];
    const s = search.trim().toLowerCase();
    return q.data.events.filter((e) =>
      enabled.has(e.source) && (!s || e.summary.toLowerCase().includes(s) || e.type.toLowerCase().includes(s) || (e.entityId ?? "").toLowerCase().includes(s)),
    );
  }, [q.data, enabled, search]);

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
    if (next.has(s)) next.delete(s); else next.add(s);
    setEnabled(next);
  }

  const subtitle = q.data ? `${q.data.full_name ?? "Unnamed"} · ${q.data.email ?? "no email"}` : "Loading…";

  return (
    <DashboardShell role="admin" active="Operations" title="Member timeline" subtitle={subtitle}>
      <div className="space-y-4 p-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 rounded-[16px] border border-reps-border bg-reps-panel/40 p-3">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search summary, type, or id…"
            className="max-w-sm bg-reps-ink/40" />
          {q.data?.stripe_customer_id && (
            <a href={`https://dashboard.stripe.com/customers/${q.data.stripe_customer_id}`} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline">Open in Stripe</Button>
            </a>
          )}
          <div className="ml-auto flex flex-wrap gap-1">
            {ALL_TIMELINE_SOURCES.map((s) => (
              <SourcePill key={s} source={s} as="button" active={enabled.has(s)} onClick={() => toggle(s)} />
            ))}
          </div>
        </div>

        {q.isLoading && <div className="text-reps-text/60">Loading timeline…</div>}
        {q.error && <div className="text-rose-300">Failed to load: {(q.error as Error).message}</div>}

        {groups.map(([day, evs]) => (
          <section key={day}>
            <div className="sticky top-0 z-10 -mx-6 mb-2 bg-reps-ink/95 px-6 py-2 text-xs uppercase tracking-wide text-reps-text/60">
              {new Date(day).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
            </div>
            <ol className="ml-4 border-l border-reps-border/60">
              {evs.map((e, i) => (
                <li key={`${e.ts}-${i}`} className="relative pl-4 py-2">
                  <span className={`absolute -left-[5px] top-3 size-2 rounded-full ${SOURCE_DOT_CLASSES[e.source]}`} />
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-xs tabular-nums text-reps-text/60">{e.ts.slice(11, 19)}</span>
                    <SourcePill source={e.source} />
                    <span className="font-mono text-xs text-reps-text/70">{e.type}</span>
                    {e.status && <span className="text-[10px] uppercase tracking-wide text-reps-text/50">{e.status}</span>}
                    {e.externalUrl && <a href={e.externalUrl} target="_blank" rel="noreferrer" className="text-xs text-reps-orange hover:underline">↗</a>}
                  </div>
                  <div className="mt-0.5 text-sm text-reps-text/90">{e.summary}</div>
                </li>
              ))}
            </ol>
          </section>
        ))}

        {q.data && filtered.length === 0 && (
          <div className="rounded-[16px] border border-reps-border bg-reps-panel/40 p-8 text-center text-reps-text/60">
            No events match the current filters.
          </div>
        )}
        {q.data?.truncated && (
          <div className="text-xs text-reps-text/50">Showing first 500 events. Use filters to narrow down.</div>
        )}
      </div>
    </DashboardShell>
  );
}
