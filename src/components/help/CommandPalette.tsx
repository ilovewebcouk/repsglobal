import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, FileText, FolderOpen, ArrowRight, ExternalLink, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Command as CommandPrimitive } from "cmdk";
import {
  CommandEmpty,
  CommandGroup,
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
  { label: "Edit website", to: "/dashboard/website", keywords: ["bio", "about", "photo", "tagline", "profile", "slug"] },
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
    setTimeout(() => navigate({ to }), 0);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-[640px] translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-[16px] border border-white/10 bg-reps-panel shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <DialogPrimitive.Title className="sr-only">Search the Help Centre</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search articles, categories, or jump to a dashboard page.
          </DialogPrimitive.Description>
          <CommandPrimitive
            className="flex h-full w-full flex-col overflow-hidden bg-transparent text-white [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-white/45 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2.5"
          >
            <div className="flex items-center gap-2 border-b border-white/10 px-4" cmdk-input-wrapper="">
              <Search className="size-4 shrink-0 text-white/55" aria-hidden />
              <CommandPrimitive.Input
                ref={inputRef}
                value={query}
                onValueChange={setQuery}
                placeholder="Search help articles or jump to a dashboard page…"
                className="flex h-12 w-full bg-transparent py-3 text-[14.5px] text-white outline-none placeholder:text-white/45"
              />
              <DialogPrimitive.Close
                aria-label="Close"
                className="rounded-[8px] p-1 text-white/55 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" />
              </DialogPrimitive.Close>
            </div>
            <CommandList className="max-h-[420px] overflow-y-auto p-2">
              <CommandEmpty className="py-8 text-center text-[13.5px] text-white/55">
                No matches. Try "verification" or "reviews".
              </CommandEmpty>

              <CommandGroup heading="Articles">
                {articles.map((a) => (
                  <CommandItem
                    key={`${a.category}/${a.slug}`}
                    value={`${a.title} ${a.tags.join(" ")} ${a.summary}`}
                    onSelect={() => go(`/help/${a.category}/${a.slug}`)}
                    className="rounded-[10px] text-white aria-selected:bg-white/[0.07] aria-selected:text-white data-[selected=true]:bg-white/[0.07]"
                  >
                    <FileText className="mr-2 size-4 text-white/55" aria-hidden />
                    <div className="min-w-0">
                      <p className="truncate text-[14px] text-white">{a.title}</p>
                      <p className="truncate text-[12px] text-white/55">{a.summary}</p>
                    </div>
                    <ArrowRight className="ml-auto size-3.5 text-white/40" aria-hidden />
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandSeparator className="my-1 h-px bg-white/10" />

              <CommandGroup heading="Categories">
                {HELP_CATEGORIES.map((c) => (
                  <CommandItem
                    key={c.slug}
                    value={`${c.title} ${c.description}`}
                    onSelect={() => go(`/help/${c.slug}`)}
                    className="rounded-[10px] text-white aria-selected:bg-white/[0.07] data-[selected=true]:bg-white/[0.07]"
                  >
                    <FolderOpen className="mr-2 size-4 text-white/55" aria-hidden />
                    <span className="text-[14px] text-white">{c.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandSeparator className="my-1 h-px bg-white/10" />

              <CommandGroup heading="Jump to dashboard">
                {DASHBOARD_ACTIONS.map((a) => (
                  <CommandItem
                    key={a.to}
                    value={`${a.label} ${a.keywords.join(" ")}`}
                    onSelect={() => go(a.to)}
                    className="rounded-[10px] text-white aria-selected:bg-white/[0.07] data-[selected=true]:bg-white/[0.07]"
                  >
                    <ExternalLink className="mr-2 size-4 text-white/55" aria-hidden />
                    <span className="text-[14px] text-white">{a.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </CommandPrimitive>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Floating "Search docs" trigger pill — meant to sit in the help shell hero. */
export function HelpSearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-8 inline-flex w-full max-w-xl items-center gap-3 rounded-[12px] border border-white/15 bg-white/[0.04] px-4 py-3 text-left text-[14.5px] text-white/60 transition-colors hover:bg-white/[0.07]"
    >
      <Search className="size-4 text-white/55" aria-hidden />
      <span className="flex-1">Search help articles, verification, reviews…</span>
      <kbd className="hidden rounded-[6px] border border-white/15 bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-medium text-white/70 sm:inline">
        ⌘K
      </kbd>
    </button>
  );
}
