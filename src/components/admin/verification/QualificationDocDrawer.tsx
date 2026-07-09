/**
 * In-page evidence viewer for the admin verification queue.
 *
 * Opens as a right-side Sheet showing signed URLs for one or more
 * qualification / CPD documents. Admin flips between attachments using a
 * segmented control at the top — no more "open in new tab".
 */

import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ExternalLink, FileText, Loader2 } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getQualificationDocSignedUrl } from "@/lib/qualifications/qualifications.functions";

export type QualificationDoc = {
  path: string;
  label: string;
};

export function QualificationDocDrawer({
  open,
  onOpenChange,
  docs,
  title,
  subtitle,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  docs: QualificationDoc[];
  title: string;
  subtitle?: string;
}) {
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [signedUrl, setSignedUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const signUrlFn = useServerFn(getQualificationDocSignedUrl);

  const active = docs[activeIdx] ?? null;

  // Reset to first doc every time the drawer opens with a new set.
  React.useEffect(() => {
    if (open) setActiveIdx(0);
  }, [open, docs]);

  React.useEffect(() => {
    let cancelled = false;
    if (!open || !active) {
      setSignedUrl(null);
      return;
    }
    setLoading(true);
    setSignedUrl(null);
    signUrlFn({ data: { path: active.path } })
      .then((res) => {
        if (!cancelled) setSignedUrl(res.url);
      })
      .catch((e) => {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Could not open document");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, active, signUrlFn]);

  const kind = active ? guessKind(active.path) : "other";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-l border-reps-border bg-reps-ink p-0 text-white sm:max-w-[720px]"
      >
        <SheetHeader className="border-b border-reps-border px-5 py-4">
          <SheetTitle className="text-white">{title}</SheetTitle>
          {subtitle ? (
            <SheetDescription className="text-white/60">{subtitle}</SheetDescription>
          ) : null}

          {docs.length > 1 ? (
            <div className="mt-3 inline-flex flex-wrap gap-1 rounded-[10px] border border-reps-border bg-reps-panel/40 p-1">
              {docs.map((d, i) => (
                <button
                  key={`${d.path}-${i}`}
                  onClick={() => setActiveIdx(i)}
                  className={`inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-[11.5px] font-semibold transition ${
                    i === activeIdx
                      ? "bg-reps-orange text-white"
                      : "text-white/55 hover:text-white"
                  }`}
                >
                  <FileText className="h-3 w-3" />
                  {d.label}
                </button>
              ))}
            </div>
          ) : null}

          {signedUrl ? (
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex w-fit items-center gap-1 text-[11.5px] text-white/60 hover:text-white"
            >
              Open in new tab <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </SheetHeader>

        <div className="relative h-[calc(100vh-140px)] w-full bg-black/40">
          {loading ? (
            <div className="flex h-full items-center justify-center text-white/60">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading document…
            </div>
          ) : !signedUrl ? (
            <div className="flex h-full items-center justify-center text-[13px] text-white/50">
              No document selected.
            </div>
          ) : kind === "pdf" ? (
            <iframe src={signedUrl} title={active?.label ?? "Document"} className="h-full w-full" />
          ) : kind === "image" ? (
            <div className="flex h-full w-full items-center justify-center overflow-auto p-4">
              <img
                src={signedUrl}
                alt={active?.label ?? "Document"}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-[13px] text-white/60">
              <FileText className="h-6 w-6" />
              <div>Preview not available for this file type.</div>
              <a
                href={signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-[8px] border border-reps-border bg-white/5 px-2.5 py-1 text-white/80 hover:bg-white/10"
              >
                Open in new tab <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function guessKind(path: string): "pdf" | "image" | "other" {
  const lower = path.toLowerCase().split("?")[0];
  if (lower.endsWith(".pdf")) return "pdf";
  if (/\.(png|jpe?g|gif|webp|avif)$/.test(lower)) return "image";
  return "other";
}
