import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { StickyNote, ArrowRightLeft, Activity, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  addLeadNote,
  listLeadActivity,
  LEAD_STAGE_LABEL,
  type LeadActivityDTO,
  type LeadStage,
} from "@/lib/leads/leads.functions";
import { timeAgo } from "@/lib/format/relative-time";

function parsePayload(json: string): Record<string, unknown> {
  try {
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function ActivityRow({ item }: { item: LeadActivityDTO }) {
  const payload = parsePayload(item.payload_json);
  if (item.type === "note") {
    return (
      <div className="flex gap-3">
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-reps-orange/15 text-reps-orange">
          <StickyNote className="size-3.5" />
        </div>
        <div className="min-w-0 flex-1 rounded-[12px] border border-reps-border bg-reps-panel-soft/40 px-3 py-2">
          <p className="whitespace-pre-wrap text-[13px] text-white/85">{String(payload.body ?? "")}</p>
          <p className="mt-1 text-[11px] text-white/45">{timeAgo(item.created_at)}</p>
        </div>
      </div>
    );
  }
  if (item.type === "stage_change") {
    const to = String(payload.to ?? "") as LeadStage;
    const label = LEAD_STAGE_LABEL[to] ?? to;
    return (
      <div className="flex gap-3">
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-reps-panel-soft text-white/70">
          <ArrowRightLeft className="size-3.5" />
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <p className="text-[13px] text-white/80">
            Moved to <span className="font-medium text-white">{label}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-white/45">{timeAgo(item.created_at)}</p>
        </div>
      </div>
    );
  }
  if (item.type === "converted") {
    return (
      <div className="flex gap-3">
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
          <UserCheck className="size-3.5" />
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <p className="text-[13px] text-white/80">
            Converted lead to <span className="font-medium text-white">client</span>
          </p>
          <p className="mt-0.5 text-[11px] text-white/45">{timeAgo(item.created_at)}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-reps-panel-soft text-white/60">
        <Activity className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1 pt-1">
        <p className="text-[13px] text-white/75">{item.type}</p>
        <p className="mt-0.5 text-[11px] text-white/45">{timeAgo(item.created_at)}</p>
      </div>
    </div>
  );
}

export function LeadActivityTab({ enquiryId }: { enquiryId: string }) {
  const list = useServerFn(listLeadActivity);
  const addNote = useServerFn(addLeadNote);
  const qc = useQueryClient();
  const [body, setBody] = React.useState("");

  const queryKey = ["lead-activity", enquiryId] as const;

  const { data = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => list({ data: { enquiryId } }),
    staleTime: 15_000,
  });

  const mut = useMutation({
    mutationFn: (text: string) => addNote({ data: { enquiryId, body: text } }),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey });
      toast.success("Note added");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not add note"),
  });

  const trimmed = body.trim();

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[14px] border border-reps-border bg-reps-panel-soft/40 p-3">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a private note about this lead…"
          rows={3}
          className="resize-none border-0 bg-transparent p-0 text-[13px] text-white placeholder:text-white/40 focus-visible:ring-0"
          maxLength={2000}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-white/45">{trimmed.length}/2000</span>
          <Button
            type="button"
            size="sm"
            disabled={!trimmed || mut.isPending}
            onClick={() => mut.mutate(trimmed)}
            className="h-8 rounded-[8px] bg-reps-orange px-3 text-[12px] font-medium text-white hover:bg-reps-orange/90"
          >
            {mut.isPending ? "Saving…" : "Add note"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {isLoading ? (
          <p className="text-[12px] text-white/45">Loading activity…</p>
        ) : data.length === 0 ? (
          <p className="text-[12px] text-white/45">No activity yet. Add a note or move the lead to log its first event.</p>
        ) : (
          data.map((item) => <ActivityRow key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}
