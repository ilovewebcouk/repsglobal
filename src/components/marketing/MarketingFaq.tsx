import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionEyebrow } from "./SectionEyebrow";
import { SectionHeading } from "./SectionHeading";

interface FaqItem {
  q: string;
  a: React.ReactNode;
}

interface MarketingFaqProps {
  eyebrow?: string;
  heading: React.ReactNode;
  items: FaqItem[];
}

/**
 * Canonical marketing FAQ block.
 * Bare Accordion in a 920px column — no Card wrapper. Matches /specialisms exactly.
 */
export function MarketingFaq({
  eyebrow = "FAQ",
  heading,
  items,
}: MarketingFaqProps) {
  return (
    <section className="border-b border-reps-border bg-reps-ink">
      <div className="mx-auto max-w-[920px] px-6 py-20 lg:px-10 lg:py-24">
        <SectionEyebrow>{eyebrow}</SectionEyebrow>
        <SectionHeading className="mt-3">{heading}</SectionHeading>

        <Accordion type="single" collapsible className="mt-10">
          {items.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border-b border-reps-border"
            >
              <AccordionTrigger className="text-left text-[15.5px] font-semibold text-white hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-[14.5px] leading-relaxed text-white/75">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
