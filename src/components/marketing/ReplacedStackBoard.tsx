import { ArrowRight, Check } from "lucide-react";
import { RepsWordmark } from "@/components/brand/RepsWordmark";
import trainerize from "@/assets/logos/trainerize.svg.asset.json";

const BEFORE = [
  { name: "Trainerize", job: "Programmes", logo: trainerize.url },
  { name: "Calendly", job: "Bookings" },
  { name: "Stripe Checkout", job: "Payments" },
  { name: "Mailchimp", job: "Email" },
  { name: "Google Sheets", job: "CRM" },
  { name: "WhatsApp", job: "Client comms" },
  { name: "MyFitnessPal-style apps", job: "Nutrition" },
  { name: "Manual check-in forms", job: "Check-ins" },
];

const AFTER = [
  "Verified directory listing",
  "Leads CRM",
  "Calendar & bookings",
  "Payments & subscriptions",
  "Programme builder",
  "Check-ins & progress",
  "Client messaging",
  "Content & lead magnets",
  "Branded client portal",
  "REPs AI assistant",
];

export function ReplacedStackBoard() {
  return (
    <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-6 lg:p-10">
      <div className="max-w-[760px]">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
          One connected platform
        </span>
        <h2 className="mt-3 font-display text-[28px] font-bold leading-tight text-white lg:text-[36px]">
          Replace the scattered stack with one connected platform for visibility,
          operations, coaching and growth.
        </h2>
        <p className="mt-3 text-[14.5px] text-white/65">
          One login. One bill. One record per client.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_auto_1fr] lg:items-stretch lg:gap-8">
        {/* BEFORE */}
        <div className="rounded-[18px] border border-reps-border bg-reps-ink/60 p-5 lg:p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
              Before · your current stack
            </span>
            <span className="text-[11px] text-white/40">8 tools</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {BEFORE.map((b) => (
              <div
                key={b.name}
                className="flex items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel/60 px-3 py-2"
              >
                {b.logo ? (
                  <img
                    src={b.logo}
                    alt=""
                    className="h-3.5 w-auto opacity-60 brightness-0 invert"
                    loading="lazy"
                  />
                ) : (
                  <span className="font-display text-[12px] font-bold text-white/55 line-through decoration-reps-orange/60">
                    {b.name}
                  </span>
                )}
                <span className="ml-auto text-[10.5px] uppercase tracking-wider text-white/40">
                  {b.job}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-reps-orange text-white shadow-[0_10px_30px_-10px_rgba(255,122,0,0.6)] lg:h-12 lg:w-12">
            <ArrowRight className="h-5 w-5" />
          </div>
        </div>

        {/* AFTER */}
        <div className="relative overflow-hidden rounded-[18px] border border-reps-orange-border bg-gradient-to-br from-reps-orange-soft via-reps-panel to-reps-panel p-5 lg:p-6">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_0%,rgba(255,122,0,0.18),transparent_70%)]"
          />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
                After
              </span>
              <RepsWordmark className="h-4 text-white" />
            </div>
            <ul className="mt-4 grid gap-1.5">
              {AFTER.map((a) => (
                <li
                  key={a}
                  className="flex items-center gap-2 text-[13px] text-white/85"
                >
                  <Check className="h-3.5 w-3.5 shrink-0 text-reps-orange" />
                  {a}
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-reps-border/60 pt-3 text-[11.5px] text-white/55">
              One login · one bill · one client record
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
