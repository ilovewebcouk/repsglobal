import { MockupStage } from "./MockupStage";
import { DeviceMockup, type DeviceMockupProps } from "./DeviceMockup";
import { cn } from "@/lib/utils";

export type Callout = {
  /** CSS top, e.g. "12%" */
  y: string;
  /** CSS left, e.g. "18%" */
  x: string;
  /** Headline shown next to the number in the legend. */
  title: string;
  /** Single sentence — keep under ~110 chars. */
  body: string;
};

interface AnnotatedMockProps {
  mockup: DeviceMockupProps;
  callouts: Callout[];
  /** Legend position relative to the device. Default "right" on lg. */
  legend?: "right" | "below";
  className?: string;
}

/**
 * Canonical "anatomy" primitive — a live REPs route inside a device frame
 * with numbered orange pills anchored over key UI areas and a matching
 * legend column. Use to teach the reader what each part of a screen does.
 *
 * Rules:
 *  - Max 6 callouts per mock. More = noise.
 *  - Never place a pill over a face or critical text — anchor to whitespace
 *    or a clean corner of the target element.
 *  - x / y are percentages of the device frame so the layout is fluid.
 */
export function AnnotatedMock({
  mockup,
  callouts,
  legend = "right",
  className,
}: AnnotatedMockProps) {
  return (
    <div
      className={cn(
        "grid items-center gap-10 lg:gap-14",
        legend === "right" ? "lg:grid-cols-[1.1fr_0.9fr]" : "lg:grid-cols-1",
        className,
      )}
    >
      <div className="relative">
        <MockupStage variant={mockup.device}>
          <DeviceMockup {...mockup} />
        </MockupStage>
        {/* Pin overlay — positioned within the stage padding box */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
          {callouts.map((c, i) => (
            <span
              key={i}
              className="absolute hidden h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-reps-orange text-[12px] font-bold text-white shadow-[0_6px_16px_-4px_rgba(255,122,0,0.55)] ring-2 ring-reps-ink sm:inline-flex"
              style={{ top: c.y, left: c.x }}
            >
              {i + 1}
            </span>
          ))}
        </div>
      </div>

      <ol className="space-y-4">
        {callouts.map((c, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-[16px] border border-reps-border bg-reps-panel/60 p-4"
          >
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-reps-orange-soft text-[12px] font-bold text-reps-orange">
              {i + 1}
            </span>
            <div>
              <p className="text-[14.5px] font-semibold text-white">{c.title}</p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-white/70">{c.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
