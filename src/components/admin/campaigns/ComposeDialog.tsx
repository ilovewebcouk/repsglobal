import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Calendar, FileText, Loader2, Paperclip, Search, Send, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DictateButton } from "@/components/ui/DictateButton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  searchTrainers,
  previewBroadcastCount,
  sendAdminOutbound,
} from "@/lib/campaigns/outbound.functions";
import {
  saveCampaignDraft,
  scheduleCampaign,
} from "@/lib/campaigns/outbound-extras.functions";

type Inbox = "support" | "pros" | "partners" | "press";
type Tier = "free" | "verified" | "pro" | "studio";

interface Recipient {
  email: string;
  name?: string | null;
  tier?: Tier;
  profession?: string | null;
  city?: string | null;
}

interface UploadedAttachment {
  storagePath: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

const INBOXES: { value: Inbox; label: string; email: string }[] = [
  { value: "support", label: "Support", email: "support@repsuk.org" },
  { value: "pros", label: "Pros", email: "pros@repsuk.org" },
  { value: "partners", label: "Partners", email: "partners@repsuk.org" },
  { value: "press", label: "Press", email: "press@repsuk.org" },
];

const TIERS: { value: Tier; label: string }[] = [
  { value: "free", label: "Unverified" },
  { value: "verified", label: "Verified" },
  { value: "pro", label: "Pro" },
  { value: "studio", label: "Studio" },
];

export interface ComposeInitialDraft {
  id?: string;
  inbox: Inbox;
  mode: "direct" | "broadcast";
  subject: string;
  body: string;
  format: "text" | "html";
  recipients?: Recipient[];
  tiers?: Tier[];
  attachments?: UploadedAttachment[];
  scheduledAt?: string | null;
}

export function ComposeDialog({
  open,
  onOpenChange,
  onSent,
  initialDraft,
  onSavedDraft,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSent: () => void;
  initialDraft?: ComposeInitialDraft | null;
  onSavedDraft?: () => void;
}) {
  const [mode, setMode] = useState<"direct" | "broadcast">("direct");
  const [inbox, setInbox] = useState<Inbox>("support");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [format, setFormat] = useState<"text" | "html">("text");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [tiers, setTiers] = useState<Tier[]>(["verified"]);
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [draftId, setDraftId] = useState<string | undefined>(undefined);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string>("");

  const sendFn = useServerFn(sendAdminOutbound);
  const previewFn = useServerFn(previewBroadcastCount);
  const saveDraftFn = useServerFn(saveCampaignDraft);
  const scheduleFn = useServerFn(scheduleCampaign);

  // Load an existing draft when the dialog opens with one
  useEffect(() => {
    if (!open) return;
    if (initialDraft) {
      setDraftId(initialDraft.id);
      setMode(initialDraft.mode);
      setInbox(initialDraft.inbox);
      setSubject(initialDraft.subject ?? "");
      setBody(initialDraft.body ?? "");
      setFormat(initialDraft.format ?? "text");
      setRecipients(initialDraft.recipients ?? []);
      setTiers(initialDraft.tiers ?? ["verified"]);
      setAttachments(initialDraft.attachments ?? []);
      setScheduledAt(initialDraft.scheduledAt ?? "");
    } else {
      setDraftId(undefined);
    }
    setConfirming(false);
    setScheduleOpen(false);
  }, [open, initialDraft]);

  const previewQuery = useQuery({
    queryKey: ["admin", "outbound", "preview", tiers],
    queryFn: () => previewFn({ data: { tiers } }),
    enabled: open && mode === "broadcast" && tiers.length > 0,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      return sendFn({
        data: {
          inbox,
          mode,
          subject,
          body,
          format,
          recipients: mode === "direct" ? recipients.map((r) => ({ email: r.email, name: r.name })) : undefined,
          tiers: mode === "broadcast" ? tiers : undefined,
          attachments,
        },
      });
    },
    onSuccess: (res) => {
      const skipped = res.skipped?.length ?? 0;
      if (res.failed > 0) {
        const first = res.failures?.[0];
        toast.warning(`Sent ${res.sent} · failed ${res.failed}`, {
          description: first
            ? `${first.email}: ${first.error}`.slice(0, 200)
            : res.failures.map((f: { email: string }) => f.email).join(", ").slice(0, 200),
        });
      } else {
        toast.success(
          `Sent to ${res.sent} ${res.sent === 1 ? "recipient" : "recipients"}`,
          skipped > 0
            ? { description: `Skipped ${skipped} invalid address${skipped === 1 ? "" : "es"}` }
            : undefined,
        );
      }
      onSent();
      reset();
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Send failed");
      setConfirming(false);
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const res = await saveDraftFn({
        data: {
          id: draftId,
          inbox,
          mode,
          subject,
          body,
          format,
          recipients: mode === "direct" ? recipients.map((r) => ({ email: r.email, name: r.name ?? null })) : undefined,
          tiers: mode === "broadcast" ? tiers : undefined,
          attachments,
        },
      });
      return res;
    },
    onSuccess: (res) => {
      setDraftId(res.id);
      toast.success("Draft saved");
      onSavedDraft?.();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Save failed");
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async (whenIso: string) => {
      // Save first to get an id with the latest content
      const saved = await saveDraftFn({
        data: {
          id: draftId,
          inbox,
          mode,
          subject,
          body,
          format,
          recipients: mode === "direct" ? recipients.map((r) => ({ email: r.email, name: r.name ?? null })) : undefined,
          tiers: mode === "broadcast" ? tiers : undefined,
          attachments,
        },
      });
      return scheduleFn({ data: { id: saved.id, scheduledAt: whenIso } });
    },
    onSuccess: () => {
      toast.success("Campaign scheduled");
      onSavedDraft?.();
      reset();
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Schedule failed");
    },
  });

  function reset() {
    setSubject("");
    setBody("");
    setFormat("text");
    setRecipients([]);
    setAttachments([]);
    setConfirming(false);
    setDraftId(undefined);
    setScheduleOpen(false);
    setScheduledAt("");
  }

  const canSend = useMemo(() => {
    if (!subject.trim() || !body.trim()) return false;
    if (mode === "direct") return recipients.length > 0;
    return tiers.length > 0 && (previewQuery.data?.count ?? 0) > 0;
  }, [subject, body, mode, recipients.length, tiers.length, previewQuery.data?.count]);

  const canSaveDraft = useMemo(() => {
    return Boolean(subject.trim() || body.trim() || recipients.length > 0);
  }, [subject, body, recipients.length]);

  const broadcastCount = previewQuery.data?.count ?? 0;
  const busy =
    sendMutation.isPending || saveDraftMutation.isPending || scheduleMutation.isPending;


  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!sendMutation.isPending) onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-3xl bg-reps-panel border-reps-border text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Compose outbound email</DialogTitle>
          <DialogDescription className="text-[12.5px] text-white/55">
            Search by partial email, name, business name, city or user ID, then send from the selected inbox.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
          <TabsList className="bg-white/[0.04]">
            <TabsTrigger value="direct">1-to-1</TabsTrigger>
            <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
          </TabsList>

