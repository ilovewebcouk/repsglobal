import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Mail, ShieldCheck, User, X } from "lucide-react";
import {
  searchSupportRecipients,
  type RecipientHit,
} from "@/lib/support/tickets.functions";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RecipientValue = {
  email: string;
  name?: string;
  picked?: RecipientHit | null;
};

export function RecipientPicker({
  email,
  onChange,
  autoFocus,
}: {
  email: string;
  /** Called with email + (optional) display name when the user picks or types. */
  onChange: (next: { email: string; name?: string }) => void;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = React.useState(email);
  const [debounced, setDebounced] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [cursor, setCursor] = React.useState(0);
  const [picked, setPicked] = React.useState<RecipientHit | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const searchFn = useServerFn(searchSupportRecipients);

  // Parent reset (e.g. dialog closes / send succeeds) → clear local state.
  React.useEffect(() => {
    if (email === "") {
      setPicked(null);
      setQuery("");
    }
  }, [email]);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 200);
    return () => clearTimeout(t);
  }, [query]);

  const looksLikeEmail = EMAIL_RE.test(query.trim());
  const enabled = debounced.length >= 2 && !looksLikeEmail && !picked;

  const { data: hits = [], isFetching } = useQuery({
    queryKey: ["support", "recipient-search", debounced],
    queryFn: () => searchFn({ data: { q: debounced } }),
    enabled,
    staleTime: 30_000,
  });

  React.useEffect(() => setCursor(0), [debounced]);

  function pick(hit: RecipientHit) {
    setPicked(hit);
    onChange({ email: hit.email, name: hit.name ?? undefined });
    setQuery(hit.email);
    setOpen(false);
  }

  function clear() {
    setPicked(null);
    onChange({ email: "", name: undefined });
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || hits.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter" && !looksLikeEmail) {
      e.preventDefault();
      pick(hits[cursor]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  // Picked chip view
  if (picked) {
    const h = picked;
    return (
      <div className="mt-1 flex items-center gap-2 rounded-[12px] border border-reps-border bg-white/[0.04] px-3 py-2">
        <span className="flex size-7 items-center justify-center rounded-full bg-reps-orange-soft text-[12px] font-semibold text-reps-orange">
          {(h.name ?? h.email).slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 truncate text-[13px] font-medium text-white">
            <span className="truncate">{h.name ?? h.email}</span>
            <TierChip tier={h.tier} kind={h.kind} />
          </div>
          {h.name ? (
            <div className="truncate text-[11.5px] text-white/55">{h.email}</div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={clear}
          className="flex size-7 items-center justify-center rounded-[8px] text-white/55 hover:bg-white/5 hover:text-white"
          aria-label="Clear recipient"
        >
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={query}
        autoFocus={autoFocus}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          onChange({ email: e.target.value, name: value.name, picked: null });
        }}
        onKeyDown={onKeyDown}
        placeholder="Search trainer or type email…"
        autoComplete="off"
        className="mt-1 bg-white/[0.04] border-reps-border text-white"
      />
      {open && (enabled || hits.length > 0) ? (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-[12px] border border-reps-border bg-reps-panel shadow-[0_12px_32px_-12px_rgba(0,0,0,0.7)]">
          {isFetching && hits.length === 0 ? (
            <div className="px-3 py-3 text-[12.5px] text-white/55">Searching…</div>
          ) : hits.length === 0 ? (
            <div className="px-3 py-3 text-[12.5px] text-white/55">
              {looksLikeEmail
                ? `Press Enter to use "${query.trim()}" as a free email.`
                : "No matches. Type a full email to send to a non-REPs contact."}
            </div>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {hits.map((h, i) => (
                <li key={`${h.email}-${i}`}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(h);
                    }}
                    onMouseEnter={() => setCursor(i)}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left",
                      i === cursor ? "bg-white/[0.05]" : "hover:bg-white/[0.03]",
                    )}
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-reps-orange-soft text-[12px] font-semibold text-reps-orange">
                      {(h.name ?? h.email).slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[13px] font-medium text-white">
                          {h.name ?? h.email}
                        </span>
                        <TierChip tier={h.tier} kind={h.kind} />
                      </span>
                      <span className="block truncate text-[11.5px] text-white/55">
                        {h.email}
                      </span>
                    </span>
                    {i === cursor ? (
                      <Check className="size-3.5 shrink-0 text-reps-orange" />
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function TierChip({
  tier,
  kind,
}: {
  tier?: "verified" | "pro" | "studio" | null;
  kind: RecipientHit["kind"];
}) {
  if (kind === "contact") {
    return (
      <Badge
        variant="outline"
        className="h-4 gap-1 border-white/10 px-1.5 text-[10px] font-medium text-white/55"
      >
        <Mail className="size-2.5" /> contact
      </Badge>
    );
  }
  if (kind === "client") {
    return (
      <Badge
        variant="outline"
        className="h-4 gap-1 border-white/10 px-1.5 text-[10px] font-medium text-white/55"
      >
        <User className="size-2.5" /> client
      </Badge>
    );
  }
  if (!tier) {
    return (
      <Badge
        variant="outline"
        className="h-4 px-1.5 text-[10px] font-medium border-white/10 text-white/55"
      >
        pro
      </Badge>
    );
  }
  const label = tier === "verified" ? "Verified" : tier === "pro" ? "Pro" : "Studio";
  return (
    <Badge
      variant="outline"
      className="h-4 gap-1 border-emerald-400/30 bg-emerald-500/15 px-1.5 text-[10px] font-medium text-emerald-300"
    >
      <ShieldCheck className="size-2.5" /> {label}
    </Badge>
  );
}
