import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Archive,
  CheckCheck,
  Inbox,
  Mail,
  MailOpen,
  MapPin,
  Phone,
  Target,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard } from "@/components/dashboard/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";
import {
  listMyEnquiries,
  updateEnquiryStatus,
  type EnquiryDTO,
} from "@/lib/enquiries/enquiries.functions";

export const Route = createFileRoute("/_authenticated/_professional/dashboard_/enquiries")({
  head: () => ({
    meta: [
      { title: "Enquiries — REPS Professional" },
      { name: "description", content: "Read and reply to client enquiries from your REPS profile." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: EnquiriesInboxPage,
});

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function StatusBadge({ status }: { status: EnquiryDTO["status"] }) {
  const map: Record<EnquiryDTO["status"], { label: string; cls: string }> = {
    new: { label: "New", cls: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300" },
    read: { label: "Read", cls: "border-reps-border bg-reps-panel-soft text-white/70" },
    replied: { label: "Replied", cls: "border-reps-border bg-reps-panel-soft text-white/70" },
    archived: { label: "Archived", cls: "border-reps-border bg-reps-panel-soft text-white/50" },
    spam: { label: "Spam", cls: "border-reps-border bg-reps-panel-soft text-white/40" },
  };
  const v = map[status];
  return (
    <Badge variant="outline" className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider ${v.cls}`}>
      {v.label}
    </Badge>
  );
}

function EnquiriesInboxPage() {
  const tier = useTrainerTier();
  const qc = useQueryClient();

  const { data: enquiries = [], isLoading } = useQuery({
    queryKey: ["my-enquiries"],
    queryFn: () => listMyEnquiries(),
    staleTime: 30_000,
  });

  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // Auto-select first enquiry once loaded
  React.useEffect(() => {
    if (!selectedId && enquiries.length) setSelectedId(enquiries[0].id);
  }, [enquiries, selectedId]);

  const selected = enquiries.find((e) => e.id === selectedId) ?? null;

  const statusMutation = useMutation({
    mutationFn: (vars: { id: string; status: EnquiryDTO["status"] }) =>
      updateEnquiryStatus({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-enquiries"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Couldn't update enquiry");
    },
  });

  // Mark selected as read on open
  React.useEffect(() => {
    if (selected && selected.status === "new") {
      statusMutation.mutate({ id: selected.id, status: "read" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const newCount = enquiries.filter((e) => e.status === "new").length;

  return (
    <DashboardShell role="trainer" tier={tier} active="Enquiries">
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-[26px] font-bold text-white">Enquiries</h1>
            <p className="mt-1 text-[13.5px] text-white/55">
              Private messages sent from your REPS profile.{" "}
              {newCount > 0 && (
                <span className="font-semibold text-emerald-300">
                  {newCount} new
                </span>
              )}
            </p>
          </div>
        </div>

        {isLoading ? (
          <PCard>
            <div className="px-5 py-10 text-center text-[13px] text-white/55">Loading enquiries…</div>
          </PCard>
        ) : enquiries.length === 0 ? (
          <PCard>
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-reps-panel-soft">
                <Inbox className="size-5 text-white/55" />
              </div>
              <h2 className="mt-4 font-display text-[17px] font-bold text-white">No enquiries yet</h2>
              <p className="mx-auto mt-1 max-w-[440px] text-[13px] text-white/55">
                When someone enquires through your REPS profile, it'll appear here and we'll email you the details. Make sure your profile is published and your services are listed.
              </p>
            </div>
          </PCard>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
            {/* List */}
            <PCard>
              <ul className="divide-y divide-reps-border/60">
                {enquiries.map((e) => {
                  const isActive = e.id === selectedId;
                  const isUnread = e.status === "new";
                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(e.id)}
                        className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors ${
                          isActive ? "bg-reps-panel-soft" : "hover:bg-reps-panel-soft/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`truncate text-[13.5px] ${isUnread ? "font-bold text-white" : "font-semibold text-white/85"}`}>
                            {e.sender_name}
                          </span>
                          <span className="shrink-0 text-[11px] text-white/45">{timeAgo(e.created_at)}</span>
                        </div>
                        <p className="line-clamp-2 text-[12.5px] leading-snug text-white/55">
                          {e.message}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <StatusBadge status={e.status} />
                          {e.service_title && (
                            <span className="truncate text-[11px] text-white/45">{e.service_title}</span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </PCard>

            {/* Detail */}
            {selected ? (
              <PCard>
                <div className="flex flex-col">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-reps-border/60 px-6 py-5">
                    <div className="min-w-0">
                      <h2 className="font-display text-[20px] font-bold text-white">
                        {selected.sender_name}
                      </h2>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-white/70">
                        <a
                          href={`mailto:${selected.sender_email}`}
                          className="inline-flex items-center gap-1.5 hover:text-white"
                        >
                          <Mail className="size-3.5" /> {selected.sender_email}
                        </a>
                        {selected.sender_phone && (
                          <a
                            href={`tel:${selected.sender_phone}`}
                            className="inline-flex items-center gap-1.5 hover:text-white"
                          >
                            <Phone className="size-3.5" /> {selected.sender_phone}
                          </a>
                        )}
                        {selected.location && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="size-3.5" /> {selected.location}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <StatusBadge status={selected.status} />
                        <span className="text-[11.5px] text-white/45">
                          Received {timeAgo(selected.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        asChild
                        size="sm"
                        className="h-9 rounded-[10px] bg-reps-orange text-[12.5px] font-semibold text-white hover:bg-reps-orange-dark"
                      >
                        <a href={`mailto:${selected.sender_email}?subject=Re%3A%20your%20REPS%20enquiry`}>
                          <Mail data-icon="inline-start" className="size-3.5" />
                          Reply by email
                        </a>
                      </Button>
                      {selected.status !== "replied" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 rounded-[10px] border-reps-border bg-reps-panel-soft text-[12.5px] font-semibold text-white hover:bg-reps-panel"
                          onClick={() => statusMutation.mutate({ id: selected.id, status: "replied" })}
                          disabled={statusMutation.isPending}
                        >
                          <CheckCheck data-icon="inline-start" className="size-3.5" />
                          Mark replied
                        </Button>
                      )}
                      {selected.status !== "archived" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 rounded-[10px] border-reps-border bg-reps-panel-soft text-[12.5px] font-semibold text-white hover:bg-reps-panel"
                          onClick={() => statusMutation.mutate({ id: selected.id, status: "archived" })}
                          disabled={statusMutation.isPending}
                        >
                          <Archive data-icon="inline-start" className="size-3.5" />
                          Archive
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-5 px-6 py-5 lg:grid-cols-[1fr_220px]">
                    <div>
                      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
                        Message
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-white/85">
                        {selected.message}
                      </p>
                    </div>

                    <dl className="flex flex-col gap-3 rounded-[16px] border border-reps-border/60 bg-reps-panel-soft p-4 text-[12.5px]">
                      {selected.service_title && (
                        <DetailRow label="Interested in" value={selected.service_title} />
                      )}
                      {selected.goals.length > 0 && (
                        <DetailRow label="Goals" value={selected.goals.join(", ")} icon={Target} />
                      )}
                      {selected.frequency && <DetailRow label="Frequency" value={selected.frequency} />}
                      {selected.start_by && <DetailRow label="Start by" value={selected.start_by} />}
                      {selected.budget && <DetailRow label="Budget" value={selected.budget} />}
                    </dl>
                  </div>
                </div>
              </PCard>
            ) : (
              <PCard>
                <div className="flex h-full items-center justify-center px-6 py-14 text-[13px] text-white/55">
                  <div className="text-center">
                    <MailOpen className="mx-auto size-6 text-white/40" />
                    <p className="mt-3">Select an enquiry to read</p>
                  </div>
                </div>
              </PCard>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function DetailRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div>
      <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-white/45">{label}</dt>
      <dd className="mt-1 flex items-start gap-1.5 text-white/85">
        {Icon && <Icon className="mt-0.5 size-3.5 shrink-0 text-white/55" />}
        <span>{value}</span>
      </dd>
    </div>
  );
}
