import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, MapPin, Sparkles, Archive, CheckCheck, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type EnquiryDTO, updateEnquiryStatus } from "@/lib/enquiries/enquiries.functions";
import { draftLeadReply, scoreLead, type DraftReply } from "@/lib/leads/leads-ai.functions";
import { useQuery } from "@tanstack/react-query";
import { listLeads } from "@/lib/leads/leads.functions";

function initials(name: string) {
  return name.split(/\s+/).map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} minutes ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hours ago`;
  const d = Math.floor(h / 24);
  return `${d} days ago`;
}

export function EnquiryDetailPane({ enquiry }: { enquiry: EnquiryDTO }) {
  const qc = useQueryClient();
  const [draft, setDraft] = React.useState<DraftReply | null>(null);

  // Same row in leads view (joined by id) gives us AI summary/recommended action.
  const { data: leadsAll = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => listLeads(),
    staleTime: 60_000,
  });
  const leadRow = leadsAll.find((l) => l.id === enquiry.id);

  const setStatus = useMutation({
    mutationFn: (status: EnquiryDTO["status"]) => updateEnquiryStatus({ data: { id: enquiry.id, status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["enquiries"] }),
  });

  const scoreMut = useMutation({
    mutationFn: () => scoreLead({ data: { enquiryId: enquiry.id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success("AI scored this enquiry");
    },
  });

  const draftMut = useMutation({
    mutationFn: () => draftLeadReply({ data: { enquiryId: enquiry.id } }),
    onSuccess: (d) => setDraft(d),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Couldn't draft reply"),
  });

  const subtitle =
    leadRow?.ai_band === "hot"
      ? "High-intent enquiry · auto-scored"
      : leadRow?.ai_band === "warm"
        ? "Warm enquiry · auto-scored"
        : leadRow?.ai_band === "cold"
          ? "Cold enquiry · auto-scored"
          : "Auto-scored on arrival";

  return (
    <div className="flex h-full flex-col gap-4 rounded-[18px] border border-reps-border bg-reps-panel p-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-reps-orange-soft text-[12px] font-bold text-reps-orange">
          {initials(enquiry.sender_name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[18px] font-bold text-white">{enquiry.sender_name}</div>
          <div className="mt-0.5 text-[11.5px] text-white/55">Received {timeAgo(enquiry.created_at)}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px]">
            <a href={`mailto:${enquiry.sender_email}`} className="inline-flex items-center gap-1 text-white/85 hover:text-white">
              <Mail className="size-3.5" /> {enquiry.sender_email}
            </a>
            {enquiry.sender_phone ? (
              <a href={`tel:${enquiry.sender_phone}`} className="inline-flex items-center gap-1 text-white/85 hover:text-white">
                <Phone className="size-3.5" /> {enquiry.sender_phone}
              </a>
            ) : null}
            {enquiry.location ? (
              <span className="inline-flex items-center gap-1 text-white/55">
                <MapPin className="size-3.5" /> {enquiry.location}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Meta chips */}
      {enquiry.goals.length || enquiry.frequency || enquiry.start_by || enquiry.budget ? (
        <div className="flex flex-wrap gap-1.5">
          {enquiry.goals.slice(0, 3).map((g) => (
            <Badge key={g} variant="outline" className="rounded-full border-reps-border bg-reps-panel-soft px-2 py-0.5 text-[10.5px] font-medium text-white/80">
              {g}
            </Badge>
          ))}
          {enquiry.frequency ? (
            <Badge variant="outline" className="rounded-full border-reps-border bg-reps-panel-soft px-2 py-0.5 text-[10.5px] font-medium text-white/80">
              {enquiry.frequency}
            </Badge>
          ) : null}
          {enquiry.start_by ? (
            <Badge variant="outline" className="rounded-full border-reps-border bg-reps-panel-soft px-2 py-0.5 text-[10.5px] font-medium text-white/80">
              Start: {enquiry.start_by}
            </Badge>
          ) : null}
          {enquiry.budget ? (
            <Badge variant="outline" className="rounded-full border-reps-border bg-reps-panel-soft px-2 py-0.5 text-[10.5px] font-medium text-white/80">
              Budget: {enquiry.budget}
            </Badge>
          ) : null}
        </div>
      ) : null}

      {/* Message */}
      <div className="rounded-[16px] border border-reps-border/60 bg-reps-panel-soft px-4 py-3.5">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/45">Enquiry message</div>
        <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-white/90">"{enquiry.message}"</p>
      </div>

      {/* AI insight */}
      <div className="rounded-[18px] border border-reps-orange-border/40 bg-gradient-to-br from-reps-orange-soft/25 via-reps-panel to-reps-panel p-4">
        <div className="flex items-start gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-reps-orange-soft">
            <Sparkles className="size-4 text-reps-orange" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-[14.5px] font-bold text-white">AI summary</div>
            <div className="text-[11.5px] text-white/55">{subtitle}</div>
          </div>
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-white/85">
          {leadRow?.ai_summary ?? "Generating summary…"}
          {leadRow?.ai_recommended_action ? (
            <> <span className="text-white/95">Recommended action: {leadRow.ai_recommended_action.replace(/\.$/, "")}.</span></>
          ) : null}
        </p>
        {draft ? (
          <div className="mt-3 rounded-[12px] border border-reps-border bg-reps-ink/60 p-3">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/45">AI draft</div>
            <div className="mt-1 text-[12px] font-semibold text-white">{draft.subject}</div>
            <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-white/80">{draft.body}</p>
            <Button asChild size="sm" className="mt-3 h-9 w-full rounded-[10px] bg-reps-orange text-[12.5px] font-semibold text-white shadow-none hover:bg-reps-orange-dark">
              <a href={`mailto:${enquiry.sender_email}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`}>
                Open in email
              </a>
            </Button>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              onClick={() => draftMut.mutate()}
              disabled={draftMut.isPending}
              className="h-10 rounded-[10px] bg-reps-orange text-[12.5px] font-semibold text-white shadow-none hover:bg-reps-orange-dark"
            >
              {draftMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              <span className="ml-1.5">Draft reply</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => scoreMut.mutate()}
              disabled={scoreMut.isPending}
              className="h-10 rounded-[10px] border-reps-border bg-reps-panel-soft text-[12.5px] font-semibold text-white shadow-none hover:bg-reps-panel"
            >
              {scoreMut.isPending ? <Loader2 className="size-4 animate-spin" /> : "Refresh AI"}
            </Button>
          </div>
        )}
      </div>

      {/* Status actions */}
      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-reps-border/60 pt-4">
        <Button
          asChild
          size="sm"
          className="h-9 rounded-[10px] bg-reps-orange text-[12.5px] font-semibold text-white shadow-none hover:bg-reps-orange-dark"
        >
          <a href={`mailto:${enquiry.sender_email}`}>
            <Mail className="size-3.5" /> <span className="ml-1.5">Reply</span>
          </a>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setStatus.mutate("replied")}
          className="h-9 rounded-[10px] border-reps-border bg-reps-panel-soft text-[12.5px] font-semibold text-white shadow-none hover:bg-reps-panel"
        >
          <CheckCheck className="size-3.5" /> <span className="ml-1.5">Mark replied</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setStatus.mutate("archived")}
          className="h-9 rounded-[10px] border-reps-border bg-reps-panel-soft text-[12.5px] font-semibold text-white shadow-none hover:bg-reps-panel"
        >
          <Archive className="size-3.5" /> <span className="ml-1.5">Archive</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setStatus.mutate("spam")}
          className="ml-auto h-9 rounded-[10px] text-[12.5px] font-medium text-white/55 hover:text-white"
        >
          <Trash2 className="size-3.5" /> <span className="ml-1.5">Spam</span>
        </Button>
      </div>
    </div>
  );
}
