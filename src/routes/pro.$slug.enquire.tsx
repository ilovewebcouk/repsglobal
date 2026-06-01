import { createFileRoute, Link } from "@tanstack/react-router";
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
              Tell {pro.name.split(" ")[0]} a bit about your goals, availability and budget. They'll reply privately with a clear quote and next steps — no payment until you accept.
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
          <form className="space-y-5">
            {/* Steps */}
            <div className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-reps-muted-light">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-reps-orange text-white">1</span>
              <span className="text-reps-charcoal">Service</span>
              <span className="mx-1 h-px w-6 bg-reps-stone" />
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-reps-stone bg-reps-warm-white">2</span>
              <span>Your goals</span>
              <span className="mx-1 h-px w-6 bg-reps-stone" />
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-reps-stone bg-reps-warm-white">3</span>
              <span>Details</span>
            </div>

            {/* 1 — Service */}
            <FormCard
              step="1"
              title="What kind of coaching are you interested in?"
              hint="Choose what fits best — you can fine-tune in the message."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {pro.services.map((s, i) => (
                  <label
                    key={s.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-[16px] border bg-reps-ivory p-4 transition-colors ${
                      i === 0 ? "border-reps-orange bg-reps-orange/5" : "border-reps-stone hover:border-reps-orange"
                    }`}
                  >
                    <input
                      type="radio"
                      name="service"
                      defaultChecked={i === 0}
                      className="mt-1 h-4 w-4 accent-reps-orange"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[14px] font-semibold text-reps-charcoal">{s.label}</span>
                        <span className="shrink-0 text-[12px] font-semibold text-reps-orange">{s.price}</span>
                      </div>
                      <p className="mt-0.5 text-[12.5px] leading-snug text-reps-muted-light">{s.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </FormCard>

            {/* 2 — Goals */}
            <FormCard
              step="2"
              title="What are you hoping to achieve?"
              hint="Pick up to three. Helps your coach prep a useful first reply."
            >
              <div className="flex flex-wrap gap-2">
                {GOALS.map((g, i) => (
                  <label
                    key={g}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium ${
                      i < 2
                        ? "border-reps-orange bg-reps-orange/10 text-reps-orange"
                        : "border-reps-stone bg-reps-ivory text-reps-charcoal hover:border-reps-orange"
                    }`}
                  >
                    <input type="checkbox" defaultChecked={i < 2} className="h-3.5 w-3.5 accent-reps-orange" />
                    {g}
                  </label>
                ))}
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <Field label="Frequency" icon={Target}>
                  <select className="w-full bg-transparent text-[13px] text-reps-charcoal focus:outline-none">
                    {FREQUENCY.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </Field>
                <Field label="Start by" icon={Calendar}>
                  <select className="w-full bg-transparent text-[13px] text-reps-charcoal focus:outline-none">
                    {TIMEFRAME.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </Field>
                <Field label="Budget guide" icon={Clock}>
                  <select className="w-full bg-transparent text-[13px] text-reps-charcoal focus:outline-none">
                    {BUDGET.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </Field>
              </div>
            </FormCard>

            {/* 3 — Message + details */}
            <FormCard
              step="3"
              title="Send your message"
              hint="Be as specific as you like — training history, injuries, anything relevant."
            >
              <textarea
                rows={6}
                placeholder={`Hi ${pro.name.split(" ")[0]} — I'm hoping to build strength after a long break from the gym. I can train two evenings a week and I'm based in central ${pro.city}. Would love to hear about your strength block.`}
                className="w-full rounded-[12px] border border-reps-stone bg-reps-ivory px-4 py-3 text-[14px] leading-relaxed text-reps-charcoal placeholder:text-reps-muted-light focus:border-reps-orange focus:outline-none"
              />

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Your name" icon={UserRound}>
                  <input
                    type="text"
                    placeholder="Full name"
                    className="w-full bg-transparent text-[13px] text-reps-charcoal placeholder:text-reps-muted-light focus:outline-none"
                  />
                </Field>
                <Field label="Email" icon={Mail}>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full bg-transparent text-[13px] text-reps-charcoal placeholder:text-reps-muted-light focus:outline-none"
                  />
                </Field>
                <Field label="Phone (optional)" icon={Phone}>
                  <input
                    type="tel"
                    placeholder="+44 7…"
                    className="w-full bg-transparent text-[13px] text-reps-charcoal placeholder:text-reps-muted-light focus:outline-none"
                  />
                </Field>
                <Field label="Your area / postcode" icon={MapPin}>
                  <input
                    type="text"
                    placeholder={`e.g. EC2A — central ${pro.city}`}
                    className="w-full bg-transparent text-[13px] text-reps-charcoal placeholder:text-reps-muted-light focus:outline-none"
                  />
                </Field>
              </div>

              <label className="mt-5 flex items-start gap-2.5 text-[12.5px] text-reps-muted-light">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-reps-orange" defaultChecked />
                <span>
                  I agree to REPs' <Link to="/terms" className="text-reps-charcoal underline">terms</Link> and{" "}
                  <Link to="/privacy" className="text-reps-charcoal underline">privacy policy</Link>. My enquiry will be sent privately to {pro.name}.
                </span>
              </label>
            </FormCard>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                to="/pro/$slug"
                params={{ slug }}
                className="inline-flex h-11 items-center gap-1 rounded-[10px] border border-reps-stone bg-reps-warm-white px-5 text-[13px] font-semibold text-reps-charcoal hover:border-reps-orange"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Back to profile
              </Link>
              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-dark"
              >
                <Send className="h-4 w-4" />
                Send enquiry to {pro.name.split(" ")[0]}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* SUMMARY */}
          <aside className="space-y-5">
            {/* Pro card */}
            <div className="overflow-hidden rounded-[22px] border border-reps-stone bg-reps-warm-white">
              <div className="flex items-center gap-4 p-5">
                <img
                  src={pro.image}
                  alt={pro.name}
                  className="h-16 w-16 rounded-full object-cover"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-display text-[18px] font-bold leading-tight text-reps-charcoal">{pro.name}</h2>
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-reps-green/15 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-reps-green ring-1 ring-reps-green/30">
                      <BadgeCheck className="h-2.5 w-2.5" /> Verified
                    </span>
                  </div>
                  <div className="text-[12.5px] text-reps-muted-light">{pro.role}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-reps-muted-light">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {pro.area}, {pro.city}</span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-reps-orange text-reps-orange" />
                      <span className="font-semibold text-reps-orange">{pro.rating.toFixed(1)}</span>
                      <span>({pro.reviews})</span>
                    </span>
                    <span className="flex items-center gap-1"><Laptop className="h-3 w-3" /> {pro.mode}</span>
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
              <ol className="mt-4 space-y-3">
                {[
                  { t: "You send this enquiry", d: "Your message lands privately in their REPs inbox." },
                  { t: "They reply with a quote", d: "Usually within a few hours — including price and availability." },
                  { t: "Book and pay through REPs", d: "Card payment is taken when you confirm — never before." },
                  { t: "Start training", d: "Sessions, programming and progress all tracked in one place." },
                ].map((s, i) => (
                  <li key={s.t} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-reps-orange text-[11px] font-bold text-white">
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
              <ul className="mt-3 space-y-2.5">
                {[
                  { i: ShieldCheck, t: "Identity, qualifications & insurance verified" },
                  { i: Lock, t: "Payments secured by REPs — never paid before you confirm" },
                  { i: CheckCircle2, t: "Refund protection on cancelled sessions" },
                ].map((x) => (
                  <li key={x.t} className="flex items-start gap-2.5 text-[12.5px] text-reps-charcoal">
                    <x.i className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
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
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-reps-orange text-[12px] font-bold text-white">
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

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 rounded-[12px] border border-reps-stone bg-reps-ivory px-3.5 py-2.5">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-reps-muted-light">
        {label}
      </span>
      <span className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 shrink-0 text-reps-muted-light" />
        {children}
      </span>
    </label>
  );
}
