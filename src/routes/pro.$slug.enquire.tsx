import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  BadgeCheck,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Laptop,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
  Star,
  Target,
  UserRound,
} from "lucide-react";

import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import proJames from "@/assets/pro-james.jpg";

/* ------------------------------------------------------------------ */
/* Route                                                               */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute("/pro/$slug/enquire")({
  head: ({ params }) => ({
    meta: [
      { title: `Send an enquiry — REPs` },
      {
        name: "description",
        content:
          "Send a private enquiry to a REPs-verified professional. Outline your goals, preferred session type and availability — they'll reply with a quote.",
      },
      { property: "og:title", content: "Send an enquiry — REPs" },
      { property: "og:description", content: "Enquire about coaching with a REPs-verified professional." },
      { property: "og:url", content: `/pro/${params.slug}/enquire` },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: `/pro/${params.slug}/enquire` }],
  }),
  component: EnquirePage,
});

/* ------------------------------------------------------------------ */
/* Static pro context (Phase 1)                                        */
/* ------------------------------------------------------------------ */

function getPro(slug: string) {
  const name = slug
    .split("-")
    .map((s) => s[0]?.toUpperCase() + s.slice(1))
    .join(" ");
  return {
    slug,
    name: name || "James Wilson",
    role: "Personal Trainer",
    city: "London",
    area: "Shoreditch",
    rating: 5.0,
    reviews: 128,
    mode: "In-person & Online" as const,
    image: proJames,
    responseTime: "Usually replies within 2 hours",
    typicalRate: "£60 / hour",
    languages: ["English"],
    services: [
      { id: "1to1", label: "1:1 Personal Training", desc: "60-min sessions, in-person at studio", price: "£60 / session" },
      { id: "block", label: "Strength Block (12 weeks)", desc: "24 sessions + programming + nutrition", price: "£1,380 total" },
      { id: "online", label: "Online Coaching", desc: "Bespoke programme, weekly check-ins, video form reviews", price: "£149 / month" },
      { id: "assess", label: "Discovery Consultation", desc: "30-min call to discuss goals — free, no commitment", price: "Free" },
    ],
  };
}

const GOALS = [
  "Lose body fat",
  "Build muscle",
  "Get stronger",
  "Improve health",
  "Sport-specific",
  "Pre / postnatal",
  "Rehab from injury",
  "Other",
];

