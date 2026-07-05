import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Download, Loader2, Search, Upload, X } from "lucide-react";
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
  listNewsletterSubscribers,
  importNewsletterSubscribers,
  getReachableMembersCount,
} from "@/lib/newsletter/subscribers.functions";

export const Route = createFileRoute("/admin_/newsletter")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({
    meta: [
      { name: "robots", content: "noindex,nofollow" },
      { title: "Newsletter subscribers — REPS Admin" },
      {
        name: "description",
        content:
          "View, filter and import newsletter subscribers. All sends run through the Campaigns tool.",
      },
    ],
  }),
  component: AdminNewsletter,
});

type Status = "pending" | "confirmed" | "unsubscribed" | "bounced";

type Subscriber = {
  id: string;
  email: string;
  status: Status;
  source: string | null;
  source_url: string | null;
  confirmed_at: string | null;
  created_at: string;
  unsubscribed_at: string | null;
};

const STATUS_META: Record<
  Status,
  { label: string; className: string }
> = {
  confirmed: { label: "Confirmed", className: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300" },
  pending: { label: "Pending", className: "border-reps-border bg-white/[0.06] text-white/70" },
  unsubscribed: { label: "Unsubscribed", className: "border-reps-border bg-white/[0.03] text-white/50" },
  bounced: { label: "Bounced", className: "border-red-400/30 bg-red-500/10 text-red-300" },
};

function AdminNewsletter() {
  const [status, setStatus] = useState<Status | "all">("all");
  const [q, setQ] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const qc = useQueryClient();

  const listFn = useServerFn(listNewsletterSubscribers);

  const listQuery = useQuery({
    queryKey: ["admin", "newsletter", "subscribers", status],
    queryFn: () =>
      listFn({
        data: {
          status: status === "all" ? undefined : status,
          limit: 500,
        },
      }),
  });

  const rows: Subscriber[] = (listQuery.data?.rows ?? []) as Subscriber[];
  const total = listQuery.data?.total ?? 0;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (r) =>
        r.email.toLowerCase().includes(needle) ||
        (r.source ?? "").toLowerCase().includes(needle) ||
        (r.source_url ?? "").toLowerCase().includes(needle),
    );
  }, [rows, q]);

  const counts = useMemo(() => {
    const c = { confirmed: 0, pending: 0, unsubscribed: 0, bounced: 0 };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  function exportCsv() {
    const header = [
      "email",
      "status",
      "source",
      "source_url",
      "created_at",
      "confirmed_at",
      "unsubscribed_at",
    ];
    const escape = (v: string | null | undefined) => {
      const s = v ?? "";
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      header.join(","),
      ...filtered.map((r) =>
        [
          r.email,
          r.status,
          r.source ?? "",
          r.source_url ?? "",
          r.created_at,
          r.confirmed_at ?? "",
          r.unsubscribed_at ?? "",
        ]
          .map(escape)
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <DashboardShell
      role="admin"
      active="Newsletter"
      title="Newsletter subscribers"
      subtitle="Double opt-in list used by the Campaigns broadcast tool. Only confirmed subscribers receive newsletter sends."
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
        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {(
            [
              ["all", "Total", total],
              ["confirmed", STATUS_META.confirmed.label, counts.confirmed],
              ["pending", STATUS_META.pending.label, counts.pending],
              ["unsubscribed", STATUS_META.unsubscribed.label, counts.unsubscribed],
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
                placeholder="Filter by email, source or URL…"
                className="bg-white/[0.04] border-reps-border text-white pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={status} onValueChange={(v) => setStatus(v as Status | "all")}>
                <SelectTrigger className="w-[180px] bg-white/[0.04] border-reps-border text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
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
              <Loader2 className="size-4 animate-spin" /> Loading subscribers…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-white/55">
              {rows.length === 0
                ? "No subscribers yet. Import a list or share the signup on any resource article."
                : "No subscribers match this filter."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-white/[0.03] text-[11px] uppercase tracking-[0.06em] text-white/45">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Email</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 font-semibold">Source</th>
                    <th className="px-4 py-2.5 font-semibold">Subscribed</th>
                    <th className="px-4 py-2.5 font-semibold">Confirmed</th>
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
                        <td className="px-4 py-2.5">
                          <Badge
                            variant="outline"
                            className={`${meta.className} uppercase text-[10px] tracking-[0.06em]`}
                          >
                            {meta.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-white/65">
                          {r.source ?? "—"}
                          {r.source_url ? (
                            <div className="truncate max-w-[240px] text-[11px] text-white/40">
                              {r.source_url}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-2.5 text-white/60">
                          {formatDate(r.created_at)}
                        </td>
                        <td className="px-4 py-2.5 text-white/60">
                          {r.confirmed_at ? formatDate(r.confirmed_at) : "—"}
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
        onDone={() => {
          void qc.invalidateQueries({
            queryKey: ["admin", "newsletter", "subscribers"],
          });
        }}
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
  const fileRef = useRef<HTMLInputElement>(null);
  const importFn = useServerFn(importNewsletterSubscribers);

  const emails = useMemo(() => {
    const found = text
      .split(/[\s,;]+/g)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
    return Array.from(new Set(found));
  }, [text]);

  const importMutation = useMutation({
    mutationFn: async () => {
      if (emails.length === 0) throw new Error("No valid emails detected");
      // Batch to 500 at a time (server caps at 2000, but we stay polite)
      let inserted = 0;
      let skipped = 0;
      for (let i = 0; i < emails.length; i += 500) {
        const chunk = emails.slice(i, i + 500);
        const res = await importFn({ data: { emails: chunk } });
        inserted += res.inserted;
        skipped += res.skipped;
      }
      return { inserted, skipped };
    },
    onSuccess: (res) => {
      toast.success(
        `Imported ${res.inserted} subscriber${res.inserted === 1 ? "" : "s"}`,
        res.skipped > 0
          ? { description: `Skipped ${res.skipped} duplicate${res.skipped === 1 ? "" : "s"}` }
          : undefined,
      );
      setText("");
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
    // Strip CSV headers / other cols — the parser only keeps valid emails.
    setText((prev) => (prev.trim() ? `${prev}\n${raw}` : raw));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-reps-panel border-reps-border text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Import newsletter subscribers</DialogTitle>
          <DialogDescription className="text-[12.5px] text-white/55">
            Paste emails or upload a CSV. Imported addresses are marked{" "}
            <strong className="text-white/80">confirmed</strong> — only use for lists that already opted in.
            Duplicates and existing addresses are skipped safely.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
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
            placeholder="one@example.com, two@example.com&#10;three@example.com"
            className="bg-white/[0.04] border-reps-border text-white font-mono text-[12.5px]"
          />

          <div className="flex items-center justify-between text-[12px] text-white/55">
            <div>
              {emails.length > 0
                ? `${emails.length} valid email${emails.length === 1 ? "" : "s"} detected`
                : "No valid emails yet"}
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
            disabled={emails.length === 0 || importMutation.isPending}
            className="bg-reps-orange text-white hover:bg-reps-orange/90"
          >
            {importMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Upload className="size-4" />
                Import {emails.length > 0 ? `(${emails.length})` : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
