import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, Plus, Sparkles, Upload, Loader2, Keyboard } from "lucide-react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { PipelineKanban } from "@/components/leads/PipelineKanban";
import { BulkActionBar } from "@/components/leads/BulkActionBar";
import { LeadDetailSheet } from "@/components/leads/LeadDetailSheet";
import { SelectedLeadCard } from "@/components/leads/SelectedLeadCard";
import { AiInsightCard } from "@/components/leads/AiInsightCard";
import { FollowUpsDueCard } from "@/components/leads/FollowUpsDueCard";
import { LeadSourcesCard } from "@/components/leads/LeadSourcesCard";
import { ConversionPerformanceCard } from "@/components/leads/ConversionPerformanceCard";
import { ViewToggle, type LeadsView } from "@/components/leads/ViewToggle";
import { GettingStartedCard } from "@/components/leads/GettingStartedCard";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";
import { useLeadsKeyboard } from "@/hooks/useLeadsKeyboard";

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

const VIEW_KEY = "reps.leads.view";
const PIN_KEY = "reps.leads.detailPinned";

function readLocal<T extends string>(key: string, fallback: T, allow: readonly T[]): T {
  if (typeof window === "undefined") return fallback;
  const v = window.localStorage.getItem(key);
  return allow.includes(v as T) ? (v as T) : fallback;
}

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
  const [stageFilter, setStageFilter] = React.useState<LeadStage | "all">("all");
  const [sourceFilter, setSourceFilter] = React.useState<string>("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);

  const [view, setView] = React.useState<LeadsView>(() => readLocal(VIEW_KEY, "table", ["table", "kanban"] as const));
  const [pinned, setPinned] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(PIN_KEY) === "1";
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem(VIEW_KEY, view);
  }, [view]);
  React.useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem(PIN_KEY, pinned ? "1" : "0");
  }, [pinned]);

  const sources = React.useMemo(() => {
    const s = new Set<string>();
    for (const l of leadsAll) s.add(l.source);
    return Array.from(s).sort();
  }, [leadsAll]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
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
  }, [leadsAll, search, stageFilter, sourceFilter]);

  React.useEffect(() => {
    if (!selectedId && filtered.length) setSelectedId(filtered[0].id);
    if (selectedId && !filtered.find((l) => l.id === selectedId) && filtered.length) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected: LeadDTO | null = leadsAll.find((l) => l.id === selectedId) ?? null;
  const activeCount = leadsAll.filter((l) => l.stage !== "converted" && l.stage !== "lost").length;
  const totalLeads = leadsAll.length;

  // Low-data thresholds
  const showFullKpi = totalLeads >= 5;
  const showAnalytics = totalLeads >= 10;
  const showGettingStarted = totalLeads > 0 && totalLeads < 5;

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

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["leads"] });
    qc.invalidateQueries({ queryKey: ["lead-kpis"] });
  };

  // Select + open sheet (or just update rail when pinned)
  const openLead = React.useCallback(
    (id: string) => {
      setSelectedId(id);
      if (!pinned) setSheetOpen(true);
    },
    [pinned],
  );

  // Keyboard navigation: J/K cycle leads, Enter opens, Esc closes
  const moveSelection = React.useCallback(
    (delta: 1 | -1) => {
      if (filtered.length === 0) return;
      const idx = Math.max(0, filtered.findIndex((l) => l.id === selectedId));
      const nextIdx = (idx + delta + filtered.length) % filtered.length;
      setSelectedId(filtered[nextIdx].id);
    },
    [filtered, selectedId],
  );
  useLeadsKeyboard({
    enabled: totalLeads > 0,
    count: filtered.length,
    selectedId,
    onMove: moveSelection,
    onOpen: () => selectedId && !pinned && setSheetOpen(true),
    onClose: () => setSheetOpen(false),
  });

  // "?" opens shortcuts cheatsheet
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement) {
        const t = e.target.tagName;
        if (t === "INPUT" || t === "TEXTAREA" || e.target.isContentEditable) return;
      }
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <DashboardShell
      role="trainer"
      tier={tier}
      active="Leads"
      title="Leads pipeline"
      subtitle="Track enquiries, prioritise follow-ups and convert leads into clients."
      search={{ value: search, onChange: setSearch, placeholder: "Search leads…" }}
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("CSV import is coming in Phase 2.3")}
            className="h-10 rounded-[10px] border-reps-border bg-reps-panel text-[12.5px] font-semibold text-white/85 shadow-none transition-colors hover:bg-reps-panel-soft hover:text-white"
          >
            <Upload className="size-3.5" /> <span className="ml-1.5">Import leads</span>
          </Button>
          <NewLeadDialog onCreated={invalidate} />
          <BackfillScoresButton onDone={invalidate} />
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Low-data mode: collapse KPI strip into Getting Started card */}
        {showGettingStarted ? (
          <GettingStartedCard
            leadCount={totalLeads}
            firstLeadName={filtered[0]?.sender_name ?? null}
            onAddLead={() => {
              const trigger = document.querySelector<HTMLButtonElement>("[data-new-lead-trigger]");
              trigger?.click();
            }}
            onOpenFirst={filtered[0] ? () => openLead(filtered[0].id) : undefined}
          />
        ) : null}

        {/* KPI strip only when there's enough data */}
        {showFullKpi ? <KpiStrip kpis={kpis} /> : null}

        {/* Pipeline + (optional) pinned rail */}
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
                When someone enquires through your REPS profile, it&apos;ll land here. You can also add a lead manually using &ldquo;+ New lead&rdquo;.
              </p>
            </div>
          </PCard>
        ) : (
          <div
            className={
              pinned
                ? "grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]"
                : "flex flex-col gap-3"
            }
          >
            {/* Pipeline */}
            <div className="flex min-w-0 flex-col gap-3">
              {selectedIds.size > 0 ? (
                <BulkActionBar selectedIds={selectedIds} onClear={clearSelection} />
              ) : null}
              <div className="rounded-[18px] border border-reps-border bg-reps-panel">
                {/* Panel header — count + view toggle */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-reps-border/60 px-5 py-3.5">
                  <p className="text-[11.5px] text-white/55">
                    <span className="font-semibold text-white/85">{activeCount}</span> active lead{activeCount === 1 ? "" : "s"} · sorted by priority and follow-up
                  </p>
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShortcutsOpen(true)}
                            aria-label="Keyboard shortcuts"
                            className="size-8 rounded-[8px] p-0 text-white/55 hover:bg-reps-panel-soft hover:text-white"
                          >
                            <Keyboard className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Keyboard shortcuts (press ?)</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <ViewToggle value={view} onChange={setView} />
                  </div>
                </div>

                {/* Filter chips */}
                <div className="flex flex-col gap-3 border-b border-reps-border/60 px-5 py-4">
                  <StageChipsBar value={stageFilter} onChange={setStageFilter} />
                  <SourceChipsRow sources={sources} value={sourceFilter} onChange={setSourceFilter} />
                </div>

                {/* View body */}
                {view === "table" ? (
                  <PipelineTable
                    leads={filtered}
                    selectedId={selectedId}
                    onSelect={openLead}
                    selectedIds={selectedIds}
                    onToggle={toggleOne}
                    onToggleAll={toggleAll}
                  />
                ) : (
                  <div className="p-4">
                    <PipelineKanban
                      leads={filtered}
                      selectedId={selectedId}
                      onSelect={openLead}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Pinned rail (only when user has toggled pin) */}
            {pinned ? (
              <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-32px)] lg:overflow-y-auto">
                {selected ? (
                  <>
                    <SelectedLeadCard lead={selected} />
                    <AiInsightCard lead={selected} />
                    <button
                      type="button"
                      onClick={() => setPinned(false)}
                      className="rounded-[10px] border border-dashed border-reps-border bg-reps-panel/40 px-3 py-2 text-[11px] font-semibold text-white/55 transition-colors hover:bg-reps-panel-soft hover:text-white"
                    >
                      Unpin · use sliding sheet
                    </button>
                  </>
                ) : (
                  <div className="rounded-[18px] border border-reps-border bg-reps-panel px-6 py-14 text-center text-[13px] text-white/55">
                    Select a lead to see details
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Bottom analytics — only at scale */}
        {showAnalytics ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <FollowUpsDueCard kpis={kpis} onOpen={(id) => openLead(id)} />
            <LeadSourcesCard kpis={kpis} />
            <ConversionPerformanceCard kpis={kpis} />
          </div>
        ) : null}
      </div>

      {/* Sliding detail sheet — non-modal so the table behind stays interactive */}
      <LeadDetailSheet
        lead={selected}
        open={!pinned && sheetOpen}
        onOpenChange={setSheetOpen}
        pinned={pinned}
        onTogglePin={() => {
          setPinned((p) => !p);
          setSheetOpen(false);
        }}
      />

      {/* Keyboard shortcuts cheatsheet */}
      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Keyboard shortcuts</DialogTitle>
            <DialogDescription>Move through leads without lifting your hands.</DialogDescription>
          </DialogHeader>
          <ul className="flex flex-col gap-2.5 text-[13px]">
            <Shortcut keys={["J", "↓"]} action="Next lead" />
            <Shortcut keys={["K", "↑"]} action="Previous lead" />
            <Shortcut keys={["Enter"]} action="Open lead details" />
            <Shortcut keys={["Esc"]} action="Close details" />
            <Shortcut keys={["?"]} action="Open this cheatsheet" />
          </ul>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

function Shortcut({ keys, action }: { keys: string[]; action: string }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="text-white/70">{action}</span>
      <span className="flex items-center gap-1.5">
        {keys.map((k) => (
          <kbd
            key={k}
            className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-[6px] border border-reps-border bg-reps-panel-soft px-1.5 text-[11px] font-semibold text-white/85"
          >
            {k}
          </kbd>
        ))}
      </span>
    </li>
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
        <Button data-new-lead-trigger size="sm" className="h-10 rounded-[10px] bg-reps-orange px-4 text-[12.5px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-dark">
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
      className="h-10 rounded-[10px] border-reps-border bg-reps-panel text-[12.5px] font-semibold text-white/85 shadow-none transition-colors hover:bg-reps-panel-soft hover:text-white"
    >
      {m.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5 text-reps-orange" />}
      <span className="ml-1.5">{m.isPending ? "Scoring…" : "Score all"}</span>
    </Button>
  );
}
