import { Link } from "@tanstack/react-router";
import signupHeroBg from "@/assets/signup-hero-bg.jpg";

export function AuthShell({
  topRight,
  eyebrow,
  heading,
  intro,
  children,
}: {
  topRight?: React.ReactNode;
  eyebrow?: string;
  heading: React.ReactNode;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
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
          <div className="text-[14px] text-white/70">{topRight}</div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <img
          src={signupHeroBg}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-left opacity-70"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              "linear-gradient(90deg, var(--reps-ink) 0%, color-mix(in oklab, var(--reps-ink) 60%, transparent) 40%, color-mix(in oklab, var(--reps-ink) 80%, transparent) 60%, var(--reps-ink) 100%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-10 z-10 h-[520px] w-[520px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, var(--reps-orange) 0%, transparent 70%)" }}
        />

        <div className="relative z-20 mx-auto grid max-w-[1320px] gap-12 px-6 pb-24 pt-12 lg:grid-cols-[1.05fr_minmax(0,440px)] lg:items-start lg:gap-14 lg:px-10">
          <div className="flex flex-col">
            {eyebrow ? (
              <span className="inline-flex w-fit items-center rounded-full bg-reps-orange-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-reps-orange">
                {eyebrow}
              </span>
            ) : null}
            <h1 className="mt-5 font-display text-[44px] font-bold leading-[1.06] tracking-[-0.02em] text-white lg:text-[52px]">
              {heading}
            </h1>
            <p className="mt-5 max-w-[520px] text-[15px] leading-relaxed text-white/65">
              {intro}
            </p>
          </div>

          <div className="rounded-[22px] bg-reps-warm-white p-8 text-reps-charcoal shadow-[0_28px_90px_rgba(0,0,0,0.38)]">
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}

export function AuthField({
  label,
  type = "text",
  placeholder,
  hint,
  right,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  hint?: string;
  right?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-semibold text-reps-charcoal">{label}</label>
        {right}
      </div>
      <div className="mt-1.5 flex h-11 items-center gap-2 rounded-[12px] border border-reps-stone bg-reps-warm-white px-3">
        <input
          type={type}
          placeholder={placeholder}
          className="w-full bg-transparent text-[14px] text-reps-charcoal placeholder:text-reps-muted-light focus:outline-none"
        />
      </div>
      {hint ? (
        <p className="mt-1.5 text-[12px] text-reps-muted-light">{hint}</p>
      ) : null}
    </div>
  );
}

export function AuthPrimaryButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-reps-orange text-[14px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover"
    >
      {children}
    </button>
  );
}
