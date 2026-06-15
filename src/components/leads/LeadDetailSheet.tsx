import * as React from "react";
import {
  X,
  Pin,
  PinOff,
  UserCheck,
  CheckCircle2,
  MailPlus,
  MoreHorizontal,
  CheckCheck,
  Archive,
  ShieldAlert,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { SelectedLeadCard } from "./SelectedLeadCard";
import { AiInsightCard } from "./AiInsightCard";
import { LeadActivityTab } from "./LeadActivityTab";
import { LeadProposalsTab } from "./LeadProposalsTab";
import { sourceLabel } from "./SourceChipsRow";
import {
  LEAD_STAGE_LABEL,
  convertLeadToClient,
  sendLeadSignupLink,
  type LeadDTO,
} from "@/lib/leads/leads.functions";
import { updateEnquiryStatus } from "@/lib/enquiries/enquiries.functions";
import { timeAgo } from "@/lib/format/relative-time";

type TabValue = "details" | "activity" | "proposals";

/**
 * Sliding right-side detail panel. Non-modal so the table behind stays interactive.
 * Includes a "pin to rail" toggle for power users who want it persistent.
 */
export function LeadDetailSheet({
  lead,
  open,
  onOpenChange,
  pinned,
  onTogglePin,
}: {
  lead: LeadDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pinned: boolean;
  onTogglePin: () => void;
}) {
  const [tab, setTab] = React.useState<TabValue>("details");

  // Reset to Details whenever a new lead is selected.
  const leadId = lead?.id ?? null;
  React.useEffect(() => {
    setTab("details");
  }, [leadId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-l border-reps-border bg-reps-ink p-0 sm:max-w-[480px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-reps-border/60 px-5 py-3.5">
          <SheetHeader className="min-w-0 flex-1 space-y-0.5 text-left">
            <SheetTitle className="truncate font-display text-[15px] font-bold text-white">
              {lead ? lead.sender_name : "Lead details"}
            </SheetTitle>
            <SheetDescription className="truncate text-[11.5px] text-white/55">
              {lead ? `${LEAD_STAGE_LABEL[lead.stage]} · ${sourceLabel(lead.source)}` : "Select a lead to see details"}
            </SheetDescription>
          </SheetHeader>
          <div className="flex shrink-0 items-center gap-1">
            {lead ? <StatusMenu lead={lead} onClose={() => onOpenChange(false)} /> : null}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onTogglePin}
                    aria-label={pinned ? "Unpin detail panel" : "Pin detail panel to side"}
                    className="size-8 rounded-[8px] p-0 text-white/55 hover:bg-reps-panel-soft hover:text-white"
                  >
                    {pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{pinned ? "Unpin (use sliding sheet)" : "Pin to side rail"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="size-8 rounded-[8px] p-0 text-white/55 hover:bg-reps-panel-soft hover:text-white"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>

        {lead ? (
          <div className="flex flex-col gap-4 p-5">
            <ConvertRow lead={lead} />
            <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)} className="flex flex-col gap-4">

            <TabsList className="grid w-full grid-cols-3 rounded-[10px] bg-reps-panel-soft/60 p-1">
              <TabsTrigger value="details" className="rounded-[8px] text-[12px]">Details</TabsTrigger>
              <TabsTrigger value="activity" className="rounded-[8px] text-[12px]">Activity</TabsTrigger>
              <TabsTrigger value="proposals" className="rounded-[8px] text-[12px]">Proposals</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="m-0 flex flex-col gap-4">
              <SelectedLeadCard
                lead={lead}
                variant="sheet"
                onOpenProposals={() => setTab("proposals")}
              />
              <AiInsightCard lead={lead} />
            </TabsContent>
            <TabsContent value="activity" className="m-0">
              <LeadActivityTab enquiryId={lead.id} />
            </TabsContent>
            <TabsContent value="proposals" className="m-0">
              <LeadProposalsTab enquiryId={lead.id} />
            </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="px-6 py-14 text-center text-[13px] text-white/55">
            Select a lead from the pipeline to see details.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ---------------------------- Status menu ---------------------------- */

function StatusMenu({ lead, onClose }: { lead: LeadDTO; onClose: () => void }) {
  const setStatus = useServerFn(updateEnquiryStatus);
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: (status: LeadDTO["status"]) => setStatus({ data: { id: lead.id, status } }),
    onSuccess: (_d, status) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead-kpis"] });
      qc.invalidateQueries({ queryKey: ["lead-activity", lead.id] });
      if (status === "spam" || status === "archived") {
        onClose();
        toast.success(status === "spam" ? "Marked as spam" : "Archived");
      } else if (status === "replied") {
        toast.success("Marked as replied");
      } else {
        toast.success("Updated");
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update"),
  });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="More actions"
          className="size-8 rounded-[8px] p-0 text-white/55 hover:bg-reps-panel-soft hover:text-white"
        >
          <MoreHorizontal className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 border-reps-border bg-reps-ink text-white"
      >
        <DropdownMenuItem
          className="text-[12.5px] text-white focus:bg-reps-panel-soft focus:text-white"
          onClick={() => mut.mutate("replied")}
          disabled={mut.isPending || lead.status === "replied"}
        >
          <CheckCheck className="mr-2 size-3.5" />
          Mark as replied
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-[12.5px] text-white focus:bg-reps-panel-soft focus:text-white"
          onClick={() => mut.mutate("archived")}
          disabled={mut.isPending}
        >
          <Archive className="mr-2 size-3.5" />
          Archive
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-reps-border" />
        <DropdownMenuItem
          className="text-[12.5px] text-red-300 focus:bg-red-500/10 focus:text-red-200"
          onClick={() => mut.mutate("spam")}
          disabled={mut.isPending}
        >
          <ShieldAlert className="mr-2 size-3.5" />
          Mark as spam
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ConvertRow({ lead }: { lead: LeadDTO }) {
  const convert = useServerFn(convertLeadToClient);
  const qc = useQueryClient();
  const alreadyConverted = lead.stage === "converted" || !!lead.converted_client_id;
  const canConvert = !!lead.sender_user_id;

  const mut = useMutation({
    mutationFn: () => convert({ data: { enquiryId: lead.id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead-activity", lead.id] });
      qc.invalidateQueries({ queryKey: ["lead-kpis"] });
      toast.success("Converted to client");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not convert lead"),
  });

  if (alreadyConverted) {
    const clientId = lead.converted_client_id;
    return (
      <div className="flex items-center justify-between gap-3 rounded-[12px] border border-emerald-400/30 bg-emerald-500/10 px-3 py-2">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-emerald-300">
          <CheckCircle2 className="size-3.5" />
          Converted to client
        </span>
        {clientId ? (
          <Link
            to="/dashboard/clients"
            className="text-[12px] font-medium text-emerald-300 underline-offset-2 hover:underline"
          >
            Open in clients
          </Link>
        ) : null}
      </div>
    );
  }

  const button = (
    <Button
      type="button"
      size="sm"
      disabled={!canConvert || mut.isPending}
      onClick={() => mut.mutate()}
      className="h-9 w-full rounded-[10px] bg-reps-orange px-3 text-[12.5px] font-medium text-white hover:bg-reps-orange/90"
    >
      <UserCheck className="size-3.5" data-icon />
      {mut.isPending ? "Converting…" : "Convert to client"}
    </Button>
  );

  if (canConvert) return button;

  return <SendSignupLinkRow lead={lead} />;
}

function SendSignupLinkRow({ lead }: { lead: LeadDTO }) {
  const send = useServerFn(sendLeadSignupLink);
  const qc = useQueryClient();
  const sentAt = lead.last_invite_sent_at;
  const hasEmail = !!lead.sender_email;

  const mut = useMutation({
    mutationFn: () => send({ data: { enquiryId: lead.id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead-activity", lead.id] });
      toast.success(sentAt ? "Sign-up link resent" : "Sign-up link sent");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not send link"),
  });

  return (
    <div className="flex flex-col gap-2 rounded-[12px] border border-reps-border bg-reps-panel-soft/40 px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12.5px] font-medium text-white">Client needs a REPs account</p>
          <p className="mt-0.5 text-[11.5px] text-white/55">
            {sentAt
              ? `Sign-up link sent ${timeAgo(sentAt)}`
              : "Send a sign-up link so they can be converted."}
          </p>
        </div>
        {sentAt ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={!hasEmail || mut.isPending}
            onClick={() => mut.mutate()}
            className="h-8 shrink-0 rounded-[8px] px-2.5 text-[12px] text-white/70 hover:bg-reps-panel-soft hover:text-white"
          >
            {mut.isPending ? "Sending…" : "Resend link"}
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            disabled={!hasEmail || mut.isPending}
            onClick={() => mut.mutate()}
            className="h-8 shrink-0 rounded-[8px] bg-reps-orange px-3 text-[12px] font-medium text-white hover:bg-reps-orange/90"
          >
            <MailPlus className="size-3.5" data-icon />
            {mut.isPending ? "Sending…" : "Send sign-up link"}
          </Button>
        )}
      </div>
      {!hasEmail ? (
        <p className="text-[11px] text-white/45">No email on file — capture an email first.</p>
      ) : null}
    </div>
  );
}