          <div className="mt-4 grid gap-4">
            {/* From */}
            <Field label="From">
              <Select value={inbox} onValueChange={(v) => setInbox(v as Inbox)}>
                <SelectTrigger className="bg-white/[0.04] border-reps-border text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INBOXES.map((i) => (
                    <SelectItem key={i.value} value={i.value}>
                      {i.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <TabsContent value="direct" className="m-0">
              <RecipientPicker
                recipients={recipients}
                onChange={setRecipients}
              />
            </TabsContent>

            <TabsContent value="broadcast" className="m-0">
              <Field label="Tier">
                <div className="flex flex-wrap gap-3">
                  {TIERS.map((t) => {
                    const checked = tiers.includes(t.value);
                    return (
                      <label
                        key={t.value}
                        className="flex items-center gap-2 cursor-pointer rounded-[10px] border border-reps-border bg-white/[0.03] px-3 py-2 text-[13px]"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(c) => {
                            setTiers((prev) =>
                              c
                                ? [...new Set([...prev, t.value])]
                                : prev.filter((x) => x !== t.value),
                            );
                          }}
                        />
                        {t.label}
                      </label>
                    );
                  })}
                </div>
                <div className="mt-2 text-[12px] text-white/55">
                  {previewQuery.isLoading
                    ? "Counting recipients…"
                    : `Will send to ${broadcastCount} ${broadcastCount === 1 ? "trainer" : "trainers"}`}
                </div>
              </Field>
            </TabsContent>

            <Field label="Subject">
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject line"
                className="bg-white/[0.04] border-reps-border text-white"
              />
            </Field>

