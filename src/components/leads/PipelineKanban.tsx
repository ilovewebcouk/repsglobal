import * as React from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { Calendar, MessageSquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  LEAD_STAGE_LABEL,
  updateLead,
  type LeadDTO,
  type LeadStage,
} from "@/lib/leads/leads.functions";
import { sourceLabel } from "./SourceChipsRow";

const COLUMNS: LeadStage[] = ["new", "call_booked", "proposal_sent", "trial_booked", "converted"];

function initials(name: string): string {
  return name.split(/\s+/).map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function fmtMoney(p: number | null): string {
  if (!p) return "—";
  return "£" + Math.round(p / 100).toLocaleString();
}

function followUpChip(iso: string | null): { label: string; tone: "urgent" | "soon" | "muted" } | null {
  if (!iso) return null;
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (diff < 0) return { label: "Overdue", tone: "urgent" };
  if (diff === 0) return { label: "Today", tone: "urgent" };
  if (diff === 1) return { label: "Tomorrow", tone: "soon" };
  if (diff < 7) return { label: `${diff}d`, tone: "soon" };
  return { label: d.toLocaleDateString(undefined, { day: "numeric", month: "short" }), tone: "muted" };
}

function priorityDot(p: LeadDTO["priority"], score: number | null): string {
  const eff = p ?? (score === null ? "low" : score >= 80 ? "high" : score >= 40 ? "medium" : "low");
  if (eff === "high") return "bg-reps-orange";
  if (eff === "medium") return "bg-white/55";
  return "bg-white/25";
}

export function PipelineKanban({
  leads,
  selectedId,
  onSelect,
}: {
  leads: LeadDTO[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const qc = useQueryClient();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const moveMut = useMutation({
    mutationFn: (vars: { id: string; stage: LeadStage }) =>
      updateLead({ data: { id: vars.id, stage: vars.stage } }),
    onSuccess: (_d, vars) => {
      toast.success(`Moved to ${LEAD_STAGE_LABEL[vars.stage]}`);
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead-kpis"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Couldn't move lead"),
  });

  const grouped = React.useMemo(() => {
    const map: Record<LeadStage, LeadDTO[]> = {
      new: [],
      contacted: [],
      call_booked: [],
      proposal_sent: [],
      trial_booked: [],
      converted: [],
      lost: [],
    };
    for (const l of leads) map[l.stage].push(l);
    return map;
  }, [leads]);

  const activeLead = activeId ? leads.find((l) => l.id === activeId) ?? null : null;

  function handleStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }
  function handleEnd(e: DragEndEvent) {
    setActiveId(null);
    const id = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId || !COLUMNS.includes(overId as LeadStage)) return;
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.stage === overId) return;
    moveMut.mutate({ id, stage: overId as LeadStage });
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleStart} onDragEnd={handleEnd}>
      <div className="grid gap-3 overflow-x-auto md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {COLUMNS.map((stage) => (
          <Column
            key={stage}
            stage={stage}
            leads={grouped[stage]}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
      <DragOverlay>
        {activeLead ? (
          <div className="pointer-events-none rotate-2">
            <KanbanCard lead={activeLead} isSelected={false} onSelect={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  stage,
  leads,
  selectedId,
  onSelect,
}: {
  stage: LeadStage;
  leads: LeadDTO[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const totalP = leads.reduce((acc, l) => acc + (l.estimated_value_pence ?? 0), 0);
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[300px] flex-col gap-2 rounded-[18px] border bg-reps-panel/60 p-3 transition-colors",
        isOver ? "border-reps-orange-border/60 bg-reps-orange-soft/8" : "border-reps-border",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-1 pb-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/85">
            {LEAD_STAGE_LABEL[stage]}
          </span>
          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-reps-panel-soft px-1.5 text-[10.5px] font-semibold text-white/70">
            {leads.length}
          </span>
        </div>
        {totalP > 0 ? (
          <span className="text-[11px] font-medium text-white/55">{fmtMoney(totalP)}</span>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        {leads.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-reps-border/60 px-3 py-6 text-center text-[11.5px] text-white/35">
            Drop here
          </div>
        ) : (
          leads.map((l) => (
            <DraggableCard
              key={l.id}
              lead={l}
              isSelected={l.id === selectedId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}

function DraggableCard({
  lead,
  isSelected,
  onSelect,
}: {
  lead: LeadDTO;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      onClick={() => onSelect(lead.id)}
    >
      <KanbanCard lead={lead} isSelected={isSelected} onSelect={onSelect} />
    </div>
  );
}

function KanbanCard({
  lead,
  isSelected,
}: {
  lead: LeadDTO;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const fu = followUpChip(lead.follow_up_at);
  return (
    <div
      className={cn(
        "group cursor-grab rounded-[16px] border bg-reps-panel p-3 text-left transition-colors active:cursor-grabbing",
        isSelected
          ? "border-reps-orange-border/70 bg-reps-orange-soft/8"
          : "border-reps-border hover:border-reps-border/80 hover:bg-reps-panel-soft/40",
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-reps-orange-soft text-[10px] font-bold text-reps-orange">
          {initials(lead.sender_name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={cn("size-1.5 rounded-full", priorityDot(lead.priority, lead.ai_score))} />
            <span className="truncate text-[12.5px] font-semibold text-white">{lead.sender_name}</span>
          </div>
          <div className="mt-0.5 truncate text-[10.5px] text-white/45">{sourceLabel(lead.source)}</div>
        </div>
      </div>

      {lead.goals[0] || lead.service_title ? (
        <div className="mt-2.5 truncate text-[11.5px] text-white/70">
          {lead.goals[0] ?? lead.service_title}
        </div>
      ) : null}

      <div className="mt-2.5 flex items-center justify-between gap-2 text-[10.5px]">
        <div className="flex items-center gap-1.5 text-white/55">
          {fu ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-[6px] border px-1.5 py-0.5 font-semibold",
                fu.tone === "urgent" && "border-reps-orange-border/40 bg-reps-orange-soft text-reps-orange",
                fu.tone === "soon" && "border-reps-border bg-reps-panel-soft text-white/85",
                fu.tone === "muted" && "border-reps-border bg-reps-panel-soft text-white/55",
              )}
            >
              <Calendar className="size-2.5" />
              {fu.label}
            </span>
          ) : null}
          {lead.ai_band === "hot" ? (
            <span className="inline-flex items-center gap-1 rounded-[6px] border border-reps-orange-border/40 bg-reps-orange-soft px-1.5 py-0.5 font-semibold text-reps-orange">
              <Sparkles className="size-2.5" /> Hot
            </span>
          ) : null}
        </div>
        <span className="font-semibold text-white">{fmtMoney(lead.estimated_value_pence)}</span>
      </div>

      {lead.message && !isSelected ? (
        <div className="mt-2.5 flex items-start gap-1.5 text-[10.5px] text-white/45">
          <MessageSquare className="size-2.5 shrink-0 translate-y-0.5" />
          <span className="line-clamp-1">{lead.message}</span>
        </div>
      ) : null}
    </div>
  );
}
