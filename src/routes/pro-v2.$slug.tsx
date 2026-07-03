import { Fragment, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
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
  const activeSection = useScrollSpy(SUB_NAV.map((s) => s.id));

  return (
    <div className="min-h-screen bg-reps-ivory pb-24 lg:pb-0">
      <PublicHeader variant="solid" />

      {/* Sticky sub-nav */}
      <div className="sticky top-[64px] z-30 border-b border-reps-stone bg-reps-warm-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1320px] items-center gap-6 overflow-x-auto px-6 lg:px-10">
          {SUB_NAV.map((item) => {
            const active = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={active ? "true" : undefined}
                className={`whitespace-nowrap border-b-2 py-4 text-[13px] font-medium transition-colors ${
                  active
                    ? "border-reps-orange text-reps-charcoal"
                    : "border-transparent text-reps-muted-light hover:border-reps-orange/60 hover:text-reps-charcoal"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      </div>

      {/* HERO */}
      <section className="bg-reps-warm-white">
        <div className="mx-auto max-w-[1320px] px-6 py-10 lg:px-10 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[380px_1fr_320px] lg:gap-8">
            {/* Portrait */}
            <div className="relative block aspect-[4/5] overflow-hidden rounded-[24px] bg-reps-stone shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)] ring-1 ring-black/5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
              <img
                src={pro.image}
                alt={`${pro.name} — ${pro.role}`}
                className="h-full w-full object-cover"
                width={760}
                height={950}
              />
            </div>

            {/* Info */}
            <div className="flex flex-col motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500" style={{ animationDelay: "80ms" }}>
              <div className="flex items-center gap-2">
                <span className="block h-[2px] w-6 bg-reps-orange" aria-hidden="true" />
                {pro.verified ? (
                  <Badge className="border-emerald-400/30 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15">
                    <BadgeCheck data-icon="inline-start" />
                    REPs Verified
                  </Badge>
                ) : null}
              </div>

              <h1 className="mt-3 font-display text-[44px] font-bold leading-[1.02] tracking-[-0.01em] text-reps-charcoal lg:text-[52px]">
                {pro.name}
              </h1>
              <div className="mt-1 text-[15px] text-reps-muted-light">{pro.role}</div>

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
                  <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium">
                    <Home data-icon="inline-start" />
                    At Home
                  </Badge>
                ) : null}
                {pro.modes.online ? (
                  <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium">
                    <Laptop data-icon="inline-start" />
                    Online Coaching
                  </Badge>
                ) : null}
                <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium">
                  <MapPin data-icon="inline-start" />
                  {pro.city} & Surrounding Areas
                </Badge>
              </div>
            </div>

            {/* Get in touch card */}
            <aside className="lg:sticky lg:top-32 lg:self-start motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500" style={{ animationDelay: "160ms" }}>
              <Card className="rounded-[18px] border-reps-stone bg-reps-warm-white ring-1 ring-reps-orange/15">
                <CardHeader className="pb-3">
                  <div className="text-[13px] font-semibold uppercase tracking-wider text-reps-muted-light">
                    Get in touch
                  </div>
                  <CardTitle className="font-display text-[22px] font-bold leading-tight text-reps-charcoal">
                    Send {pro.firstName} an enquiry
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2.5 text-[13px]">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-reps-muted-light">Last active</dt>
                      <dd className="font-medium text-reps-charcoal">{pro.lastActive}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-reps-muted-light">Response rate</dt>
                      <dd className="font-medium text-reps-charcoal">{pro.responseRate}</dd>
                    </div>
                    <div className="text-[12px] text-reps-muted-light">
                      Usually replies in ~2 hours
                    </div>
                    <Separator className="my-1" />
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-reps-muted-light">Verified pro</dt>
                      <dd className="font-medium text-reps-charcoal">
                        {pro.verified ? "Yes" : "Pending"}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5 flex flex-col gap-2.5">
                    <Button
                      size="lg"
                      className="h-12 w-full rounded-[10px] bg-reps-orange text-white hover:bg-reps-orange-dark"
                    >
                      <MessageCircle data-icon="inline-start" />
                      Send an enquiry
                      <ChevronRight data-icon="inline-end" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="lg"
                      className="h-12 w-full rounded-[10px] text-reps-charcoal hover:bg-reps-ivory"
                    >
                      <Bookmark data-icon="inline-start" />
                      Save profile
                    </Button>
                  </div>

                  <p className="mt-4 text-center text-[11px] text-reps-muted-light">
                    Contact details shared once your enquiry is accepted.
                  </p>
                </CardContent>
              </Card>
            </aside>
          </div>

          {/* Trust strip */}
          <Card className="mt-8 rounded-[16px] border-reps-stone bg-reps-warm-white">
            <CardContent className="grid grid-cols-2 items-center gap-0 p-0 sm:grid-cols-4">
              <TrustItem icon={ShieldCheck} title="REPS Verified" sub="Qualified & insured" />
              <TrustCell>
                <TrustItem icon={Award} title="Qualifications Checked" sub="Checked Jun 2026" />
              </TrustCell>
              <TrustCell>
                <TrustItem icon={Umbrella} title="Professional Indemnity" sub="Active until 12 Mar 2027" />
              </TrustCell>
              <TrustCell>
                <TrustItem icon={Calendar} title="Member since" sub={pro.memberSince} />
              </TrustCell>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="scroll-mt-32 bg-reps-ivory">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <SectionHeader eyebrow="About" title={`Meet ${pro.firstName}`} />
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px] lg:gap-14">
            <div className="max-w-prose space-y-5 text-[16px] leading-relaxed text-reps-charcoal/85">
              {pro.about.map((para) => (
                <p key={para}>{para}</p>
              ))}
            </div>
            <Card className="rounded-[18px] border-reps-stone bg-reps-warm-white lg:self-start">
              <CardHeader className="pb-2">
                <div className="text-[12px] font-semibold uppercase tracking-wider text-reps-muted-light">
                  At a glance
                </div>
              </CardHeader>
              <CardContent>
                <dl>
                  {pro.atAGlance.map((stat, i) => (
                    <Fragment key={stat.label}>
                      {i > 0 ? <Separator className="my-3" /> : null}
                      <div className="flex items-baseline justify-between gap-3">
                        <dt className="text-[13px] text-reps-muted-light">{stat.label}</dt>
                        <dd className="font-display text-[20px] font-bold text-reps-charcoal">
                          {stat.value}
                        </dd>
                      </div>
                    </Fragment>
                  ))}
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="scroll-mt-32 bg-reps-warm-white">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <SectionHeader
            eyebrow="Services"
            title="Ways to train with me"
            sub="Every plan is written by hand and priced per session — no lock-ins."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {pro.services.map((service) => (
              <Card
                key={service.name}
                className={`relative flex flex-col rounded-[18px] bg-reps-ivory ${
                  service.popular
                    ? "border-reps-orange ring-2 ring-reps-orange/40 shadow-[0_20px_50px_-25px_rgba(255,122,0,0.4)]"
                    : "border-reps-stone"
                }`}
              >
                {service.popular ? (
                  <Badge className="absolute -top-3 left-6 gap-1 rounded-full bg-reps-orange px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-reps-orange">
                    <Sparkles data-icon="inline-start" />
                    Most popular
                  </Badge>
                ) : null}
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-[22px] font-bold text-reps-charcoal">
                    {service.name}
                  </CardTitle>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="font-display text-[32px] font-bold leading-none text-reps-charcoal">
                      {service.price}
                    </span>
                    <span className="text-[14px] text-reps-muted-light">{service.unit}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <p className="text-[14px] leading-relaxed text-reps-muted-light">
                    {service.description}
                  </p>
                  <ul className="mt-4 flex flex-col gap-2">
                    {service.includes.map((line) => (
                      <li key={line} className="flex items-start gap-2 text-[13.5px] text-reps-charcoal/85">
                        <Check className="mt-0.5 h-4 w-4 flex-none text-reps-orange" />
                        {line}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={service.popular ? "default" : "outline"}
                    className={`mt-6 h-11 rounded-[10px] ${
                      service.popular
                        ? "bg-reps-orange text-white hover:bg-reps-orange-dark"
                        : "border-reps-stone bg-reps-warm-white text-reps-charcoal hover:bg-reps-ivory"
                    }`}
                  >
                    Enquire about this
                    <ChevronRight data-icon="inline-end" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* WHO I HELP + SPECIALISMS */}
      <section className="bg-reps-ivory">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <SectionHeader eyebrow="Who I work with" title="I'm probably a good fit if you're…" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {pro.whoIHelp.map((item) => (
              <Card key={item.title} className="rounded-[18px] border-reps-stone bg-reps-warm-white">
                <CardContent className="pt-6">
                  <div className="inline-flex size-10 items-center justify-center rounded-full bg-reps-orange/10 text-reps-orange">
                    <Users className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-[18px] font-bold text-reps-charcoal">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-reps-muted-light">
                    {item.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-10 rounded-[18px] border-reps-stone bg-reps-warm-white">
            <CardContent className="pt-6">
              <div className="text-[12px] font-semibold uppercase tracking-wider text-reps-muted-light">
                Specialisms
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {pro.specialisms.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="rounded-full border-reps-stone bg-reps-ivory px-3 py-1 text-[13px] font-medium text-reps-charcoal"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* QUALIFICATIONS */}
      <section id="qualifications" className="scroll-mt-32 bg-reps-warm-white">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <SectionHeader
            eyebrow="Credentials"
            title="Qualifications & insurance"
            sub="Every credential below has been checked by the REPs team."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {pro.qualifications.map((q) => (
              <Card key={q.name} className="rounded-[18px] border-reps-stone bg-reps-ivory">
                <CardContent className="flex items-start justify-between gap-4 pt-5">
                  <div className="flex items-start gap-3">
                    <div className="inline-flex size-10 flex-none items-center justify-center rounded-full bg-reps-orange/10 text-reps-orange">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-display text-[16px] font-bold text-reps-charcoal">
                        {q.name}
                      </div>
                      <div className="mt-1 text-[13px] text-reps-muted-light">
                        {q.body} · {q.year}
                        {q.expires ? ` · expires ${q.expires}` : ""}
                      </div>
                    </div>
                  </div>
                  <Badge className="flex-none gap-1 border-emerald-400/30 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15">
                    <BadgeCheck data-icon="inline-start" />
                    {q.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PROOF */}
      <section className="bg-reps-ivory">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <SectionHeader eyebrow="Client results" title="Real outcomes from real clients" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {pro.proofs.map((p) => (
              <Card key={p.headline} className="flex flex-col rounded-[18px] border-reps-stone bg-reps-warm-white">
                <CardContent className="flex flex-col pt-6">
                  <div className="font-display text-[32px] font-bold leading-none text-reps-orange">
                    {p.metric}
                  </div>
                  <h3 className="mt-3 font-display text-[17px] font-bold leading-tight text-reps-charcoal">
                    {p.headline}
                  </h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-reps-muted-light">
                    {p.body}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <Avatar className="size-7">
                      <AvatarFallback className="bg-reps-orange/10 text-[11px] font-bold text-reps-orange">
                        {p.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-muted-light">
                      Verified client
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="scroll-mt-32 bg-reps-warm-white">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <SectionHeader eyebrow="Reviews" title={`${pro.reviews.count} verified reviews`} />
          <div className="mt-10 grid gap-10 lg:grid-cols-[320px_1fr] lg:gap-14">
            <Card className="rounded-[18px] border-reps-stone bg-reps-ivory lg:self-start">
              <CardContent className="pt-6">
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
                <div className="mt-5 flex flex-col gap-2.5">
                  {pro.reviews.distribution.map((row) => {
                    const pct = (row.count / pro.reviews.count) * 100;
                    return (
                      <div key={row.stars} className="flex items-center gap-3 text-[12px]">
                        <span className="w-4 text-reps-muted-light">{row.stars}</span>
                        <Star className="h-3 w-3 fill-reps-orange text-reps-orange" />
                        <Progress value={pct} className="h-1.5 flex-1 bg-reps-stone [&>div]:bg-reps-orange" />
                        <span className="w-6 text-right text-reps-muted-light">{row.count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              {pro.reviews.items.map((r) => (
                <Card key={`${r.author}-${r.date}`} className="rounded-[18px] border-reps-stone bg-reps-ivory">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="bg-reps-orange/10 text-[13px] font-bold text-reps-orange">
                            {r.author[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-[14px] font-semibold text-reps-charcoal">{r.author}</div>
                            <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[10px] font-semibold">
                              <BadgeCheck data-icon="inline-start" />
                              Verified booking
                            </Badge>
                          </div>
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
                  </CardContent>
                </Card>
              ))}
              <Button
                variant="outline"
                className="h-11 w-fit rounded-[10px] border-reps-stone bg-reps-warm-white text-reps-charcoal hover:bg-reps-ivory"
              >
                Read all {pro.reviews.count} reviews
                <ChevronRight data-icon="inline-end" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* LOCATION & AVAILABILITY */}
      <section id="location" className="scroll-mt-32 bg-reps-ivory">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <SectionHeader eyebrow="Location & availability" title="Where and when we can train" />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden rounded-[18px] border-reps-stone bg-reps-warm-white p-0">
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
                <Badge variant="outline" className="gap-1.5 rounded-full border-reps-stone bg-reps-ivory px-3 py-1 text-[12px] font-medium text-reps-charcoal">
                  <Clock data-icon="inline-start" />
                  Also online
                </Badge>
              </div>
            </Card>

            <Card className="rounded-[18px] border-reps-stone bg-reps-warm-white">
              <CardContent className="pt-6">
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
                                ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-700"
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
                <div className="mt-5 flex items-center gap-4 text-[11px] text-reps-muted-light">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block size-2.5 rounded-sm border border-emerald-400/30 bg-emerald-500/15" />
                    Available
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block size-2.5 rounded-sm bg-reps-ivory" />
                    Unavailable
                  </span>
                  <span className="ml-auto">Send an enquiry for live slots.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-reps-warm-white">
        <div className="mx-auto max-w-[900px] px-6 py-16 lg:px-10 lg:py-20">
          <SectionHeader eyebrow="FAQ" title="Common questions" />
          <Accordion type="single" collapsible className="mt-8">
            {pro.faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`} className="border-reps-stone">
                <AccordionTrigger className="text-left text-[15px] font-medium text-reps-charcoal hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-[14.5px] leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden bg-reps-charcoal text-reps-warm-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, rgba(255,122,0,0.25) 0%, transparent 55%)",
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 100%, rgba(255,122,0,0.08) 0%, transparent 40%)",
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-[1320px] px-6 py-16 text-center lg:px-10 lg:py-20">
          <h2 className="font-display text-[32px] font-bold leading-tight lg:text-[42px]">
            Ready to train with {pro.firstName}?
          </h2>
          <p className="mx-auto mt-3 max-w-[540px] text-[15px] text-reps-warm-white/70">
            Send a quick enquiry — {pro.firstName} usually replies within 24 hours.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              className="h-12 rounded-[10px] bg-reps-orange px-6 text-white hover:bg-reps-orange-dark"
            >
              <MessageCircle data-icon="inline-start" />
              Send an enquiry
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 rounded-[10px] border-reps-warm-white/30 bg-transparent text-reps-warm-white hover:bg-reps-warm-white/10 hover:text-reps-warm-white"
            >
              <Link to="/find-a-professional">
                Browse other pros
                <ChevronRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-reps-stone bg-reps-warm-white/95 p-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.4)] backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-[12px] font-semibold text-reps-charcoal">{pro.name}</div>
            <div className="text-[11px] text-reps-muted-light">
              From {pro.services[0]?.price ?? ""} · {pro.responseRate}
            </div>
          </div>
          <Button className="h-11 flex-1 rounded-[10px] bg-reps-orange text-white hover:bg-reps-orange-dark">
            <MessageCircle data-icon="inline-start" />
            Enquire
          </Button>
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

function TrustCell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative sm:before:absolute sm:before:inset-y-3 sm:before:left-0 sm:before:w-px sm:before:bg-reps-stone">
      {children}
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
    <div className="flex items-start gap-3 p-4 lg:p-5">
      <div className="inline-flex size-10 flex-none items-center justify-center rounded-full bg-reps-orange/10 text-reps-orange">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-[13.5px] font-semibold text-reps-charcoal">{title}</div>
        <div className="text-[12.5px] text-reps-muted-light">{sub}</div>
      </div>
    </div>
  );
}

function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-140px 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);
  return active;
}
