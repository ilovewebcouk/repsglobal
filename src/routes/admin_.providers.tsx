import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import * as React from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

import { listProviders, createProvider } from "@/lib/admin/providers.functions";

export const Route = createFileRoute("/admin_/providers")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({
    meta: [
      { name: "robots", content: "noindex,nofollow" },
      { title: "Training providers — REPS Admin" },
    ],
  }),
  component: ProvidersListPage,
});

function ProvidersListPage() {
  const list = useServerFn(listProviders);

  const [q, setQ] = React.useState("");
  const [verified, setVerified] = React.useState<"any" | "verified" | "unverified">("any");
  const [published, setPublished] = React.useState<"any" | "published" | "hidden">("any");
  const [suspended, setSuspended] = React.useState<"any" | "suspended" | "active">("any");
  const [openCreate, setOpenCreate] = React.useState(false);

  const query = useQuery({
    queryKey: ["admin-providers-list", q, verified, published, suspended],
    queryFn: () =>
      list({ data: { q, verified, published, suspended, limit: 100, offset: 0 } }),
  });

  const rows = query.data?.rows ?? [];
  const total = query.data?.total ?? 0;

  return (
    <DashboardShell
      role="admin"
      active="Providers"
      title="Training providers"
      subtitle="Manage every organisation-type account on REPs."
    >
      <div className="flex flex-col gap-5 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[280px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Search name, slug, contact email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-10 rounded-[10px] border-reps-border bg-reps-panel/40 pl-9 text-white placeholder:text-white/40"
            />
          </div>
          <FilterSelect
            value={verified}
            onChange={(v) => setVerified(v as any)}
            options={[
              ["any", "Any verification"],
              ["verified", "Verified"],
              ["unverified", "Unverified"],
            ]}
          />
          <FilterSelect
            value={published}
            onChange={(v) => setPublished(v as any)}
            options={[
              ["any", "Any visibility"],
              ["published", "Published"],
              ["hidden", "Hidden"],
            ]}
          />
          <FilterSelect
            value={suspended}
            onChange={(v) => setSuspended(v as any)}
            options={[
              ["any", "Any status"],
              ["active", "Active"],
              ["suspended", "Suspended"],
            ]}
          />
          <Button
            onClick={() => setOpenCreate(true)}
            className="ml-auto h-10 rounded-[10px] bg-reps-orange text-white hover:bg-reps-orange-hover"
          >
            <Plus data-icon="inline-start" /> New training provider
          </Button>
        </div>

        <div className="rounded-[18px] border border-reps-border bg-reps-panel/40 p-1">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-white/50">
              <tr>
                <th className="px-4 py-3">Provider name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Verified</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Member ID</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {query.isLoading ? (
                <SkeletonRows />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-white/55">
                    No training providers match those filters.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-t border-reps-border/70 hover:bg-reps-panel-soft/50">
                    <td className="px-4 py-3">
                      <Link
                        to="/admin/providers/$userId"
                        params={{ userId: r.id }}
                        className="font-semibold text-white hover:text-reps-orange"
                      >
                        {r.business_name ?? <span className="text-white/50 italic">Unnamed</span>}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-white/55">{r.slug ?? "—"}</td>
                    <td className="px-4 py-3">
                      {r.verification_status === "verified" ? (
                        <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                          Verified
                        </span>
                      ) : (
                        <span className="text-white/55">{r.verification_status ?? "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.suspended_at ? (
                        <span className="text-red-300">Suspended</span>
                      ) : r.is_published ? (
                        <span className="text-emerald-300">Live</span>
                      ) : (
                        <span className="text-white/55">Hidden</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-white/55">
                      {r.reps_member_id ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-white/55">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString("en-GB") : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="text-[12px] text-white/45">
          {total > 0 ? `${rows.length} of ${total} training providers` : ""}
        </div>
      </div>

      <CreateProviderDialog open={openCreate} onOpenChange={setOpenCreate} />
    </DashboardShell>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 w-[180px] rounded-[10px] border-reps-border bg-reps-panel/40 text-white">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(([v, l]) => (
          <SelectItem key={v} value={v}>
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-t border-reps-border/70">
          {Array.from({ length: 6 }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <Skeleton className="h-4 w-24 bg-reps-panel/60" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function CreateProviderDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const create = useServerFn(createProvider);
  const qc = useQueryClient();
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  function reset() {
    setEmail("");
    setName("");
    setWebsite("");
    setNote("");
    setBusy(false);
  }

  async function handleSubmit() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await create({
        data: {
          email: email.trim(),
          name: name.trim(),
          website: website.trim() || null,
          note: note.trim() || null,
        },
      });
      toast.success(`Invite sent to ${email}. Provider seeded.`);
      await qc.invalidateQueries({ queryKey: ["admin-providers-list"] });
      reset();
      onOpenChange(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      window.location.assign(`/admin/providers/${(res as any).user_id}`);
    } catch (e) {
      toast.error((e as Error).message ?? "Could not create provider");
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="border-reps-border bg-reps-ink text-white">
        <DialogHeader>
          <DialogTitle>New training provider</DialogTitle>
          <DialogDescription className="text-white/60">
            Creates an auth user, seeds a hidden organisation profile, and sends the
            invite email. Errors cleanly if the email is already registered.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@provider.com" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Provider name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Northline Academy" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Website (optional)</Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Initial admin note (optional)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={busy || !email.trim() || !name.trim()}
            className="bg-reps-orange text-white hover:bg-reps-orange-hover"
          >
            {busy ? "Creating…" : "Send invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
