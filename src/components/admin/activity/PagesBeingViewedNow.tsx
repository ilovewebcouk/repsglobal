// Pages Being Viewed Now — build contract §16.
// Unions member current-pages with public visitor latest_paths. Zero rows never render.

import { useMemo } from "react";
import { cn } from "@/lib/utils";

export interface PagesBeingViewedNowProps {
  memberPages: Array<{
    path: string;
    online_count: number;
    avatars: Array<{ user_id: string; name: string; avatar_url: string | null }>;
  }>;
  publicVisitors: Array<{
    latest_path: string | null;
    status: "live" | "recent" | "stale";
    last_seen_at: string;
    visitor_label?: string | null;
  }>;
  loading?: boolean;
  onOpenPath?: (path: string) => void;
}

interface Row {
  path: string;
  total: number;
  members: number;
  publicCount: number;
  lastActivityAt: string;
  memberAvatars: Array<{ user_id: string; name: string; avatar_url: string | null }>;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.max(0, Math.round(diff / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
}

export function PagesBeingViewedNow({ memberPages, publicVisitors, loading, onOpenPath }: PagesBeingViewedNowProps) {
  const rows = useMemo<Row[]>(() => {
    const map = new Map<string, Row>();
    for (const mp of memberPages) {
      if (!mp.path || mp.online_count <= 0) continue;
      map.set(mp.path, {
        path: mp.path,
        total: mp.online_count,
        members: mp.online_count,
        publicCount: 0,
        lastActivityAt: new Date().toISOString(),
        memberAvatars: mp.avatars ?? [],
      });
    }
    for (const v of publicVisitors) {
      if (!v.latest_path || v.status === "stale") continue;
      const existing = map.get(v.latest_path);
      if (existing) {
        existing.publicCount += 1;
        existing.total += 1;
        if (v.last_seen_at > existing.lastActivityAt) existing.lastActivityAt = v.last_seen_at;
      } else {
        map.set(v.latest_path, {
          path: v.latest_path,
          total: 1,
          members: 0,
          publicCount: 1,
          lastActivityAt: v.last_seen_at,
          memberAvatars: [],
        });
      }
    }
    return Array.from(map.values())
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [memberPages, publicVisitors]);

  return (
    <section className="rounded-[18px] border border-reps-border bg-reps-panel">
      <header className="flex items-center gap-2 border-b border-reps-border/70 px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-orange-400" />
        <h2 className="font-display text-[13.5px] font-semibold text-white">Pages being viewed now</h2>
        <span className="text-[10.5px] text-white/45">Live · last 5 min</span>
      </header>
      <div className="divide-y divide-reps-border/50">
        {loading && rows.length === 0 ? (
          <div className="px-4 py-6 text-[12px] text-white/50">Loading active pages…</div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-6 text-[12px] text-white/55">No pages being viewed right now</div>
        ) : (
          rows.map((r) => (
            <button
              key={r.path}
              type="button"
              onClick={() => onOpenPath?.(r.path)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-white/[0.03]",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-[12px] text-white">{r.path}</div>
                <div className="mt-0.5 text-[10.5px] text-white/55">
                  {r.publicCount > 0 ? `${r.publicCount} public` : null}
                  {r.publicCount > 0 && r.members > 0 ? " · " : null}
                  {r.members > 0 ? `${r.members} member${r.members === 1 ? "" : "s"}` : null}
                  {" · last activity "}{timeAgo(r.lastActivityAt)}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {r.memberAvatars.slice(0, 3).map((a) => (
                  <span
                    key={a.user_id}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-reps-border bg-white/10 text-[10px] font-semibold text-white"
                    title={a.name}
                  >
                    {a.name?.charAt(0).toUpperCase() ?? "?"}
                  </span>
                ))}
                {r.publicCount > 0 ? (
                  <span className="inline-flex h-6 items-center rounded-full border border-reps-border bg-white/5 px-2 text-[10px] font-medium text-white/70">
                    +{r.publicCount} public
                  </span>
                ) : null}
                <span className="ml-1 font-display text-[16px] font-semibold text-white">{r.total}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
