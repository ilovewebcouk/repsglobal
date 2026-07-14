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
import {
  createCertificateTemplate,
  deleteCertificateTemplate,
  listCertificateTemplates,
  previewCertificateTemplate,
  setDefaultCertificateTemplate,
  updateCertificateTemplateFieldMap,
  type CertificateTemplateDTO,
} from "@/lib/certificates/templates.functions";
import { TemplateEditor } from "@/components/admin/certificates/TemplateEditor";
import {
  clearProviderCertificateLogo,
  listProviderCenterNumbers,
  setProviderCenterNumber,
  setProviderCertificateLogo,
} from "@/lib/certificates/providers.functions";

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

type Tab = "pricing" | "templates" | "providers" | "batches" | "print" | "search";

function AdminCertificatesPage() {
  const [tab, setTab] = useState<Tab>("pricing");
  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "pricing", label: "Pricing" },
    { id: "templates", label: "Templates" },
    { id: "providers", label: "Providers" },
    { id: "batches", label: "Batches" },
    { id: "print", label: "Print queue" },
    { id: "search", label: "Search & revoke" },
  ];
  return (
    <DashboardShell
      role="admin"
      active="Certificates"
      title="Certificates"
      subtitle="Certificate pricing, PDF templates, batches, Royal Mail dispatch and revocation."
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
      {tab === "templates" && <TemplatesPanel />}
      {tab === "providers" && <ProvidersPanel />}
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

  const currentServiceLabel =
    RM_SERVICE_OPTS.find((s) => s.code === currentService)?.label ?? currentService;

  return (

    <div className="max-w-2xl space-y-4">
      <PCard>
        <div className="p-6">
          <div className="mb-5">
            <h2 className="font-display text-lg">Pricing</h2>
            <p className="mt-0.5 text-[12.5px] text-white/50">
              What professionals pay for certificates and postage.
            </p>
          </div>
          <div className="divide-y divide-white/5">
            <SettingRow
              label="Certificate unit price"
              helper="Charged per certificate."
              suffix="£ / cert"
              currentValue={(currentUnit / 100).toFixed(2)}
              value={unit}
              onChange={setUnit}
              disabled={isLoading || save.isPending || !unit}
              pending={save.isPending}
              onSave={() => {
                const n = Number(unit);
                if (!Number.isFinite(n) || n < 0) return;
                save.mutate({ unit_price_pence: Math.round(n * 100) });
              }}
            />
            <SettingRow
              label="UK postage per batch"
              helper="Once per UK batch, any size."
              suffix="£ / batch"
              currentValue={(currentPostage / 100).toFixed(2)}
              value={postage}
              onChange={setPostage}
              disabled={save.isPending || !postage}
              pending={save.isPending}
              onSave={() => {
                const n = Number(postage);
                if (!Number.isFinite(n) || n < 0) return;
                save.mutate({ postage_fee_pence: Math.round(n * 100) });
              }}
            />
            <SettingRow
              label="International postage per batch"
              helper="Once per non-UK batch. Royal Mail International Tracked."
              suffix="£ / batch"
              currentValue={(currentIntlPostage / 100).toFixed(2)}
              value={intlPostage}
              onChange={setIntlPostage}
              disabled={save.isPending || !intlPostage}
              pending={save.isPending}
              onSave={() => {
                const n = Number(intlPostage);
                if (!Number.isFinite(n) || n < 0) return;
                save.mutate({ international_postage_fee_pence: Math.round(n * 100) });
              }}
            />
          </div>
        </div>
      </PCard>

      <PCard>
        <div className="p-6">
          <div className="mb-5">
            <h2 className="font-display text-lg">Dispatch</h2>
            <p className="mt-0.5 text-[12.5px] text-white/50">
              Default carrier service used for UK batches. International batches always use
              International Tracked.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-[13px] text-white">Default UK Royal Mail service</div>
              <div className="mt-0.5 text-[12px] text-white/50">
                Currently: {currentServiceLabel}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-[13px] text-white min-w-[220px]"
                value={service || currentService}
                onChange={(e) => setService(e.target.value)}
              >
                {RM_SERVICE_OPTS.filter((s) => s.code === "TPN" || s.code === "TPS").map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.label}
                  </option>
                ))}
              </select>
              <Button
                variant="subtle"
                size="sm"
                disabled={save.isPending || !service || service === currentService}
                onClick={() =>
                  save.mutate({
                    default_rm_service_code: service as RmServiceCode,
                  })
                }
              >
                {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </PCard>
    </div>
  );
}

