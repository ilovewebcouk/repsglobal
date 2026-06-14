import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, Plus, Search, Target } from "lucide-react";
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
  createLead,
  getLeadKpis,
  listLeads,
  type LeadDTO,
  type LeadStage,
} from "@/lib/leads/leads.functions";
import { PipelineTable } from "@/components/leads/PipelineTable";
import { LeadDrawer } from "@/components/leads/LeadDrawer";
import { KpiStrip, BottomCards } from "@/components/leads/Kpis";

export const Route = createFileRoute("/_authenticated/_professional/dashboard_/leads")({
  head: () => ({
    meta: [
      { title: "Leads pipeline — REPS Professional" },
      { name: "description", content: "Manage every lead from first enquiry to converted client — with AI scoring, recommended actions and revenue forecasts." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: LeadsPipelinePage,
});

function LeadsPipelinePage() {
  const qc = useQueryClient();

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

  const leads = React.useMemo(() => {
    if (!search.trim()) return leadsAll;
    const q = search.toLowerCase();
    return leadsAll.filter(
      (l) =>
        l.sender_name.toLowerCase().includes(q) ||
        l.sender_email.toLowerCase().includes(q) ||
        l.message.toLowerCase().includes(q),
    );
  }, [leadsAll, search]);

  React.useEffect(() => {
    if (!selectedId && leads.length) setSelectedId(leads[0].id);
  }, [leads, selectedId]);

  const selected: LeadDTO | null = leads.find((l) => l.id === selectedId) ?? null;

  return (
    <DashboardShell role="trainer" tier={tier} active="Leads" title="Leads" subtitle="Your full pipeline">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-[26px] font-bold text-white">Leads pipeline</h1>
            <p className="mt-1 text-[13.5px] text-white/55">
              Every enquiry — scored, ranked and ready to act on. {locked ? <span className="text-reps-orange">Upgrade to Pro to unlock AI scoring, drafts and forecasts.</span> : null}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-white/45" />
              <Input
                placeholder="Search leads…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-[220px] rounded-[10px] border-reps-border bg-reps-panel-soft pl-8 text-[12.5px]"
              />
            </div>
            <NewLeadDialog onCreated={() => { qc.invalidateQueries({ queryKey: ["leads"] }); qc.invalidateQueries({ queryKey: ["lead-kpis"] }); }} />
          </div>
        </div>

        {/* KPI strip */}
        <KpiStrip kpis={kpis} locked={locked} />

        {/* Pipeline + drawer */}
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
          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <PCard className="min-h-[560px]">
              <PipelineTable
                leads={leads}
                selectedId={selectedId}
                onSelect={setSelectedId}
                stageFilter={stageFilter}
                onStageFilterChange={setStageFilter}
                sourceFilter={sourceFilter}
                onSourceFilterChange={setSourceFilter}
              />
            </PCard>
            <PCard className="lg:sticky lg:top-4 self-start max-h-[calc(100vh-120px)] overflow-y-auto">
              {selected ? (
                <div className="p-4">
                  <LeadDrawer lead={selected} locked={locked} />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center px-6 py-14 text-[13px] text-white/55">
                  <div className="text-center">
                    <Target className="mx-auto size-6 text-white/40" />
                    <p className="mt-3">Select a lead to see details</p>
                  </div>
                </div>
              )}
            </PCard>
          </div>
        )}

        {/* Bottom row */}
        <BottomCards kpis={kpis} locked={locked} />
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
        <Button size="sm" className="h-9 rounded-[10px] bg-reps-orange text-[12.5px] font-semibold text-white hover:bg-reps-orange-dark">
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
            className="bg-reps-orange text-white hover:bg-reps-orange-dark"
          >
            {m.isPending ? "Adding…" : "Add lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
