import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Pencil, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  updateProviderField,
  renameProvider,
  type EditableProviderField,
} from "@/lib/admin/providers.functions";

const FIELDS: {
  key: EditableProviderField;
  label: string;
  type: "text" | "textarea" | "number" | "url" | "email" | "csv";
  hint?: string;
}[] = [
  { key: "headline", label: "Headline", type: "text" },
  { key: "value_prop", label: "Value prop (≤ 90 chars)", type: "text" },
  { key: "bio", label: "Bio", type: "textarea" },
  { key: "contact_email", label: "Contact email", type: "email" },
  { key: "contact_phone", label: "Contact phone (E.164)", type: "text", hint: "e.g. +447123456789" },
  { key: "website", label: "Website", type: "text" },
  { key: "website_url", label: "Website URL (https)", type: "url" },
  { key: "city", label: "City", type: "text" },
  { key: "address", label: "Address", type: "text" },
  { key: "country", label: "Country", type: "text" },
  { key: "year_established", label: "Year established", type: "number" },
  { key: "staff_count", label: "Staff count", type: "number" },
  { key: "company_number", label: "Company number", type: "text" },
  { key: "cover_url", label: "Cover URL", type: "url" },
  { key: "social_instagram", label: "Instagram URL", type: "url" },
  { key: "social_linkedin", label: "LinkedIn URL", type: "url" },
  { key: "social_youtube", label: "YouTube URL", type: "url" },
  { key: "social_tiktok", label: "TikTok URL", type: "url" },
  { key: "social_x", label: "X (Twitter) URL", type: "url" },
  { key: "awarding_bodies", label: "Awarding bodies (comma-separated)", type: "csv" },
];

const PANEL = "rounded-[18px] border border-reps-border bg-reps-panel/40 p-5";

export function ProviderProfileTab({
  userId,
  snapshot,
}: {
  userId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  snapshot: { business_name: string | null; professional: Record<string, any> };
}) {
  return (
    <div className="flex flex-col gap-4">
      <ProviderNameCard userId={userId} currentName={snapshot.business_name} />

      <div className={PANEL}>
        <h3 className="mb-4 text-[15px] font-semibold text-white">Profile fields</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <FieldRow
              key={f.key}
              userId={userId}
              field={f}
              value={snapshot.professional[f.key] ?? null}
            />
          ))}
        </div>
      </div>

      <div className="rounded-[18px] border border-reps-border bg-reps-panel/20 p-4 text-[12px] text-white/50">
        Read-only: <span className="font-mono">id</span>, <span className="font-mono">slug</span>,{" "}
        <span className="font-mono">account_type</span>,{" "}
        <span className="font-mono">verification_status</span>,{" "}
        <span className="font-mono">reps_member_id</span>,{" "}
        <span className="font-mono">is_published</span>,{" "}
        <span className="font-mono">suspended_at</span>. Use the Danger tab to publish/suspend.
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Provider name (rename dialog)                                       */
/* ------------------------------------------------------------------ */

function ProviderNameCard({ userId, currentName }: { userId: string; currentName: string | null }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className={PANEL}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-white/50">Provider name</div>
          <div className="mt-1 text-[18px] font-semibold text-white">
            {currentName ?? <span className="italic text-white/50">Unnamed</span>}
          </div>
          <p className="mt-2 max-w-xl text-[12px] text-white/55">
            The one canonical provider name across REPs. Renaming updates{" "}
            <span className="font-mono">profiles.business_name</span>, regenerates the URL slug, and
            writes a legacy redirect from the old <span className="font-mono">/t/&lt;slug&gt;</span>.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="rounded-[10px] border-reps-border bg-white/5 text-white hover:bg-reps-panel-soft hover:text-white"
        >
          <Pencil data-icon="inline-start" /> Rename
        </Button>
      </div>
      <RenameDialog
        open={open}
        onOpenChange={setOpen}
        userId={userId}
        currentName={currentName ?? ""}
      />
    </div>
  );
}

