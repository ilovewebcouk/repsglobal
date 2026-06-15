import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Inbox,
  MailOpen,
  Mail,
  Phone,
  Reply,
  Archive,
  Clock,
  Search,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  X,
  Loader2,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  listMyEnquiries,
  getEnquiryStats,
  updateEnquiryStatus,
  type EnquiryDTO,
} from "@/lib/enquiries/enquiries.functions";

export const Route = createFileRoute("/_authenticated/_professional/dashboard_/enquiries")({
  head: () => ({
    meta: [
      { title: "Enquiries inbox — REPS Professional" },
      { name: "description", content: "View and manage enquiries from your REPS profile." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: EnquiriesInboxPage,
});

const STATUS_LABEL: Record<EnquiryDTO["status"], string> = {
  new: "New",
  read: "Read",
  replied: "Replied",
  archived: "Archived",
  spam: "Spam",
};

const STATUS_COLORS: Record<EnquiryDTO["status"], string> = {
  new: "bg-reps-orange/15 text-reps-orange border-reps-orange-border",
  read: "bg-white/10 text-white/70 border-white/20",
  replied: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  archived: "bg-reps-panel-soft text-white/50 border-reps-border",
  spam: "bg-reps-red/15 text-reps-red border-reps-red/30",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EnquiriesInboxPage() {
  const tier = useTrainerTier();
  const qc = useQueryClient();
  const fetchEnquiries = useServerFn(listMyEnquiries);
  const fetchStats = useServerFn(getEnquiryStats);
  const doUpdateStatus = useServerFn(updateEnquiryStatus);

  const { data: enquiries = [], isLoading } = useQuery({
    queryKey: ["my-enquiries"],
    queryFn: () => fetchEnquiries(),
    staleTime: 30_000,
  });
  const { data: stats } = useQuery({
    queryKey: ["enquiry-stats"],
    queryFn: () => fetchStats(),
    staleTime: 30_000,
  });

  const [search, setSearch] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const selected = enquiries.find((e) => e.id === selectedId) ?? null;

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return enquiries;
    return enquiries.filter(
      (e) =>
        e.sender_name.toLowerCase().includes(q) ||
        e.sender_email.toLowerCase().includes(q) ||
        e.message.toLowerCase().includes(q),
    );
  }, [enquiries, search]);

  const updateMut = useMutation({
    mutationFn: (args: { id: string; status: EnquiryDTO["status"] }) =>
      doUpdateStatus({ data: args }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["my-enquiries"] });
      qc.invalidateQueries({ queryKey: ["enquiry-stats"] });
    },
    onError: () => toast.error("Could not update status"),
  });

  const newCount = enquiries.filter((e) => e.status === "new").length;

  return (
    <DashboardShell
      role="trainer"
      tier={tier}
      active="Enquiries"
      title="Enquiries inbox"
      subtitle="Every message from your REPS profile lands here."
      search={{
        value: search,
        onChange: setSearch,
        placeholder: "Search enquiries…",
      }}
    >
      <div className="flex flex-col gap-5">
        {/* Stats strip */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Total enquiries"
            value={stats?.total ?? 0}
            icon={Inbox}
          />
          <StatTile
            label="This month"
            value={stats?.this_month_count ?? 0}
            icon={MailOpen}
          />
          <StatTile
            label="Reply rate"
            value={
              stats?.reply_rate_pct != null
                ? `${stats.reply_rate_pct}%`
                : "—"
            }
            icon={Reply}
          />
          <StatTile
            label="Avg reply time"
            value={
              stats?.reply_time_avg_hours != null
                ? `${Math.round(stats.reply_time_avg_hours)}h`
                : "—"
            }
            icon={Clock}
          />
        </div>

        {/* Upgrade nudge — replies stay in the user's own email on Verified.
            Pro unlocks AI drafts, follow-ups and pipeline in-app. */}
        <div className="flex flex-col items-start gap-3 rounded-[16px] border border-reps-orange-border bg-reps-orange-soft/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange/20">
              <Sparkles className="h-4 w-4 text-reps-orange" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-white">
                Reply faster with AI drafts, follow-ups and a pipeline
              </p>
              <p className="mt-0.5 text-[12px] text-white/65">
                Verified sends enquiries to your inbox so you reply from your own email.
                Pro adds AI-drafted replies, lead scoring and a full pipeline inside REPS.
              </p>
            </div>
          </div>
          <Button asChild className="h-9 shrink-0 gap-1.5 rounded-[10px] bg-reps-orange px-3 text-[12.5px] font-semibold text-white hover:bg-reps-orange-hover">
            <Link to="/pricing">
              Upgrade to Pro
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {/* Enquiry list */}
        <PPanel>
          {isLoading ? (
            <div className="px-5 py-10 text-center text-[13px] text-white/55">
              <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-white/40" />
              Loading enquiries…
            </div>
          ) : enquiries.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-reps-panel-soft">
                <Inbox className="size-5 text-white/55" />
              </div>
              <h2 className="mt-4 font-display text-[17px] font-bold text-white">
                No enquiries yet
              </h2>
              <p className="mx-auto mt-1 max-w-[440px] text-[13px] text-white/55">
                When someone reaches out through your REPS profile, it&apos;ll
                appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-reps-border/60 px-5 py-3.5">
                <p className="text-[11.5px] text-white/55">
                  <span className="font-semibold text-white/85">
                    {filtered.length}
                  </span>{" "}
                  enquiry{filtered.length === 1 ? "" : "s"}
                  {newCount > 0 ? (
                    <>
                      {" "}
                      ·{" "}
                      <span className="text-reps-orange">{newCount} new</span>
                    </>
                  ) : null}
                </p>
              </div>

              {/* List */}
              <ul className="divide-y divide-reps-border/40">
                {filtered.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(e.id);
                        setSheetOpen(true);
                        if (e.status === "new") {
                          updateMut.mutate({ id: e.id, status: "read" });
                        }
                      }}
                      className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-reps-panel-soft/60"
                    >
                      {/* Initials */}
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-reps-orange-soft text-[12px] font-semibold text-reps-orange">
                        {e.sender_name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[13.5px] font-semibold text-white">
                            {e.sender_name}
                          </span>
                          <span className="shrink-0 text-[11.5px] text-white/40">
                            {formatDate(e.created_at)}
                          </span>
                          {e.status === "new" && (
                            <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-reps-orange" />
                          )}
                        </div>
                        <div className="mt-0.5 truncate text-[12px] text-white/55">
                          {e.sender_email}
                        </div>
                        <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-white/70">
                          {e.message}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge
                            className={`rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${STATUS_COLORS[e.status]}`}
                            variant="outline"
                          >
                            {STATUS_LABEL[e.status]}
                          </Badge>
                          {e.service_title && (
                            <span className="rounded-full border border-reps-border bg-reps-panel-soft px-2 py-0.5 text-[10.5px] font-medium text-white/60">
                              {e.service_title}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </PPanel>
      </div>

      {/* Detail sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto border-l border-reps-border bg-reps-ink p-0 sm:max-w-[520px]"
        >
          {selected ? (
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-3 border-b border-reps-border/60 px-5 py-4">
                <SheetHeader className="space-y-0.5 text-left">
                  <SheetTitle className="font-display text-[16px] font-bold text-white">
                    {selected.sender_name}
                  </SheetTitle>
                  <SheetDescription className="text-[12px] text-white/55">
                    {selected.sender_email} · {formatDate(selected.created_at)} at{" "}
                    {formatTime(selected.created_at)}
                  </SheetDescription>
                </SheetHeader>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-[10px] text-white/50 hover:bg-reps-panel-soft hover:text-white"
                  onClick={() => setSheetOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5">
                {/* Meta chips */}
                <div className="mb-4 flex flex-wrap gap-2">
                  <Badge
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[selected.status]}`}
                    variant="outline"
                  >
                    {STATUS_LABEL[selected.status]}
                  </Badge>
                  {selected.service_title && (
                    <span className="rounded-full border border-reps-border bg-reps-panel-soft px-2.5 py-0.5 text-[11px] font-medium text-white/60">
                      {selected.service_title}
                    </span>
                  )}
                </div>

                {/* Details grid */}
                <div className="mb-5 grid grid-cols-2 gap-3">
                  <DetailItem label="Phone" value={selected.sender_phone} />
                  <DetailItem label="Location" value={selected.location} />
                  <DetailItem label="Frequency" value={selected.frequency} />
                  <DetailItem label="Start by" value={selected.start_by} />
                  <DetailItem label="Budget" value={selected.budget} />
                </div>

                {selected.goals.length > 0 && (
                  <div className="mb-5">
                    <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                      Goals
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.goals.map((g) => (
                        <span
                          key={g}
                          className="rounded-full border border-reps-border bg-reps-panel-soft px-2.5 py-1 text-[11.5px] font-medium text-white/75"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message */}
                <div>
                  <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                    Message
                  </h4>
                  <div className="whitespace-pre-wrap rounded-[12px] border border-reps-border bg-reps-panel-soft p-4 text-[13px] leading-relaxed text-white/85">
                    {selected.message}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-reps-border/60 px-5 py-4">
                <div className="flex flex-wrap gap-2">
                  {selected.status !== "replied" && (
                    <Button
                      onClick={() =>
                        updateMut.mutate({ id: selected.id, status: "replied" })
                      }
                      disabled={updateMut.isPending}
                      className="h-9 gap-1.5 rounded-[10px] bg-reps-orange px-3 text-[12.5px] font-semibold text-white hover:bg-reps-orange-hover"
                    >
                      <Reply className="h-3.5 w-3.5" />
                      Mark replied
                    </Button>
                  )}
                  {selected.status !== "archived" && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        updateMut.mutate({ id: selected.id, status: "archived" })
                      }
                      disabled={updateMut.isPending}
                      className="h-9 gap-1.5 rounded-[10px] border-reps-border bg-reps-panel text-[12.5px] font-semibold text-white/85 hover:bg-reps-panel-soft hover:text-white"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      Archive
                    </Button>
                  )}
                  {selected.status === "archived" && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        updateMut.mutate({ id: selected.id, status: "read" })
                      }
                      disabled={updateMut.isPending}
                      className="h-9 gap-1.5 rounded-[10px] border-reps-border bg-reps-panel text-[12.5px] font-semibold text-white/85 hover:bg-reps-panel-soft hover:text-white"
                    >
                      <MailOpen className="h-3.5 w-3.5" />
                      Unarchive
                    </Button>
                  )}
                  {selected.status !== "spam" && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        updateMut.mutate({ id: selected.id, status: "spam" })
                      }
                      disabled={updateMut.isPending}
                      className="h-9 gap-1.5 rounded-[10px] border-reps-red/30 bg-reps-panel text-[12.5px] font-semibold text-reps-red hover:bg-reps-red/10"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Mark as spam
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-[13px] text-white/55">
              Select an enquiry to view details
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardShell>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <PCard className="flex items-center gap-3 p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft">
        <Icon className="h-4 w-4 text-reps-orange" />
      </div>
      <div>
        <div className="text-[18px] font-bold text-white">{value}</div>
        <div className="text-[11px] font-medium text-white/45">{label}</div>
      </div>
    </PCard>
  );
}

function DetailItem({
  label,
  value,
  href,
}: {
  label: string;
  value: string | null;
  href?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
        {label}
      </div>
      {href ? (
        <a
          href={href}
          className="mt-0.5 block truncate text-[12.5px] font-medium text-reps-orange hover:underline"
        >
          {value}
        </a>
      ) : (
        <div className="mt-0.5 text-[12.5px] font-medium text-white/85">{value}</div>
      )}
    </div>
  );
}
