import * as React from "react";
import { ExternalLink, FileText, Loader2, ShieldCheck } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { type CheckStatus } from "@/lib/verification/cross-checks";

export type CrossCheck = {
  id: string;
  label: string;
  status: CheckStatus;
  detail?: string | null;
};

export type CertDrawerData = {
  id: string;
  qualification: string;
  awarding_body: string;
  year?: number | null;
  expiry_date?: string | null;
  doc_paths: string[];
  regulator_verified?: boolean | null;
  derived_title_label?: string | null;
  status: string;
  holder_name?: string | null;
  professional_name?: string | null;
};

const STATUS_DOT: Record<CheckStatus, string> = {
  pass: "bg-emerald-400",
  warn: "bg-amber-400",
  fail: "bg-red-500",
  pending: "bg-white/30",
  skip: "bg-white/15",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cert: CertDrawerData | null;
  crossChecks: CrossCheck[];
  resolveDocUrl: (path: string) => Promise<string>;
  readOnly?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onRequestChanges?: () => void;
  busy?: boolean;
};

export function CertDrawer({
  open,
  onOpenChange,
  cert,
  crossChecks,
  resolveDocUrl,
  readOnly = false,
  onApprove,
  onReject,
  onRequestChanges,
  busy = false,
}: Props) {
  const [activeDoc, setActiveDoc] = React.useState<string | null>(null);
  const [docUrl, setDocUrl] = React.useState<string | null>(null);
  const [loadingDoc, setLoadingDoc] = React.useState(false);

  React.useEffect(() => {
    if (!cert) return;
    const first = cert.doc_paths[0] ?? null;
    setActiveDoc(first);
  }, [cert?.id]);

  React.useEffect(() => {
    let cancelled = false;
    if (!activeDoc) {
      setDocUrl(null);
      return;
    }
    setLoadingDoc(true);
    resolveDocUrl(activeDoc)
      .then((url) => {
        if (!cancelled) setDocUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDocUrl(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingDoc(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeDoc, resolveDocUrl]);

  if (!cert) return null;
  const isImage = activeDoc ? /\.(png|jpe?g|webp|gif)$/i.test(activeDoc) : false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-[680px] overflow-y-auto border-l border-reps-border bg-reps-ink p-0 text-white sm:max-w-[680px]"
      >
        <SheetHeader className="space-y-2 border-b border-reps-border p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="text-white">
                {cert.qualification}
              </SheetTitle>
              <SheetDescription className="text-white/55">
                {cert.awarding_body}
                {cert.year ? ` · ${cert.year}` : ""}
                {cert.professional_name ? ` · ${cert.professional_name}` : ""}
              </SheetDescription>
            </div>
            {cert.regulator_verified ? (
              <Badge className="shrink-0 border-emerald-400/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">
                <ShieldCheck className="mr-1 h-3 w-3" /> Ofqual
              </Badge>
            ) : (
              <Badge className="shrink-0 border-amber-400/30 bg-amber-500/15 text-amber-300 hover:bg-amber-500/15">
                Manual review
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-5 p-5">
          {/* Document preview */}
          <section>
            <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-white/55">
              Certificate
            </h4>
            {cert.doc_paths.length > 1 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {cert.doc_paths.map((p, i) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setActiveDoc(p)}
                    className={`rounded-[8px] border px-2 py-1 text-[11px] font-medium transition ${
                      activeDoc === p
                        ? "border-reps-orange/40 bg-reps-orange-soft text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:text-white"
                    }`}
                  >
                    <FileText className="mr-1 inline h-3 w-3" />
                    Doc {i + 1}
                  </button>
                ))}
              </div>
            )}
            <div className="relative overflow-hidden rounded-[14px] border border-reps-border bg-black/30">
              {loadingDoc && (
                <div className="flex h-[60vh] items-center justify-center text-white/55">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
                </div>
              )}
              {!loadingDoc && docUrl && isImage && (
                <img
                  src={docUrl}
                  alt="Certificate"
                  className="h-[60vh] w-full object-contain"
                />
              )}
              {!loadingDoc && docUrl && !isImage && (
                <iframe
                  src={docUrl}
                  title="Certificate"
                  className="h-[60vh] w-full"
                />
              )}
              {!loadingDoc && !docUrl && (
                <div className="flex h-[60vh] items-center justify-center text-[12px] text-white/55">
                  Couldn&rsquo;t load document
                </div>
              )}
            </div>
            {docUrl && (
              <a
                href={docUrl}
                target="_blank"
                rel="noopener"
                className="mt-2 inline-flex items-center gap-1 text-[11px] text-white/55 hover:text-white"
              >
                Open in new tab <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </section>

          {/* Details */}
          <section className="grid grid-cols-2 gap-3 text-[12px]">
            <Detail label="Holder on cert" value={cert.holder_name ?? "—"} />
            <Detail label="Status" value={cert.status} />
            <Detail label="Issue year" value={cert.year ? String(cert.year) : "—"} />
            <Detail label="Expiry" value={cert.expiry_date ?? "No expiry"} />
            {cert.derived_title_label && (
              <Detail
                label="If approved → unlocks title"
                value={cert.derived_title_label}
              />
            )}
          </section>

          <Separator className="bg-reps-border" />

          {/* Cross-checks */}
          <section>
            <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-white/55">
              Cross-checks
            </h4>
            <div className="space-y-1.5">
              {crossChecks.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 rounded-[10px] bg-white/[0.03] px-3 py-2 text-[12px]"
                >
                  <span className={`h-2 w-2 rounded-full ${STATUS_DOT[c.status]}`} />
                  <span className="flex-1 text-white/80">{c.label}</span>
                  <span className="text-white/55">{c.detail ?? c.status}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Decision footer (admin only) */}
          {!readOnly && (
            <>
              <Separator className="bg-reps-border" />
              <section className="flex flex-wrap items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white"
                  disabled={busy}
                  onClick={onRequestChanges}
                >
                  Request changes
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white"
                  disabled={busy}
                  onClick={onReject}
                >
                  Reject
                </Button>
                <div className="flex-1" />
                <Button
                  size="sm"
                  className="bg-reps-orange text-white hover:bg-reps-orange-hover"
                  disabled={busy}
                  onClick={onApprove}
                >
                  {busy ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : null}
                  Approve cert
                </Button>
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-white/45">{label}</div>
      <div className="mt-0.5 text-white/85">{value}</div>
    </div>
  );
}