function RenameDialog({
  open,
  onOpenChange,
  userId,
  currentName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  currentName: string;
}) {
  const rename = useServerFn(renameProvider);
  const qc = useQueryClient();
  const [name, setName] = React.useState(currentName);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName(currentName);
      setReason("");
    }
  }, [open, currentName]);

  async function submit() {
    if (busy) return;
    if (!name.trim() || !reason.trim()) return;
    setBusy(true);
    try {
      const res = await rename({
        data: { user_id: userId, name: name.trim(), reason: reason.trim() },
      });
      toast.success(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `Renamed. New slug: ${(res as any).new_slug}${(res as any).old_slug && (res as any).old_slug !== (res as any).new_slug ? " (redirect written)" : ""}`,
      );
      await qc.invalidateQueries({ queryKey: ["admin-provider-360", userId] });
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message ?? "Rename failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-reps-border bg-reps-ink text-white">
        <DialogHeader>
          <DialogTitle>Rename provider</DialogTitle>
          <DialogDescription className="text-white/60">
            Bypasses the provider self-service name-request flow. A legacy redirect is
            written for the old public URL so links keep working.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>New provider name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Reason (required)</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={busy || !name.trim() || !reason.trim()}
            className="bg-reps-orange text-white hover:bg-reps-orange-hover"
          >
            {busy ? "Renaming…" : "Rename"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Individual editable field                                           */
/* ------------------------------------------------------------------ */

function FieldRow({
  userId,
  field,
  value,
}: {
  userId: string;
  field: (typeof FIELDS)[number];
  value: unknown;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState<string>(formatValue(field, value));
  const [busy, setBusy] = React.useState(false);
  const save = useServerFn(updateProviderField);
  const qc = useQueryClient();

  React.useEffect(() => {
    if (!editing) setDraft(formatValue(field, value));
  }, [value, editing, field]);

  async function handleSave() {
    if (busy) return;
    setBusy(true);
    try {
      let payload: unknown = draft;
      if (field.type === "csv") {
        payload = draft
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (field.type === "number") {
        payload = draft === "" ? null : Number(draft);
      }
      await save({
        data: {
          user_id: userId,
          field: field.key,
          value: payload,
          reason: null,
        },
      });
      toast.success(`${field.label} saved`);
      await qc.invalidateQueries({ queryKey: ["admin-provider-360", userId] });
      setEditing(false);
    } catch (e) {
      toast.error((e as Error).message ?? "Save failed");
    } finally {
      setBusy(false);
    }
  }

  const display = value == null || value === "" ? (
    <span className="italic text-white/40">not set</span>
  ) : Array.isArray(value) ? (
    <span className="text-white/80">{(value as unknown[]).join(", ") || "—"}</span>
  ) : (
    <span className="text-white/80">{String(value)}</span>
  );

  return (
    <div className="rounded-[12px] border border-reps-border/70 bg-reps-panel/30 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-wide text-white/50">{field.label}</div>
          {editing ? (
            <div className="mt-2 flex flex-col gap-2">
              {field.type === "textarea" ? (
                <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} />
              ) : (
                <Input
                  type={field.type === "number" ? "number" : "text"}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
              )}
              {field.hint && <div className="text-[11px] text-white/45">{field.hint}</div>}
            </div>
          ) : (
            <div className="mt-1 truncate text-[13px]">{display}</div>
          )}
        </div>
        {editing ? (
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              disabled={busy}
              onClick={handleSave}
              className="size-8 rounded-[8px]"
              aria-label="Save"
            >
              <Save className="h-4 w-4 text-emerald-300" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setEditing(false)}
              className="size-8 rounded-[8px]"
              aria-label="Cancel"
            >
              <X className="h-4 w-4 text-white/60" />
            </Button>
          </div>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setEditing(true)}
            className="size-8 rounded-[8px]"
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4 text-white/60" />
          </Button>
        )}
      </div>
    </div>
  );
}

function formatValue(field: (typeof FIELDS)[number], value: unknown): string {
  if (value == null) return "";
  if (field.type === "csv" && Array.isArray(value)) return (value as unknown[]).join(", ");
  return String(value);
}
