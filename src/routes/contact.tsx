import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Building2, LifeBuoy, Mail, MessageSquare, Phone, ShieldCheck, Sparkles, Users } from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact REPs" },
      {
        name: "description",
        content:
          "Talk to the REPs team — general enquiries, professional support, verification questions and press.",
      },
      { property: "og:title", content: "Contact REPs" },
      {
        property: "og:description",
        content: "Get in touch with REPs — we typically reply within one business day.",
      },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

const CHANNELS = [
  {
    icon: Users,
    title: "Client support",
    body: "Help with finding a pro, bookings, or your account.",
    contact: "support@repsglobal.com",
  },
  {
    icon: ShieldCheck,
    title: "Professional support",
    body: "Verification, payouts, profile and CPD questions.",
    contact: "pros@repsglobal.com",
  },
  {
    icon: Building2,
    title: "Press & partnerships",
    body: "Media, sponsorships and integrations.",
    contact: "press@repsglobal.com",
  },
];

const OFFICES = [
  { city: "London", line1: "1 Pancras Square", line2: "London N1C 4AG, UK", phone: "+44 20 7946 0000" },
  { city: "Manchester", line1: "10 Whitworth St West", line2: "Manchester M1 5WG, UK", phone: "+44 161 503 2000" },
];

function ContactPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1100px] px-6 py-20 text-center lg:px-10 lg:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
            <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> Contact
          </span>
          <h1 className="mt-5 font-display text-[44px] font-bold leading-tight text-white lg:text-[56px]">
            We're here to help.
          </h1>
          <p className="mx-auto mt-4 max-w-[560px] text-[16px] text-white/65">
            Most questions are answered in the help centre. If you need a human, send us a note — we typically
            reply within one business day.
          </p>
        </div>
      </section>

      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10">
          <div className="grid gap-5 md:grid-cols-3">
            {CHANNELS.map((c) => (
              <div
                key={c.title}
                className="rounded-[18px] border border-reps-border bg-reps-panel p-6"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <c.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-[17px] font-bold text-white">{c.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/65">{c.body}</p>
                <a
                  href={`mailto:${c.contact}`}
                  className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-reps-orange"
                >
                  {c.contact} <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto grid max-w-[1320px] gap-10 px-6 py-20 lg:grid-cols-[1.2fr_1fr] lg:px-10">
          <div className="rounded-[22px] border border-reps-border bg-reps-panel p-8">
            <h2 className="font-display text-[24px] font-bold text-white">Send us a message</h2>
            <p className="mt-1 text-[13px] text-white/55">
              We'll route your message to the right team and reply to your email.
            </p>

            <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Full name" placeholder="Jane Carter" />
                <Field label="Email" type="email" placeholder="you@example.com" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Select label="Reason" options={["Client support", "Professional support", "Press & partnerships", "Other"]} />
                <Field label="Subject" placeholder="What's this about?" />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-white/75">Message</label>
                <textarea
                  rows={5}
                  placeholder="Tell us a bit more…"
                  className="mt-2 w-full rounded-[12px] border border-reps-border bg-reps-ink px-4 py-3 text-[13px] text-white placeholder:text-white/35 focus:border-reps-orange focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="flex h-12 items-center justify-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
              >
                Send message <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div className="space-y-5">
            <div className="rounded-[22px] border border-reps-border bg-reps-panel p-6">
              <div className="flex items-center gap-2">
                <LifeBuoy className="h-4 w-4 text-reps-orange" />
                <h3 className="font-display text-[17px] font-bold text-white">Help centre</h3>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-white/65">
                Browse guides for clients and professionals — most answers in under a minute.
              </p>
              <a className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-reps-orange" href="#">
                Visit help centre <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>

            {OFFICES.map((o) => (
              <div
                key={o.city}
                className="rounded-[18px] border border-reps-border bg-reps-panel p-6"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-reps-orange" />
                  <h3 className="font-display text-[15px] font-bold text-white">{o.city}</h3>
                </div>
                <div className="mt-2 text-[13px] leading-relaxed text-white/70">
                  {o.line1}
                  <br />
                  {o.line2}
                </div>
                <div className="mt-3 flex items-center gap-2 text-[12px] text-white/55">
                  <Phone className="h-3.5 w-3.5" /> {o.phone}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function Field({ label, type = "text", placeholder }: { label: string; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold text-white/75">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-[12px] border border-reps-border bg-reps-ink px-4 text-[13px] text-white placeholder:text-white/35 focus:border-reps-orange focus:outline-none"
      />
    </label>
  );
}

function Select({ label, options }: { label: string; options: string[] }) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold text-white/75">{label}</span>
      <select className="mt-2 h-11 w-full rounded-[12px] border border-reps-border bg-reps-ink px-3 text-[13px] text-white focus:border-reps-orange focus:outline-none">
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
