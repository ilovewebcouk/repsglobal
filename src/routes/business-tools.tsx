import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Calendar,
  CreditCard,
  MessageSquare,
  LineChart,
  ClipboardCheck,
  Apple,
  Users,
  Megaphone,
  Sparkles,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import heroGym from "@/assets/hero-gym-bg.jpg";
import ctaBand from "@/assets/cta-band.jpg";

export const Route = createFileRoute("/business-tools")({
  head: () => ({
    meta: [
      { title: "Business Tools for Fitness Professionals — REPs" },
      {
        name: "description",
        content:
          "Run your whole fitness business inside REPs — bookings, payments, programmes, check-ins, nutrition, client CRM and lead enquiries.",
      },
      { property: "og:title", content: "Business Tools — REPs" },
      { property: "og:description", content: "The professional toolkit for REPs members." },
      { property: "og:url", content: "https://repsglobal.lovable.app/business-tools" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/business-tools" }],
  }),
  component: BusinessToolsPage,
});

const TOOLS = [
  { icon: Calendar, title: "Bookings & calendar", body: "Two-way sync, session reminders and rescheduling without the texting spiral." },
  { icon: CreditCard, title: "Payments", body: "Take card payments, packages and subscriptions. Auto-invoicing and reporting included." },
  { icon: MessageSquare, title: "Client messaging", body: "All your conversations in one place — separate from your personal phone." },
  { icon: ClipboardCheck, title: "Programmes", body: "Build, deliver and update training programmes with video demos and progressions." },
  { icon: Apple, title: "Nutrition", body: "Meal templates, macro targets and shopping lists clients actually use." },
  { icon: LineChart, title: "Check-ins & progress", body: "Weekly check-in forms, photos and metrics in one tidy timeline." },
  { icon: Users, title: "Client CRM", body: "A single record per client — sessions, notes, payments, programmes and goals." },
  { icon: Megaphone, title: "Lead enquiries", body: "New enquiries land straight in your dashboard from your public REPs profile." },
];

function BusinessToolsPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      <section className="relative overflow-hidden border-b border-reps-border">
        <img src={heroGym} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-reps-ink/80 via-reps-ink/90 to-reps-ink" />
        <div className="relative mx-auto max-w-[1240px] px-6 py-24 lg:px-10 lg:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
            <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> Business Tools
          </span>
          <h1 className="mt-5 max-w-[860px] font-display text-[44px] font-bold leading-tight text-white lg:text-[60px]">
            One platform. <span className="text-reps-orange">Whole business.</span>
          </h1>
          <p className="mt-5 max-w-[620px] text-[16px] leading-relaxed text-white/70">
            REPs isn't just a register. Members get the full professional toolkit — bookings,
            payments, programmes, check-ins and client management — bundled into one membership.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/for-professionals"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
            >
              Join REPs <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-6 text-[14px] font-semibold text-white hover:bg-white/10"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <div className="max-w-[720px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">What's included</span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
              Everything you need to run your day.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {TOOLS.map((t) => (
              <div key={t.title} className="rounded-[18px] border border-reps-border bg-reps-panel p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <t.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-[16px] font-bold text-white">{t.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/65">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-reps-border">
        <img src={ctaBand} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-reps-ink/85" />
        <div className="relative mx-auto max-w-[1100px] px-6 py-20 text-center lg:px-10">
          <h2 className="font-display text-[34px] font-bold leading-tight text-white lg:text-[44px]">
            Stop stitching five apps together.
          </h2>
          <p className="mx-auto mt-3 max-w-[560px] text-[15px] text-white/70">
            Move your whole business into REPs and get verified at the same time.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to="/for-professionals"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
            >
              Join REPs <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-6 text-[14px] font-semibold text-white hover:bg-white/10"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