const FREQUENCY = ["1x / week", "2x / week", "3x / week", "4+ / week", "Online only"];
const TIMEFRAME = ["This week", "Within 2 weeks", "This month", "Just exploring"];
const BUDGET = ["Under £50 / session", "£50–£80 / session", "£80–£120 / session", "£120+ / session", "Monthly online plan"];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function EnquirePage() {
  const { slug } = Route.useParams();
  const pro = getPro(slug);

  const [service, setService] = useState(pro.services[0].id);
  const [goals, setGoals] = useState<string[]>([GOALS[0], GOALS[1]]);

  return (
    <div className="min-h-screen bg-reps-ivory text-reps-charcoal">
      <PublicHeader variant="solid" />

      {/* Breadcrumb + back */}
      <div className="mx-auto max-w-[1320px] px-6 pt-6 lg:px-10">
        <Link
          to="/pro/$slug"
          params={{ slug }}
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-reps-muted-light hover:text-reps-charcoal"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back to {pro.name}'s profile
        </Link>
      </div>

      {/* Heading */}
      <section className="mx-auto max-w-[1320px] px-6 pb-8 pt-4 lg:px-10 lg:pb-12">
        <div className="grid items-end gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h1 className="font-display text-[34px] font-bold leading-[1.05] text-reps-charcoal lg:text-[44px]">
              Enquire about coaching with {pro.name}
            </h1>
            <p className="mt-3 max-w-[620px] text-[15px] leading-relaxed text-reps-muted-light">
              Tell {pro.name.split(" ")[0]} a bit about your goals, availability and budget — they'll reply privately with a clear quote and next steps.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-reps-muted-light lg:justify-end">
            <Lock className="h-3.5 w-3.5 text-reps-green" />
            Private to {pro.name.split(" ")[0]} · You won't be added to any mailing lists
          </div>
        </div>
      </section>

      {/* Form + summary */}
      <section className="mx-auto max-w-[1320px] px-6 pb-20 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* FORM */}
          <form className="flex flex-col gap-5">
            {/* Steps */}
            <div className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-reps-muted-light">
              <span className="flex size-6 items-center justify-center rounded-full bg-reps-orange text-white">1</span>
              <span className="text-reps-charcoal">Service</span>
              <span className="mx-1 h-px w-6 bg-reps-stone" />
              <span className="flex size-6 items-center justify-center rounded-full border border-reps-stone bg-reps-warm-white">2</span>
              <span>Your goals</span>
              <span className="mx-1 h-px w-6 bg-reps-stone" />
              <span className="flex size-6 items-center justify-center rounded-full border border-reps-stone bg-reps-warm-white">3</span>
              <span>Details</span>
            </div>

            {/* 1 — Service */}
            <FormCard
              step="1"
              title="What kind of coaching are you interested in?"
              hint="Choose what fits best — you can fine-tune in the message."
            >
              <RadioGroup
                value={service}
                onValueChange={setService}
                className="grid gap-3 sm:grid-cols-2"
              >
                {pro.services.map((s) => {
                  const checked = service === s.id;
                  return (
                    <label
                      key={s.id}
                      htmlFor={`service-${s.id}`}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-[16px] border bg-reps-ivory p-4 transition-colors",
                        checked
                          ? "border-reps-orange bg-reps-orange/5"
                          : "border-reps-stone hover:border-reps-orange",
                      )}
                    >
                      <RadioGroupItem
                        id={`service-${s.id}`}
                        value={s.id}
                        className="mt-1 border-reps-stone text-reps-orange data-[state=checked]:border-reps-orange"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[14px] font-semibold text-reps-charcoal">{s.label}</span>
                          <span className="shrink-0 text-[12px] font-semibold text-reps-orange">{s.price}</span>
                        </div>
                        <p className="mt-0.5 text-[12.5px] leading-snug text-reps-muted-light">{s.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </RadioGroup>
            </FormCard>

            {/* 2 — Goals */}
            <FormCard
              step="2"
              title="What are you hoping to achieve?"
              hint="Pick up to three. Helps your coach prep a useful first reply."
            >
              <ToggleGroup
                type="multiple"
                value={goals}
                onValueChange={(v) => setGoals(v.slice(0, 3))}
                className="flex flex-wrap justify-start gap-2"
              >
                {GOALS.map((g) => (
                  <ToggleGroupItem
                    key={g}
                    value={g}
                    aria-label={g}
                    className={cn(
                      "h-auto rounded-full border border-reps-stone bg-reps-ivory px-3.5 py-1.5 text-[13px] font-medium text-reps-charcoal hover:border-reps-orange hover:bg-reps-ivory hover:text-reps-charcoal",
                      "data-[state=on]:border-reps-orange data-[state=on]:bg-reps-orange/10 data-[state=on]:text-reps-orange",
                    )}
                  >
                    {g}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <SelectField label="Frequency" icon={Target} options={FREQUENCY} defaultValue={FREQUENCY[0]} />
                <SelectField label="Start by" icon={Calendar} options={TIMEFRAME} defaultValue={TIMEFRAME[0]} />
                <SelectField label="Budget guide" icon={Clock} options={BUDGET} defaultValue={BUDGET[0]} />
              </div>
            </FormCard>

            {/* 3 — Message + details */}
            <FormCard
              step="3"
              title="Send your message"
              hint="Be as specific as you like — training history, injuries, anything relevant."
            >
              <Textarea
                rows={6}
                placeholder={`Hi ${pro.name.split(" ")[0]} — I'm hoping to build strength after a long break from the gym. I can train two evenings a week and I'm based in central ${pro.city}. Would love to hear about your strength block.`}
                className="w-full rounded-[12px] border-reps-stone bg-reps-ivory px-4 py-3 text-[14px] leading-relaxed text-reps-charcoal placeholder:text-reps-muted-light focus-visible:border-reps-orange focus-visible:ring-0"
              />

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <InputField label="Your name" icon={UserRound} type="text" placeholder="Full name" />
                <InputField label="Email" icon={Mail} type="email" placeholder="you@example.com" />
                <InputField label="Phone (optional)" icon={Phone} type="tel" placeholder="+44 7…" />
                <InputField
                  label="Your area / postcode"
                  icon={MapPin}
                  type="text"
                  placeholder={`e.g. EC2A — central ${pro.city}`}
                />
              </div>

              <label className="mt-5 flex items-start gap-2.5 text-[12.5px] text-reps-muted-light">
                <Checkbox
                  id="terms"
                  defaultChecked
                  className="mt-0.5 border-reps-stone data-[state=checked]:border-reps-orange data-[state=checked]:bg-reps-orange data-[state=checked]:text-white"
                />
                <span>
                  I agree to REPs'{" "}
                  <Link to="/terms" className="text-reps-charcoal underline">terms</Link> and{" "}
                  <Link to="/privacy" className="text-reps-charcoal underline">privacy policy</Link>. My enquiry will be sent privately to {pro.name}.
                </span>
              </label>
            </FormCard>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-[10px] border-reps-stone bg-reps-warm-white px-5 text-[13px] font-semibold text-reps-charcoal shadow-none hover:border-reps-orange hover:bg-reps-warm-white hover:text-reps-charcoal"
              >
                <Link to="/pro/$slug" params={{ slug }}>
                  <ChevronLeft data-icon="inline-start" />
                  Back to profile
                </Link>
              </Button>
              <Button
                type="button"
                className="h-11 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-dark"
              >
                <Send data-icon="inline-start" />
                Send enquiry to {pro.name.split(" ")[0]}
                <ChevronRight data-icon="inline-end" />
              </Button>
            </div>
          </form>

          {/* SUMMARY */}
          <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
            {/* Pro card */}
            <div className="overflow-hidden rounded-[22px] border border-reps-stone bg-reps-warm-white">
              <div className="flex items-center gap-4 p-5">
                <img
                  src={pro.image}
                  alt={pro.name}
                  className="size-16 rounded-[14px] object-cover"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-display text-[18px] font-bold leading-tight text-reps-charcoal">{pro.name}</h2>
                    <Badge
                      variant="outline"
                      className="gap-0.5 rounded-full border-reps-green/30 bg-reps-green/15 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-reps-green"
                    >
                      <BadgeCheck className="size-2.5" /> Verified
                    </Badge>
                  </div>
                  <div className="text-[12.5px] text-reps-muted-light">{pro.role}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-reps-muted-light">
                    <span className="flex items-center gap-1"><MapPin className="size-3" /> {pro.area}, {pro.city}</span>
                    <span className="flex items-center gap-1">
                      <Star className="size-3 fill-reps-orange text-reps-orange" />
                      <span className="font-semibold text-reps-orange">{pro.rating.toFixed(1)}</span>
                      <span>({pro.reviews})</span>
                    </span>
                    <span className="flex items-center gap-1"><Laptop className="size-3" /> {pro.mode}</span>
                  </div>
                </div>
              </div>
              <div className="border-t border-reps-stone bg-reps-ivory px-5 py-3 text-[12px] text-reps-muted-light">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-reps-green" />
                  {pro.responseTime}
                </div>
              </div>
            </div>

            {/* What happens next */}
            <div className="rounded-[22px] border border-reps-stone bg-reps-warm-white p-5">
              <h3 className="font-display text-[16px] font-bold text-reps-charcoal">What happens next</h3>
              <ol className="mt-4 flex flex-col gap-3">
                {[
                  { t: "You send this enquiry", d: "Your message lands privately in their REPs inbox." },
                  { t: "They reply with a quote", d: "Usually within a few hours — including price and availability." },
                  { t: "Book and pay through REPs", d: "Card payment is taken when you confirm — never before." },
                  { t: "Start training", d: "Sessions, programming and progress all tracked in one place." },
                ].map((s, i) => (
                  <li key={s.t} className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-reps-orange text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <div className="text-[13.5px] font-semibold text-reps-charcoal">{s.t}</div>
                      <p className="text-[12.5px] leading-snug text-reps-muted-light">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Trust */}
            <div className="rounded-[22px] border border-reps-stone bg-reps-warm-white p-5">
              <h3 className="font-display text-[16px] font-bold text-reps-charcoal">Booking on REPs is safe</h3>
              <ul className="mt-3 flex flex-col gap-2.5">
                {[
                  { i: ShieldCheck, t: "Identity, qualifications & insurance verified" },
                  { i: Lock, t: "Payments secured by REPs — never paid before you confirm" },
                  { i: CheckCircle2, t: "Refund protection on cancelled sessions" },
                ].map((x) => (
                  <li key={x.t} className="flex items-start gap-2.5 text-[12.5px] text-reps-charcoal">
                    <x.i className="mt-0.5 size-4 shrink-0 text-reps-orange" />
                    {x.t}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Form primitives                                                     */
/* ------------------------------------------------------------------ */

function FormCard({
  step,
  title,
  hint,
  children,
}: {
  step: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-reps-stone bg-reps-warm-white p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-reps-orange text-[12px] font-bold text-white">
          {step}
        </span>
        <div>
          <h2 className="font-display text-[18px] font-bold leading-tight text-reps-charcoal">{title}</h2>
          {hint && <p className="mt-0.5 text-[12.5px] text-reps-muted-light">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function SelectField({
  label,
  icon: Icon,
  options,
  defaultValue,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  options: string[];
  defaultValue: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-[12px] border border-reps-stone bg-reps-ivory px-3.5 py-2.5">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-reps-muted-light">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 shrink-0 text-reps-muted-light" />
        <Select defaultValue={defaultValue}>
          <SelectTrigger className="h-auto w-full border-0 bg-transparent p-0 text-[13px] font-normal text-reps-charcoal shadow-none focus:ring-0 focus-visible:ring-0 [&>svg]:size-3.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-[12px]">
            <SelectGroup>
              {options.map((o) => (
                <SelectItem key={o} value={o} className="text-[13px]">
                  {o}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function InputField({
  label,
  icon: Icon,
  type,
  placeholder,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  type: string;
  placeholder: string;
}) {
  return (
    <label className="flex flex-col gap-1 rounded-[12px] border border-reps-stone bg-reps-ivory px-3.5 py-2.5">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-reps-muted-light">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 shrink-0 text-reps-muted-light" />
        <Input
          type={type}
          placeholder={placeholder}
          className="h-auto w-full border-0 bg-transparent p-0 text-[13px] text-reps-charcoal shadow-none placeholder:text-reps-muted-light focus-visible:ring-0"
        />
      </div>
    </label>
  );
}
