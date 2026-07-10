import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Download,
  ExternalLink,
  Loader2,
  Printer,
  Search,
  ShieldOff,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard } from "@/components/dashboard/primitives";
import { DashboardButton as Button } from "@/components/dashboard/ui/button";
import { DashboardInput as Input } from "@/components/dashboard/ui/input";
import { DashboardBadge as Badge } from "@/components/dashboard/ui/badge";
import {
  adminDownloadPrintPack,
  adminDownloadShippingLabel,
  adminListBatches,
  adminListPrintQueue,
  adminMarkBatchDispatched,
  adminMarkBatchPrinted,
  adminRevokeCertificate,
  adminSearchRegistrations,
  getCertificatePricing,
  setCertificatePricing,
  type PrintQueueRowDTO,
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
      role="admin"
      active="Certificates"
      title="Certificates"
      subtitle="Certificate pricing, batches, Royal Mail dispatch and revocation."
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

// ─────────────────────────────────────────────────────────────── Pricing

const RM_SERVICE_OPTS = [
  { code: "TPN", label: "Royal Mail Tracked 48 (UK)" },
  { code: "TPS", label: "Royal Mail Tracked 24 (UK)" },
  { code: "MTM", label: "Royal Mail International Tracked" },
  { code: "MTL", label: "Royal Mail International Tracked & Signed" },
] as const;
type RmServiceCode = (typeof RM_SERVICE_OPTS)[number]["code"];

function PricingPanel() {
  const qc = useQueryClient();
  const fetchPricing = useServerFn(getCertificatePricing);
  const savePricing = useServerFn(setCertificatePricing);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-cert-pricing"],
    queryFn: () => fetchPricing({ data: undefined as never }),
  });
  const [unit, setUnit] = useState<string>("");
  const [postage, setPostage] = useState<string>("");
  const [intlPostage, setIntlPostage] = useState<string>("");
  const [service, setService] = useState<string>("");

  const currentUnit = data?.unit_price_pence ?? 1500;
  const currentPostage = data?.postage_fee_pence ?? 650;
  const currentIntlPostage = data?.international_postage_fee_pence ?? 1500;
  const currentService = data?.default_rm_service_code ?? "TPN";

  const save = useMutation({
    mutationFn: (payload: {
      unit_price_pence?: number;
      postage_fee_pence?: number;
      international_postage_fee_pence?: number;
      default_rm_service_code?: RmServiceCode;
    }) => savePricing({ data: payload }),
    onSuccess: () => {
      toast.success("Pricing updated");
      setUnit("");
      setPostage("");
      setIntlPostage("");
      setService("");
      qc.invalidateQueries({ queryKey: ["admin-cert-pricing"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save"),
  });

  return (
    <PCard>
      <div className="p-6 max-w-lg space-y-6">
        <div>
          <div className="text-[13px] text-white/60">Certificate unit price</div>
          <div className="mt-1 font-display text-3xl">
            £{(currentUnit / 100).toFixed(2)}{" "}
            <span className="text-sm text-white/40">/ certificate</span>
          </div>
          <div className="mt-2">
            <label className="text-[12px] text-white/50">New price (£)</label>
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder={(currentUnit / 100).toFixed(2)}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>
          <Button
            className="mt-3"
            disabled={isLoading || save.isPending || !unit}
            onClick={() => {
              const n = Number(unit);
              if (!Number.isFinite(n) || n < 0) return;
              save.mutate({ unit_price_pence: Math.round(n * 100) });
            }}
          >
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save unit price"}
          </Button>
        </div>

        <div className="border-t border-white/5 pt-6">
          <div className="text-[13px] text-white/60">Postage per UK batch</div>
          <div className="mt-1 font-display text-3xl">
            £{(currentPostage / 100).toFixed(2)}{" "}
            <span className="text-sm text-white/40">/ batch</span>
          </div>
          <p className="mt-1 text-[12px] text-white/50">
            Charged once per UK batch regardless of how many certificates are inside.
          </p>
          <div className="mt-2">
            <label className="text-[12px] text-white/50">New postage fee (£)</label>
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder={(currentPostage / 100).toFixed(2)}
              value={postage}
              onChange={(e) => setPostage(e.target.value)}
            />
          </div>
          <Button
            className="mt-3"
            disabled={save.isPending || !postage}
            onClick={() => {
              const n = Number(postage);
              if (!Number.isFinite(n) || n < 0) return;
              save.mutate({ postage_fee_pence: Math.round(n * 100) });
            }}
          >
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save postage fee"}
          </Button>
        </div>

        <div className="border-t border-white/5 pt-6">
          <div className="text-[13px] text-white/60">
            International postage per batch
          </div>
          <div className="mt-1 font-display text-3xl">
            £{(currentIntlPostage / 100).toFixed(2)}{" "}
            <span className="text-sm text-white/40">/ batch</span>
          </div>
          <p className="mt-1 text-[12px] text-white/50">
            Flat fee charged once per non-UK batch. Covers Royal Mail International Tracked.
          </p>
          <div className="mt-2">
            <label className="text-[12px] text-white/50">
              New international postage fee (£)
            </label>
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder={(currentIntlPostage / 100).toFixed(2)}
              value={intlPostage}
              onChange={(e) => setIntlPostage(e.target.value)}
            />
          </div>
          <Button
            className="mt-3"
            disabled={save.isPending || !intlPostage}
            onClick={() => {
              const n = Number(intlPostage);
              if (!Number.isFinite(n) || n < 0) return;
              save.mutate({ international_postage_fee_pence: Math.round(n * 100) });
            }}
          >
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save international postage"}
          </Button>
        </div>

        <div className="border-t border-white/5 pt-6">
          <div className="text-[13px] text-white/60">Default UK Royal Mail service</div>
          <div className="mt-1 font-display text-xl">
            {RM_SERVICE_OPTS.find((s) => s.code === currentService)?.label ?? currentService}
          </div>
          <p className="mt-1 text-[12px] text-white/50">
            Used by default for UK batches. International batches default to International
            Tracked. Admin can override per batch at dispatch time.
          </p>
          <div className="mt-2">
            <label className="text-[12px] text-white/50">Change default</label>
            <select
              className="mt-1 w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-[13px] text-white"
              value={service || currentService}
              onChange={(e) => setService(e.target.value)}
            >
              {RM_SERVICE_OPTS.filter((s) => s.code === "TPN" || s.code === "TPS").map((s) => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <Button
            className="mt-3"
            disabled={save.isPending || !service || service === currentService}
            onClick={() =>
              save.mutate({
                default_rm_service_code: service as RmServiceCode,
              })
            }
          >
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save default service"}
          </Button>
        </div>
      </div>
    </PCard>
  );
}

// ─────────────────────────────────────────────────────────────── Batches

function BatchesPanel() {
  const fetchBatches = useServerFn(adminListBatches);
  const [status, setStatus] = useState<
    | "all"
    | "pending"
    | "paid"
    | "issued"
    | "awaiting_print"
    | "printed"
    | "dispatched"
    | "fulfilled"
    | "canceled"
  >("all");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-batches", status],
    queryFn: () => fetchBatches({ data: { status } }),
  });
  const statuses = [
    "all",
    "pending",
    "paid",
    "issued",
    "awaiting_print",
    "printed",
    "dispatched",
    "fulfilled",
    "canceled",
  ] as const;
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
                  {b.count} × £{(b.unit_price_pence / 100).toFixed(2)}
                  {b.postage_fee_pence_snapshot > 0
                    ? ` + £${(b.postage_fee_pence_snapshot / 100).toFixed(2)} postage`
                    : ""}{" "}
                  = £{(b.total_pence / 100).toFixed(2)} · {b.format}
                </div>
                {b.tracking_number && (
                  <div className="text-white/50 text-[12px] mt-1">
                    {b.rm_service_code === "TPS" ? "Tracked 24" : "Tracked 48"} ·{" "}
                    <a
                      href={b.tracking_url ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="text-reps-orange hover:underline inline-flex items-center gap-1"
                    >
                      {b.tracking_number} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
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

// ─────────────────────────────────────────────────────────────── Print queue

function PrintQueuePanel() {
  const qc = useQueryClient();
  const fetchQueue = useServerFn(adminListPrintQueue);
  const markPrinted = useServerFn(adminMarkBatchPrinted);
  const downloadPack = useServerFn(adminDownloadPrintPack);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-print-queue"],
    queryFn: () => fetchQueue({ data: undefined as never }),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-print-queue"] });
  const printedMut = useMutation({
    mutationFn: (batch_id: string) => markPrinted({ data: { batch_id } }),
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
  const [downloading, setDownloading] = useState<string | null>(null);
  const openPack = async (batch_id: string, format: "merged" | "zip") => {
    setDownloading(`${batch_id}:${format}`);
    try {
      const { url } = await downloadPack({ data: { batch_id, format } });
      window.open(url, "_blank", "noopener");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not build print pack");
    } finally {
      setDownloading(null);
    }
  };

  const [dispatching, setDispatching] = useState<PrintQueueRowDTO | null>(null);

  const csv = useMemo(() => {
    if (!data) return "";
    const rows: string[] = [
      "provider,batch_id,certificate_number,learner_name,learner_email,course,service,tracking_number,shipped_at",
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
            b.rm_service_code ?? "",
            b.tracking_number ?? "",
            b.shipped_at ?? "",
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(","),
        );
      }
    }
    return rows.join("\n");
  }, [data]);

  return (
    <>
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
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {b.provider_name ?? b.provider_id}
                    </div>
                    <div className="text-white/50 text-[12px]">
                      {b.count} certificates · paid{" "}
                      {b.paid_at ? new Date(b.paid_at).toLocaleDateString("en-GB") : "—"}
                    </div>
                    {b.ship_to_address && (
                      <div className="text-white/50 text-[12px] mt-1">
                        {b.ship_to_address.fullName}, {b.ship_to_address.addressLine1},{" "}
                        {b.ship_to_address.city} {b.ship_to_address.postcode}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge>{b.status}</Badge>
                    {b.status === "awaiting_print" && (
                      <>
                        <Button
                          size="sm"
                          variant="subtle"
                          onClick={() => openPack(b.batch_id, "merged")}
                          disabled={downloading === `${b.batch_id}:merged`}
                        >
                          {downloading === `${b.batch_id}:merged` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}{" "}
                          Print pack
                        </Button>
                        <Button
                          size="sm"
                          variant="subtle"
                          onClick={() => openPack(b.batch_id, "zip")}
                          disabled={downloading === `${b.batch_id}:zip`}
                          title="Download individual PDFs (ZIP)"
                        >
                          ZIP
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => printedMut.mutate(b.batch_id)}
                          disabled={printedMut.isPending}
                        >
                          <Printer className="h-3.5 w-3.5" /> Mark printed
                        </Button>
                      </>
                    )}
                    {b.status === "printed" && (
                      <>
                        <Button
                          size="sm"
                          variant="subtle"
                          onClick={() => openPack(b.batch_id, "merged")}
                          disabled={downloading === `${b.batch_id}:merged`}
                          title="Re-download print pack"
                        >
                          <Download className="h-3.5 w-3.5" /> Reprint
                        </Button>
                        <Button size="sm" onClick={() => setDispatching(b)}>
                          <Truck className="h-3.5 w-3.5" /> Create label &amp; dispatch
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {b.status === "printed" && b.printed_at && (
                  <div className="text-[11.5px] text-emerald-300/80">
                    Printed {new Date(b.printed_at).toLocaleString("en-GB")}
                  </div>
                )}
                <div className="rounded-lg bg-white/[0.03] p-3 text-[12px] text-white/70">
                  {b.learners.map((l) => (
                    <div
                      key={l.registration_id}
                      className="flex justify-between gap-4 py-0.5"
                    >
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

      {dispatching && (
        <DispatchDialog
          batch={dispatching}
          onClose={() => setDispatching(null)}
          onDone={() => {
            setDispatching(null);
            invalidate();
          }}
        />
      )}
    </>
  );
}

function DispatchDialog({
  batch,
  onClose,
  onDone,
}: {
  batch: PrintQueueRowDTO;
  onClose: () => void;
  onDone: () => void;
}) {
  const addr = batch.ship_to_address;
  const isIntl =
    !!addr?.countryCode &&
    addr.countryCode.toUpperCase() !== "GB" &&
    addr.countryCode.toUpperCase() !== "UK";
  const serviceOpts = isIntl
    ? RM_SERVICE_OPTS.filter((s) => s.code === "MTM" || s.code === "MTL")
    : RM_SERVICE_OPTS.filter((s) => s.code === "TPN" || s.code === "TPS");
  const [service, setService] = useState<RmServiceCode>(
    isIntl ? "MTM" : "TPN",
  );
  const dispatch = useServerFn(adminMarkBatchDispatched);
  const downloadLabel = useServerFn(adminDownloadShippingLabel);

  const mut = useMutation({
    mutationFn: () =>
      dispatch({ data: { batch_id: batch.batch_id, service_code: service } }),
    onSuccess: async (res) => {
      toast.success("Royal Mail order created");
      // Open the label PDF for printing immediately
      try {
        const { url } = await downloadLabel({ data: { batch_id: batch.batch_id } });
        window.open(url, "_blank", "noopener");
      } catch {
        /* ignore — admin can re-download from the batches list */
      }
      onDone();
    },
    onError: (e: any) => toast.error(e?.message ?? "Royal Mail failed"),
  });

  const addr = batch.ship_to_address;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-reps-panel border border-white/10 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 className="font-display text-xl">Create Royal Mail label</h2>
          <p className="text-[12px] text-white/50 mt-1">
            {batch.count} certificate{batch.count === 1 ? "" : "s"} to{" "}
            {batch.provider_name ?? "provider"}
          </p>
        </div>

        {addr ? (
          <div className="rounded-lg bg-white/[0.03] p-3 text-[12.5px] text-white/75">
            <div className="font-medium text-white">{addr.fullName}</div>
            {addr.companyName && <div>{addr.companyName}</div>}
            <div>{addr.addressLine1}</div>
            {addr.addressLine2 && <div>{addr.addressLine2}</div>}
            <div>
              {addr.city}
              {addr.county ? `, ${addr.county}` : ""}
            </div>
            <div className="font-mono">{addr.postcode}</div>
            {addr.phoneNumber && <div className="text-white/50">{addr.phoneNumber}</div>}
          </div>
        ) : (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-[12.5px] text-red-200">
            No shipping address on this batch. Ask the provider to add one before dispatching.
          </div>
        )}

        <div>
          <label className="text-[12px] text-white/60">Service</label>
          <select
            className="mt-1 w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-[13px] text-white"
            value={service}
            onChange={(e) => setService(e.target.value as "TPN" | "TPS")}
          >
            {RM_SERVICE_OPTS.map((s) => (
              <option key={s.code} value={s.code}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => mut.mutate()} disabled={!addr || mut.isPending}>
            {mut.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Calling Royal Mail…
              </>
            ) : (
              <>
                <Truck className="h-4 w-4" /> Create label &amp; dispatch
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── Search

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
            <div
              key={r.id}
              className="p-4 flex items-center justify-between gap-4 text-[13px]"
            >
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
                    variant="destructive-ghost"
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

// Keep Download imported for future label re-download UI; suppress unused warning
void Download;
