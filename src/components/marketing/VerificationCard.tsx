import { QRCodeSVG } from "qrcode.react";
import { BadgeCheck, Check, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VerificationCardProps {
  name: string;
  role: string;
  location: string;
  photo: string;
  verifiedId: string;
  /** URL the QR resolves to. */
  verifyUrl: string;
  /** Display date (e.g. "Mar 2026"). */
  lastVerified: string;
  /** Renewal due date display. */
  renewsOn?: string;
  /** Smaller density variant for marketing sections. */
  size?: "default" | "lg";
  className?: string;
}

const CHECKS: Array<{ label: string; meta: string }> = [
  { label: "Qualifications", meta: "Ofqual-regulated · matched on awarding-body register" },
  { label: "Insurance", meta: "Public liability · in date" },
  { label: "Identity", meta: "Government ID · biometric match" },
  { label: "CPD", meta: "Logged · 12 mo rolling" },
];

/**
 * Tactile, scannable verification credential. Always uses a cream/ivory
 * surface so it reads as a physical artefact against the dark marketing
 * surface. The QR resolves to a public `/verify/$id` page.
 */
export function VerificationCard({
  name,
  role,
  location,
  photo,
  verifiedId,
  verifyUrl,
  lastVerified,
  renewsOn,
  size = "default",
  className,
}: VerificationCardProps) {
  const isLg = size === "lg";

  return (
    <div
      className={cn(
        // Card surface — cream credential against dark page
        "relative isolate overflow-hidden rounded-[22px] border border-reps-stone/80 bg-reps-ivory text-reps-charcoal",
        "shadow-[0_30px_60px_-30px_rgba(0,0,0,0.55),0_8px_24px_-16px_rgba(0,0,0,0.35)]",
        isLg ? "max-w-[440px]" : "max-w-[400px]",
        className,
      )}
    >
      {/* Top brand strip */}
      <div className="flex items-center justify-between border-b border-reps-stone/70 bg-reps-warm-white px-5 py-3">
        <span className="font-display text-[16px] font-black tracking-[0.18em] text-reps-charcoal">
          REPS
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700 ring-1 ring-emerald-500/30">
          <BadgeCheck className="h-3 w-3" />
          Verified Professional
        </span>
      </div>

      {/* Pro identity */}
      <div className="flex items-center gap-4 px-5 pt-5">
        <img
          src={photo}
          alt={`${name} — verified REPs professional`}
          className="h-16 w-16 rounded-full object-cover ring-2 ring-reps-stone/80"
          loading="lazy"
        />
        <div className="min-w-0">
          <div className="font-display text-[20px] font-bold leading-tight text-reps-charcoal">
            {name}
          </div>
          <div className="truncate text-[13px] text-reps-charcoal/70">
            {role} · {location}
          </div>
          <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-reps-charcoal/55">
            ID {verifiedId}
          </div>
        </div>
      </div>

      {/* Verification chain */}
      <ul className="mt-5 grid grid-cols-1 gap-2 px-5">
        {CHECKS.map((c) => (
          <li
            key={c.label}
            className="flex items-start gap-3 rounded-[10px] border border-reps-stone/70 bg-white px-3 py-2"
          >
            <span className="mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
              <Check className="h-3 w-3 text-emerald-700" strokeWidth={3} />
            </span>
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold text-reps-charcoal">{c.label}</div>
              <div className="truncate text-[11.5px] text-reps-charcoal/60">{c.meta}</div>
            </div>
          </li>
        ))}
      </ul>

      {/* QR + scan footer */}
      <div className="mt-5 flex items-stretch gap-4 border-t border-dashed border-reps-stone/70 bg-reps-warm-white/60 px-5 py-4">
        <div className="rounded-[10px] border border-reps-stone/80 bg-white p-1.5">
          <QRCodeSVG
            value={verifyUrl}
            size={isLg ? 96 : 84}
            level="M"
            bgColor="#FFFFFF"
            fgColor="#1A1A1A"
            marginSize={0}
          />
        </div>
        <div className="flex min-w-0 flex-col justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-reps-charcoal/55">
              Scan to verify
            </div>
            <div className="mt-1 truncate font-mono text-[12px] text-reps-charcoal/80">
              repsglobal.app/verify/{verifiedId.toLowerCase()}
            </div>
          </div>
          <div className="space-y-0.5 text-[11px] text-reps-charcoal/65">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3 text-emerald-700" />
              Last verified <span className="font-semibold text-reps-charcoal">{lastVerified}</span>
            </div>
            {renewsOn ? (
              <div>Renews <span className="font-semibold text-reps-charcoal">{renewsOn}</span></div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Watermark stripe */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-[linear-gradient(90deg,var(--reps-orange)_0_25%,transparent_25%_50%,var(--reps-orange)_50%_75%,transparent_75%_100%)] opacity-90"
      />
    </div>
  );
}
