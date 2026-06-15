import * as React from "react";
import {
  MapPin,
  Calendar as CalendarIcon,
  Mail,
  Phone,
  FileText,
  CalendarDays,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { type LeadDTO, updateLead } from "@/lib/leads/leads.functions";
import { sourceLabel } from "./SourceChipsRow";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { timeAgo } from "@/lib/format/relative-time";
import { cn } from "@/lib/utils";

function followUpLabel(iso: string | null): string {
  if (!iso) return "Not set";
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86_400_000);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  if (target.getTime() === today.getTime()) return "Today";
  if (target.getTime() === tomorrow.getTime()) return "Tomorrow";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
      <span className="text-white/55">{label}</span>
      <span className="truncate text-right font-medium text-white/90">{value}</span>
    </div>
  );
}

function ContactRow({
  label,
  value,
  href,
  icon: Icon,
}: {
  label: string;
  value: string | null;
  href: string | null;
  icon: React.ComponentType<{ className?: string }>;
}) {
  if (!value) {
    return (
      <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
        <span className="text-white/55">{label}</span>
        <span className="text-right text-white/35">Not provided</span>
      </div>
    );
  }
  return (
    <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
      <span className="text-white/55">{label}</span>
      <a
        href={href ?? "#"}
        className="inline-flex max-w-[60%] items-center gap-1.5 truncate font-medium text-reps-orange hover:underline"
      >
        <Icon className="size-3 shrink-0" />
        <span className="truncate">{value}</span>
      </a>
    </div>
  );
}

