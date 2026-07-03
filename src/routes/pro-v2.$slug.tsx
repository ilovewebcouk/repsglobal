import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Award,
  BadgeCheck,
  Bookmark,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Home,
  Laptop,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Umbrella,
  Users,
} from "lucide-react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { samplePro } from "@/components/pro-v2/sample-pro";

export const Route = createFileRoute("/pro-v2/$slug")({
  head: () => ({
    meta: [
      { title: "Pro Profile v2 — Design sandbox" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ProV2Page,
});

const SUB_NAV = [
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "reviews", label: "Reviews" },
  { id: "qualifications", label: "Qualifications" },
  { id: "location", label: "Location" },
];

function ProV2Page() {
  const pro = samplePro;

  return (
    <div className="min-h-screen bg-reps-ivory pb-24 lg:pb-0">
      <PublicHeader variant="solid" />

      {/* Sticky sub-nav */}
      <div className="sticky top-[64px] z-30 border-b border-reps-stone bg-reps-warm-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1320px] items-center gap-6 overflow-x-auto px-6 lg:px-10">
          {SUB_NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="whitespace-nowrap border-b-2 border-transparent py-4 text-[13px] font-medium text-reps-muted-light transition-colors hover:border-reps-orange hover:text-reps-charcoal"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>

      {/* HERO */}
      <section className="bg-reps-warm-white">
        <div className="mx-auto max-w-[1320px] px-6 py-10 lg:px-10 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[380px_1fr_320px] lg:gap-8">
            {/* Portrait */}
            <div className="relative block aspect-[4/5] overflow-hidden rounded-[24px] bg-reps-stone">
              <img
                src={pro.image}
                alt={`${pro.name} — ${pro.role}`}
                className="h-full w-full object-cover"
                width={760}
                height={950}
              />
            </div>

            {/* Info */}
            <div className="flex flex-col">
              {pro.verified ? (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  <BadgeCheck className="h-3 w-3" />
                  REPs Verified
                </span>
              ) : null}

              <h1 className="mt-3 font-display text-[44px] font-bold leading-[1.02] tracking-[-0.01em] text-reps-charcoal lg:text-[52px]">
                {pro.name}
              </h1>
              <div className="mt-1 text-[16px] text-reps-muted-light">{pro.role}</div>

              <p className="mt-4 max-w-[560px] text-[15px] leading-relaxed text-reps-muted-light">
                {pro.tagline}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px]">
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-reps-orange text-reps-orange" />
                  <span className="font-semibold text-reps-charcoal">
                    {pro.reviews.rating.toFixed(1)}
                  </span>
                  <span className="text-reps-muted-light">
                    Based on {pro.reviews.count} verified reviews
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-reps-charcoal">
                  <MapPin className="h-4 w-4 text-reps-muted-light" />
                  {pro.location}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {pro.modes.inPerson ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-reps-stone bg-reps-warm-white px-3 py-1 text-[12px] font-medium text-reps-charcoal">
                    <Home className="h-3.5 w-3.5" />
                    At Home
                  </span>
                ) : null}
                {pro.modes.online ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-reps-stone bg-reps-warm-white px-3 py-1 text-[12px] font-medium text-reps-charcoal">
                    <Laptop className="h-3.5 w-3.5" />
                    Online Coaching
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-reps-stone bg-reps-warm-white px-3 py-1 text-[12px] font-medium text-reps-charcoal">
                  <MapPin className="h-3.5 w-3.5" />
                  {pro.city} & Surrounding Areas
                </span>
              </div>
            </div>

            {/* Get in touch card */}
            <aside className="lg:sticky lg:top-32 lg:self-start">
              <div className="rounded-[18px] border border-reps-stone bg-reps-warm-white p-5">
                <div className="text-[13px] font-semibold uppercase tracking-wider text-reps-muted-light">
                  Get in touch
                </div>
                <div className="mt-3 font-display text-[22px] font-bold leading-tight text-reps-charcoal">
                  Send {pro.firstName} an enquiry
                </div>

                <dl className="mt-4 space-y-2.5 text-[13px]">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-reps-muted-light">Last active</dt>
                    <dd className="font-medium text-reps-charcoal">{pro.lastActive}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-reps-muted-light">Response rate</dt>
                    <dd className="font-medium text-reps-charcoal">{pro.responseRate}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-reps-muted-light">Verified pro</dt>
                    <dd className="font-medium text-reps-charcoal">
                      {pro.verified ? "Yes" : "Pending"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5 flex flex-col gap-2.5">
                  <button
                    type="button"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white transition-colors hover:bg-reps-orange-dark"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Send an enquiry
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border border-reps-stone bg-white px-6 text-[14px] font-semibold text-reps-charcoal transition-colors hover:bg-reps-ivory"
                  >
                    <Bookmark className="h-4 w-4" />
                    Save profile
                  </button>
                </div>

                <p className="mt-4 text-center text-[11px] text-reps-muted-light">
                  Contact details shared once your enquiry is accepted.
                </p>
              </div>
            </aside>
          </div>

          {/* Trust strip */}
          <div className="mt-8 grid grid-cols-2 gap-4 rounded-[16px] border border-reps-stone bg-reps-warm-white p-4 sm:grid-cols-4 lg:p-5">
            <TrustItem icon={ShieldCheck} title="REPS Verified" sub="Qualified & insured" />
            <TrustItem icon={Award} title="Qualifications Checked" sub="Checked Jun 2026" />
            <TrustItem icon={Umbrella} title="Professional Indemnity" sub="Active until 12 Mar 2027" />
            <TrustItem icon={Calendar} title="Member since" sub={pro.memberSince} />
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="border-t border-reps-stone bg-reps-ivory">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <SectionHeader eyebrow="About" title={`Meet ${pro.firstName}`} />
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px] lg:gap-14">
            <div className="space-y-5 text-[16px] leading-relaxed text-reps-charcoal/85">
              {pro.about.map((para) => (
                <p key={para}>{para}</p>
              ))}
            </div>
            <aside className="rounded-[18px] border border-reps-stone bg-reps-warm-white p-6 lg:self-start">
              <div className="text-[12px] font-semibold uppercase tracking-wider text-reps-muted-light">
                At a glance
              </div>
              <dl className="mt-4 space-y-4">
                {pro.atAGlance.map((stat) => (
                  <div key={stat.label} className="flex items-baseline justify-between gap-3 border-b border-reps-stone/60 pb-3 last:border-0 last:pb-0">
                    <dt className="text-[13px] text-reps-muted-light">{stat.label}</dt>
                    <dd className="font-display text-[20px] font-bold text-reps-charcoal">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </aside>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="border-t border-reps-stone bg-reps-warm-white">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <SectionHeader
            eyebrow="Services"
            title="Ways to train with me"
            sub="Every plan is written by hand and priced per session — no lock-ins."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {pro.services.map((service) => (
              <div
                key={service.name}
                className={`relative flex flex-col rounded-[18px] border bg-reps-ivory p-6 ${
                  service.popular
                    ? "border-reps-orange shadow-[0_0_0_1px_var(--reps-orange)]"
                    : "border-reps-stone"
                }`}
              >
                {service.popular ? (
                  <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-reps-orange px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    <Sparkles className="h-3 w-3" />
                    Most popular
                  </span>
                ) : null}
                <h3 className="font-display text-[22px] font-bold text-reps-charcoal">
                  {service.name}
                </h3>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="font-display text-[32px] font-bold text-reps-charcoal">
                    {service.price}
                  </span>
                  <span className="text-[13px] text-reps-muted-light">{service.unit}</span>
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-reps-muted-light">
                  {service.description}
                </p>
                <ul className="mt-4 space-y-2">
                  {service.includes.map((line) => (
                    <li key={line} className="flex items-start gap-2 text-[13.5px] text-reps-charcoal/85">
                      <Check className="mt-0.5 h-4 w-4 flex-none text-reps-orange" />
                      {line}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={`mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-[10px] px-5 text-[13.5px] font-semibold transition-colors ${
                    service.popular
                      ? "bg-reps-orange text-white hover:bg-reps-orange-dark"
                      : "border border-reps-stone bg-reps-warm-white text-reps-charcoal hover:bg-reps-ivory"
                  }`}
                >
                  Enquire about this
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO I HELP + SPECIALISMS */}
      <section className="border-t border-reps-stone bg-reps-ivory">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <SectionHeader eyebrow="Who I work with" title="I'm probably a good fit if you're…" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {pro.whoIHelp.map((item) => (
              <div key={item.title} className="rounded-[18px] border border-reps-stone bg-reps-warm-white p-6">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-reps-orange/10 text-reps-orange">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-[18px] font-bold text-reps-charcoal">
                  {item.title}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-reps-muted-light">
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-[18px] border border-reps-stone bg-reps-warm-white p-6">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-reps-muted-light">
              Specialisms
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {pro.specialisms.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-reps-stone bg-reps-ivory px-3 py-1 text-[13px] font-medium text-reps-charcoal"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* QUALIFICATIONS */}
      <section id="qualifications" className="border-t border-reps-stone bg-reps-warm-white">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <SectionHeader
            eyebrow="Credentials"
            title="Qualifications & insurance"
            sub="Every credential below has been checked by the REPs team."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {pro.qualifications.map((q) => (
              <div
                key={q.name}
                className="flex items-start justify-between gap-4 rounded-[18px] border border-reps-stone bg-reps-ivory p-5"
              >
                <div>
                  <div className="font-display text-[16px] font-bold text-reps-charcoal">
                    {q.name}
                  </div>
                  <div className="mt-1 text-[13px] text-reps-muted-light">
                    {q.body} · {q.year}
                    {q.expires ? ` · expires ${q.expires}` : ""}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  <BadgeCheck className="h-3 w-3" />
                  {q.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROOF */}
      <section className="border-t border-reps-stone bg-reps-ivory">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <SectionHeader eyebrow="Client results" title="Real outcomes from real clients" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {pro.proofs.map((p) => (
              <div key={p.headline} className="flex flex-col rounded-[18px] border border-reps-stone bg-reps-warm-white p-6">
                <div className="font-display text-[32px] font-bold leading-none text-reps-orange">
                  {p.metric}
                </div>
                <h3 className="mt-3 font-display text-[17px] font-bold leading-tight text-reps-charcoal">
                  {p.headline}
                </h3>
                <p className="mt-3 text-[14px] leading-relaxed text-reps-muted-light">
                  {p.body}
                </p>
                <div className="mt-4 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-reps-muted-light">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-reps-orange/10 text-[11px] font-bold text-reps-orange">
                    {p.initials}
                  </span>
                  Verified client
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="border-t border-reps-stone bg-reps-warm-white">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <SectionHeader eyebrow="Reviews" title={`${pro.reviews.count} verified reviews`} />
          <div className="mt-10 grid gap-10 lg:grid-cols-[320px_1fr] lg:gap-14">
            <aside className="rounded-[18px] border border-reps-stone bg-reps-ivory p-6 lg:self-start">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[52px] font-bold leading-none text-reps-charcoal">
                  {pro.reviews.rating.toFixed(1)}
                </span>
                <span className="text-[14px] text-reps-muted-light">/ 5</span>
              </div>
              <div className="mt-2 flex items-center gap-0.5 text-reps-orange">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <div className="mt-1 text-[13px] text-reps-muted-light">
                Based on {pro.reviews.count} verified reviews
              </div>
              <div className="mt-5 space-y-2">
                {pro.reviews.distribution.map((row) => {
                  const pct = (row.count / pro.reviews.count) * 100;
                  return (
                    <div key={row.stars} className="flex items-center gap-3 text-[12px]">
                      <span className="w-4 text-reps-muted-light">{row.stars}</span>
                      <Star className="h-3 w-3 fill-reps-orange text-reps-orange" />
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-reps-stone">
                        <div
                          className="h-full bg-reps-orange"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-reps-muted-light">{row.count}</span>
                    </div>
                  );
                })}
              </div>
            </aside>

            <div className="space-y-4">
              {pro.reviews.items.map((r) => (
                <div key={`${r.author}-${r.date}`} className="rounded-[18px] border border-reps-stone bg-reps-ivory p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-reps-orange/10 text-[13px] font-bold text-reps-orange">
                        {r.author[0]}
                      </div>
                      <div>
                        <div className="text-[14px] font-semibold text-reps-charcoal">{r.author}</div>
                        <div className="text-[12px] text-reps-muted-light">{r.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 text-reps-orange">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-reps-charcoal/85">
                    {r.body}
                  </p>
                </div>
              ))}
              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-reps-stone bg-reps-warm-white px-5 text-[13.5px] font-semibold text-reps-charcoal hover:bg-reps-ivory"
              >
                Read all {pro.reviews.count} reviews
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* LOCATION & AVAILABILITY */}
      <section id="location" className="border-t border-reps-stone bg-reps-ivory">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <SectionHeader eyebrow="Location & availability" title="Where and when we can train" />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="overflow-hidden rounded-[18px] border border-reps-stone bg-reps-warm-white">
              <div className="relative aspect-[16/10] w-full bg-[linear-gradient(135deg,#e9e2d6_0%,#d9cfb8_100%)]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full border border-reps-orange bg-reps-warm-white/90 px-4 py-2 text-[13px] font-semibold text-reps-charcoal shadow-sm">
                    <MapPin className="mr-1.5 inline h-4 w-4 text-reps-orange" />
                    {pro.city}
                  </div>
                </div>
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(0deg, transparent 0 40px, rgba(0,0,0,0.06) 40px 41px), repeating-linear-gradient(90deg, transparent 0 40px, rgba(0,0,0,0.06) 40px 41px)",
                  }}
                />
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-reps-stone p-5">
                <div>
                  <div className="text-[14px] font-semibold text-reps-charcoal">{pro.location}</div>
                  <div className="text-[13px] text-reps-muted-light">
                    Covers {pro.coverageRadiusKm} km radius
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-reps-stone bg-reps-ivory px-3 py-1 text-[12px] font-medium text-reps-charcoal">
                  <Clock className="h-3.5 w-3.5" />
                  Also online
                </span>
              </div>
            </div>

            <div className="rounded-[18px] border border-reps-stone bg-reps-warm-white p-6">
              <div className="text-[12px] font-semibold uppercase tracking-wider text-reps-muted-light">
                Typical availability
              </div>
              <div className="mt-4 grid grid-cols-[64px_1fr_1fr_1fr] gap-y-2 text-[13px]">
                <div />
                <div className="text-center text-[11px] font-semibold uppercase tracking-wider text-reps-muted-light">
                  AM
                </div>
                <div className="text-center text-[11px] font-semibold uppercase tracking-wider text-reps-muted-light">
                  PM
                </div>
                <div className="text-center text-[11px] font-semibold uppercase tracking-wider text-reps-muted-light">
                  Eve
                </div>
                {pro.availability.map((d) => (
                  <Fragment key={d.day}>
                    <div className="font-semibold text-reps-charcoal">{d.day}</div>
                    {(["morning", "afternoon", "evening"] as const).map((slot) => {
                      const on = d.slots.includes(slot);
                      return (
                        <div
                          key={`${d.day}-${slot}`}
                          className={`mx-auto flex h-8 w-full max-w-[72px] items-center justify-center rounded-[8px] text-[11px] font-semibold ${
                            on
                              ? "bg-reps-orange/15 text-reps-orange"
                              : "bg-reps-ivory text-reps-muted-light/60"
                          }`}
                        >
                          {on ? "Open" : "—"}
                        </div>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
              <p className="mt-5 text-[12px] text-reps-muted-light">
                Availability is a guide — send an enquiry for live slots.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-reps-stone bg-reps-warm-white">
        <div className="mx-auto max-w-[900px] px-6 py-16 lg:px-10 lg:py-20">
          <SectionHeader eyebrow="FAQ" title="Common questions" />
          <Accordion type="single" collapsible className="mt-8">
            {pro.faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`} className="border-reps-stone">
                <AccordionTrigger className="text-left text-[15.5px] font-semibold text-reps-charcoal hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-[14.5px] leading-relaxed text-reps-muted-light">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-reps-charcoal text-reps-warm-white">
        <div className="mx-auto max-w-[1320px] px-6 py-16 text-center lg:px-10 lg:py-20">
          <h2 className="font-display text-[32px] font-bold leading-tight lg:text-[42px]">
            Ready to train with {pro.firstName}?
          </h2>
          <p className="mx-auto mt-3 max-w-[540px] text-[15px] text-reps-warm-white/70">
            Send a quick enquiry — {pro.firstName} usually replies within 24 hours.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white transition-colors hover:bg-reps-orange-dark"
            >
              <MessageCircle className="h-4 w-4" />
              Send an enquiry
            </button>
            <Link
              to="/find-a-professional"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] border border-reps-warm-white/30 bg-transparent px-6 text-[14px] font-semibold text-reps-warm-white transition-colors hover:bg-reps-warm-white/10"
            >
              Browse other pros
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-reps-stone bg-reps-warm-white p-3 shadow-[0_-4px_16px_-8px_rgba(0,0,0,0.15)] lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-[12px] font-semibold text-reps-charcoal">{pro.name}</div>
            <div className="text-[11px] text-reps-muted-light">{pro.responseRate}</div>
          </div>
          <button
            type="button"
            className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-reps-orange px-5 text-[13.5px] font-semibold text-white"
          >
            <MessageCircle className="h-4 w-4" />
            Enquire
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="max-w-[720px]">
      <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-reps-orange">
        {eyebrow}
      </div>
      <h2 className="mt-2 font-display text-[30px] font-bold leading-[1.1] tracking-[-0.01em] text-reps-charcoal lg:text-[40px]">
        {title}
      </h2>
      {sub ? (
        <p className="mt-3 text-[15px] leading-relaxed text-reps-muted-light">{sub}</p>
      ) : null}
    </div>
  );
}

function TrustItem({
  icon: Icon,
  title,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-full bg-reps-orange/10 text-reps-orange">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-[13.5px] font-semibold text-reps-charcoal">{title}</div>
        <div className="text-[12.5px] text-reps-muted-light">{sub}</div>
      </div>
    </div>
  );
}
