import * as React from "react";
import { X, Pin, PinOff } from "lucide-react";
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
import { LEAD_STAGE_LABEL, type LeadDTO } from "@/lib/leads/leads.functions";

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
          <Tabs defaultValue="details" className="flex flex-col gap-4 p-5">
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
        ) : (
          <div className="px-6 py-14 text-center text-[13px] text-white/55">
            Select a lead from the pipeline to see details.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
