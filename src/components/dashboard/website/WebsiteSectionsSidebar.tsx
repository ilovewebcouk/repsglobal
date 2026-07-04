import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, ExternalLink, Undo2 } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { WebsiteEditorSection } from "./WebsiteEditorLayout";

/** Sections the server can revert to the last-published snapshot. */
export type DiscardableSectionId = "basics" | "method" | "plans" | "results" | "faqs";

type Props = {
  sections: WebsiteEditorSection[];
  activeId: string;
  onActive: (id: string) => void;
  isDirty: boolean;
  onPublish: () => void;
  publishPending: boolean;
  publicUrl?: string;
  /** section id → true when its live content differs from published snapshot. */
  dirtyMap?: Record<string, boolean>;
  /** Called when trainer clicks the per-section "Discard" undo icon. */
  onDiscardSection?: (id: DiscardableSectionId) => void;
  /** id of the section currently being discarded (spinner). */
  discardingId?: string | null;
};


/**
 * Sidebar replacement rendered while the user is inside /dashboard/website.
 * Reuses the shadcn Sidebar shell so it inherits the same collapse state,
 * width tokens and mobile sheet behaviour as the main dashboard sidebar.
 *
 * Header = back-to-dashboard row.
 * Content = editable Website sections with completion status.
 * Footer = dirty-state pill + single Publish button.
 */
export function WebsiteSectionsSidebar({
  sections,
  activeId,
  onActive,
  isDirty,
  onPublish,
  publishPending,
  publicUrl,
}: Props) {
  return (
    <Sidebar collapsible="icon" className="border-r border-reps-border">
      <SidebarHeader className="gap-1 px-3 pb-2 pt-4 group-data-[collapsible=icon]:px-2">
        <Link
          to="/dashboard"
          aria-label="Back to dashboard"
          className={cn(
            "flex h-9 items-center gap-2 rounded-[10px] px-2 text-[13px] font-medium text-white/70 transition-colors hover:bg-reps-panel hover:text-white",
            "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
          )}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span className="truncate group-data-[collapsible=icon]:hidden">
            Back to dashboard
          </span>
        </Link>
        <div className="mt-1 border-t border-reps-border/60 group-data-[collapsible=icon]:hidden" />
      </SidebarHeader>

      <SidebarContent
        className={cn(
          "px-2",
          "[scrollbar-width:thin] [scrollbar-color:rgb(255_255_255/0.12)_transparent]",
          "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10",
          "hover:[&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-button]:hidden",
        )}
      >
        <SidebarGroup>
          <div className="mb-1 flex items-center justify-between px-2 group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel className="p-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40">
              Website sections
            </SidebarGroupLabel>
            {(() => {
              const done = sections.filter((s) => s.status === "done").length;
              const total = sections.length;
              const complete = done === total;
              return (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                    complete
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-white/[0.06] text-white/60",
                  )}
                >
                  {done}/{total}
                </span>
              );
            })()}
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {sections.map((s) => {
                const isActive = s.id === activeId;
                return (
                  <SidebarMenuItem key={s.id}>
                    <SidebarMenuButton
                      tooltip={s.label}
                      isActive={isActive}
                      onClick={() => onActive(s.id)}
                      className={cn(
                        "h-9 rounded-[10px] text-[13px] font-medium text-white/70 hover:bg-reps-panel hover:text-white",
                        "data-[active=true]:bg-reps-orange-soft data-[active=true]:text-reps-orange data-[active=true]:hover:bg-reps-orange/25 data-[active=true]:hover:text-reps-orange",
                      )}
                    >
                      <StatusDot status={s.status} />
                      <span className="truncate">{s.label}</span>
                      <span className="ml-auto group-data-[collapsible=icon]:hidden">
                        <StatusPill status={s.status} />
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-2 px-3 pb-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2">
        <div className="rounded-[12px] border border-reps-border bg-reps-panel-soft/60 p-3 group-data-[collapsible=icon]:hidden">
          {isDirty ? (
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-amber-300">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-300" />
              Unpublished changes
            </div>
          ) : (
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-white/45">
              <Check className="h-3 w-3" /> All changes published
            </div>
          )}
          <button
            type="button"
            onClick={onPublish}
            disabled={publishPending}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-[10px] bg-reps-orange text-[13px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
          >
            {publishPending ? "Publishing…" : "Publish changes"}
          </button>
          {publicUrl && publicUrl !== "#" ? (
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-white/55 hover:text-white"
            >
              <ExternalLink className="h-3 w-3" /> View public page
            </a>
          ) : null}
        </div>

        {/* Icon-mode: compact publish dot */}
        <button
          type="button"
          onClick={onPublish}
          disabled={publishPending}
          aria-label={publishPending ? "Publishing" : "Publish changes"}
          className={cn(
            "hidden size-9 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange text-white hover:bg-reps-orange-hover disabled:opacity-60",
            "group-data-[collapsible=icon]:flex",
          )}
        >
          <Check className="h-4 w-4" />
        </button>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

function StatusDot({ status }: { status: WebsiteEditorSection["status"] }) {
  const cls =
    status === "done"
      ? "bg-emerald-400"
      : status === "partial"
        ? "bg-amber-300"
        : status === "empty"
          ? "border border-white/25 bg-transparent"
          : "border border-white/15 bg-transparent";
  return <span className={cn("inline-block h-1.5 w-1.5 shrink-0 rounded-full", cls)} />;
}

function StatusPill({ status }: { status: WebsiteEditorSection["status"] }) {
  if (status === "done") {
    return (
      <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-emerald-300">
        Done
      </span>
    );
  }
  if (status === "partial") {
    return (
      <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-amber-300">
        In progress
      </span>
    );
  }
  // empty & optional both render "Add" — no section is ever silently unlabeled.
  return (
    <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-white/55">
      Add
    </span>
  );
}
