import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Megaphone, Mail, CheckCircle2, AlertCircle, MessageSquareReply } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { listCampaigns, getCampaign } from "@/lib/support/campaigns.functions";
import { Empty } from "@/components/ui/empty";

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

const STATUS_CHIP: Record<string, string> = {
  queued: "bg-white/10 text-white/65",
  sent: "bg-emerald-500/15 text-emerald-300",
  failed: "bg-rose-500/15 text-rose-300",
  bounced: "bg-amber-500/15 text-amber-300",
  complained: "bg-amber-500/15 text-amber-300",
  replied: "bg-reps-orange-soft text-reps-orange",
};

export function CampaignsTab() {
  const listFn = useServerFn(listCampaigns);
  const [openId, setOpenId] = useState<string | null>(null);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["admin", "support", "campaigns"],
    queryFn: () => listFn(),
  });

  const campaigns = q.data ?? [];

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-[13px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.06em] text-white/45">
              <th className="px-5 py-3 font-semibold">Campaign</th>
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
                <td colSpan={7} className="px-5 py-8 text-center text-white/45 text-[12px]">
                  Loading campaigns…
                </td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12">
                  <Empty
                    className="border-0 bg-transparent"
                  >
                    <Megaphone className="mx-auto mb-2 size-6 text-white/35" />
                    <div className="text-[13px] font-medium text-white/80">No broadcasts yet</div>
                    <div className="mt-1 text-[12px] text-white/45">
                      Use Compose → Broadcast to email trainers by tier. Each broadcast is a
                      single campaign — replies become real tickets.
                    </div>
                  </Empty>
                </td>
              </tr>
            ) : (
              campaigns.map((c: any) => (
                <tr
                  key={c.id}
                  className="border-t border-reps-border/60 text-white/85 hover:bg-white/[0.02] cursor-pointer"
                  onClick={() => setOpenId(c.id)}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Megaphone className="size-3.5 text-reps-orange" />
                      <div className="text-[13px] font-semibold text-white line-clamp-1">
                        {c.subject}
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
                    <span className="inline-flex h-6 items-center rounded-[6px] bg-white/10 px-2 text-[11px] font-semibold text-white/75 capitalize">
                      {c.inbox}
                    </span>
                  </td>
                  <td className="px-3 py-3 tabular-nums text-white/85">{c.total_recipients}</td>
                  <td className="px-3 py-3 tabular-nums text-emerald-300">{c.sent_count}</td>
                  <td className={`px-3 py-3 tabular-nums ${c.failed_count > 0 ? "text-rose-300" : "text-white/45"}`}>
                    {c.failed_count}
                  </td>
                  <td className="px-3 py-3 text-[12px] text-white/55">
                    {timeAgo(c.sent_at ?? c.created_at)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button className="text-[12px] font-semibold text-reps-orange hover:underline">
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CampaignDrawer
        campaignId={openId}
        onClose={() => {
          setOpenId(null);
          void qc.invalidateQueries({ queryKey: ["admin", "support", "campaigns"] });
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
  const q = useQuery({
    queryKey: ["admin", "support", "campaign", campaignId],
    queryFn: () => getFn({ data: { id: campaignId! } }),
    enabled: !!campaignId,
  });

  return (
    <Sheet open={!!campaignId} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[640px] bg-reps-bg border-l border-reps-border text-white overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="text-white">
            {q.data?.campaign.subject ?? "Campaign"}
          </SheetTitle>
        </SheetHeader>

        {q.isLoading ? (
          <div className="mt-6 text-[12.5px] text-white/55">Loading…</div>
        ) : q.data ? (
          <div className="mt-4 flex flex-col gap-4">
            <div className="grid grid-cols-4 gap-2">
              <Stat
                icon={<Mail className="size-3.5 text-white/55" />}
                label="Total"
                value={q.data.campaign.total_recipients}
              />
              <Stat
                icon={<CheckCircle2 className="size-3.5 text-emerald-300" />}
                label="Sent"
                value={q.data.campaign.sent_count}
                tone="emerald"
              />
              <Stat
                icon={<AlertCircle className="size-3.5 text-rose-300" />}
                label="Failed"
                value={q.data.campaign.failed_count}
                tone={q.data.campaign.failed_count > 0 ? "rose" : undefined}
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
                {q.data.campaign.body_text}
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
      <div className={`mt-1 font-display text-[20px] font-bold tabular-nums ${tone ? tones[tone] : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}
