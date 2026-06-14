import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, Plus, Search, Sparkles, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  backfillLeadScores,
  createLead,
  getLeadKpis,
  listLeads,
  type LeadDTO,
  type LeadStage,
} from "@/lib/leads/leads.functions";
import { KpiStrip } from "@/components/leads/KpiStrip";
import { StageChipsBar } from "@/components/leads/StageChipsBar";
import { SourceChipsRow } from "@/components/leads/SourceChipsRow";
import { PipelineTable } from "@/components/leads/PipelineTable";
import { BulkActionBar } from "@/components/leads/BulkActionBar";
import { SelectedLeadCard } from "@/components/leads/SelectedLeadCard";
import { AiInsightCard } from "@/components/leads/AiInsightCard";
import { FollowUpsDueCard } from "@/components/leads/FollowUpsDueCard";
import { LeadSourcesCard } from "@/components/leads/LeadSourcesCard";
import { ConversionPerformanceCard } from "@/components/leads/ConversionPerformanceCard";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";

export const Route = createFileRoute("/_authenticated/_professional/_pro/dashboard_/leads")({
  head: () => ({
    meta: [
      { title: "Leads pipeline — REPS Professional" },
      { name: "description", content: "Track enquiries, prioritise follow-ups and convert leads into clients." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: LeadsPipelinePage,
});

function LeadsPipelinePage() {
  const qc = useQueryClient();
  const tier = useTrainerTier();

  const { data: leadsAll = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => listLeads(),
    staleTime: 30_000,
  });
  const { data: kpis } = useQuery({
    queryKey: ["lead-kpis"],
    queryFn: () => getLeadKpis(),
    staleTime: 30_000,
  });

  const [search, setSearch] = React.useState("");
  const [innerSearch, setInnerSearch] = React.useState("");
  const [stageFilter, setStageFilter] = React.useState<LeadStage | "all">("all");
  const [sourceFilter, setSourceFilter] = React.useState<string>("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const sources = React.useMemo(() => {
    const s = new Set<string>();
    for (const l of leadsAll) s.add(l.source);
    return Array.from(s).sort();
  }, [leadsAll]);

  const filtered = React.useMemo(() => {
    const q = (search + " " + innerSearch).trim().toLowerCase();
    let out = leadsAll;
    if (q)
      out = out.filter(
        (l) =>
          l.sender_name.toLowerCase().includes(q) ||
          l.sender_email.toLowerCase().includes(q) ||
          l.message.toLowerCase().includes(q),
      );
    if (stageFilter !== "all") out = out.filter((l) => l.stage === stageFilter);
    if (sourceFilter !== "all") out = out.filter((l) => l.source === sourceFilter);

    // Smart sort: priority × follow-up urgency × score, descending
    return [...out].sort((a, b) => {
      const score = (l: LeadDTO) => {
        let s = l.ai_score ?? 0;
        if (l.follow_up_at) {
          const due = new Date(l.follow_up_at).getTime();
          const hrs = (due - Date.now()) / 3_600_000;
          if (hrs < 24 && hrs > -24) s += 50;
        }
        if (l.stage === "new") s += 10;
        return s;
      };
      return score(b) - score(a);
    });
  }, [leadsAll, search, innerSearch, stageFilter, sourceFilter]);

  React.useEffect(() => {
    if (!selectedId && filtered.length) setSelectedId(filtered[0].id);
    if (selectedId && !filtered.find((l) => l.id === selectedId) && filtered.length) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected: LeadDTO | null = leadsAll.find((l) => l.id === selectedId) ?? null;
  const activeCount = leadsAll.filter((l) => l.stage !== "converted" && l.stage !== "lost").length;

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(filtered.map((l) => l.id)));
    else setSelectedIds(new Set());
  };
  const clearSelection = () => setSelectedIds(new Set());

  return (
    <DashboardShell role="trainer" tier={tier} active="Leads" title="Leads" subtitle="Your full pipeline">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-[28px] font-bold text-white">Leads pipeline</h1>
            <p className="mt-1 text-[13.5px] text-white/55">
              Track enquiries, prioritise follow-ups and convert leads into clients.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/45" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-[260px] rounded-[12px] border-reps-border bg-reps-panel pl-9 text-[12.5px] shadow-none"
              />
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-[6px] border border-reps-border bg-reps-panel-soft px-1.5 py-0.5 text-[10px] font-medium text-white/55">
                ⌘K
              </kbd>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("CSV import is coming in Phase 2.3")}
              className="h-10 rounded-[10px] border-reps-border bg-reps-panel text-[12.5px] font-semibold text-white shadow-none hover:bg-reps-panel-soft"
            >
              <Upload className="size-3.5" /> <span className="ml-1.5">Import leads</span>
            </Button>
            <NewLeadDialog
              onCreated={() => {
                qc.invalidateQueries({ queryKey: ["leads"] });
                qc.invalidateQueries({ queryKey: ["lead-kpis"] });
              }}
            />
            <BackfillScoresButton
              onDone={() => {
                qc.invalidateQueries({ queryKey: ["leads"] });
                qc.invalidateQueries({ queryKey: ["lead-kpis"] });
              }}
            />
          </div>
        </div>

        {/* KPI strip */}
        <KpiStrip kpis={kpis} />

        {/* Pipeline + rail */}
        {isLoading ? (
          <PCard><div className="px-5 py-10 text-center text-[13px] text-white/55">Loading leads…</div></PCard>
        ) : leadsAll.length === 0 ? (
          <PCard>
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-reps-panel-soft">
                <Inbox className="size-5 text-white/55" />
              </div>
              <h2 className="mt-4 font-display text-[17px] font-bold text-white">No leads yet</h2>
              <p className="mx-auto mt-1 max-w-[440px] text-[13px] text-white/55">
                When someone enquires through your REPS profile, it'll land here. You can also add a lead manually using "+ New lead".
              </p>
            </div>
          </PCard>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
            {/* Pipeline */}
            <div className="flex flex-col gap-3">
              {selectedIds.size > 0 ? (
                <BulkActionBar selectedIds={selectedIds} onClear={clearSelection} />
              ) : null}
              <div className="rounded-[18px] border border-reps-border bg-reps-panel">
                {/* Panel header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-reps-border/60 px-5 py-4">
                  <div>
                    <h2 className="font-display text-[16px] font-bold text-white">Lead pipeline</h2>
                    <p className="mt-0.5 text-[11.5px] text-white/55">
                      {activeCount} active leads · sorted by priority and follow-up
                    </p>
                  </div>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/45" />
                    <Input
                      placeholder="Search leads…"
                      value={innerSearch}
                      onChange={(e) => setInnerSearch(e.target.value)}
                      className="h-9 w-[240px] rounded-[12px] border-reps-border bg-reps-panel-soft pl-9 text-[12px] shadow-none"
                    />
                  </div>
                </div>

                {/* Filter chips */}
                <div className="flex flex-col gap-3 border-b border-reps-border/60 px-5 py-4">
                  <StageChipsBar value={stageFilter} onChange={setStageFilter} />
                  <SourceChipsRow sources={sources} value={sourceFilter} onChange={setSourceFilter} />
                </div>

                {/* Table */}
                <PipelineTable
                  leads={filtered}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  selectedIds={selectedIds}
                  onToggle={toggleOne}
                  onToggleAll={toggleAll}
                />
              </div>
            </div>

            {/* Sticky right rail */}
            <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-32px)] lg:overflow-y-auto">
              {selected ? (
                <>
                  <SelectedLeadCard lead={selected} />
                  <AiInsightCard lead={selected} />
                </>
              ) : (
                <div className="rounded-[18px] border border-reps-border bg-reps-panel px-6 py-14 text-center text-[13px] text-white/55">
                  Select a lead to see details
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom row */}
        {leadsAll.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <FollowUpsDueCard kpis={kpis} onOpen={(id) => setSelectedId(id)} />
            <LeadSourcesCard kpis={kpis} />
            <ConversionPerformanceCard kpis={kpis} />
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}

function NewLeadDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [value, setValue] = React.useState("");

  const m = useMutation({
    mutationFn: () =>
      createLead({
        data: {
          sender_name: name.trim(),
          sender_email: email.trim(),
          sender_phone: phone.trim() || null,
          message: message.trim() || `Manually added lead — ${name.trim()}`,
          goals: [],
          estimated_value_pence: value ? Math.round(Number(value) * 100) : null,
          source: "manual",
        },
      }),
    onSuccess: () => {
      toast.success("Lead added");
      setOpen(false);
      setName(""); setEmail(""); setPhone(""); setMessage(""); setValue("");
      onCreated();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Couldn't add lead"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-10 rounded-[10px] bg-reps-orange px-4 text-[12.5px] font-semibold text-white shadow-none hover:bg-reps-orange-dark">
          <Plus className="size-3.5" /> <span className="ml-1">New lead</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a lead manually</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="ld-name">Name</Label>
            <Input id="ld-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sarah Mills" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ld-email">Email</Label>
              <Input id="ld-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sarah@…" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ld-phone">Phone</Label>
              <Input id="ld-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="optional" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ld-value">Est. value (£)</Label>
            <Input id="ld-value" type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 1200" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ld-msg">Notes / what they want</Label>
            <Textarea id="ld-msg" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What did they ask for? Where did they come from?" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={() => m.mutate()}
            disabled={!name.trim() || !email.trim() || m.isPending}
            className="bg-reps-orange text-white shadow-none hover:bg-reps-orange-dark"
          >
            {m.isPending ? "Adding…" : "Add lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BackfillScoresButton({ onDone }: { onDone: () => void }) {
  const m = useMutation({
    mutationFn: () => backfillLeadScores(),
    onSuccess: (r) => {
      if (r.scored > 0) toast.success(`Scored ${r.scored} lead${r.scored === 1 ? "" : "s"}`);
      else toast.info("No unscored leads to backfill");
      onDone();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Couldn't score leads"),
  });
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => m.mutate()}
      disabled={m.isPending}
      className="h-10 rounded-[10px] border-reps-border bg-reps-panel text-[12.5px] font-semibold text-white/85 shadow-none hover:text-white"
    >
      {m.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5 text-reps-orange" />}
      <span className="ml-1.5">{m.isPending ? "Scoring…" : "Score all"}</span>
    </Button>
  );
}
