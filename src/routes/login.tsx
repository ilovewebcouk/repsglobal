import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Apple,
  BadgeCheck,
  Eye,
  Globe,
  Mail,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

import proSophie from "@/assets/pro-sophie.jpg";
import signupHeroBg from "@/assets/signup-hero-bg.jpg";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in to REPs — Your Professional Account" },
      {
        name: "description",
        content:
          "Log in to REPs to manage your professional profile, clients, bookings and CPD all in one place.",
      },
      { property: "og:title", content: "Sign in to REPs" },
      {
        property: "og:description",
        content:
          "Welcome back — sign in to REPs to access your professional dashboard.",
      },
      { property: "og:url", content: "/login" },
    ],
    links: [{ rel: "canonical", href: "/login" }],
  }),
  component: LoginPage,
});

const TRUST_BULLETS = [
  {
    icon: BadgeCheck,
    title: "Verified. Trusted. Recognised.",
    sub: "The professional standard in fitness.",
  },
  {
    icon: Users,
    title: "Manage your clients",
    sub: "All your bookings and leads in one place.",
  },
  {
    icon: TrendingUp,
    title: "Track your growth",
    sub: "Reviews, CPD and career progress at a glance.",
  },
  {
    icon: Globe,
    title: "Trusted worldwide",
    sub: "120+ countries. One professional standard.",
  },
];

function LoginPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      {/* ============ AUTH HEADER ============ */}
      <header className="relative z-30">
        <div className="mx-auto flex h-[76px] max-w-[1320px] items-center justify-between px-6 lg:px-10">
          <Link to="/" className="flex items-center gap-3">
            <span className="font-display text-[34px] font-bold leading-none tracking-tight text-white">
              REPs
            </span>
            <span className="hidden border-l border-white/15 pl-3 text-[11px] leading-tight text-white/70 sm:block">
              The Register of
              <br />
              Exercise Professionals
            </span>
          </Link>
          <p className="text-[14px] text-white/70">
            New to REPs?{" "}
            <Link
              to="/signup"
              className="font-semibold text-reps-orange hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </header>

      {/* ============ HERO + FORM ============ */}
      <section className="relative overflow-hidden">
        {/* Dashboard laptop background */}
        <img
          src={signupHeroBg}
          alt=""
          aria-hidden
          width={1920}
          height={1080}
          className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-left opacity-80"
        />
        {/* Ink wash + right-side fade so the form card stays high contrast */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              "linear-gradient(90deg, var(--reps-ink) 0%, color-mix(in oklab, var(--reps-ink) 55%, transparent) 35%, color-mix(in oklab, var(--reps-ink) 75%, transparent) 60%, var(--reps-ink) 100%)",
          }}
        />
        {/* Decorative orange swooshes */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 top-20 z-10 h-[420px] w-[420px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, var(--reps-orange) 0%, transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-10 z-10 h-[520px] w-[520px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, var(--reps-orange) 0%, transparent 70%)" }}
        />

        <div className="relative z-20 mx-auto grid max-w-[1320px] gap-12 px-6 pb-20 pt-8 lg:grid-cols-2 lg:items-start lg:gap-14 lg:px-10">
          {/* Left: welcome back */}
          <div className="flex flex-col">
            <h1 className="font-display text-[44px] font-bold leading-[1.06] tracking-[-0.02em] text-white lg:text-[52px]">
              Welcome back to{" "}
              <span className="text-reps-orange">REPs.</span>
            </h1>
            <p className="mt-5 text-[15px] leading-relaxed text-white/65">
              Sign in to access your professional profile, manage clients and
              keep your qualifications current — all in one place.
            </p>

            <ul className="mt-8 grid gap-5">
              {TRUST_BULLETS.map((b) => (
                <li key={b.title} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                    <b.icon className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <div className="text-[14px] font-semibold text-white">
                      {b.title}
                    </div>
                    <div className="text-[13px] text-white/60">{b.sub}</div>
                  </div>
                </li>
              ))}
            </ul>

            <figure className="mt-10 w-full max-w-[480px] rounded-[18px] border border-reps-border bg-reps-panel/80 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-reps-orange text-reps-orange"
                  />
                ))}
              </div>
              <blockquote className="mt-3 text-[14px] leading-relaxed text-white/80">
                &ldquo;REPs has helped me build trust with clients and grow
                my business. The tools and support are incredible.&rdquo;
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <img
                  src={proSophie}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <div className="text-[13px] font-semibold text-white">
                    Sophie Williams
                  </div>
                  <div className="text-[12px] text-white/60">
                    Pilates Instructor
                  </div>
                </div>
              </figcaption>
            </figure>
          </div>

          {/* Right: login form */}
          <div className="rounded-[22px] bg-reps-warm-white p-8 text-reps-charcoal shadow-[0_28px_90px_rgba(0,0,0,0.38)]">
            <div className="text-center">
              <h2 className="font-display text-[24px] font-bold leading-tight text-reps-charcoal">
                Sign in to REPs
              </h2>
              <p className="mt-1.5 text-[13px] text-reps-muted-light">
                Welcome back. Enter your details to continue.
              </p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
              {/* Email */}
              <div>
                <label className="text-[13px] font-semibold text-reps-charcoal">
                  Email address
                </label>
                <div className="mt-1.5 flex h-11 items-center gap-2 rounded-[12px] border border-reps-stone bg-reps-warm-white px-3">
                  <Mail className="h-4 w-4 text-reps-muted-light" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    className="w-full bg-transparent text-[14px] text-reps-charcoal placeholder:text-reps-muted-light focus:outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-semibold text-reps-charcoal">
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-[12px] font-semibold text-reps-orange hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="mt-1.5 flex h-11 items-center gap-2 rounded-[12px] border border-reps-stone bg-reps-warm-white px-3">
                  <input
                    type="password"
                    required
                    placeholder="Enter your password"
                    className="w-full bg-transparent text-[14px] text-reps-charcoal placeholder:text-reps-muted-light focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label="Show password"
                    className="text-reps-muted-light hover:text-reps-charcoal"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-[13px] text-reps-charcoal">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded-[6px] border-reps-stone accent-reps-orange"
                />
                Keep me signed in
              </label>

              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-reps-orange text-[14px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover"
              >
                Sign in
              </button>

              <div className="flex items-center gap-3 py-1 text-[11px] uppercase tracking-wider text-reps-muted-light">
                <span className="h-px flex-1 bg-reps-stone" />
                or continue with
                <span className="h-px flex-1 bg-reps-stone" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <SocialButton label="Continue with Google">
                  <GoogleGlyph />
                </SocialButton>
                <SocialButton label="Continue with Apple">
                  <Apple className="h-4 w-4 text-reps-charcoal" />
                </SocialButton>
              </div>

              <p className="text-center text-[12px] text-reps-muted-light">
                Don&apos;t have an account?{" "}
                <Link
                  to="/signup"
                  className="font-semibold text-reps-orange hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

function SocialButton({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-reps-stone bg-reps-warm-white text-[13px] font-semibold text-reps-charcoal shadow-none transition-colors hover:bg-reps-ivory"
    >
      {children}
      {label}
    </button>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.05-3.72 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
