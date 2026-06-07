import { Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import jamesCarter from "@/assets/testimonials/james-carter.jpg";

// Phase 1 placeholder testimonial — replace with real, opted-in quotes before public launch.
export function TestimonialFeature() {
  return (
    <figure className="relative overflow-hidden rounded-[22px] border border-reps-border bg-gradient-to-br from-reps-panel via-reps-panel/80 to-reps-ink p-8 lg:p-12">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(50%_60%_at_85%_20%,rgba(255,122,0,0.12),transparent_70%)]"
      />
      <div className="relative grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:items-center lg:gap-14">
        <div>
          <div className="flex items-center gap-3">
            <Quote className="h-8 w-8 text-reps-orange" aria-hidden />
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/45">
              Sample story · for illustration
            </span>
          </div>
          <blockquote className="mt-4 font-display text-[22px] font-semibold leading-snug text-white lg:text-[28px]">
            "I shut down my old Trainerize app, my booking link and my spreadsheet
            on the same day. REPs runs the lot — and the Verified badge actually
            fills my diary."
          </blockquote>
          <div className="mt-6 flex items-center gap-4">
            <Avatar className="size-12 border border-reps-border">
              <AvatarImage src={jamesCarter} alt="James Carter" loading="lazy" />
              <AvatarFallback className="bg-reps-orange-soft text-reps-orange">JC</AvatarFallback>
            </Avatar>
            <figcaption className="text-[13px] leading-tight">
              <div className="font-semibold text-white">James Carter</div>
              <div className="text-white/55">Strength Coach · Manchester · REPs Pro</div>
            </figcaption>
          </div>
        </div>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          <Stat k="+12 enquiries" v="first 90 days on the verified register" />
          <Stat k="Sundays back" v="AI drafts every weekly check-in" />
          <Stat k="£0 add-ons" v="Trainerize, Calendly and Mailchimp retired" />
        </dl>
      </div>
    </figure>
  );
}

function Stat({ k, v }: { k: React.ReactNode; v: string }) {
  return (
    <div className="rounded-[18px] border border-reps-border bg-reps-ink/60 p-5">
      <dt className="font-display text-[18px] font-bold leading-tight text-reps-orange lg:text-[20px]">{k}</dt>
      <dd className="mt-2 text-[12px] leading-snug text-white/60">{v}</dd>
    </div>
  );
}
