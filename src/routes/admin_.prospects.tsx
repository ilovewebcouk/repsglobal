import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Download, Loader2, Search, Trash2, Upload, X } from "lucide-react";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PPanel } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  listProspects,
  listProspectTags,
  importProspects,
  deleteProspect,
  deleteProspectTag,
  unsubscribeProspect,
  getProspectCounts,
} from "@/lib/prospects/prospects.functions";

export const Route = createFileRoute("/admin_/prospects")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Prospects — REPS Admin" },
      {
        name: "description",
        content:
          "Cold contacts (non-members) imported from CSVs for outreach campaigns.",
      },
    ],
  }),
  component: AdminProspects,
});

type Status = "active" | "converted" | "unsubscribed" | "bounced";

type Prospect = {
  id: string;
  email: string;
  full_name: string | null;
  list_tag: string | null;
  source_note: string | null;
  status: Status;
  converted_user_id: string | null;
  imported_at: string;
  unsubscribed_at: string | null;
  created_at: string;
};

const STATUS_META: Record<Status, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
  },
  converted: {
    label: "Joined",
    className: "border-reps-orange/40 bg-reps-orange/15 text-reps-orange",
  },
  unsubscribed: {
    label: "Unsubscribed",
    className: "border-reps-border bg-white/[0.03] text-white/50",
  },
  bounced: {
    label: "Bounced",
    className: "border-red-400/30 bg-red-500/10 text-red-300",
  },
};

