import { Award, ShieldCheck, Clock, AlertTriangle, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type CertRow = {
  id: string;
  awarding_body: string;
  qualification: string;
  year: number | null;
  expiry_date: string | null;
  status: "submitted" | "approved" | "rejected" | "changes_requested" | string;
  admin_note: string | null;
  verify_token: string | null;
};

function expiryState(expiry: string | null): "ok" | "soon" | "expired" | "none" {
  if (!expiry) return "none";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiry);
  if (exp < today) return "expired";
  const days = Math.floor((exp.getTime() - today.getTime()) / 86_400_000);
  if (days <= 60) return "soon";
  return "ok";
}

export function CertificateCard({ cert, onDelete }: { cert: CertRow; onDelete?: (id: string) => void }) {
  const isApproved = cert.status === "approved";
  const isPending = cert.status === "submitted";
  const isChanges = cert.status === "changes_requested";
  const isRejected = cert.status === "rejected";
  const exp = expiryState(cert.expiry_date);

  return (
    <li className="rounded-[16px] border border-reps-border bg-reps-panel-soft p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
          <Award className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="truncate text-[13px] font-semibold text-white">{cert.qualification}</span>
            {isApproved ? (
              exp === "expired" ? (
                <Badge variant="outline" className="shrink-0 border-red-400/30 bg-red-500/15 text-red-300">
                  Expired
                </Badge>
              ) : exp === "soon" ? (
                <Badge variant="outline" className="shrink-0 border-amber-400/30 bg-amber-500/15 text-amber-300">
                  <Clock className="mr-1 size-3" /> Expiring
                </Badge>
              ) : (
                <Badge variant="outline" className="shrink-0 border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
                  <ShieldCheck className="mr-1 size-3" /> Verified
                </Badge>
              )
            ) : isPending ? (
              <Badge variant="outline" className="shrink-0 border-amber-400/30 bg-amber-500/15 text-amber-300">
                Pending review
              </Badge>
            ) : isChanges ? (
              <Badge variant="outline" className="shrink-0 border-amber-400/30 bg-amber-500/15 text-amber-300">
                <AlertTriangle className="mr-1 size-3" /> Changes requested
              </Badge>
            ) : isRejected ? (
              <Badge variant="outline" className="shrink-0 border-red-400/30 bg-red-500/15 text-red-300">
                Rejected
              </Badge>
            ) : null}
          </div>
          <div className="mt-0.5 text-[11px] text-white/55">
            {cert.awarding_body}
            {cert.year ? ` · Issued ${cert.year}` : ""}
            {cert.expiry_date ? ` · Expires ${cert.expiry_date}` : ""}
          </div>
          {(isChanges || isRejected) && cert.admin_note ? (
            <div className="mt-2 rounded-[8px] border border-amber-400/20 bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-200">
              {cert.admin_note}
            </div>
          ) : null}
          <div className="mt-2 flex items-center justify-between text-[12px]">
            {isApproved && cert.verify_token ? (
              <a
                href={`/verify/${cert.verify_token}`}
                target="_blank"
                rel="noreferrer"
                className="text-reps-orange hover:text-reps-orange-hover"
              >
                Public verify link
              </a>
            ) : (
              <span className="text-white/45">{isPending || isChanges ? "Awaiting REPs review" : ""}</span>
            )}
            {(isPending || isChanges) && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(cert.id)}
                className="flex items-center gap-1 text-white/55 hover:text-white"
              >
                <X className="size-3" /> Remove
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}