function SettingRow({
  label,
  helper,
  suffix,
  currentValue,
  value,
  onChange,
  onSave,
  disabled,
  pending,
}: {
  label: string;
  helper: string;
  suffix: string;
  currentValue: string;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  disabled: boolean;
  pending: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <div className="text-[13px] text-white">{label}</div>
        <div className="mt-0.5 text-[12px] text-white/50">
          {helper} <span className="text-white/40">Currently £{currentValue}.</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative">
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder={currentValue}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-[140px] text-right pr-2"
          />
        </div>
        <span className="text-[11px] text-white/40 whitespace-nowrap">{suffix}</span>
        <Button variant="subtle" size="sm" disabled={disabled} onClick={onSave}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
      </div>
    </div>
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
                <div className="font-medium truncate">
                  {b.provider_name ?? "Unknown provider"}
                </div>
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
                <div
                  className="text-white/30 text-[11px] mt-1 font-mono truncate cursor-pointer"
                  title={`Batch ID: ${b.id} (click to copy)`}
                  onClick={() => {
                    void navigator.clipboard?.writeText(b.id);
                    toast.success("Batch ID copied");
                  }}
                >
                  Batch ID · {b.id.slice(0, 8)}…
                </div>
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

// ─────────────────────────────────────────────────────────────── Templates

const DEFAULT_FIELD_MAP_TEMPLATE = `{
  "certificate": {
    "text": [
      { "field": "learner_name",       "x": 421, "y": 360, "align": "center", "fontSize": 40, "fontWeight": "bold", "color": "#111111", "maxWidth": 700 },
      { "field": "course_line",        "x": 421, "y": 300, "align": "center", "fontSize": 20, "fontWeight": "bold", "color": "#333333", "maxWidth": 700 },
      { "field": "provider_name",      "x": 421, "y": 268, "align": "center", "fontSize": 12, "color": "#555555" },
      { "field": "issue_date",         "x": 60,  "y": 70,  "fontSize": 10, "color": "#555555", "prefix": "Issued " },
      { "field": "certificate_number", "x": 780, "y": 70,  "align": "right", "fontSize": 10, "color": "#555555", "prefix": "No. " },
      { "field": "reps_course_number", "x": 60,  "y": 55,  "fontSize": 9,  "color": "#666666", "prefix": "REPS Course: " },
      { "field": "ofqual_number",      "x": 60,  "y": 40,  "fontSize": 9,  "color": "#666666", "prefix": "Ofqual: " },
      { "field": "verify_url",         "x": 700, "y": 90,  "align": "right", "fontSize": 9, "color": "#555555", "prefix": "Verify at " }
    ],
    "images": [
      { "field": "qr_code",       "x": 720, "y": 30,  "width": 90,  "height": 90 },
      { "field": "provider_logo", "x": 60,  "y": 460, "width": 160, "height": 60 }
    ]
  },
  "unit_summary": {
    "text": [
      { "field": "learner_name",       "x": 48, "y": 760, "fontSize": 14, "fontWeight": "bold", "color": "#111111" },
      { "field": "course_line",        "x": 48, "y": 740, "fontSize": 11, "color": "#333333" },
      { "field": "certificate_number", "x": 48, "y": 722, "fontSize": 10, "color": "#555555", "prefix": "Certificate No. " },
      { "field": "issue_date",         "x": 48, "y": 706, "fontSize": 10, "color": "#555555", "prefix": "Issued " }
    ],
    "images": [
      { "field": "qr_code", "x": 470, "y": 40, "width": 72, "height": 72 }
    ],
    "list": {
      "field": "unit_summary",
      "x": 62, "y": 660, "maxWidth": 470, "lineHeight": 14, "fontSize": 10, "color": "#111111", "bullet": "•", "bulletColor": "#e97316"
    }
  }
}`;

function TemplatesPanel() {
  const qc = useQueryClient();
  const listFn = useServerFn(listCertificateTemplates);
  const createFn = useServerFn(createCertificateTemplate);
  const setDefaultFn = useServerFn(setDefaultCertificateTemplate);
  const updateMapFn = useServerFn(updateCertificateTemplateFieldMap);
  const deleteFn = useServerFn(deleteCertificateTemplate);
  const previewFn = useServerFn(previewCertificateTemplate);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["cert-templates"],
    queryFn: () => listFn(),
  });

  const [showForm, setShowForm] = useState(false);

  return (
    <PCard>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[13px] font-medium text-white">Certificate PDF templates</div>
          <div className="text-[12px] text-white/60">
            Upload the Adobe-designed print-ready PDFs and the coordinate map. The default template is
            overlaid with learner data at issue time. QR code and provider logo are stamped into their
            slots automatically.
          </div>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "Upload template"}</Button>
      </div>

      {showForm && (
        <UploadTemplateForm
          onSubmit={async (payload) => {
            try {
              await createFn({ data: payload });
              toast.success("Template uploaded");
              setShowForm(false);
              qc.invalidateQueries({ queryKey: ["cert-templates"] });
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Upload failed");
            }
          }}
        />
      )}

      {isLoading && <div className="text-[12px] text-white/60">Loading…</div>}
      {!isLoading && rows.length === 0 && (
        <div className="rounded-lg border border-dashed border-white/10 p-6 text-center text-[12px] text-white/60">
          No templates uploaded yet. The legacy code-drawn renderer will be used until you upload one and mark it default.
        </div>
      )}

      <div className="space-y-3">
        {rows.map((t) => (
          <TemplateRow
            key={t.id}
            template={t}
            onSetDefault={async () => {
              try {
                await setDefaultFn({ data: { id: t.id } });
                toast.success("Default template updated");
                qc.invalidateQueries({ queryKey: ["cert-templates"] });
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed");
              }
            }}
            onSaveMap={async (json) => {
              try {
                await updateMapFn({ data: { id: t.id, field_map_json: json } });
                toast.success("Field map saved");
                qc.invalidateQueries({ queryKey: ["cert-templates"] });
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed");
              }
            }}
            onDelete={async () => {
              if (!window.confirm("Delete this template? Existing certs stay intact.")) return;
              try {
                await deleteFn({ data: { id: t.id } });
                toast.success("Template deleted");
                qc.invalidateQueries({ queryKey: ["cert-templates"] });
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed");
              }
            }}
            onPreview={async () => {
              try {
                const { pdf_b64 } = await previewFn({ data: { id: t.id } });
                const bytes = Uint8Array.from(atob(pdf_b64), (c) => c.charCodeAt(0));
                const blob = new Blob([bytes], { type: "application/pdf" });
                const url = URL.createObjectURL(blob);
                window.open(url, "_blank");
                setTimeout(() => URL.revokeObjectURL(url), 60_000);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Preview failed");
              }
            }}
          />
        ))}
      </div>
    </PCard>
  );
}

