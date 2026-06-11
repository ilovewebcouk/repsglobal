import { Briefcase, Clock, ShieldCheck } from "lucide-react";

/**
 * "Right now" hero status card for /contact.
 * B2B: messaging is for professionals and training providers/partners.
 * Phase 1: static copy. Wired to real data later.
 */
export function StatusCard() {
  return (
    <div className="relative overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel/80 p-6 backdrop-blur lg:p-7">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(60%_70%_at_100%_0%,rgba(255,122,0,0.08),transparent_70%)]"
      />
      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Right now
          </span>
        </div>

        <ul className="mt-5 flex flex-col gap-4">
          <Row
            icon={<ShieldCheck className="size-4 text-reps-orange" />}
            title="Helping pros get verified"
            sub="Evidence reviewed in order, weekdays"
          />
          <Row
            icon={<Clock className="size-4 text-reps-orange" />}
            title="Pro questions: ~2hr reply"
            sub="Mon–Fri, 9–6 GMT"
          />
          <Row
            icon={<Briefcase className="size-4 text-reps-orange" />}
            title="Partnerships: same-day acknowledgement"
            sub="Training providers, awarding bodies, press"
          />
        </ul>
      </div>
    </div>
  );
}

function Row({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[10px] border border-reps-border bg-reps-ink">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[14px] font-semibold text-white">{title}</div>
        <div className="text-[12px] text-white/55">{sub}</div>
      </div>
    </li>
  );
}
