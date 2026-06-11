import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  GraduationCap,
  Handshake,
  LifeBuoy,
  Mail,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { MarketingHeroEyebrow } from "@/components/marketing/MarketingHeroEyebrow";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { MarketingFaq } from "@/components/marketing/MarketingFaq";
import { FinalCta } from "@/components/marketing/FinalCta";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatusCard } from "@/components/contact/StatusCard";
import { ContactForm } from "@/components/contact/ContactForm";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact REPs — talk to the team behind the register" },
      {
        name: "description",
        content:
          "For professionals joining REPs and training providers, awarding bodies, partners and press. Real humans, typical reply ~2hr on weekdays.",
      },
      { property: "og:title", content: "Contact REPs — talk to the team behind the register" },
      {
        property: "og:description",
        content:
          "A B2B contact route for professionals and training providers. Verification help, partnership, recognition and press — routed to the right person.",
      },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

const QUICK_ANSWERS = [
  {
    icon: ShieldCheck,
    title: "Get verified",
    body: "£99/year. Submit evidence once — decision in 5 working days.",
    to: "/get-verified" as const,
    cta: "See how verification works",
  },
  {
    icon: Sparkles,
    title: "Compare Pro vs Studio",
    body: "Shop-front, bookings, payments, growth tools — see what's in each tier.",
    to: "/pricing" as const,
    cta: "See pricing",
  },
  {
    icon: GraduationCap,
    title: "For training providers",
    body: "Course recognition, bulk verification for graduates, partnership and integrations.",
    href: "/for-training-providers",
    cta: "Provider enquiries",
  },
] as const;

const CHANNELS = [
  {
    label: "Professional support",
    email: "pros@repsuk.org",
    scope: "Verification, billing, profile and shop-front.",
  },
  {
    label: "Partnerships",
    email: "partners@repsuk.org",
    scope: "Training providers, awarding bodies, integrations.",
  },
  {
    label: "Press & media",
    email: "press@repsuk.org",
    scope: "Editorial, interviews, brand assets.",
  },
] as const;

const FAQ_ITEMS = [
  {
    q: "How long does verification take?",
    a: "We aim for a decision within 5 working days of receiving complete evidence (ID, qualification, insurance). Most pros hear back in 48 hours.",
  },
  {
    q: "Does REPs charge a booking commission?",
    a: "No. There's no booking fee or commission of any kind. Every feature in your tier is included — no paid add-ons.",
  },
  {
    q: "Can my course be recognised on REPs?",
    a: "Yes — pick \"Training provider / partner\" above and choose \"Course recognition on REPs\". We'll come back with what we need to assess your qualification.",
  },
  {
    q: "How do bulk verifications work for training providers?",
    a: "If you'd like a streamlined onboarding lane for your graduates (so they don't each have to re-submit qualification evidence from scratch), use the partner form — we'll set up a dedicated pipeline.",
  },
  {
    q: "Where do I send a safeguarding or conduct concern?",
    a: "Use the dedicated safeguarding route below — it goes straight to our safeguarding lead and is kept separate from general support.",
  },
];

function ContactPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(60%_70%_at_20%_0%,rgba(255,122,0,0.10),transparent_70%)]"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-reps-ink lg:h-56"
        />
        <div className="relative mx-auto grid max-w-[1320px] gap-12 px-6 pt-24 pb-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-16 lg:px-10 lg:pt-28 lg:pb-24">
          <div className="max-w-[640px]">
            <MarketingHeroEyebrow
              icon={MessageSquare}
              style={{ animationDuration: "560ms", animationFillMode: "both" }}
            >
              Contact
            </MarketingHeroEyebrow>

            <h1
              className="mt-6 animate-fade-in font-display text-[40px] font-bold leading-[1.05] text-white sm:text-[52px] lg:text-[64px]"
              style={{
                animationDuration: "640ms",
                animationDelay: "80ms",
                animationFillMode: "both",
              }}
            >
              Talk to the team behind the{" "}
              <span className="text-reps-orange">register.</span>
            </h1>

            <p
              className="mt-6 max-w-[560px] animate-fade-in text-[16px] leading-relaxed text-white/80"
              style={{
                animationDuration: "640ms",
                animationDelay: "180ms",
                animationFillMode: "both",
              }}
            >
              Whether you're a professional joining REPs or a training provider partnering with
              us, you'll speak to a human who actually knows the product — not a ticket queue.
            </p>

            <div
              className="mt-8 flex animate-fade-in flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] text-white/55"
              style={{
                animationDuration: "640ms",
                animationDelay: "260ms",
                animationFillMode: "both",
              }}
            >
              <span className="inline-flex items-center gap-2">
                <Sparkles className="size-3.5 text-reps-orange" /> Named humans, not a ticket bot
              </span>
              <span className="inline-flex items-center gap-2">
                <Mail className="size-3.5 text-reps-orange" /> Routed to the right team
              </span>
            </div>

            <p
              className="mt-6 animate-fade-in text-[12.5px] text-white/55"
              style={{
                animationDuration: "640ms",
                animationDelay: "320ms",
                animationFillMode: "both",
              }}
            >
              Looking for a coach?{" "}
              <Link
                to="/find-a-professional"
                className="font-semibold text-white/75 underline-offset-4 hover:text-reps-orange hover:underline"
              >
                Search the register →
              </Link>
            </p>
          </div>

          <div
            className="animate-fade-in"
            style={{
              animationDuration: "640ms",
              animationDelay: "340ms",
              animationFillMode: "both",
            }}
          >
            <StatusCard />
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="bg-reps-panel/15">
        <div className="mx-auto max-w-[1100px] px-6 py-20 lg:px-10 lg:py-28">
          <SectionHeader
            eyebrow="Send a message"
            heading="Two audiences. One form. Routed properly."
            lede="Pick the tab that fits and we'll show only the fields that matter. The estimated reply time below updates as you choose a reason."
            align="center"
            className="mx-auto text-center"
          />
          <div className="mt-10">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Quick answers */}
      <section>
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <SectionHeader
            eyebrow="Before you write"
            heading="Most pros and providers are asking…"
            lede="If your question lives here, you'll get an answer in under a minute — no waiting on a reply."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {QUICK_ANSWERS.map((q) => {
              const Icon = q.icon;
              const inner = (
                <>
                  <span className="flex size-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-5 font-display text-[18px] font-bold text-white">
                    {q.title}
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">
                    {q.body}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1 text-[13px] font-semibold text-reps-orange">
                    {q.cta}{" "}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </>
              );
              const className =
                "group flex flex-col rounded-[16px] border border-reps-border bg-reps-panel/40 p-6 transition-colors hover:border-reps-orange/60";
              if ("href" in q) {
                return (
                  <a key={q.title} href={q.href} className={className}>
                    {inner}
                  </a>
                );
              }
              return (
                <Link key={q.title} to={q.to} className={className}>
                  {inner}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Direct channels */}
      <section className="bg-reps-panel/30">
        <div className="mx-auto max-w-[1100px] px-6 py-20 lg:px-10 lg:py-28">
          <SectionHeader
            eyebrow="Prefer email?"
            heading="Reach the right inbox directly."
            lede="No phone line, no offices to visit. Email keeps a written record and goes straight to the team that owns it."
          />
          <ul className="mt-10 flex flex-col divide-y divide-reps-border overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel/50">
            {CHANNELS.map((c) => (
              <li
                key={c.email}
                className="grid gap-2 px-6 py-5 sm:grid-cols-[200px_minmax(0,1fr)_auto] sm:items-center sm:gap-6"
              >
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55">
                  {c.label}
                </span>
                <span className="text-[14px] text-white/75">{c.scope}</span>
                <a
                  href={`mailto:${c.email}`}
                  className="inline-flex items-center gap-2 text-[14px] font-semibold text-reps-orange hover:text-reps-orange-hover"
                >
                  <Mail className="size-4" /> {c.email}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-6 inline-flex items-center gap-2 text-[13px] text-white/55">
            <Handshake className="size-4 text-reps-orange" />
            REPs is a remote-first global team — every message is read by a named person.
          </p>
        </div>
      </section>

      {/* Safeguarding callout */}
      <section>
        <div className="mx-auto max-w-[1100px] px-6 py-20 lg:px-10 lg:py-28">
          <Alert className="flex flex-col gap-4 rounded-[18px] border-emerald-400/30 bg-emerald-500/10 p-6 text-emerald-100 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-emerald-400/30 bg-emerald-500/15">
                <ShieldAlert className="size-5 text-emerald-300" />
              </span>
              <div>
                <AlertTitle className="font-display text-[18px] font-bold text-white">
                  Safeguarding or conduct concern? Use the dedicated route.
                </AlertTitle>
                <AlertDescription className="mt-1 text-[14px] text-white/75">
                  If you have a safeguarding or professional-conduct concern about a registered
                  pro or a graduate, please don't use the general form — it goes straight to our
                  safeguarding lead.
                </AlertDescription>
              </div>
            </div>
            <a
              href="/complaints"
              className="inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-[10px] border border-emerald-400/40 bg-emerald-500/15 px-5 text-[13.5px] font-semibold text-emerald-100 hover:bg-emerald-500/25 sm:self-auto"
            >
              <LifeBuoy className="size-4" /> Open safeguarding route
            </a>
          </Alert>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-reps-panel/15">
        <div className="mx-auto max-w-[1100px] px-6 py-20 lg:px-10 lg:py-28">
          <MarketingFaq
            eyebrow="FAQ"
            heading="Before you write…"
            items={FAQ_ITEMS}
          />
        </div>
      </section>

      <FinalCta
        eyebrow={null}
        heading="Ready to join the register?"
        lede="Most pros are verified within 5 working days. Pricing is honest, evidence is reviewed by humans, and every feature in your tier is included."
        primary={{ to: "/get-verified", label: "Get verified — £99/yr" }}
        secondary={{ to: "/pricing", label: "Compare Pro & Studio" }}
      />

      <PublicFooter />
    </div>
  );
}