function UploadTemplateForm({
  onSubmit,
}: {
  onSubmit: (payload: {
    slug: string;
    name: string;
    certificate_pdf_b64: string;
    unit_summary_pdf_b64: string | null;
    field_map_json: string;
    notes: string | null;
    set_default: boolean;
  }) => Promise<void>;
}) {
  const [slug, setSlug] = useState("reps-default-v1");
  const [name, setName] = useState("REPS default v1");
  const [certFile, setCertFile] = useState<File | null>(null);
  const [unitFile, setUnitFile] = useState<File | null>(null);
  const [fieldMapJson, setFieldMapJson] = useState(DEFAULT_FIELD_MAP_TEMPLATE);
  const [notes, setNotes] = useState("");
  const [setDefault, setSetDefault] = useState(true);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certFile) {
      toast.error("Certificate PDF is required");
      return;
    }
    try {
      JSON.parse(fieldMapJson);
    } catch {
      toast.error("Field map is not valid JSON");
      return;
    }
    setBusy(true);
    try {
      const certB64 = await fileToBase64(certFile);
      const unitB64 = unitFile ? await fileToBase64(unitFile) : null;
      await onSubmit({
        slug,
        name,
        certificate_pdf_b64: certB64,
        unit_summary_pdf_b64: unitB64,
        field_map_json: fieldMapJson,
        notes: notes.trim() || null,
        set_default: setDefault,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mb-4 space-y-3 rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[11px] text-white/60">Slug</span>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] text-white/60">Name</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] text-white/60">Certificate PDF (A4 landscape)</span>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setCertFile(e.target.files?.[0] ?? null)}
            className="block w-full text-[12px] text-white/80"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] text-white/60">Unit summary PDF (optional, A4 portrait)</span>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setUnitFile(e.target.files?.[0] ?? null)}
            className="block w-full text-[12px] text-white/80"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-[11px] text-white/60">
          Field map (JSON) — coordinates in pdf-lib points from bottom-left
        </span>
        <textarea
          value={fieldMapJson}
          onChange={(e) => setFieldMapJson(e.target.value)}
          rows={16}
          className="w-full rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-[11px] text-white/90"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-[11px] text-white/60">Notes (optional)</span>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      <label className="flex items-center gap-2 text-[12px] text-white/80">
        <input type="checkbox" checked={setDefault} onChange={(e) => setSetDefault(e.target.checked)} />
        Make this the default template
      </label>

      <div className="flex justify-end">
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          Upload
        </Button>
      </div>
    </form>
  );
}

