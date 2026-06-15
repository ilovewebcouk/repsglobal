import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PROPOSAL_CADENCES,
  PROPOSAL_CADENCE_LABEL,
  type ProposalBody,
  type ProposalCadence,
} from "@/lib/leads/proposals.functions";

export type ProposalFormValues = ProposalBody;

export function ProposalForm({
  initial,
  onCancel,
  onSubmit,
  saving,
  submitLabel = "Save draft",
  secondaryLabel,
  onSecondary,
}: {
  initial?: Partial<ProposalFormValues>;
  onCancel: () => void;
  onSubmit: (values: ProposalFormValues) => void;
  saving: boolean;
  submitLabel?: string;
  secondaryLabel?: string;
  onSecondary?: (values: ProposalFormValues) => void;
}) {
  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [summary, setSummary] = React.useState(initial?.summary ?? "");
  const [priceGbp, setPriceGbp] = React.useState(
    initial?.price_pence ? (initial.price_pence / 100).toFixed(2) : "",
  );
  const [cadence, setCadence] = React.useState<ProposalCadence>(initial?.cadence ?? "monthly");
  const [sessions, setSessions] = React.useState(initial?.sessions ? String(initial.sessions) : "");
  const [startDate, setStartDate] = React.useState(initial?.start_date ?? "");
  const [notes, setNotes] = React.useState(initial?.notes ?? "");

  const pricePence = Math.round((parseFloat(priceGbp) || 0) * 100);
  const valid = title.trim().length > 0 && pricePence > 0;

  function buildValues(): ProposalFormValues {
    return {
      title: title.trim(),
      summary: summary.trim() || undefined,
      price_pence: pricePence,
      cadence,
      sessions: sessions ? parseInt(sessions, 10) : undefined,
      start_date: startDate || undefined,
      notes: notes.trim() || undefined,
    };
  }

  return (
    <div className="rounded-[14px] border border-reps-border bg-reps-panel-soft/40 p-3">
      <div className="grid grid-cols-1 gap-2.5">
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-white/55">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="12-week transformation"
            className="h-9 rounded-[10px] border-reps-border bg-reps-ink/60 text-[13px] text-white placeholder:text-white/35"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-white/55">Summary</label>
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="What's included…"
            rows={2}
            className="resize-none rounded-[10px] border-reps-border bg-reps-ink/60 text-[13px] text-white placeholder:text-white/35"
          />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-white/55">Price (£)</label>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={priceGbp}
              onChange={(e) => setPriceGbp(e.target.value)}
              placeholder="0.00"
              className="h-9 rounded-[10px] border-reps-border bg-reps-ink/60 text-[13px] text-white placeholder:text-white/35"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-white/55">Cadence</label>
            <Select value={cadence} onValueChange={(v) => setCadence(v as ProposalCadence)}>
              <SelectTrigger className="h-9 rounded-[10px] border-reps-border bg-reps-ink/60 text-[13px] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-reps-border bg-reps-ink text-white">
                {PROPOSAL_CADENCES.map((c) => (
                  <SelectItem key={c} value={c} className="text-white focus:bg-reps-panel-soft focus:text-white">
                    {PROPOSAL_CADENCE_LABEL[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-white/55">Sessions</label>
            <Input
              type="number"
              min={1}
              value={sessions}
              onChange={(e) => setSessions(e.target.value)}
              placeholder="12"
              className="h-9 rounded-[10px] border-reps-border bg-reps-ink/60 text-[13px] text-white placeholder:text-white/35"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-white/55">Start date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 rounded-[10px] border-reps-border bg-reps-ink/60 text-[13px] text-white placeholder:text-white/35 [color-scheme:dark]"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-white/55">Internal notes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Only you can see this"
            rows={2}
            className="resize-none rounded-[10px] border-reps-border bg-reps-ink/60 text-[13px] text-white placeholder:text-white/35"
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-8 rounded-[8px] px-3 text-[12px] text-white/70 hover:bg-reps-panel-soft hover:text-white"
        >
          Cancel
        </Button>
        {secondaryLabel && onSecondary ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!valid || saving}
            onClick={() => onSecondary(buildValues())}
            className="h-8 rounded-[8px] border-reps-border bg-reps-ink/60 px-3 text-[12px] text-white hover:bg-reps-panel-soft"
          >
            {secondaryLabel}
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          disabled={!valid || saving}
          onClick={() => onSubmit(buildValues())}
          className="h-8 rounded-[8px] bg-reps-orange px-3 text-[12px] font-medium text-white hover:bg-reps-orange/90"
        >
          {saving ? "Saving…" : submitLabel}
        </Button>
      </div>
    </div>
  );
}
