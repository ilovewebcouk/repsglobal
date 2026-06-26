import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, FileText, FolderOpen, ArrowRight, ExternalLink } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { HELP_CATEGORIES } from "@/content/help/categories";
import { getArticleSummaries } from "@/content/help/registry";

const DASHBOARD_ACTIONS = [
  { label: "Open verification", to: "/dashboard/verification", keywords: ["id", "identity", "qualification", "insurance"] },
  { label: "Open enquiries", to: "/dashboard/enquiries", keywords: ["inbox", "messages", "leads"] },
  { label: "Open reviews", to: "/dashboard/reviews", keywords: ["rating", "feedback"] },
  { label: "Edit profile", to: "/dashboard/profile", keywords: ["bio", "photo", "slug"] },
  { label: "Account settings", to: "/dashboard/settings", keywords: ["password", "email"] },
  { label: "Pricing & plans", to: "/pricing", keywords: ["billing", "verified", "pro", "studio"] },
] as const;

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const articles = useMemo(() => getArticleSummaries(), []);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const go = (to: string) => {
    onOpenChange(false);
    // Defer to next tick so the dialog can unmount cleanly
    setTimeout(() => navigate({ to }), 0);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        ref={inputRef}
        placeholder="Search help articles or jump to a dashboard page…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No matches. Try “verification” or “reviews”.</CommandEmpty>

        <CommandGroup heading="Articles">
          {articles.map((a) => (
            <CommandItem
              key={`${a.category}/${a.slug}`}
              value={`${a.title} ${a.tags.join(" ")} ${a.summary}`}
              onSelect={() => go(`/help/${a.category}/${a.slug}`)}
            >
              <FileText className="mr-2 size-4 text-white/60" aria-hidden />
              <div className="min-w-0">
                <p className="truncate text-[14px] text-white">{a.title}</p>
                <p className="truncate text-[12px] text-white/55">{a.summary}</p>
              </div>
              <ArrowRight className="ml-auto size-3.5 text-white/40" aria-hidden />
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Categories">
          {HELP_CATEGORIES.map((c) => (
            <CommandItem
              key={c.slug}
              value={`${c.title} ${c.description}`}
              onSelect={() => go(`/help/${c.slug}`)}
            >
              <FolderOpen className="mr-2 size-4 text-white/60" aria-hidden />
              <span className="text-[14px] text-white">{c.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Jump to dashboard">
          {DASHBOARD_ACTIONS.map((a) => (
            <CommandItem
              key={a.to}
              value={`${a.label} ${a.keywords.join(" ")}`}
              onSelect={() => go(a.to)}
            >
              <ExternalLink className="mr-2 size-4 text-white/60" aria-hidden />
              <span className="text-[14px] text-white">{a.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/** Floating "Search docs" trigger pill — meant to sit in the help shell hero. */
export function HelpSearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-8 inline-flex w-full max-w-xl items-center gap-3 rounded-[14px] border border-white/15 bg-white/[0.04] px-4 py-3 text-left text-[14.5px] text-white/60 transition-colors hover:bg-white/[0.07]"
    >
      <Search className="size-4 text-white/55" aria-hidden />
      <span className="flex-1">Search help articles, verification, reviews…</span>
      <kbd className="hidden rounded-md border border-white/15 bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-medium text-white/70 sm:inline">
        ⌘K
      </kbd>
    </button>
  );
}
