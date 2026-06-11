import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionEyebrow } from "./SectionEyebrow";
import { SectionHeading } from "./SectionHeading";
import { cn } from "@/lib/utils";

interface FaqItem {
  q: string;
  a: React.ReactNode;
}

interface MarketingFaqProps {
  eyebrow?: string;
  heading: React.ReactNode;
  items: FaqItem[];
  /**
   * Surface tone. "dark" (default) renders the canonical ink-surface FAQ
   * used on every feature/pillar page. "light" renders on warm-white for
   * homepage-style mixed-theme pages (e.g. /reviews).
   */
  tone?: "dark" | "light";
}

/**
 * Canonical marketing FAQ block.
 * Bare Accordion in a 920px column — no Card wrapper. Matches /specialisms exactly.
 */
export function MarketingFaq({
  eyebrow = "FAQ",
  heading,
  items,
  tone = "dark",
}: MarketingFaqProps) {
  const isLight = tone === "light";

  return (
    <section className={isLight ? "bg-reps-warm-white" : "bg-reps-ink"}>
      <div className="mx-auto max-w-[920px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionEyebrow>{eyebrow}</SectionEyebrow>
        <SectionHeading className={cn("mt-3", isLight && "text-reps-ink")}>
          {heading}
        </SectionHeading>

        <Accordion type="single" collapsible className="mt-10">
          {items.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className={cn(
                "border-b",
                isLight ? "border-reps-stone" : "border-reps-border",
              )}
            >
              <AccordionTrigger
                className={cn(
                  "text-left text-[15.5px] font-semibold hover:no-underline",
                  isLight ? "text-reps-ink" : "text-white",
                )}
              >
                {f.q}
              </AccordionTrigger>
              <AccordionContent
                className={cn(
                  "text-[14.5px] leading-relaxed",
                  isLight ? "text-reps-muted-light" : "text-white/75",
                )}
              >
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
