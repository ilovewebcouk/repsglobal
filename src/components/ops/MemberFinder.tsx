import { useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { findMember, type MemberMatch } from "@/lib/ops/member-finder.functions";

interface Props {
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  // Destination route for the matched member.
  target?: "/admin/members/$userId";
}

export function MemberFinder({
  placeholder = "Find member by email, user id, cus_…, sub_… or BD id",
  className = "",
  autoFocus,
  target = "/admin/members/$userId",
}: Props) {

  const navigate = useNavigate();
  const find = useServerFn(findMember);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [matches, setMatches] = useState<MemberMatch[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function go(query?: string) {
    const v = (query ?? q).trim();
    if (!v) return;
    setBusy(true);
    try {
      const rows = await find({ data: { q: v } });
      if (rows.length === 0) {
        toast.info("No matches");
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