            <Field label="Message">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex rounded-[8px] border border-reps-border bg-white/[0.04] p-0.5 text-[12px]">
                  <button
                    type="button"
                    onClick={() => setFormat("text")}
                    className={`rounded-[6px] px-3 py-1 transition ${
                      format === "text"
                        ? "bg-reps-orange text-white"
                        : "text-white/65 hover:text-white"
                    }`}
                  >
                    Plain text
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat("html")}
                    className={`rounded-[6px] px-3 py-1 transition ${
                      format === "html"
                        ? "bg-reps-orange text-white"
                        : "text-white/65 hover:text-white"
                    }`}
                  >
                    HTML
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-1 text-[11px] text-white/55">
                  <span className="mr-1 uppercase tracking-[0.06em]">Tags:</span>
                  {["{{first_name}}", "{{last_name}}", "{{full_name}}", "{{email}}"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setBody((b) => (b.endsWith(" ") || b === "" ? b + tag : b + " " + tag))
                      }
                      className="rounded-[6px] border border-reps-border bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10.5px] text-white/75 hover:bg-white/[0.08] hover:text-white"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={
                    format === "html"
                      ? "<p>Paste or write HTML here…</p>"
                      : "Write your message…  Use **bold**, blank lines for paragraphs, and `- ` for lists."
                  }
                  rows={12}
                  className={`bg-white/[0.04] border-reps-border text-white resize-y pr-12 ${
                    format === "html" ? "font-mono text-[12.5px]" : ""
                  }`}
                />
                <DictateButton
                  className="absolute bottom-2 right-2"
                  onTranscript={(t) =>
                    setBody((b) => (b.trim() ? `${b.trimEnd()} ${t}` : t))
                  }
                />
              </div>
              <div className="mt-1.5 text-[11px] text-white/45">
                {format === "html"
                  ? "Paste full HTML emails. <script> and <style> are stripped."
                  : "Plain text with light markdown: **bold**, blank lines = paragraphs, lines starting with - become bullets."}
              </div>
            </Field>

            <AttachmentPicker
              attachments={attachments}
              onChange={setAttachments}
            />
          </div>
        </Tabs>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-reps-border pt-3">
          <div className="flex-1 min-w-0 text-[12px] text-white/45">
            {mode === "broadcast"
              ? `Logged as one campaign in ${inbox}. Replies become real tickets — no per-recipient noise.`
              : `Logged as a ticket in the ${inbox} inbox.`}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => saveDraftMutation.mutate()}
              disabled={busy || !canSaveDraft}
              className="border-reps-border bg-white/[0.04] text-white/85 hover:text-white"
            >
              {saveDraftMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <FileText className="size-4" />
                  {draftId ? "Update draft" : "Save draft"}
                </>
              )}
            </Button>
            {mode === "broadcast" ? (
              <Button
                variant="outline"
                onClick={() => setScheduleOpen((v) => !v)}
                disabled={busy || !canSend}
                className="border-reps-border bg-white/[0.04] text-white/85 hover:text-white"
              >
                <Calendar className="size-4" />
                Schedule
              </Button>
            ) : null}
            {confirming ? (
              <Button
                onClick={() => sendMutation.mutate()}
                disabled={busy}
                className="bg-reps-orange text-white hover:bg-reps-orange/90"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Send className="size-4" />
                    Confirm send
                    {mode === "broadcast" ? ` (${broadcastCount})` : ` (${recipients.length})`}
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (mode === "broadcast") setConfirming(true);
                  else sendMutation.mutate();
                }}
                disabled={!canSend || busy}
                className="bg-reps-orange text-white hover:bg-reps-orange/90"
              >
                <Send className="size-4" />
                {mode === "broadcast" ? `Send to ${broadcastCount}` : "Send"}
              </Button>
            )}
          </div>
        </div>

        {scheduleOpen && mode === "broadcast" ? (
          <div className="mt-3 flex flex-wrap items-end gap-2 rounded-[12px] border border-reps-border bg-white/[0.03] p-3">
            <div className="flex-1 min-w-[220px]">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em] text-white/55">
                Send at
              </label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="bg-white/[0.04] border-reps-border text-white"
              />
              <div className="mt-1 text-[11px] text-white/45">
                Your local time. The cron picks up scheduled campaigns every minute.
              </div>
            </div>
            <Button
              onClick={() => {
                const t = scheduledAt ? new Date(scheduledAt).toISOString() : "";
                if (!t) return toast.error("Pick a send time");
                scheduleMutation.mutate(t);
              }}
              disabled={busy || !scheduledAt}
              className="bg-reps-orange text-white hover:bg-reps-orange/90"
            >
              {scheduleMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Calendar className="size-4" />
                  Schedule send
                </>
              )}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-white/55">
        {label}
      </div>
      {children}
    </div>
  );
}