function TemplateRow({
  template,
  onSetDefault,
  onSaveMap,
  onDelete,
  onPreview,
}: {
  template: CertificateTemplateDTO;
  onSetDefault: () => Promise<void>;
  onSaveMap: (json: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onPreview: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-white">{template.name}</span>
            {template.is_default && <Badge>Default</Badge>}
          </div>
          <div className="text-[11px] text-white/50">
            slug: {template.slug} · updated {new Date(template.updated_at).toLocaleString("en-GB")}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={onPreview}>
            Open PDF
          </Button>
          {!template.is_default && (
            <Button variant="ghost" onClick={onSetDefault}>
              Set as default
            </Button>
          )}
          <Button variant="ghost" onClick={() => setEditing((v) => !v)}>
            {editing ? "Close editor" : "Edit & preview"}
          </Button>
          <Button variant="ghost" onClick={onDelete}>
            <ShieldOff className="mr-1 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {editing && (
        <TemplateEditor
          templateId={template.id}
          initialFieldMapJson={template.field_map_json}
          onSave={async (json) => {
            await onSaveMap(json);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
}

async function fileToBase64(file: File): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) {
    s += String.fromCharCode.apply(null, Array.from(buf.subarray(i, i + chunk)));
  }
  return btoa(s);
}

// ─────────────────────────────────────────────────────────── Providers

function ProvidersPanel() {
  const qc = useQueryClient();
  const list = useServerFn(listProviderCenterNumbers);
  const save = useServerFn(setProviderCenterNumber);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-provider-center-numbers"],
    queryFn: () => list({ data: undefined as never }),
  });
  const [filter, setFilter] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (payload: { provider_id: string; center_number: string | null }) =>
      save({ data: payload }),
    onSuccess: () => {
      toast.success("Centre number saved");
      qc.invalidateQueries({ queryKey: ["admin-provider-center-numbers"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save"),
  });

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const list = data ?? [];
    if (!q) return list;
    return list.filter(
      (r) =>
        (r.provider_name ?? "").toLowerCase().includes(q) ||
        (r.center_number ?? "").toLowerCase().includes(q),
    );
  }, [data, filter]);

  return (
    <div className="max-w-3xl space-y-4">
      <PCard>
        <div className="p-6">
          <div className="mb-4">
            <h2 className="font-display text-lg">Provider centre numbers</h2>
            <p className="mt-0.5 text-[12.5px] text-white/50">
              Prints as "Centre No. &lt;number&gt;" beneath the provider name on issued
              certificates. Providers upload their own certificate logo from their dashboard.
            </p>
          </div>
          <div className="mb-3">
            <Input
              placeholder="Search providers"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading providers…
            </div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-white/50">No providers found.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {rows.map((r) => {
                const draft = drafts[r.provider_id] ?? r.center_number ?? "";
                const dirty = draft !== (r.center_number ?? "");
                return (
                  <div
                    key={r.provider_id}
                    className="flex flex-wrap items-start gap-3 py-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] text-white/90">
                        {r.provider_name ?? "Unnamed provider"}
                      </div>
                      <div className="truncate text-[11.5px] text-white/40">
                        {r.provider_id}
                      </div>
                      {r.certificate_logo_url ? (
                        <div className="mt-2 flex items-center gap-2 text-[11.5px] text-white/45">
                          <img
                            src={r.certificate_logo_url}
                            alt=""
                            width={80}
                            height={30}
                            className="h-[30px] w-[80px] rounded-[6px] border border-white/10 bg-white/5 object-contain"
                          />
                          <span>Logo uploaded by provider</span>
                        </div>
                      ) : (
                        <div className="mt-1 text-[11.5px] text-white/40">
                          No provider logo uploaded yet
                        </div>
                      )}
                    </div>
                    <div className="w-52">
                      <div className="mb-1 text-[11px] uppercase tracking-wide text-white/40">
                        Centre number
                      </div>
                      <Input
                        placeholder="e.g. REPS-000123"
                        value={draft}
                        onChange={(e) =>
                          setDrafts((s) => ({ ...s, [r.provider_id]: e.target.value }))
                        }
                      />
                      <div className="mt-2">
                        <Button
                          variant={dirty ? "primary" : "subtle"}
                          disabled={!dirty || mutation.isPending}
                          onClick={() =>
                            mutation.mutate({
                              provider_id: r.provider_id,
                              center_number: draft.trim() ? draft.trim() : null,
                            })
                          }
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PCard>
    </div>
  );
}


