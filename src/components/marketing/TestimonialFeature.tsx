import { Quote, Star } from "lucide-react";
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
      <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-14">
        <div>
          <Quote className="h-8 w-8 text-reps-orange" aria-hidden />
          <blockquote className="mt-4 font-display text-[22px] font-semibold leading-snug text-white lg:text-[28px]">
            "I shut down my Trainerize, my Calendly and my spreadsheet on the same day.
            REPs runs the lot — and the Verified badge actually fills my diary."
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
        <div className="hidden h-full w-px bg-reps-border lg:block" />
        <dl className="grid grid-cols-3 gap-6 lg:grid-cols-1 lg:gap-5">
          <Stat k="+38%" v="enquiries since joining" />
          <Stat k="9 hrs" v="saved every Sunday" />
          <Stat k={<span className="inline-flex items-center gap-1">4.9<Star className="h-4 w-4 fill-reps-orange text-reps-orange" /></span>} v="REPs profile rating" />
        </dl>
      </div>
    </figure>
  );
}

function Stat({ k, v }: { k: React.ReactNode; v: string }) {
  return (
    <div>
      <dt className="font-display text-[24px] font-bold text-reps-orange lg:text-[28px]">{k}</dt>
      <dd className="mt-1 text-[12px] text-white/60">{v}</dd>
    </div>
  );
}
