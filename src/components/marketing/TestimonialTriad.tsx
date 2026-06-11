import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import sofiaReyes from "@/assets/testimonials/sofia-reyes.jpg";
import marcusOkafor from "@/assets/testimonials/marcus-okafor.jpg";
import ellaMarsh from "@/assets/testimonials/ella-marsh.jpg";

// Phase 1 placeholders — replace with real, opted-in quotes before public launch.
const QUOTES = [
  {
    initials: "SR",
    name: "Sofia Reyes",
    role: "Pilates Instructor · London",
    image: sofiaReyes,
    quote: "Clients book themselves now. I haven't replied to a 'do you have space?' DM in months.",
  },
  {
    initials: "MO",
    name: "Marcus Okafor",
    role: "Online Coach · Bristol",
    image: marcusOkafor,
    quote: "The Sunday check-in pile used to take 5 hours. REPS AI does the first pass — I just review and send.",
  },
  {
    initials: "EM",
    name: "Ella Marsh",
    role: "Studio Owner · Edinburgh",
    image: ellaMarsh,
    quote: "We replaced six tools with one. Three coaches, one dashboard, one bill, zero finger-pointing.",
  },
];

export function TestimonialTriad() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {QUOTES.map((q) => (
        <Card key={q.name} className="rounded-[18px] border-reps-border bg-reps-panel/60 text-white">
          <CardContent className="flex h-full flex-col gap-5 p-6">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-reps-orange text-reps-orange" />
              ))}
            </div>
            <p className="flex-1 text-[14px] leading-relaxed text-white/85">"{q.quote}"</p>
            <div className="flex items-center gap-3 border-t border-reps-border pt-4">
              <Avatar className="size-9">
                <AvatarImage src={q.image} alt={q.name} loading="lazy" />
                <AvatarFallback className="bg-reps-orange-soft text-[12px] text-reps-orange">
                  {q.initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-[12.5px] leading-tight">
                <div className="font-semibold text-white">{q.name}</div>
                <div className="text-white/55">{q.role}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
