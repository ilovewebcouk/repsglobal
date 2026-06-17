import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Megaphone,
  Mail,
  CheckCircle2,
  AlertCircle,
  MessageSquareReply,
  RefreshCw,
  Trash2,
  Calendar,
  Send,
  Loader2,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listCampaigns, getCampaign } from "@/lib/campaigns/campaigns.functions";
import {
  resendFailedRecipients,
  sendCampaignNow,
  deleteCampaign,
  unscheduleCampaign,
} from "@/lib/campaigns/outbound-extras.functions";
import type { ComposeInitialDraft } from "./ComposeDialog";

function timeAgo(iso?: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

function whenLabel(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

const STATUS_CHIP: Record<string, string> = {
  queued: "bg-white/10 text-white/65",
  sent: "bg-emerald-500/15 text-emerald-300",
  failed: "bg-rose-500/15 text-rose-300",
  bounced: "bg-amber-500/15 text-amber-300",
  complained: "bg-amber-500/15 text-amber-300",
  replied: "bg-reps-orange-soft text-reps-orange",
  draft: "bg-white/10 text-white/65",
  scheduled: "bg-amber-500/15 text-amber-300",
  sending: "bg-sky-500/15 text-sky-300",
};

const TABS: Array<{ key: string; label: string; statuses?: string[] }> = [
  { key: "sent", label: "Sent", statuses: ["sent", "failed", "sending"] },
  { key: "drafts", label: "Drafts", statuses: ["draft"] },
  { key: "scheduled", label: "Scheduled", statuses: ["scheduled"] },
];

export function CampaignsList({
  onEditDraft,
}: {
  onEditDraft?: (draft: ComposeInitialDraft) => void;
}) {
  const listFn = useServerFn(listCampaigns);
  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState<string>("sent");
  const qc = useQueryClient();

  const activeStatuses = useMemo(
    () => TABS.find((t) => t.key === tab)?.statuses,
    [tab],
  );

  const q = useQuery({
    queryKey: ["admin", "support", "campaigns", tab],
    queryFn: () => listFn({ data: { status: activeStatuses } }),
  });

  const campaigns = q.data ?? [];

  const refetchAll = () => {
    void qc.invalidateQueries({ queryKey: ["admin", "support", "campaigns"] });
  };

  return (
    <>
      <div className="flex items-center gap-1 border-b border-reps-border/60 px-3 pt-2">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative px-3 py-2 text-[12.5px] font-semibold transition ${
                active ? "text-white" : "text-white/55 hover:text-white/85"
              }`}
            >
              {t.label}
              {active ? (
                <span className="absolute inset-x-2 -bottom-px h-[2px] bg-reps-orange" />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-[13px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.06em] text-white/45">
              <th className="px-5 py-3 font-semibold">Campaign</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 font-semibold">Inbox</th>
              <th className="px-3 py-3 font-semibold">Recipients</th>
              <th className="px-3 py-3 font-semibold">Sent</th>
              <th className="px-3 py-3 font-semibold">Failed</th>
              <th className="px-3 py-3 font-semibold">When</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {q.isLoading ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-white/45 text-[12px]">
                  Loading campaigns…
                </td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center">
                  <Megaphone className="mx-auto mb-2 size-6 text-white/35" />
                  <div className="text-[13px] font-medium text-white/80">
                    {tab === "drafts"
                      ? "No drafts saved"
                      : tab === "scheduled"
                      ? "Nothing scheduled"
                      : "No campaigns yet"}
                  </div>
                  <div className="mx-auto mt-1 max-w-md text-[12px] text-white/45">
                    {tab === "drafts"
                      ? "Use Compose → Save draft to keep a campaign for later."
                      : tab === "scheduled"
                      ? "Use Compose → Schedule to send a broadcast at a future time."
                      : "Use Compose → Broadcast to email trainers by tier. Replies become real tickets."}
                  </div>
                </td>
              </tr>
            ) : (
              campaigns.map((c: any) => {
                const isDraft = c.status === "draft";
                const isScheduled = c.status === "scheduled";
                return (
                  <tr
                    key={c.id}
                    className="border-t border-reps-border/60 text-white/85 hover:bg-white/[0.02] cursor-pointer"
                    onClick={() => {
                      if (isDraft && onEditDraft) {
                        onEditDraft({
                          id: c.id,
                          inbox: c.inbox,
                          mode: c.mode ?? (c.tiers?.length > 0 ? "broadcast" : "direct"),
                          subject: c.subject ?? "",
                          body: c.body_text ?? "",
                          format: c.format ?? "text",
                          tiers: c.tiers ?? [],
                          recipients: c.direct_recipients ?? [],
                          attachments: c.attachments ?? [],
                          scheduledAt: c.scheduled_at,
                        });
                      } else {
                        setOpenId(c.id);
                      }
                    }}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Megaphone className="size-3.5 text-reps-orange" />
                        <div className="text-[13px] font-semibold text-white line-clamp-1">
                          {c.subject || <span className="text-white/45">(no subject)</span>}
                        </div>
                      </div>
                      {c.tiers?.length > 0 ? (
                        <div className="mt-1 flex gap-1">
                          {c.tiers.map((t: string) => (
                            <Badge
                              key={t}
                              variant="outline"
                              className="border-reps-border text-white/55 uppercase text-[10px]"
                            >
                              {t}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex h-5 items-center rounded-full px-2 text-[10.5px] font-semibold capitalize ${
                          STATUS_CHIP[c.status] ?? STATUS_CHIP.queued
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex h-6 items-center rounded-[6px] bg-white/10 px-2 text-[11px] font-semibold text-white/75 capitalize">
                        {c.inbox}
                      </span>
                    </td>
                    <td className="px-3 py-3 tabular-nums text-white/85">{c.total_recipients}</td>
                    <td className="px-3 py-3 tabular-nums text-emerald-300">{c.sent_count}</td>
                    <td
                      className={`px-3 py-3 tabular-nums ${
                        c.failed_count > 0 ? "text-rose-300" : "text-white/45"
                      }`}
                    >
                      {c.failed_count}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-white/55">
                      {isScheduled
                        ? whenLabel(c.scheduled_at)
                        : timeAgo(c.sent_at ?? c.created_at)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button className="text-[12px] font-semibold text-reps-orange hover:underline">
                        {isDraft ? "Edit" : "View"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <CampaignDrawer
        campaignId={openId}
        onClose={() => {
          setOpenId(null);
          refetchAll();
        }}
      />
    </>
  );
}

function CampaignDrawer({
  campaignId,
  onClose,
}: {
  campaignId: string | null;
  onClose: () => void;
}) {
  const getFn = useServerFn(getCampaign);
  const resendFn = useServerFn(resendFailedRecipients);
  const sendNowFn = useServerFn(sendCampaignNow);
  const deleteFn = useServerFn(deleteCampaign);
  const unscheduleFn = useServerFn(unscheduleCampaign);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["admin", "support", "campaign", campaignId],
    queryFn: () => getFn({ data: { id: campaignId! } }),
    enabled: !!campaignId,
  });

  const resend = useMutation({
    mutationFn: () => resendFn({ data: { campaignId: campaignId! } }),
    onSuccess: (res) => {
      if (res.total === 0) toast.info("No failed recipients to resend");
      else if (res.dailyLimitHit)
        toast.warning(`Resent ${res.sent} · stopped — Mailgun daily limit hit`);
      else if (res.failed > 0) toast.warning(`Resent ${res.sent} · still failed ${res.failed}`);
      else toast.success(`Resent ${res.sent} ${res.sent === 1 ? "recipient" : "recipients"}`);
      void qc.invalidateQueries({ queryKey: ["admin", "support", "campaign", campaignId] });
      void qc.invalidateQueries({ queryKey: ["admin", "support", "campaigns"] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Resend failed"),
  });

  const sendNow = useMutation({
    mutationFn: () => sendNowFn({ data: { id: campaignId! } }),
    onSuccess: (res) => {
      if (res.dailyLimitHit)
        toast.warning(`Sent ${res.sent} · stopped — Mailgun daily limit hit`);
      else if (res.failed > 0) toast.warning(`Sent ${res.sent} · failed ${res.failed}`);
      else toast.success(`Sent to ${res.sent} ${res.sent === 1 ? "recipient" : "recipients"}`);
      void qc.invalidateQueries({ queryKey: ["admin", "support", "campaign", campaignId] });
      void qc.invalidateQueries({ queryKey: ["admin", "support", "campaigns"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Send failed"),
  });

  const del = useMutation({
    mutationFn: () => deleteFn({ data: { id: campaignId! } }),
    onSuccess: () => {
      toast.success("Campaign deleted");
      onClose();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Delete failed"),
  });

  const unschedule = useMutation({
    mutationFn: () => unscheduleFn({ data: { id: campaignId! } }),
    onSuccess: () => {
      toast.success("Schedule cancelled — moved back to draft");
      void qc.invalidateQueries({ queryKey: ["admin", "support", "campaign", campaignId] });
      void qc.invalidateQueries({ queryKey: ["admin", "support", "campaigns"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Cancel failed"),
  });

  const campaign = q.data?.campaign;
  const status = campaign?.status as string | undefined;

  return (
    <Sheet open={!!campaignId} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[640px] bg-reps-bg border-l border-reps-border text-white overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="text-white">
            {campaign?.subject ?? "Campaign"}
          </SheetTitle>
        </SheetHeader>

        {q.isLoading ? (
          <div className="mt-6 text-[12.5px] text-white/55">Loading…</div>
        ) : q.data ? (
          <div className="mt-4 flex flex-col gap-4">
            {status ? (
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex h-5 items-center rounded-full px-2 text-[10.5px] font-semibold capitalize ${
                    STATUS_CHIP[status] ?? STATUS_CHIP.queued
                  }`}
                >
                  {status}
                </span>
                {status === "scheduled" && campaign?.scheduled_at ? (
                  <span className="text-[12px] text-white/55">
                    <Calendar className="mr-1 inline size-3.5 text-amber-300" />
                    Sends at {whenLabel(campaign.scheduled_at)}
                  </span>
                ) : null}
                {campaign?.last_error ? (
                  <span className="text-[12px] text-rose-300">{campaign.last_error}</span>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              {(campaign?.failed_count ?? 0) > 0 ? (
                <Button
                  onClick={() => resend.mutate()}
                  disabled={resend.isPending}
                  className="bg-reps-orange text-white hover:bg-reps-orange/90"
                >
                  {resend.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="size-4" />
                      Resend failed ({campaign?.failed_count ?? 0})
                    </>
                  )}
                </Button>
              ) : null}
              {status === "scheduled" ? (
                <>
                  <Button
                    onClick={() => sendNow.mutate()}
                    disabled={sendNow.isPending}
                    className="bg-reps-orange text-white hover:bg-reps-orange/90"
                  >
                    {sendNow.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="size-4" />
                        Send now
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => unschedule.mutate()}
                    disabled={unschedule.isPending}
                    className="border-reps-border bg-white/[0.04] text-white/85 hover:text-white"
                  >
                    Cancel schedule
                  </Button>
                </>
              ) : null}
              {status && ["draft", "scheduled", "failed"].includes(status) ? (
                <Button
                  variant="outline"
                  onClick={() => del.mutate()}
                  disabled={del.isPending}
                  className="border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 hover:text-rose-100"
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              ) : null}
            </div>

            <div className="grid grid-cols-4 gap-2">
              <Stat
                icon={<Mail className="size-3.5 text-white/55" />}
                label="Total"
                value={campaign?.total_recipients ?? 0}
              />
              <Stat
                icon={<CheckCircle2 className="size-3.5 text-emerald-300" />}
                label="Sent"
                value={campaign?.sent_count ?? 0}
                tone="emerald"
              />
              <Stat
                icon={<AlertCircle className="size-3.5 text-rose-300" />}
                label="Failed"
                value={campaign?.failed_count ?? 0}
                tone={(campaign?.failed_count ?? 0) > 0 ? "rose" : undefined}
              />
              <Stat
                icon={<MessageSquareReply className="size-3.5 text-reps-orange" />}
                label="Replied"
                value={q.data.repliedCount}
                tone={q.data.repliedCount > 0 ? "orange" : undefined}
              />
            </div>

            <div className="rounded-[16px] border border-reps-border bg-white/[0.02] p-4">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-white/55">
                Message
              </div>
              <div className="whitespace-pre-wrap text-[13px] text-white/85 leading-relaxed max-h-72 overflow-y-auto">
                {campaign?.body_text}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/55">
                  Recipients
                </div>
                <div className="text-[11px] text-white/45 tabular-nums">
                  {q.data.recipients.length}
                </div>
              </div>
              <div className="rounded-[16px] border border-reps-border bg-white/[0.02] divide-y divide-reps-border/60 max-h-[420px] overflow-y-auto">
                {q.data.recipients.map((r: any) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 text-[12.5px]"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium text-white/90">
                        {r.name || r.email}
                      </div>
                      {r.name ? (
                        <div className="truncate text-[11px] text-white/45">{r.email}</div>
                      ) : null}
                      {r.error_message ? (
                        <div className="mt-0.5 truncate text-[11px] text-rose-300">
                          {r.error_message}
                        </div>
                      ) : null}
                    </div>
                    <span
                      className={`inline-flex h-5 items-center rounded-full px-2 text-[10.5px] font-semibold capitalize ${
                        STATUS_CHIP[r.status] ?? STATUS_CHIP.queued
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: "emerald" | "rose" | "orange";
}) {
  const tones: Record<string, string> = {
    emerald: "text-emerald-300",
    rose: "text-rose-300",
    orange: "text-reps-orange",
  };
  return (
    <div className="rounded-[16px] border border-reps-border bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-white/45">
        {icon}
        {label}
      </div>
      <div
        className={`mt-1 font-display text-[20px] font-bold tabular-nums ${
          tone ? tones[tone] : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
