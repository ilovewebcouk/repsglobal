import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { GraduationCap, Loader2, Printer, Search, ShieldOff, Truck } from "lucide-react";

import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard } from "@/components/dashboard/primitives";
import { DashboardButton as Button } from "@/components/dashboard/ui/button";
import { DashboardInput as Input } from "@/components/dashboard/ui/input";
import { DashboardBadge as Badge } from "@/components/dashboard/ui/badge";
import {
  adminListBatches,
  adminListPrintQueue,
  adminMarkBatchDispatched,
  adminMarkBatchPrinted,
  adminRevokeCertificate,
  adminSearchRegistrations,
  getCertificatePricing,
  setCertificatePricing,
} from "@/lib/certificates/certificates.functions";

export const Route = createFileRoute("/admin_/certificates")({
  head: () => ({
    meta: [
      { title: "Certificates — Admin | REPS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  component: AdminCertificatesPage,
});

type Tab = "pricing" | "batches" | "print" | "search";

function AdminCertificatesPage() {
  const [tab, setTab] = useState<Tab>("pricing");
  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "pricing", label: "Pricing" },
    { id: "batches", label: "Batches" },
    { id: "print", label: "Print queue" },
    { id: "search", label: "Search & revoke" },
  ];
  return (
    <DashboardShell
      title="Certificates"
      description="Certificate pricing, batches, print fulfilment and revocation."
      icon={GraduationCap}
    >
      <div className="mb-4 flex flex-wrap gap-1 rounded-xl bg-white/[0.04] p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-[13px] transition ${
              tab === t.id ? "bg-white/10 text-white" : "text-white/60 hover:text-white/90"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "pricing" && <PricingPanel />}
      {tab === "batches" && <BatchesPanel />}
      {tab === "print" && <PrintQueuePanel />}
      {tab === "search" && <SearchPanel />}
    </DashboardShell>
  );
}

function PricingPanel() {
  const qc = useQueryClient();
  const fetchPricing = useServerFn(getCertificatePricing);
  const savePricing = useServerFn(setCertificatePricing);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-cert-pricing"],
    queryFn: () => fetchPricing({ data: undefined as never }),
  });
  const [pounds, setPounds] = useState<string>("");
  const cur = data?.unit_price_pence ?? 1500;
  const save = useMutation({
    mutationFn: (pence: number) => savePricing({ data: { unit_price_pence: pence } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-cert-pricing"] }),
  });

  return (
    <PCard>
      <div className="p-6 max-w-md space-y-4">
        <div>
          <div className="text-[13px] text-white/60">Current unit price</div>
          <div className="mt-1 font-display text-3xl">
            £{(cur / 100).toFixed(2)} <span className="text-sm text-white/40">/ certificate</span>
          </div>
        </div>
        <div>
          <label className="text-[13px] text-white/60">New price (£)</label>
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder={(cur / 100).toFixed(2)}
            value={pounds}
            onChange={(e) => setPounds(e.target.value)}
          />
        </div>
        <Button
          disabled={isLoading || save.isPending || !pounds}
          onClick={() => {
            const n = Number(pounds);
            if (!Number.isFinite(n) || n < 0) return;
            save.mutate(Math.round(n * 100));
          }}
        >
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save price"}
        </Button>
        <p className="text-[12px] text-white/50">
          Snapshotted per registration at checkout — historic batches keep their original price.
        </p>
      </div>
    </PCard>
  );
}

function BatchesPanel() {
  const fetchBatches = useServerFn(adminListBatches);
  const [status, setStatus] = useState<
    "all" | "pending" | "paid" | "issued" | "awaiting_print" | "printed" | "dispatched" | "fulfilled" | "canceled"
  >("all");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-batches", status],
    queryFn: () => fetchBatches({ data: { status } }),
  });
  const statuses = ["all", "pending", "paid", "issued", "awaiting_print", "printed", "fulfilled", "canceled"] as const;
  return (
    <PCard>
      <div className="p-4 flex flex-wrap gap-1 border-b border-white/5">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-lg px-2.5 py-1 text-[12px] ${
              status === s ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="p-8 text-center text-white/50">Loading…</div>
      ) : !data || data.length === 0 ? (
        <div className="p-8 text-center text-white/50">No batches.</div>
      ) : (
        <div className="divide-y divide-white/5">
          {data.map((b) => (
            <div key={b.id} className="p-4 flex items-center justify-between gap-4 text-[13px]">
              <div className="min-w-0">
                <div className="font-medium truncate">{b.provider_name ?? b.provider_id}</div>
                <div className="text-white/50 text-[12px]">
                  {b.count} × £{(b.unit_price_pence / 100).toFixed(2)} = £{(b.total_pence / 100).toFixed(2)} · {b.format}
                </div>
                <div className="text-white/40 text-[11px] font-mono truncate">{b.id}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge>{b.status}</Badge>
                <span className="text-white/40 text-[12px]">
                  {b.paid_at ? new Date(b.paid_at).toLocaleDateString("en-GB") : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </PCard>
  );
}

function PrintQueuePanel() {
  const qc = useQueryClient();
  const fetchQueue = useServerFn(adminListPrintQueue);
  const markPrinted = useServerFn(adminMarkBatchPrinted);
  const markDispatched = useServerFn(adminMarkBatchDispatched);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-print-queue"],
    queryFn: () => fetchQueue({ data: undefined as never }),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-print-queue"] });
  const printedMut = useMutation({
    mutationFn: (batch_id: string) => markPrinted({ data: { batch_id } }),
    onSuccess: invalidate,
  });
  const dispatchedMut = useMutation({
    mutationFn: (batch_id: string) => markDispatched({ data: { batch_id } }),
    onSuccess: invalidate,
  });

  const csv = useMemo(() => {
    if (!data) return "";
    const rows: string[] = [
      "provider,batch_id,certificate_number,learner_name,learner_email,course",
    ];
    for (const b of data) {
      for (const l of b.learners) {
        rows.push(
          [
            b.provider_name ?? b.provider_id,
            b.batch_id,
            l.certificate_number ?? "",
            l.learner_name,
            l.learner_email,
            l.course_title.replace(/,/g, ";"),
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(","),
        );
      }
    }
    return rows.join("\n");
  }, [data]);

  return (
    <PCard>
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        <div className="text-[13px] text-white/70">
          UK batches awaiting print &amp; dispatch
        </div>
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
          download="reps-print-queue.csv"
          className="text-[12px] text-reps-orange hover:underline"
        >
          Export CSV
        </a>
      </div>
      {isLoading ? (
        <div className="p-8 text-center text-white/50">Loading…</div>
      ) : !data || data.length === 0 ? (
        <div className="p-8 text-center text-white/50">Print queue is clear.</div>
      ) : (
        <div className="divide-y divide-white/5">
          {data.map((b) => (
            <div key={b.batch_id} className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium">{b.provider_name ?? b.provider_id}</div>
                  <div className="text-white/50 text-[12px]">
                    {b.count} certificates · paid{" "}
                    {b.paid_at ? new Date(b.paid_at).toLocaleDateString("en-GB") : "—"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{b.status}</Badge>
                  {b.status === "awaiting_print" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => printedMut.mutate(b.batch_id)}
                      disabled={printedMut.isPending}
                    >
                      <Printer className="h-3.5 w-3.5" /> Mark printed
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => dispatchedMut.mutate(b.batch_id)}
                    disabled={dispatchedMut.isPending}
                  >
                    <Truck className="h-3.5 w-3.5" /> Mark dispatched
                  </Button>
                </div>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-3 text-[12px] text-white/70">
                {b.learners.map((l) => (
                  <div key={l.registration_id} className="flex justify-between gap-4 py-0.5">
                    <span className="truncate">
                      {l.certificate_number ?? "—"} · {l.learner_name}
                    </span>
                    <span className="text-white/40 truncate">{l.course_title}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </PCard>
  );
}

function SearchPanel() {
  const qc = useQueryClient();
  const search = useServerFn(adminSearchRegistrations);
  const revoke = useServerFn(adminRevokeCertificate);
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-cert-search", submitted],
    queryFn: () => search({ data: { q: submitted } }),
  });
  const revokeMut = useMutation({
    mutationFn: (id: string) => revoke({ data: { registration_id: id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-cert-search"] }),
  });

  return (
    <PCard>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(q);
        }}
        className="p-4 flex gap-2 border-b border-white/5"
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cert number, learner email or name"
        />
        <Button type="submit">
          <Search className="h-4 w-4" /> Search
        </Button>
      </form>
      {isLoading ? (
        <div className="p-8 text-center text-white/50">Searching…</div>
      ) : !data || data.length === 0 ? (
        <div className="p-8 text-center text-white/50">
          {submitted ? "No matches." : "Enter a search."}
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {data.map((r) => (
            <div key={r.id} className="p-4 flex items-center justify-between gap-4 text-[13px]">
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {r.certificate_number ?? "—"} · {r.learner_name}
                </div>
                <div className="text-white/50 text-[12px] truncate">
                  {r.learner_email} · {r.course_title}
                  {r.course_level ? ` · L${r.course_level}` : ""} ·{" "}
                  {r.provider_name ?? r.provider_id}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge>{r.status}</Badge>
                {(r.status === "issued" || r.status === "dispatched") && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm(`Revoke ${r.certificate_number ?? "this certificate"}?`)) {
                        revokeMut.mutate(r.id);
                      }
                    }}
                    disabled={revokeMut.isPending}
                  >
                    <ShieldOff className="h-3.5 w-3.5" /> Revoke
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PCard>
  );
}
