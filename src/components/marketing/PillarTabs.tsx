import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, ClipboardCheck, Dumbbell, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeviceMockup } from "@/components/marketing/DeviceMockup";
import { MockupStage } from "@/components/marketing/MockupStage";

type Tab = {
  value: string;
  label: string;
  icon: typeof Dumbbell;
  title: string;
  body: string;
  bullets: string[];
  mockup: { device: "laptop" | "phone"; src: string; title: string };
};

const TABS: Tab[] = [
  {
    value: "programmes",
    label: "Programmes",
    icon: Dumbbell,
    title: "Programmes your clients show off.",
    body:
      "Weeks, workouts, sets, reps, rest, RPE and video demos — built in a clean editor and assigned in one click. Or one-line brief in, 12-week plan out, drafted by REPS AI.",
    bullets: [
      "Week-by-week structure with progression",
      "Curated exercise library with video demos",
      "One-click assignment, bulk edits across clients",
      "AI Programme Writer — drafted from a brief",
    ],
    mockup: { device: "laptop", src: "/dashboard/programs", title: "Programme builder preview" },
  },
  {
    value: "checkins",
    label: "Check-ins",
    icon: ClipboardCheck,
    title: "Reclaim your Sunday evenings.",
    body:
      "Adherence, sleep, stress, training, nutrition, measurements and photos summarised into one card per client — with a reply already drafted in your tone of voice.",
    bullets: [
      "Single-screen check-in review per client",
      "AI Check-in Summariser — headline, change, ask",
      "Nutrition targets vs actuals with deltas",
      "Progress photos and measurements side-by-side",
    ],
    mockup: { device: "laptop", src: "/dashboard/check-ins", title: "Check-in review preview" },
  },
  {
    value: "record",
    label: "Client record",
    icon: User,
    title: "One record. The whole client.",
    body:
      "Goals, programme, last check-in, next session, lifetime value, outstanding invoice — on one screen. The CRM the coaching apps don't have, wired to the coaching tools the CRMs don't have.",
    bullets: [
      "Full client record with adherence and progress",
      "Programme and nutrition snapshot at the top",
      "Notes, bookings and payments in the same view",
      "Lifetime value and renewal date surfaced",
    ],
    mockup: { device: "laptop", src: "/dashboard/clients", title: "Client record preview" },
  },
];

export function PillarTabs() {
  return (
    <Tabs defaultValue="programmes" className="w-full">
      <TabsList className="mb-8 inline-flex h-auto flex-wrap gap-1 rounded-full border border-reps-border bg-reps-panel/60 p-1">
        {TABS.map((t) => (
          <TabsTrigger
            key={t.value}
            value={t.value}
            className="rounded-full px-4 py-2 text-[13px] font-semibold text-white/70 data-[state=active]:bg-reps-orange data-[state=active]:text-white"
          >
            <t.icon className="mr-1.5 inline h-3.5 w-3.5" />
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {TABS.map((t) => (
        <TabsContent key={t.value} value={t.value} className="mt-0">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <MockupStage variant={t.mockup.device}>
              <DeviceMockup {...t.mockup} />
            </MockupStage>
            <div>
              <h3 className="font-display text-[26px] font-bold leading-tight text-white lg:text-[32px]">
                {t.title}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-white/70">{t.body}</p>
              <ul className="mt-4 space-y-2">
                {t.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-[14px] text-white/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                to="/features/coaching"
                className="mt-5 inline-flex items-center gap-1 text-[14px] font-semibold text-reps-orange hover:underline"
              >
                Explore Coaching <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