function AdminProspects() {
  const [status, setStatus] = useState<Status | "all">("all");
  const [listTag, setListTag] = useState<string>("all");
  const [q, setQ] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const qc = useQueryClient();

  const listFn = useServerFn(listProspects);
  const tagsFn = useServerFn(listProspectTags);
  const countsFn = useServerFn(getProspectCounts);
  const deleteFn = useServerFn(deleteProspect);
  const deleteTagFn = useServerFn(deleteProspectTag);
  const unsubscribeFn = useServerFn(unsubscribeProspect);

  const listQuery = useQuery({
    queryKey: ["admin", "prospects", "list", status, listTag],
    queryFn: () =>
      listFn({
        data: {
          status: status === "all" ? undefined : status,
          listTag: listTag === "all" ? undefined : listTag,
          limit: 1000,
        },
      }),
  });

  const tagsQuery = useQuery({
    queryKey: ["admin", "prospects", "tags"],
    queryFn: () => tagsFn(),
    staleTime: 60_000,
  });

  const countsQuery = useQuery({
    queryKey: ["admin", "prospects", "counts"],
    queryFn: () => countsFn(),
    staleTime: 30_000,
  });

  const rows: Prospect[] = (listQuery.data?.rows ?? []) as Prospect[];

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (r) =>
        r.email.toLowerCase().includes(needle) ||
        (r.full_name ?? "").toLowerCase().includes(needle) ||
        (r.list_tag ?? "").toLowerCase().includes(needle) ||
        (r.source_note ?? "").toLowerCase().includes(needle),
    );
  }, [rows, q]);

  const counts = countsQuery.data?.counts ?? {
    active: 0,
    converted: 0,
    unsubscribed: 0,
    bounced: 0,
  };
  const total = countsQuery.data?.total ?? 0;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Prospect deleted");
      invalidateAll();
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  const unsubMutation = useMutation({
    mutationFn: (id: string) => unsubscribeFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Marked unsubscribed");
      invalidateAll();
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const deleteTagMutation = useMutation({
    mutationFn: (tag: string) => deleteTagFn({ data: { listTag: tag } }),
    onSuccess: (res) => {
      toast.success(`Deleted ${res.deleted} prospect${res.deleted === 1 ? "" : "s"}`);
      setListTag("all");
      invalidateAll();
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  function invalidateAll() {
    void qc.invalidateQueries({ queryKey: ["admin", "prospects"] });
  }

  function exportCsv() {
    const header = [
      "email",
      "full_name",
      "list_tag",
      "source_note",
      "status",
      "imported_at",
    ];
    const escape = (v: string | null | undefined) => {
      const s = v ?? "";
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      header.join(", "),
      ...filtered.map((r) =>
        [
          r.email,
          r.full_name ?? "",
          r.list_tag ?? "",
          r.source_note ?? "",
          r.status,
          r.imported_at,
        ]
          .map(escape)
          .join(", "),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prospects-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <DashboardShell
      role="admin"
      active="Prospects"
      title="Prospects"
      subtitle="Cold contacts (non-members) imported from CSVs — for outreach only. Reach them via Campaigns → Broadcast with the Prospects tier."
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="border-reps-border bg-white/[0.04] text-white/85 hover:text-white"
          >
            <Download className="size-4" />
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={() => setImportOpen(true)}
            className="bg-reps-orange text-white hover:bg-reps-orange/90"
          >
            <Upload className="size-4" />
            Import CSV
          </Button>
        </div>
      }
    >
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {(
            [
              ["all", "Total", total],
              ["active", STATUS_META.active.label, counts.active],
              ["converted", STATUS_META.converted.label, counts.converted],
              ["unsubscribed", STATUS_META.unsubscribed.label, counts.unsubscribed],
              ["bounced", STATUS_META.bounced.label, counts.bounced],
            ] as const
          ).map(([key, label, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key as Status | "all")}
              className={`rounded-[16px] border p-4 text-left transition ${
                status === key
                  ? "border-reps-orange/60 bg-reps-orange/10"
                  : "border-reps-border bg-white/[0.03] hover:bg-white/[0.06]"
              }`}
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/55">
                {label}
              </div>
              <div className="mt-1 text-[24px] font-semibold text-white">{value}</div>
            </button>
          ))}
        </div>

        <PPanel className="p-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-reps-border p-4">
            <div className="relative flex-1 min-w-[240px] max-w-[420px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Filter by email, name or tag…"
                className="bg-white/[0.04] border-reps-border text-white pl-9"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={listTag} onValueChange={setListTag}>
                <SelectTrigger className="w-[200px] bg-white/[0.04] border-reps-border text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All lists</SelectItem>
                  {(tagsQuery.data?.tags ?? []).map((t) => (
                    <SelectItem key={t.list_tag} value={t.list_tag}>
                      {t.list_tag} ({t.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {listTag !== "all" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (
                      confirm(
                        `Delete every prospect tagged "${listTag}"? This cannot be undone.`,
                      )
                    ) {
                      deleteTagMutation.mutate(listTag);
                    }
                  }}
                  className="border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                >
                  <Trash2 className="size-4" /> Delete list
                </Button>
              )}
              <Select value={status} onValueChange={(v) => setStatus(v as Status | "all")}>
                <SelectTrigger className="w-[160px] bg-white/[0.04] border-reps-border text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="converted">Joined</SelectItem>
                  <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                  <SelectItem value="bounced">Bounced</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-[12px] text-white/55">
                {filtered.length} of {rows.length}
              </div>
            </div>
          </div>

          {listQuery.isLoading ? (
            <div className="flex items-center gap-2 p-6 text-[13px] text-white/55">
              <Loader2 className="size-4 animate-spin" /> Loading prospects…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-white/55">
              {rows.length === 0
                ? "No prospects yet. Import a CSV to get started."
                : "No prospects match this filter."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-white/[0.03] text-[11px] uppercase tracking-[0.06em] text-white/45">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Email</th>
                    <th className="px-4 py-2.5 font-semibold">Name</th>
                    <th className="px-4 py-2.5 font-semibold">List tag</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 font-semibold">Imported</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const meta = STATUS_META[r.status];
                    return (
                      <tr
                        key={r.id}
                        className="border-t border-reps-border/60 text-white/85"
                      >
                        <td className="px-4 py-2.5 font-mono text-[12.5px]">{r.email}</td>
                        <td className="px-4 py-2.5 text-white/75">{r.full_name ?? "—"}</td>
                        <td className="px-4 py-2.5 text-white/65">
                          {r.list_tag ?? "—"}
                          {r.source_note ? (
                            <div className="truncate max-w-[220px] text-[11px] text-white/40">
                              {r.source_note}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge
                            variant="outline"
                            className={`${meta.className} uppercase text-[10px] tracking-[0.06em]`}
                          >
                            {meta.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-white/60">
                          {formatDate(r.imported_at)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="inline-flex items-center gap-1">
                            {r.status === "active" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => unsubMutation.mutate(r.id)}
                                className="text-white/60 hover:text-white text-[11.5px]"
                              >
                                Unsubscribe
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Delete ${r.email}?`)) {
                                  deleteMutation.mutate(r.id);
                                }
                              }}
                              className="text-white/55 hover:text-red-300"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </PPanel>
      </div>

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onDone={invalidateAll}
      />
    </DashboardShell>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Import CSV dialog
// ─────────────────────────────────────────────────────────────────────────────
function ImportDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone: () => void;
}) {
  const [text, setText] = useState("");
  const [listTag, setListTag] = useState("");
  const [sourceNote, setSourceNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const importFn = useServerFn(importProspects);

  const parsed = useMemo(() => parseCsv(text), [text]);

  const importMutation = useMutation({
    mutationFn: async () => {
      if (parsed.length === 0) throw new Error("No valid rows detected");
      if (!listTag.trim()) throw new Error("Add a list tag first");
      let inserted = 0;
      let dup = 0;
      let mem = 0;
      let sup = 0;
      // Batch to 1000 per call
      for (let i = 0; i < parsed.length; i += 1000) {
        const chunk = parsed.slice(i, i + 1000);
        const res = await importFn({
          data: {
            rows: chunk,
            listTag: listTag.trim(),
            sourceNote: sourceNote.trim() || undefined,
          },
        });
        inserted += res.inserted;
        dup += res.skippedDuplicates;
        mem += res.skippedMembers;
        sup += res.skippedSuppressed;
      }
      return { inserted, dup, mem, sup };
    },
    onSuccess: (res) => {
      const parts: string[] = [];
      if (res.dup) parts.push(`${res.dup} duplicate${res.dup === 1 ? "" : "s"}`);
      if (res.mem)
        parts.push(`${res.mem} already ${res.mem === 1 ? "a member" : "members"}`);
      if (res.sup)
        parts.push(`${res.sup} unsubscribed/bounced`);
      toast.success(
        `Imported ${res.inserted} prospect${res.inserted === 1 ? "" : "s"}`,
        parts.length > 0 ? { description: `Skipped ${parts.join(", ")}` } : undefined,
      );
      setText("");
      setSourceNote("");
      onDone();
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Import failed");
    },
  });

  async function onFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const raw = await file.text();
    setText((prev) => (prev.trim() ? `${prev}\n${raw}` : raw));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-reps-panel border-reps-border text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Import prospects</DialogTitle>
          <DialogDescription className="text-[12.5px] text-white/55">
            Paste emails, or upload a CSV with columns like{""}
            <code className="rounded bg-white/10 px-1 py-0.5 text-white/75">email,name</code>.
            Existing prospects, current members, and suppressed addresses are skipped automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/55">
                List tag (required)
              </label>
              <Input
                value={listTag}
                onChange={(e) => setListTag(e.target.value)}
                placeholder="e.g. gym-owners-london"
                className="mt-1 bg-white/[0.04] border-reps-border text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/55">
                Source note (optional)
              </label>
              <Input
                value={sourceNote}
                onChange={(e) => setSourceNote(e.target.value)}
                placeholder="Where did this list come from?"
                className="mt-1 bg-white/[0.04] border-reps-border text-white"
              />
            </div>
          </div>

          <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-[10px] border border-dashed border-reps-border bg-white/[0.03] px-3 py-2 text-[12.5px] text-white/75 hover:bg-white/[0.06]">
            <Upload className="size-4" />
            Upload CSV or TXT
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt,text/csv,text/plain"
              className="hidden"
              onChange={(e) => onFile(e.target.files)}
            />
          </label>

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder={"email,name\none@example.com,Alex Smith\ntwo@example.com,Jamie Doe"}
            className="bg-white/[0.04] border-reps-border text-white font-mono text-[12.5px]"
          />

          <div className="flex items-center justify-between text-[12px] text-white/55">
            <div>
              {parsed.length > 0
                ? `${parsed.length} valid row${parsed.length === 1 ? "" : "s"} detected`
                : "No valid rows yet"}
            </div>
            {text ? (
              <button
                type="button"
                onClick={() => setText("")}
                className="inline-flex items-center gap-1 text-white/55 hover:text-white"
              >
                <X className="size-3" /> Clear
              </button>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={importMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => importMutation.mutate()}
            disabled={
              parsed.length === 0 ||
              !listTag.trim() ||
              importMutation.isPending
            }
            className="bg-reps-orange text-white hover:bg-reps-orange/90"
          >
            {importMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Upload className="size-4" />
                Import {parsed.length > 0 ? `(${parsed.length})` : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Parse a CSV or plain email list into { email, fullName } rows.
// Accepts:
//   - one email per line
//   - "email, name" per line
//   - CSV with header row containing "email" and optionally "name"/"full_name"
function parseCsv(text: string): Array<{ email: string; fullName: string | null }> {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const out = new Map<string, string | null>();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  // Detect header
  let emailIdx = -1;
  let nameIdx = -1;
  const firstCells = splitLine(lines[0]);
  const lower = firstCells.map((c) => c.toLowerCase().trim());
  if (lower.some((c) => c === "email")) {
    emailIdx = lower.indexOf("email");
    nameIdx = lower.findIndex((c) => c === "name" || c === "full_name" || c === "fullname");
    lines.shift();
  }

  for (const line of lines) {
    const cells = splitLine(line);
    let email: string | undefined;
    let name: string | undefined;
    if (emailIdx >= 0) {
      email = cells[emailIdx]?.toLowerCase().trim();
      if (nameIdx >= 0) name = cells[nameIdx]?.trim();
    } else if (cells.length >= 2) {
      // Try both orders: "email, name" or "name, email"
      if (EMAIL_RE.test(cells[0])) {
        email = cells[0].toLowerCase().trim();
        name = cells.slice(1).join("").trim();
      } else if (EMAIL_RE.test(cells[cells.length - 1])) {
        email = cells[cells.length - 1].toLowerCase().trim();
        name = cells.slice(0, -1).join("").trim();
      }
    } else {
      email = cells[0]?.toLowerCase().trim();
    }
    if (!email || !EMAIL_RE.test(email)) continue;
    if (!out.has(email)) out.set(email, name || null);
  }

  return [...out.entries()].map(([email, fullName]) => ({ email, fullName }));
}

function splitLine(line: string): string[] {
  // Simple CSV: quoted fields with commas allowed inside quotes.
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQ = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ", " || ch === ";" || ch === "\t") {
        out.push(cur);
        cur = "";
      } else cur += ch;
    }
  }
  out.push(cur);
  return out;
}
