import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ = [
  {
    q: "Do I get locked in? Can I export my client data?",
    a: "No lock-in. You can export your full client list, programmes, check-ins and payment history as CSV any time — your data stays yours.",
  },
  {
    q: "I'm already on Trainerize / MyPTHub / PT Distinction. How do I switch?",
    a: "Bring a CSV of clients and your programmes — we'll help you import. Your Stripe stays connected to your account; nothing moves unless you say so.",
  },
  {
    q: "Does REPs take a cut of my bookings or sessions?",
    a: "No. Every feature in your tier is included — no per-booking commission, no transaction surcharge, no paid add-ons. You keep what your clients pay you.",
  },
  {
    q: "Do my clients need to download an app?",
    a: "No. The client portal works on the web — they open a link, log in, and see today's session, this week's targets and their last message. They can install it as a home-screen app if they want to.",
  },
  {
    q: "How does the Verified badge actually work?",
    a: "We check qualifications, insurance and CPD against the underlying register. Verified pros are surfaced higher in public search and carry the badge on every profile and review.",
  },
  {
    q: "What does the AI do — and what stays with me?",
    a: "AI drafts work: programmes from a brief, replies to leads, summaries of check-ins, risk flags, the Monday Next Move card. You review, edit and send. You stay the coach.",
  },
];

export function ForProsFaq() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {FAQ.map((f, i) => (
        <AccordionItem key={f.q} value={`q-${i}`} className="border-reps-border">
          <AccordionTrigger className="text-left text-[15px] font-semibold text-white hover:no-underline [&>svg]:text-white/60">
            {f.q}
          </AccordionTrigger>
          <AccordionContent className="text-[14px] leading-relaxed text-white/70">
            {f.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
