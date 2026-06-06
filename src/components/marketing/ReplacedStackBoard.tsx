import {
  ArrowRight,
  Check,
  Apple,
  Filter,
  Zap,
  GraduationCap,
  BookOpen,
  Users,
  FileSignature,
} from "lucide-react";
import { RepsWordmark } from "@/components/brand/RepsWordmark";
import wix from "@/assets/logos/wix.svg.asset.json";
import trainerize from "@/assets/logos/trainerize.svg.asset.json";
import calendly from "@/assets/logos/calendly.svg.asset.json";
import stripe from "@/assets/logos/stripe.svg.asset.json";
import mailchimp from "@/assets/logos/mailchimp.svg.asset.json";
import googlesheets from "@/assets/logos/googlesheets.svg.asset.json";
import whatsapp from "@/assets/logos/whatsapp.svg.asset.json";
import googleforms from "@/assets/logos/googleforms.svg.asset.json";
import hubspot from "@/assets/logos/hubspot.svg.asset.json";
import typeform from "@/assets/logos/typeform.svg.asset.json";

type Before = {
  name: string;
  job: string;
  logo?: string;
  icon?: React.ComponentType<{ className?: string }>;
  wide?: boolean;
};

const BEFORE: Before[] = [
  // Web & content
  { name: "Wix / Squarespace", job: "Website", logo: wix.url },
  { name: "Kajabi", job: "Courses", icon: GraduationCap },
  { name: "Thinkific", job: "Courses", icon: BookOpen },
  // Programmes & training delivery
  { name: "Trainerize", job: "Programmes", logo: trainerize.url, wide: true },
  // Sales & lead capture
  { name: "ClickFunnels", job: "Funnels", icon: Filter },
  { name: "Typeform", job: "Lead forms", logo: typeform.url },
  // Bookings & money
  { name: "Calendly", job: "Bookings", logo: calendly.url },
  { name: "Stripe Checkout", job: "Payments", logo: stripe.url },
  { name: "DocuSign", job: "Contracts", icon: FileSignature },
  // Marketing & CRM
  { name: "Mailchimp", job: "Email", logo: mailchimp.url },
  { name: "HubSpot", job: "CRM", logo: hubspot.url },
  { name: "Google Sheets", job: "Spreadsheets", logo: googlesheets.url },
  { name: "GoHighLevel", job: "Automation", icon: Zap },
  // Community & client comms
  { name: "Skool", job: "Community", icon: Users },
  { name: "WhatsApp", job: "Client comms", logo: whatsapp.url },
  // Coaching ops
  { name: "MyFitnessPal", job: "Nutrition", icon: Apple },
  { name: "Manual check-in forms", job: "Check-ins", logo: googleforms.url },
];


const AFTER = [
  "Verified directory listing",
  "Personal shop-front at /c/your-name",
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
            <span className="rounded-full border border-reps-border/60 px-2 py-0.5 text-[10.5px] uppercase tracking-wider text-white/50">
              9 tools · 9 bills
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {BEFORE.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.name}
                  className="flex items-center gap-2 rounded-[10px] border border-reps-border/70 bg-reps-panel/40 px-3 py-2 transition-colors hover:border-reps-border"
                >
                  <span
                    className={`flex shrink-0 items-center justify-center opacity-60 ${
                      b.wide ? "h-3.5 w-auto max-w-[64px]" : "h-4 w-4"
                    }`}
                  >
                    {b.logo ? (
                      <img
                        src={b.logo}
                        alt=""
                        aria-hidden
                        className={`brightness-0 invert ${
                          b.wide
                            ? "h-full w-auto object-contain"
                            : "h-full w-full object-contain"
                        }`}
                      />
                    ) : Icon ? (
                      <Icon className="h-full w-full text-white" />
                    ) : null}
                  </span>
                  <span className="font-display text-[12px] font-semibold text-white/65 line-through decoration-reps-orange/60">
                    {b.name}
                  </span>
                  <span className="ml-auto text-[10.5px] uppercase tracking-wider text-white/35">
                    {b.job}
                  </span>
                </div>
              );
            })}
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
