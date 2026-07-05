import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { findMember, type MemberMatch } from "@/lib/ops/member-finder.functions";

function normaliseQuery(raw: string): string {
  const cleaned = raw.replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/^["'`\s]+|["'`\s]+$/g, "");
  const uuid = cleaned.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (uuid) return uuid[0].toLowerCase();
  const stripe = cleaned.match(/\b(cus|sub)_[A-Za-z0-9]+/);
  if (stripe) return stripe[0];
  return cleaned;
}

interface Props {
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  /** Destination route for the matched member. */
  target?: "/admin/members/$userId";
  /** Visual variant. `topbar` matches the dashboard search style. */
  variant?: "default" | "topbar";
}

export function MemberFinder({
  placeholder = "Find member by email, user id, cus_…, sub_… or BD id",
  className = "",
  autoFocus,
  target = "/admin/members/$userId",
  variant = "default",
}: Props) {
  const navigate = useNavigate();
  const find = useServerFn(findMember);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [matches, setMatches] = useState<MemberMatch[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function go(query?: string) {
    const v = normaliseQuery(query ?? q);
    if (!v) return;
    setBusy(true);
    try {
      const rows = await find({ data: { q: v } });
      if (rows.length === 0) {
        toast.info(`No matches for "${v}"`);
        setMatches([]);
      } else if (rows.length === 1) {
        setMatches([]);
        navigate({ to: target, params: { userId: rows[0].user_id } });
      } else {
        setMatches(rows);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // ⌘K focuses the topbar variant input.
  useEffect(() => {
    if (variant !== "topbar") return;
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [variant]);

  if (variant === "topbar") {
    return (
      <div className={`relative ${className}`}>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/45" />
        {busy ? (
          <Loader2 className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-white/55" />
        ) : (
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-[6px] border border-reps-border bg-reps-panel-soft px-1.5 py-0.5 text-[10px] font-medium text-white/55">
            ⌘K
          </kbd>
        )}
        <input
          ref={inputRef}
          type="search"
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void go();
            if (e.key === "Escape") setMatches([]);
          }}
          placeholder={placeholder}
          className="h-10 w-[260px] rounded-[12px] border border-reps-border bg-reps-panel pl-9 pr-12 text-[12.5px] text-white placeholder:text-white/45 shadow-none transition-colors focus-visible:outline-none focus-visible:border-reps-orange/60 focus-visible:bg-reps-panel-soft"
        />
        {matches.length > 0 && (
          <div className="absolute z-30 mt-1 max-h-80 w-[320px] overflow-auto rounded-[12px] border border-reps-border bg-reps-ink/95 p-1 shadow-xl">
            {matches.map((m) => (
              <button
                key={`${m.user_id}-${m.match_kind}`}
                type="button"
                onClick={() => {
                  setMatches([]);
                  setQ("");
                  navigate({ to: target, params: { userId: m.user_id } });
                }}
                className="flex w-full items-center justify-between gap-3 rounded-[8px] px-3 py-2 text-left text-sm hover:bg-reps-panel/60"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-white">{m.full_name ?? "Unnamed"}</div>
                  <div className="truncate text-xs text-white/60">{m.email ?? m.user_id}</div>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px] uppercase">
                  {m.match_kind.replace("_", " ")}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        <Search className="size-4 text-reps-text/60" aria-hidden />
        <Input
          ref={inputRef}
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void go(); }}
          placeholder={placeholder}
          className="bg-reps-ink/40"
        />
        <Button onClick={() => void go()} disabled={busy || q.trim().length === 0}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : "Open"}
        </Button>
      </div>
      {matches.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-[12px] border border-reps-border bg-reps-ink/95 p-1 shadow-xl">
          {matches.map((m) => (
            <button
              key={`${m.user_id}-${m.match_kind}`}
              type="button"
              onClick={() => {
                setMatches([]);
                navigate({ to: target, params: { userId: m.user_id } });
              }}
              className="flex w-full items-center justify-between gap-3 rounded-[8px] px-3 py-2 text-left text-sm hover:bg-reps-panel/60"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{m.full_name ?? "Unnamed"}</div>
                <div className="truncate text-xs text-reps-text/60">{m.email ?? m.user_id}</div>
              </div>
              <Badge variant="outline" className="shrink-0 text-[10px] uppercase">
                {m.match_kind.replace("_", " ")}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