export function SelectedLeadCard({
  lead,
  variant = "panel",
  onOpenProposals,
}: {
  lead: LeadDTO;
  /** "panel" = standalone bordered card (rail). "sheet" = embedded inside SheetContent (no outer chrome). */
  variant?: "panel" | "sheet";
  /** Switch the parent's Tabs to the Proposals tab (only available when inside LeadDetailSheet). */
  onOpenProposals?: () => void;
}) {
  const qc = useQueryClient();
  const isConverted = lead.stage === "converted";
  const [followUpOpen, setFollowUpOpen] = React.useState(false);

  const setFollowUp = useMutation({
    mutationFn: (iso: string | null) =>
      updateLead({ data: { id: lead.id, follow_up_at: iso } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead-kpis"] });
      toast.success("Follow-up updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  const followUpDate = lead.follow_up_at ? new Date(lead.follow_up_at) : undefined;

  // Pre-filled mailto for "Book call" — until the calendar module ships,
  // it sends a templated email asking for two times.
  const bookCallHref = lead.sender_email
    ? `mailto:${lead.sender_email}?subject=${encodeURIComponent(
        "Quick call about your enquiry",
      )}&body=${encodeURIComponent(
        `Hi ${lead.sender_name.split(" ")[0] || "there"},\n\nThanks for your enquiry — happy to jump on a 15-minute call so we can talk through what you're after.\n\nDo any of these times work for you?\n• \n• \n• \n\nIf not, send a few that do and we'll lock one in.\n\nSpeak soon.`,
      )}`
    : "#";

  return (
    <div
      className={cn(
        variant === "panel"
          ? "rounded-[18px] border border-reps-border bg-reps-panel p-5"
          : "rounded-[18px] border border-reps-border/50 bg-reps-panel/60 p-4",
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-reps-orange-soft text-[12px] font-bold text-reps-orange">
          {initials(lead.sender_name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[17px] font-bold text-white">{lead.sender_name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge
              className={cn(
                "rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
                isConverted
                  ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                  : "border-reps-orange-border/40 bg-reps-orange-soft text-reps-orange",
              )}
            >
              {isConverted ? "Converted" : lead.stage === "new" ? "New lead" : "Active lead"}
            </Badge>
            {lead.location ? (
              <span className="inline-flex items-center gap-1 text-[11.5px] text-white/55">
                <MapPin className="size-3" /> {lead.location}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Field list */}
      <div className="mt-5 flex flex-col gap-2.5">
        <Row label="Source" value={sourceLabel(lead.source)} />
        <ContactRow
          label="Email"
          value={lead.sender_email || null}
          href={lead.sender_email ? `mailto:${lead.sender_email}` : null}
          icon={Mail}
        />
        <ContactRow
          label="Phone"
          value={lead.sender_phone}
          href={lead.sender_phone ? `tel:${lead.sender_phone}` : null}
          icon={Phone}
        />
        <Row label="Goal" value={lead.goals[0] ?? lead.service_title ?? "—"} />
        {lead.frequency ? <Row label="Preferred format" value={lead.frequency} /> : null}
        {lead.start_by ? <Row label="Start by" value={lead.start_by} /> : null}
        {lead.budget ? <Row label="Budget" value={lead.budget} /> : null}
        <Row
          label="Estimated value"
          value={
            lead.estimated_value_pence
              ? "£" + Math.round(lead.estimated_value_pence / 100).toLocaleString()
              : "—"
          }
        />
        <Row label="Last activity" value={`Enquired ${timeAgo(lead.created_at)}`} />
        <Row label="Follow-up due" value={followUpLabel(lead.follow_up_at)} />
      </div>

      {/* Message */}
      <div className="mt-5 rounded-[16px] border border-reps-border/60 bg-reps-panel-soft px-4 py-3">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/45">
          Lead message
        </div>
        <p className="mt-1.5 whitespace-pre-wrap text-[12.5px] leading-relaxed text-white/85">
          &ldquo;{lead.message}&rdquo;
        </p>
      </div>

      {/* Actions: 2x2 grid */}
      <TooltipProvider>
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                disabled={!lead.sender_email}
                className="h-10 rounded-[10px] bg-reps-orange text-[12.5px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-dark"
              >
                <a href={bookCallHref}>
                  <CalendarIcon className="size-3.5" /> <span className="ml-1.5">Book call</span>
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Email a few times you can offer</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                variant="outline"
                disabled={!lead.sender_email}
                className="h-10 rounded-[10px] border-reps-border bg-reps-panel text-[12.5px] font-semibold text-white/85 shadow-none transition-colors hover:bg-reps-panel-soft hover:text-white"
              >
                <a href={lead.sender_email ? `mailto:${lead.sender_email}` : "#"}>
                  <Mail className="size-3.5" /> <span className="ml-1.5">Reply by email</span>
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open in your email client</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                disabled={!onOpenProposals}
                className="h-10 rounded-[10px] border-reps-border bg-reps-panel text-[12.5px] font-semibold text-white/85 shadow-none transition-colors hover:bg-reps-panel-soft hover:text-white"
                onClick={() => onOpenProposals?.()}
              >
                <FileText className="size-3.5" /> <span className="ml-1.5">Create proposal</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open the Proposals tab to draft one</TooltipContent>
          </Tooltip>

          {isConverted ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  variant="outline"
                  className="h-10 rounded-[10px] border-emerald-400/30 bg-emerald-500/10 text-[12.5px] font-semibold text-emerald-300 shadow-none transition-colors hover:bg-emerald-500/20 hover:text-emerald-200"
                >
                  <a href="/dashboard/clients">
                    <ExternalLink className="size-3.5" /> <span className="ml-1.5">View client</span>
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open the clients list</TooltipContent>
            </Tooltip>
          ) : (
            <Popover open={followUpOpen} onOpenChange={setFollowUpOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 rounded-[10px] border-reps-border bg-reps-panel text-[12.5px] font-semibold text-white/85 shadow-none transition-colors hover:bg-reps-panel-soft hover:text-white"
                >
                  <CalendarDays className="size-3.5" />
                  <span className="ml-1.5 truncate">
                    {lead.follow_up_at ? followUpLabel(lead.follow_up_at) : "Set follow-up"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-auto border-reps-border bg-reps-ink p-0 text-white"
              >
                <Calendar
                  mode="single"
                  selected={followUpDate}
                  initialFocus
                  className={cn("pointer-events-auto p-3")}
                  onSelect={(d) => {
                    if (!d) return;
                    setFollowUp.mutate(d.toISOString());
                    setFollowUpOpen(false);
                  }}
                />
                {lead.follow_up_at ? (
                  <div className="border-t border-reps-border p-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-full rounded-[8px] text-[12px] text-white/70 hover:bg-reps-panel-soft hover:text-white"
                      onClick={() => {
                        setFollowUp.mutate(null);
                        setFollowUpOpen(false);
                      }}
                    >
                      Clear follow-up
                    </Button>
                  </div>
                ) : null}
              </PopoverContent>
            </Popover>
          )}
        </div>
      </TooltipProvider>
    </div>
  );
}
