import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Paperclip, Search, Send, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/lib/support/outbound.functions";

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
  { value: "verified", label: "Verified" },
  { value: "pro", label: "Pro" },
  { value: "studio", label: "Studio" },
  { value: "free", label: "Free" },
];

export function ComposeDialog({
  open,
  onOpenChange,
  onSent,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSent: () => void;
}) {
  const [mode, setMode] = useState<"direct" | "broadcast">("direct");
  const [inbox, setInbox] = useState<Inbox>("support");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [tiers, setTiers] = useState<Tier[]>(["verified"]);
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [confirming, setConfirming] = useState(false);

  const sendFn = useServerFn(sendAdminOutbound);
  const previewFn = useServerFn(previewBroadcastCount);

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
          recipients: mode === "direct" ? recipients.map((r) => ({ email: r.email, name: r.name })) : undefined,
          tiers: mode === "broadcast" ? tiers : undefined,
          attachments,
        },
      });
    },
    onSuccess: (res) => {
      if (res.failed > 0) {
        toast.warning(`Sent ${res.sent} · failed ${res.failed}`, {
          description: res.failures.map((f) => f.email).join(", ").slice(0, 200),
        });
      } else {
        toast.success(`Sent to ${res.sent} ${res.sent === 1 ? "recipient" : "recipients"}`);
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

  function reset() {
    setSubject("");
    setBody("");
    setRecipients([]);
    setAttachments([]);
    setConfirming(false);
  }

  const canSend = useMemo(() => {
    if (!subject.trim() || !body.trim()) return false;
    if (mode === "direct") return recipients.length > 0;
    return tiers.length > 0 && (previewQuery.data?.count ?? 0) > 0;
  }, [subject, body, mode, recipients.length, tiers.length, previewQuery.data?.count]);

  const broadcastCount = previewQuery.data?.count ?? 0;

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
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message…"
                rows={9}
                className="bg-white/[0.04] border-reps-border text-white resize-y"
              />
            </Field>

            <AttachmentPicker
              attachments={attachments}
              onChange={setAttachments}
            />
          </div>
        </Tabs>

        <div className="mt-2 flex items-center justify-between gap-3 border-t border-reps-border pt-3">
          <div className="text-[12px] text-white/45">
            {mode === "broadcast"
              ? `Logged as one campaign in ${inbox}. Replies become real tickets — no per-recipient noise.`
              : `Logged as a ticket in the ${inbox} inbox.`}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={sendMutation.isPending}
            >
              Cancel
            </Button>
            {confirming ? (
              <Button
                onClick={() => sendMutation.mutate()}
                disabled={sendMutation.isPending}
                className="bg-reps-orange text-black hover:bg-reps-orange/90"
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
                disabled={!canSend}
                className="bg-reps-orange text-black hover:bg-reps-orange/90"
              >
                <Send className="size-4" />
                {mode === "broadcast" ? `Send to ${broadcastCount}` : "Send"}
              </Button>
            )}
          </div>
        </div>
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
          placeholder="Search trainers by name, city, email…"
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
        <Button variant="outline" onClick={addManual} type="button">
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
