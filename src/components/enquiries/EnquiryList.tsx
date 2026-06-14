import * as React from "react";
import { cn } from "@/lib/utils";
import type { EnquiryDTO } from "@/lib/enquiries/enquiries.functions";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}

function initials(name: string) {
  return name.split(/\s+/).map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export type EnquiryTab = "all" | "new" | "replied" | "archived";

export function EnquiryList({
  enquiries,
  selectedId,
  onSelect,
  tab,
  onTabChange,
  search,
  onSearchChange,
}: {
  enquiries: EnquiryDTO[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  tab: EnquiryTab;
  onTabChange: (v: EnquiryTab) => void;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  const counts = React.useMemo(() => {
    const c = { all: enquiries.length, new: 0, replied: 0, archived: 0 };
    for (const e of enquiries) {
      if (e.status === "new" || e.status === "read") c.new++;
      else if (e.status === "replied") c.replied++;
      else if (e.status === "archived") c.archived++;
    }
    return c;
  }, [enquiries]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return enquiries.filter((e) => {
      if (tab === "new" && !(e.status === "new" || e.status === "read")) return false;
      if (tab === "replied" && e.status !== "replied") return false;
      if (tab === "archived" && e.status !== "archived") return false;
      if (q && !(e.sender_name.toLowerCase().includes(q) || e.message.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [enquiries, tab, search]);

  const tabs: Array<{ key: EnquiryTab; label: string; count: number }> = [
    { key: "all", label: "All", count: counts.all },
    { key: "new", label: "New", count: counts.new },
    { key: "replied", label: "Replied", count: counts.replied },
    { key: "archived", label: "Archived", count: counts.archived },
  ];

  return (
    <div className="flex h-full flex-col rounded-[18px] border border-reps-border bg-reps-panel">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-reps-border/60 px-3 py-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => onTabChange(t.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors",
              tab === t.key
                ? "bg-reps-orange text-white"
                : "text-white/65 hover:bg-reps-panel-soft hover:text-white",
            )}
          >
            {t.label}
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
              tab === t.key ? "bg-white/20 text-white" : "bg-reps-panel-soft text-white/55",
            )}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-3 pt-3">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search enquiries…"
          className="h-9 w-full rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[12.5px] text-white placeholder:text-white/45 focus:outline-none focus:ring-1 focus:ring-reps-orange"
        />
      </div>

      {/* Rows */}
      <div className="mt-2 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-[12.5px] text-white/45">No enquiries here.</div>
        ) : (
          filtered.map((e) => {
            const active = e.id === selectedId;
            const unread = e.status === "new";
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => onSelect(e.id)}
                className={cn(
                  "flex w-full items-start gap-3 border-b border-reps-border/40 px-4 py-3.5 text-left transition-colors",
                  active ? "bg-reps-orange-soft/15" : "hover:bg-reps-panel-soft/60",
                )}
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-full bg-reps-orange-soft text-[10.5px] font-bold text-reps-orange">
                  {initials(e.sender_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[13px] font-semibold text-white">{e.sender_name}</span>
                    <span className="shrink-0 text-[11px] text-white/45">{timeAgo(e.created_at)}</span>
                  </div>
                  <div className="mt-0.5 line-clamp-2 text-[12px] text-white/65">{e.message}</div>
                  <div className="mt-1.5 flex items-center gap-2">
                    {e.goals[0] ? (
                      <span className="rounded-full bg-reps-panel-soft px-2 py-0.5 text-[10.5px] text-white/70">{e.goals[0]}</span>
                    ) : null}
                    {e.location ? (
                      <span className="text-[10.5px] text-white/45">{e.location}</span>
                    ) : null}
                  </div>
                </div>
                {unread ? <span className="mt-1.5 size-2 shrink-0 rounded-full bg-reps-orange" /> : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
