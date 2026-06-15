import * as React from "react";
import { X, Pin, PinOff, UserCheck, CheckCircle2 } from "lucide-react";
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
import { SelectedLeadCard } from "./SelectedLeadCard";
import { AiInsightCard } from "./AiInsightCard";
import { LeadActivityTab } from "./LeadActivityTab";
import { LeadProposalsTab } from "./LeadProposalsTab";
import { sourceLabel } from "./SourceChipsRow";
import { LEAD_STAGE_LABEL, convertLeadToClient, type LeadDTO } from "@/lib/leads/leads.functions";

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
            <Tabs defaultValue="details" className="flex flex-col gap-4">

            <TabsList className="grid w-full grid-cols-3 rounded-[10px] bg-reps-panel-soft/60 p-1">
              <TabsTrigger value="details" className="rounded-[8px] text-[12px]">Details</TabsTrigger>
              <TabsTrigger value="activity" className="rounded-[8px] text-[12px]">Activity</TabsTrigger>
              <TabsTrigger value="proposals" className="rounded-[8px] text-[12px]">Proposals</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="m-0 flex flex-col gap-4">
              <SelectedLeadCard lead={lead} variant="sheet" />
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
            View client
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

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="block w-full">{button}</span>
        </TooltipTrigger>
        <TooltipContent>
          Client needs a REPs account — send them a sign-up link first.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
