import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Send } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard } from "@/components/dashboard/primitives";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardTextarea as Textarea } from "@/components/dashboard/ui/textarea";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  SupportAttachmentsField,
  uploadPendingFiles,
  type PendingFile,
} from "@/components/dashboard/SupportAttachmentsField";
import { SupportAttachmentList } from "@/components/dashboard/SupportAttachmentList";
import {
  attachToMyMessage,
  getMyTicket,
  markMyTicketRead,
  replyToMyTicket,
  type MyTicketRow,
} from "@/lib/support/my-tickets.functions";

export const Route = createFileRoute(
  "/_authenticated/_professional/dashboard_/support/$id",
)({
  head: () => ({
    meta: [
      { title: "Support ticket — REPS" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: TicketThreadPage,
});

const STATUS_LABEL: Record<MyTicketRow["status"], string> = {
  new: "New",
  open: "Open",
  pending: "Waiting on you",
  solved: "Solved",
  closed: "Closed",
  spam: "Spam",
  trash: "Trash",
};

const STATUS_TONE: Record<MyTicketRow["status"], string> = {
  new: "bg-reps-orange/15 text-reps-orange border-reps-orange-border",
  open: "bg-sky-500/15 text-sky-300 border-sky-400/30",
  pending: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  solved: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  closed: "bg-white/10 text-white/55 border-white/15",
  spam: "bg-reps-red/15 text-reps-red border-reps-red/30",
  trash: "bg-white/5 text-white/40 border-white/10",
};

function formatStamp(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TicketThreadPage() {
  const tier = useTrainerTier();
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const getFn = useServerFn(getMyTicket);
  const replyFn = useServerFn(replyToMyTicket);
  const attachFn = useServerFn(attachToMyMessage);
  const markReadFn = useServerFn(markMyTicketRead);

  const [reply, setReply] = React.useState("");
  const [files, setFiles] = React.useState<PendingFile[]>([]);
  const [uploading, setUploading] = React.useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-support-ticket", id],
    queryFn: () => getFn({ data: { id } }),
  });

  // Auto-mark read whenever the user opens an unread ticket.
  React.useEffect(() => {
    if (!data?.ticket?.requester_unread) return;
    void markReadFn({ data: { ticketId: id } }).then(() => {
      qc.invalidateQueries({ queryKey: ["my-support", "unread"] });
      qc.invalidateQueries({ queryKey: ["my-support-tickets"] });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.ticket?.requester_unread, id]);

  const sendReply = useMutation({
    mutationFn: async (body: string) => {
      const res = await replyFn({ data: { ticketId: id, body } });
      if (files.length > 0) {
        setUploading(true);
        try {
          const uploaded = await uploadPendingFiles({ ticketId: id, files });
          await attachFn({
            data: { messageId: res.message_id, files: uploaded },
          });
        } finally {
          setUploading(false);
        }
      }
      return res;
    },
    onSuccess: () => {
      setReply("");
      setFiles([]);
      toast.success("Reply sent");
      qc.invalidateQueries({ queryKey: ["my-support-ticket", id] });
      qc.invalidateQueries({ queryKey: ["my-support-tickets"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not send reply"),
  });

  const ticket = data?.ticket;
  const messages = data?.messages ?? [];

  return (
    <DashboardShell
      role="trainer"
      tier={tier}
      active="Support"
      title={ticket?.subject ?? "Support ticket"}
      subtitle={ticket ? `Ticket ${ticket.ticket_number}` : "Loading…"}
    >
      <div className="mx-auto w-full max-w-[820px]">
        <div className="mb-4">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 rounded-[10px] px-2 text-white/55 hover:text-white"
          >
            <Link to="/dashboard/support">
              <ArrowLeft className="mr-1.5 h-4 w-4" data-icon /> All tickets
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <PCard className="flex items-center justify-center gap-2 px-6 py-16 text-white/55">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </PCard>
        ) : error || !ticket ? (
          <PCard className="px-6 py-12 text-center text-white/55">
            We couldn’t load this ticket. It may have been deleted.
          </PCard>
        ) : (
          <>
            <PCard className="mb-4 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${STATUS_TONE[ticket.status]}`}
                  >
                    {STATUS_LABEL[ticket.status]}
                  </Badge>
                  <span className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                    {ticket.ticket_number}
                  </span>
                </div>
                <p className="text-[12px] text-white/45">
                  Opened {formatStamp(ticket.created_at)}
                </p>
              </div>
            </PCard>

            <ol className="space-y-3">
              {messages.length === 0 ? (
                <PCard className="px-5 py-6 text-[13.5px] text-white/55">
                  No messages yet.
                </PCard>
              ) : (
                messages.map((m) => {
                  const fromUser = m.direction === "inbound";
                  return (
                    <li key={m.id}>
                      <PCard
                        className={`px-5 py-4 ${
                          fromUser
                            ? "border-reps-border/80"
                            : "border-reps-orange/30 bg-reps-orange/[0.04]"
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-[12.5px] font-semibold text-white">
                            {fromUser ? (
                              <span>You</span>
                            ) : (
                              <span className="text-reps-orange">
                                {m.from_name?.trim() || "REPS Support"}
                              </span>
                            )}
                            {m.is_auto && (
                              <span className="rounded-full border border-white/15 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-white/45">
                                Auto
                              </span>
                            )}
                          </div>
                          <span className="text-[11.5px] text-white/40">
                            {formatStamp(m.created_at)}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-white/85">
                          {m.body_text ?? ""}
                        </p>
                        <SupportAttachmentList attachments={m.attachments} />
                      </PCard>
                    </li>
                  );
                })
              )}
            </ol>

            {ticket.status !== "spam" && ticket.status !== "trash" && (
              <PCard className="mt-4 p-5">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const body = reply.trim();
                    if (body.length === 0 || sendReply.isPending) return;
                    sendReply.mutate(body);
                  }}
                >
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="reply">Your reply</FieldLabel>
                      <Textarea
                        id="reply"
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Reply to the REPS team…"
                        rows={5}
                        maxLength={10000}
                        className="rounded-[12px]"
                      />
                      {(ticket.status === "solved" || ticket.status === "closed") && (
                        <FieldDescription>
                          Replying will re-open this ticket.
                        </FieldDescription>
                      )}
                    </Field>

                    <Field>
                      <FieldLabel>Attachments</FieldLabel>
                      <SupportAttachmentsField
                        files={files}
                        onChange={setFiles}
                        uploading={uploading}
                        onError={(msg) => toast.error(msg)}
                      />
                    </Field>
                  </FieldGroup>

                  <div className="mt-4 flex items-center justify-end">
                    <Button
                      type="submit"
                      disabled={reply.trim().length === 0 || sendReply.isPending || uploading}
                      className="rounded-[10px] bg-reps-orange text-white hover:bg-reps-orange/90"
                    >
                      {sendReply.isPending || uploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" data-icon />
                      ) : (
                        <Send className="mr-2 h-4 w-4" data-icon />
                      )}
                      Send reply
                    </Button>
                  </div>
                </form>
              </PCard>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
