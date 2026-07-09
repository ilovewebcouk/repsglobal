import { useState, useRef, useEffect, useCallback } from "react";
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

const MAX_SUGGESTIONS = 8;

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
  const [suggesting, setSuggesting] = useState(false);
  const [matches, setMatches] = useState<MemberMatch[]>([]);
  const [highlight, setHighlight] = useState(-1);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const reqIdRef = useRef(0);

  const openTo = useCallback(
    (userId: string) => {
      setMatches([]);
      setOpen(false);
      setHighlight(-1);
      navigate({ to: target, params: { userId } });
    },
    [navigate, target],
  );

  async function go(query?: string) {
    const v = normaliseQuery(query ?? q);
    if (!v) return;
    setBusy(true);
    try {
      const rows = await find({ data: { q: v } });
      if (rows.length === 0) {
        toast.info(`No matches for "${v}"`);
        setMatches([]);
        setOpen(false);
      } else if (rows.length === 1) {
        openTo(rows[0].user_id);
      } else {
        setMatches(rows.slice(0, MAX_SUGGESTIONS));
        setOpen(true);
        setHighlight(0);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Debounced autocomplete
  useEffect(() => {
    const v = normaliseQuery(q);
    if (v.length < 2) {
      setMatches([]);
      setSuggesting(false);
      setOpen(false);
      return;
    }
    const myReq = ++reqIdRef.current;
    setSuggesting(true);
    const t = setTimeout(async () => {
      try {
        const rows = await find({ data: { q: v } });
        if (reqIdRef.current !== myReq) return; // stale
        setMatches(rows.slice(0, MAX_SUGGESTIONS));
        setOpen(rows.length > 0);
        setHighlight(rows.length > 0 ? 0 : -1);
      } catch {
        // silent for autocomplete; explicit Enter surfaces errors
      } finally {
        if (reqIdRef.current === myReq) setSuggesting(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, find]);

  // Click-away
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

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

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      if (matches.length === 0) return;
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => (h + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      if (matches.length === 0) return;
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => (h <= 0 ? matches.length - 1 : h - 1));
    } else if (e.key === "Enter") {
      if (open && highlight >= 0 && matches[highlight]) {
        e.preventDefault();
        openTo(matches[highlight].user_id);
      } else {
        void go();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlight(-1);
    }
  }

  const showLoader = busy || suggesting;

  const suggestions = open && matches.length > 0 && (
    <div
      className={
        variant === "topbar"
          ? "absolute z-30 mt-1 max-h-80 w-[320px] overflow-auto rounded-[12px] border border-reps-border bg-reps-ink/95 p-1 shadow-xl"
          : "absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-[12px] border border-reps-border bg-reps-ink/95 p-1 shadow-xl"
      }
    >
      {matches.map((m, i) => (
        <button
          key={`${m.user_id}-${m.match_kind}`}
          type="button"
          onMouseEnter={() => setHighlight(i)}
          onClick={() => openTo(m.user_id)}
          className={`flex w-full items-center justify-between gap-3 rounded-[8px] px-3 py-2 text-left text-sm ${
            i === highlight ? "bg-reps-panel/60" : "hover:bg-reps-panel/60"
          }`}
        >
          <div className="min-w-0">
            <div className={`truncate font-medium ${variant === "topbar" ? "text-white" : ""}`}>
              {m.full_name ?? "Unnamed"}
            </div>
            <div className={`truncate text-xs ${variant === "topbar" ? "text-white/60" : "text-reps-text/60"}`}>
              {m.email ?? m.user_id}
            </div>
          </div>
          <Badge variant="outline" className="shrink-0 border-white/20 bg-reps-panel-soft text-[10px] uppercase text-white/70">
            {m.match_kind.replace("_", "")}
          </Badge>
        </button>
      ))}
    </div>
  );

  if (variant === "topbar") {
    return (
      <div ref={wrapRef} className={`relative ${className}`}>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/45" />
        {showLoader ? (
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
          onFocus={() => matches.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="h-10 w-[260px] rounded-[12px] border border-reps-border bg-reps-panel pl-9 pr-12 text-[12.5px] text-white placeholder:text-white/45 shadow-none transition-colors focus-visible:outline-none focus-visible:border-reps-orange/60 focus-visible:bg-reps-panel-soft"
        />
        {suggestions}
      </div>
    );
  }

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        <Search className="size-4 text-reps-text/60" aria-hidden />
        <Input
          ref={inputRef}
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => matches.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="bg-reps-ink/40"
        />
        <Button onClick={() => void go()} disabled={busy || q.trim().length === 0}>
          {showLoader ? <Loader2 className="size-4 animate-spin" /> : "Open"}
        </Button>
      </div>
      {suggestions}
    </div>
  );
}
