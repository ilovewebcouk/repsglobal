// Admin Activity v1.1 — redesigned feed with grouping + event detail sheet.

import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity, ChevronRight, ExternalLink, Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { ActivityEvent, ActivitySeverity } from "@/lib/ops/activity-feed.functions";
import { getActivityEventDetail, getSessionTrail } from "@/lib/ops/activity-panels.functions";
import { countryFlag, EmptyState, PanelShell, timeAgo } from "./panels";

const SEVERITY_DOT: Record<ActivitySeverity, string> = {
  critical: "bg-rose-500",
  warning: "bg-amber-500",
  success: "bg-emerald-500",
  info: "bg-white/40",
};

const SEVERITY_BADGE: Record<ActivitySeverity, string> = {
  critical: "bg-rose-500/15 text-rose-200",
  warning: "bg-amber-500/15 text-amber-200",
  success: "bg-emerald-500/15 text-emerald-200",
  info: "bg-white/10 text-white/70",
};

function groupKey(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "Now";
  if (s < 15 * 60) return "Last 15 minutes";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 86_400_000);
  const ts = new Date(iso);
  if (ts >= today) return "Today";
  if (ts >= yesterday) return "Yesterday";
  return "Older";
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? "").join("") || "?";
}

export function ActivityFeedV2({
  events, loading, onOpenEvent, compact = false,
}: {
  events: ActivityEvent[]; loading: boolean;
  onOpenEvent: (e: ActivityEvent) => void;
  /** Compact = drop the outer PanelShell (parent already wraps it). */
  compact?: boolean;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, ActivityEvent[]>();
    for (const e of events) {
      const k = groupKey(e.ts);
      const arr = map.get(k) ?? [];
      arr.push(e);
      map.set(k, arr);
    }
    const order = ["Now", "Last 15 minutes", "Today", "Yesterday", "Older"];
    return order.filter((k) => map.has(k)).map((k) => [k, map.get(k)!] as const);
  }, [events]);

  const body = (
    <>
      {loading && !events.length ? (
        <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : events.length === 0 ? (
        <EmptyState icon={Activity} title="No events in this window" hint="Try widening the time range or clearing filters." />
      ) : (
        <div className={cn("divide-y divide-reps-border/60 overflow-auto", compact ? "max-h-[420px]" : "max-h-[720px]") }>
          {grouped.map(([label, list]) => (
            <div key={label}>
              <div className="sticky top-0 z-[1] flex items-center justify-between border-b border-reps-border/60 bg-reps-panel/95 px-4 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/50 backdrop-blur">
                <span>{label}</span>
                <span className="text-white/35">{list.length}</span>
              </div>
              <ul className="divide-y divide-reps-border/40">
                {list.map((e) => {
                  const isCritical = e.severity === "critical";
                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => onOpenEvent(e)}
                        className={cn(
                          "group flex w-full items-start gap-3 px-4 py-2.5 text-left transition hover:bg-white/[0.04]",
                          isCritical && "bg-rose-500/[0.03]",
                        )}
                      >
                        <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", SEVERITY_DOT[e.severity])} />
                        <Badge className={cn("shrink-0 text-[9.5px] uppercase", SEVERITY_BADGE[e.severity])}>{e.source}</Badge>
                        {e.user_label ? (
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarFallback className="bg-reps-panel-soft text-[9px] text-white/70">{initials(e.user_label)}</AvatarFallback>
                          </Avatar>
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <div className={cn(
                            "truncate text-[12.5px]",
                            isCritical ? "font-semibold text-white" : "font-medium text-white/90",
                          )}>
                            {e.summary}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10.5px] text-white/45">
                            <span className="font-mono">{e.type}</span>
                            <span>·</span>
                            <span>{timeAgo(e.ts)}</span>
                          </div>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/30 group-hover:text-white/60" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </>
  );

  if (compact) return body;
  return (
    <PanelShell title="Live activity feed" subtitle="Every business event across REPS" icon={Radio}>
      {body}
    </PanelShell>
  );
}

// ─────────────────────────────────────────────────────── EVENT DETAIL SHEET ──

export function EventDetailSheet({ event, onClose }: { event: ActivityEvent | null; onClose: () => void }) {
  const getDetail = useServerFn(getActivityEventDetail);
  const getTrail = useServerFn(getSessionTrail);

  const rawId = event ? event.id.split(":").slice(1).join(":") : "";
  const source = event?.source;

  const detail = useQuery({
    enabled: Boolean(event && rawId),
    queryKey: ["activity-event-detail", source, rawId],
    queryFn: () => getDetail({ data: { source: source!, id: rawId } }),
  });

  const trail = useQuery({
    enabled: Boolean(event?.user_id) && (source === "session" || source === "auth"),
    queryKey: ["activity-session-trail", event?.user_id],
    queryFn: () => getTrail({ data: { user_id: event!.user_id!, limit: 25 } }),
  });

  return (
    <Sheet open={Boolean(event)} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full overflow-y-auto border-l border-reps-border bg-reps-ink p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-reps-border p-5 text-left">
          <div className="flex items-center gap-2">
            <Badge className={cn(SEVERITY_BADGE[event?.severity ?? "info"], "text-[10px] uppercase")}>
              {event?.source}
            </Badge>
            <span className="text-[10.5px] text-white/45">{event ? timeAgo(event.ts) : ""}</span>
          </div>
          <SheetTitle className="mt-2 text-[16px] font-semibold text-white">
            {event?.summary}
          </SheetTitle>
          <SheetDescription className="font-mono text-[11px] text-white/45">
            {event?.type}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 p-5">
          {/* Member card */}
          {detail.data?.member ? (
            <section className="rounded-[14px] border border-reps-border bg-reps-panel p-4">
              <div className="text-[10.5px] font-semibold uppercase tracking-wide text-white/50">Member</div>
              <div className="mt-2 flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {detail.data.member.avatar_url ? <AvatarImage src={detail.data.member.avatar_url} alt={detail.data.member.name} /> : null}
                  <AvatarFallback className="bg-reps-panel-soft text-[11px] text-white/70">{initials(detail.data.member.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium text-white">{detail.data.member.name}</div>
                  {detail.data.member.email ? <div className="truncate text-[11px] text-white/50">{detail.data.member.email}</div> : null}
                </div>
                <Link
                  to="/admin/members/$userId"
                  params={{ userId: detail.data.member.user_id }}
                  onClick={onClose}
                  className="inline-flex items-center gap-1 rounded-[8px] bg-reps-orange px-3 py-1.5 text-[11px] font-medium text-white hover:opacity-90"
                >
                  Member 360 <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </section>
          ) : detail.isLoading ? <Skeleton className="h-20 w-full rounded-[14px]" /> : null}

          {/* Related links */}
          {detail.data?.related_url ? (
            <a href={detail.data.related_url} className="flex items-center justify-between rounded-[14px] border border-reps-border bg-reps-panel px-4 py-3 text-[12px] text-white/80 hover:bg-white/5">
              <span>Open source record</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}

          {/* Session trail */}
          {trail.data && trail.data.events.length > 0 ? (
            <section className="rounded-[14px] border border-reps-border bg-reps-panel">
              <div className="border-b border-reps-border/60 px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-white/50">
                Recent session trail
              </div>
              <ul className="max-h-64 divide-y divide-reps-border/40 overflow-auto">
                {trail.data.events.map((t, i) => (
                  <li key={`${t.ts}:${i}`} className="flex items-center justify-between gap-3 px-4 py-2 text-[11.5px]">
                    <span className="truncate font-mono text-white/80">{t.path}</span>
                    <span className="shrink-0 text-white/40">{timeAgo(t.ts)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Metadata */}
          <Collapsible>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-[14px] border border-reps-border bg-reps-panel px-4 py-3 text-[11.5px] font-medium text-white/70 hover:bg-white/5">
              Raw metadata
              <ChevronRight className="h-3.5 w-3.5 transition-transform data-[state=open]:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="mt-2 max-h-[300px] overflow-auto rounded-[14px] border border-reps-border bg-reps-ink/60 p-3 font-mono text-[10.5px] leading-relaxed text-white/70">
                {detail.data?.metadata_json ?? (detail.isLoading ? "Loading…" : "No metadata")}
              </pre>
            </CollapsibleContent>
          </Collapsible>

          <div className="text-[10.5px] text-white/35">
            Source · <span className="font-mono">{event?.source}</span> · id{" "}
            <span className="font-mono">{rawId.slice(0, 12)}</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
