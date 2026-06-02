import * as React from "react";
import {
  Dumbbell,
  Apple,
  ClipboardCheck,
  Inbox,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

const CAPS = [
  {
    icon: Dumbbell,
    title: "AI Programme Writer",
    body: "Describe the client, get a draft 12-week plan with video demos. Tweak and publish.",
  },
  {
    icon: Apple,
    title: "AI Nutrition Planner",
    body: "Macro targets and meal plans from goal, allergies and food preferences in seconds.",
  },
  {
    icon: ClipboardCheck,
    title: "AI Check-in Summariser",
    body: '"Maya is plateauing — drop volume 10%, push protein." Read all six check-ins in one card.',
  },
  {
    icon: Inbox,
    title: "AI Lead Reply",
    body: "Every enquiry scored and answered with a tailored first-draft, ready in your inbox.",
  },
  {
    icon: AlertTriangle,
    title: "AI Risk Alerts",
    body: "Spots the client whose adherence is sliding and tells you who to message — before they ghost.",
  },
  {
    icon: Sparkles,
    title: "Monday Next-Move Card",
    body: "The single highest-leverage action this week — which package to push, which day to open up.",
  },
];

export function AICapabilities() {
  return (
    <div>
      <div className="grid items-end gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
            AI · Your business on autopilot
          </span>
          <h2 className="mt-2 font-display text-[34px] font-bold leading-tight text-white lg:text-[46px]">
            An AI coach for your coaching business.
          </h2>
          <p className="mt-4 max-w-[620px] text-[15.5px] leading-relaxed text-white/70">
            Trainerize, MyPTHub and PT Distinction give you forms to fill in. REPs writes the
            programme, drafts the nutrition plan, summarises the check-in, prioritises the
            lead, flags the at-risk client and tells you the one move that will grow your
            month. You stay the coach. The admin runs itself.
          </p>
        </div>
        <div className="rounded-[22px] border border-reps-orange-border bg-reps-orange-soft p-7">
          <div className="font-display text-[56px] font-bold leading-none text-reps-orange">
            +24%
          </div>
          <div className="mt-2 text-[12px] font-semibold uppercase tracking-wider text-white/70">
            Average revenue YoY
          </div>
          <p className="mt-4 text-[14px] leading-relaxed text-white/85">
            "The Monday 'next move' card is like having a business coach on tap. Single
            best feature."
          </p>
          <div className="mt-3 text-[11.5px] text-white/55">
            Marcus Bell · Online Coach · Leeds
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {CAPS.map((c) => (
          <div
            key={c.title}
            className="rounded-[18px] border border-reps-border bg-reps-panel p-6"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
              <c.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display text-[17px] font-bold text-white">
              {c.title}
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