function RecipientPicker({
  recipients,
  onChange,
}: {
  recipients: Recipient[];
  onChange: (r: Recipient[]) => void;
}) {
  const [q, setQ] = useState("");
  const [manual, setManual] = useState("");
  const searchFn = useServerFn(searchTrainers);

  const searchQuery = useQuery({
    queryKey: ["admin", "outbound", "search", q],
    queryFn: () => searchFn({ data: { q } }),
    enabled: q.trim().length > 1,
  });

  function addRecipient(r: Recipient) {
    if (recipients.some((x) => x.email === r.email)) return;
    onChange([...recipients, r]);
  }
  function removeRecipient(email: string) {
    onChange(recipients.filter((r) => r.email !== email));
  }
  function addManual() {
    const email = manual.trim().toLowerCase();
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error("Enter a valid email");
      return;
    }
    addRecipient({ email });
    setManual("");
  }

  return (
    <Field label="To">
      {recipients.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {recipients.map((r) => (
            <Badge
              key={r.email}
              variant="secondary"
              className="gap-1.5 bg-white/10 text-white hover:bg-white/15"
            >
              {r.name ? `${r.name} · ${r.email}` : r.email}
              <button onClick={() => removeRecipient(r.email)} className="hover:text-reps-orange">
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by email, name, business name, city or ID…"
          className="bg-white/[0.04] border-reps-border text-white pl-9"
        />
      </div>
      {q.trim().length > 1 && (
        <div className="mt-1 max-h-56 overflow-y-auto rounded-[12px] border border-reps-border bg-reps-panel/40 p-1">
          {searchQuery.isLoading ? (
            <div className="px-3 py-2 text-[12px] text-white/55">Searching…</div>
          ) : (searchQuery.data ?? []).length === 0 ? (
            <div className="px-3 py-2 text-[12px] text-white/55">No matches</div>
          ) : (
            (searchQuery.data ?? []).map((t: any) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  addRecipient({
                    email: t.email,
                    name: t.full_name,
                    tier: t.tier,
                    profession: t.profession,
                    city: t.city,
                  });
                  setQ("");
                }}
                className="flex w-full items-center justify-between gap-2 rounded-[8px] px-3 py-2 text-left text-[13px] text-white/85 hover:bg-white/[0.06]"
              >
                <div>
                  <div className="font-medium">{t.full_name}</div>
                  <div className="text-[11.5px] text-white/45">
                    {t.email} · {t.profession ?? "—"}{t.city ? ` · ${t.city}` : ""}
                  </div>
                </div>
                <Badge variant="outline" className="border-reps-border text-white/65 uppercase text-[10px]">
                  {t.tier}
                </Badge>
              </button>
            ))
          )}
        </div>
      )}
      <div className="mt-2 flex items-center gap-2">
        <Input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addManual();
            }
          }}
          placeholder="or type any email and press Enter"
          className="bg-white/[0.04] border-reps-border text-white"
        />
        <Button
          onClick={addManual}
          type="button"
          className="bg-reps-orange text-white hover:bg-reps-orange/90"
        >
          Add
        </Button>
      </div>
    </Field>
  );
}

function AttachmentPicker({
  attachments,
  onChange,
}: {
  attachments: UploadedAttachment[];
  onChange: (a: UploadedAttachment[]) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const next: UploadedAttachment[] = [...attachments];
      for (const file of Array.from(files)) {
        if (file.size > 20 * 1024 * 1024) {
          toast.error(`${file.name} is larger than 20 MB`);
          continue;
        }
        const path = `outbound/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`;
        const { error } = await supabase.storage
          .from("support-attachments")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) {
          toast.error(`Upload failed: ${file.name}`);
          continue;
        }
        next.push({
          storagePath: path,
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        });
      }
      onChange(next);
    } finally {
      setUploading(false);
    }
  }

  function remove(idx: number) {
    onChange(attachments.filter((_, i) => i !== idx));
  }

  return (
    <Field label="Attachments">
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] border border-dashed border-reps-border bg-white/[0.03] px-3 py-2 text-[12.5px] text-white/75 hover:bg-white/[0.06]">
          <Paperclip className="size-4" />
          {uploading ? "Uploading…" : "Attach files"}
          <input
            type="file"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => onFiles(e.target.files)}
          />
        </label>
        {attachments.map((a, i) => (
          <Badge key={a.storagePath} variant="secondary" className="gap-1.5 bg-white/10 text-white">
            {a.filename} ({(a.sizeBytes / 1024).toFixed(0)} KB)
            <button onClick={() => remove(i)} className="hover:text-reps-orange">
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
    </Field>
  );
}
