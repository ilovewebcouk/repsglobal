import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search, ExternalLink, GraduationCap, Star } from "lucide-react";

import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard } from "@/components/dashboard/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listOrganisations,
  createOrganisationFromStripe,
} from "@/lib/training-providers.functions";

export const Route = createFileRoute("/admin_/training-providers")({
  head: () => ({ meta: [{ name: "robots", content: "noindex,nofollow" }] }),
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  component: AdminTrainingProvidersPage,
});

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
    draft: "border-white/15 bg-white/5 text-white/70",
    suspended: "border-amber-400/30 bg-amber-500/15 text-amber-300",
    cancelled: "border-red-400/30 bg-red-500/15 text-red-300",
  };
  return (
    <Badge className={`${map[status] ?? map.draft} rounded-full`}>
      {status}
    </Badge>
  );
}

function AdminTrainingProvidersPage() {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const qc = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin", "training-providers"],
    queryFn: () => listOrganisations(),
  });

  const filtered = rows.filter((o) => {
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return (
      o.name.toLowerCase().includes(needle) ||
      (o.slug ?? "").toLowerCase().includes(needle) ||
      (o.city ?? "").toLowerCase().includes(needle) ||
      (o.membership_number ?? "").toLowerCase().includes(needle) ||
      (o.stripe_customer_id ?? "").toLowerCase().includes(needle)
    );
  });

  const total = rows.length;
  const active = rows.filter((r) => r.status === "active").length;
  const drafts = rows.filter((r) => r.status === "draft").length;
  const totalCourses = rows.reduce(
    (a, r) => a + (r.accredited_course_count ?? 0),
    0,
  );

  return (
    <DashboardShell
      role="admin"
      active="Training Providers"
      title="Training providers"
      subtitle="REPs-accredited training organisations, their accredited courses and reviews."
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/admin/training-providers/reviews"
            className="rounded-[10px] border border-white/15 bg-white/[0.03] hover:bg-white/[0.06] text-white/80 px-3 py-2 text-sm inline-flex items-center gap-1.5"
          >
            <Star className="h-4 w-4" /> Reviews queue
          </Link>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-[10px] bg-reps-orange hover:bg-reps-orange-hover text-white shadow-none">
                <Plus className="mr-1.5 h-4 w-4" /> Add provider
              </Button>
            </DialogTrigger>
            <CreateFromStripeDialog
              onDone={() => {
                qc.invalidateQueries({ queryKey: ["admin", "training-providers"] });
                setOpen(false);
              }}
            />
          </Dialog>
        </div>
      }

    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Providers" value={total} />
          <Kpi label="Active" value={active} tone="emerald" />
          <Kpi label="Drafts" value={drafts} />
          <Kpi label="Accredited courses" value={totalCourses} />
        </div>

        <PCard className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, slug, city, membership number, cus_..."
                className="pl-9 rounded-[12px]"
              />
            </div>
            <div className="text-xs text-white/50">
              {filtered.length} of {total}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-white/50">
                <tr className="border-b border-white/10">
                  <th className="py-2 pr-3">Provider</th>
                  <th className="py-2 pr-3">Membership #</th>
                  <th className="py-2 pr-3">Location</th>
                  <th className="py-2 pr-3">Courses</th>
                  <th className="py-2 pr-3">Reviews</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Stripe</th>
                  <th className="py-2 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-white/50">
                      Loading…
                    </td>
                  </tr>
                )}
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-white/50">
                      No providers yet — add one with a Stripe customer id.
                    </td>
                  </tr>
                )}
                {filtered.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-white/5 hover:bg-white/[0.02]"
                  >
                    <td className="py-3 pr-3">
                      <Link
                        to="/admin/training-providers/$id"
                        params={{ id: o.id }}
                        className="font-medium text-white hover:text-reps-orange"
                      >
                        {o.name}
                      </Link>
                      <div className="text-xs text-white/45">/{o.slug}</div>
                    </td>
                    <td className="py-3 pr-3 text-white/70">
                      {o.membership_number ?? "—"}
                    </td>
                    <td className="py-3 pr-3 text-white/70">
                      {[o.city, o.country].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="py-3 pr-3">
                      <span className="inline-flex items-center gap-1 text-white/80">
                        <GraduationCap className="h-3.5 w-3.5 text-reps-orange" />
                        {o.accredited_course_count ?? 0}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      {o.review_count ? (
                        <span className="inline-flex items-center gap-1 text-white/80">
                          <Star className="h-3.5 w-3.5 fill-reps-orange text-reps-orange" />
                          {o.review_avg?.toFixed(1)} · {o.review_count}
                        </span>
                      ) : (
                        <span className="text-white/40">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="py-3 pr-3 text-xs text-white/50">
                      {o.stripe_customer_id ? (
                        <code className="rounded bg-white/5 px-1.5 py-0.5">
                          {o.stripe_customer_id.slice(0, 12)}…
                        </code>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 pr-3 text-right">
                      {o.published_at && (
                        <Link
                          to="/providers/$slug"
                          params={{ slug: o.slug }}
                          className="text-xs text-white/60 hover:text-reps-orange inline-flex items-center gap-1"
                          target="_blank"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PCard>
      </div>
    </DashboardShell>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "emerald";
}) {
  return (
    <PCard className="p-4">
      <div className="text-xs uppercase tracking-wide text-white/50">{label}</div>
      <div
        className={`mt-1 font-display text-3xl ${tone === "emerald" ? "text-emerald-300" : "text-white"}`}
      >
        {value}
      </div>
    </PCard>
  );
}

function CreateFromStripeDialog({ onDone }: { onDone: () => void }) {
  const [cus, setCus] = React.useState("");
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [env, setEnv] = React.useState<"live" | "sandbox">("live");

  const mut = useMutation({
    mutationFn: () =>
      createOrganisationFromStripe({
        data: {
          stripe_customer_id: cus.trim(),
          stripe_env: env,
          name: name.trim() || undefined,
          slug: slug.trim() || undefined,
        },
      }),
    onSuccess: (res) => {
      toast.success(`Provider created (/${res.slug})`);
      setCus("");
      setName("");
      setSlug("");
      onDone();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to create provider"),
  });

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Add training provider</DialogTitle>
        <DialogDescription>
          Pulls name, contact, and address from Stripe using the customer id.
          Any active subscription is attached automatically.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Stripe customer id</Label>
          <Input
            value={cus}
            onChange={(e) => setCus(e.target.value)}
            placeholder="cus_..."
            className="rounded-[12px]"
          />
        </div>
        <div>
          <Label>Stripe environment</Label>
          <Select value={env} onValueChange={(v) => setEnv(v as any)}>
            <SelectTrigger className="rounded-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="sandbox">Sandbox / test</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Display name (optional)</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Override Stripe name"
            className="rounded-[12px]"
          />
        </div>
        <div>
          <Label>Slug (optional)</Label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto-generated from name"
            className="rounded-[12px]"
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          disabled={!cus.trim() || mut.isPending}
          onClick={() => mut.mutate()}
          className="rounded-[10px] bg-reps-orange hover:bg-reps-orange-hover text-white shadow-none"
        >
          {mut.isPending ? "Creating…" : "Create provider"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
