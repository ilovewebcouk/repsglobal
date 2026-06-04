import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const DAYS = [
  { day: "Mon", title: "Next Move card", body: "REPs ranks this week's highest-leverage action — the price to raise, the client to renew." },
  { day: "Tue", title: "Lead drafts ready", body: "Every enquiry scored on intent, with a personalised first-draft reply waiting in the pipeline." },
  { day: "Wed", title: "Programme writer", body: "One-line brief in, 12-week plan out. Edit, assign, done before your 11am coffee." },
  { day: "Thu", title: "Risk flagged", body: "Three clients off-track — REPs spotted it before they ghosted. Drafted check-in queued." },
  { day: "Fri", title: "Check-ins, summarised", body: "Twelve check-ins read for you. One card per client: headline, change, ask." },
];

export function WeekWithReps() {
  return (
    <Carousel opts={{ align: "start" }} className="w-full">
      <CarouselContent className="-ml-4">
        {DAYS.map((d, i) => (
          <CarouselItem key={d.day} className="basis-[85%] pl-4 sm:basis-1/2 lg:basis-1/3">
            <div className="h-full rounded-[18px] border border-reps-border bg-reps-panel/60 p-6">
              <div className="flex items-center gap-3">
                <span className="font-display text-[36px] font-bold leading-none text-reps-orange">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
                    {d.day}
                  </div>
                  <div className="text-[15px] font-semibold text-white">{d.title}</div>
                </div>
              </div>
              <p className="mt-4 text-[13.5px] leading-relaxed text-white/65">{d.body}</p>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="mt-6 flex justify-end gap-2">
        <CarouselPrevious className="static translate-y-0 border-reps-border bg-reps-panel text-white hover:bg-reps-panel/80" />
        <CarouselNext className="static translate-y-0 border-reps-border bg-reps-panel text-white hover:bg-reps-panel/80" />
      </div>
    </Carousel>
  );
}
