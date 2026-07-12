import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { heroAvatarsQueryOptions, type HeroAvatar } from "@/lib/directory/hero.functions";
import { getNewestCoaches, type NewestCoachRow } from "@/lib/directory/newest.functions";
import { getTitleLabel } from "@/lib/cpd/titles-catalog";
import {
  Activity,
  Apple,
  ArrowRight,
  Award,
  Calendar,
  ChevronRight,
  Dumbbell,
  Globe,
  MessageCircle,
  Quote,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users,
} from "lucide-react";
import { NewestCoachCard, type NewestCoach } from "@/components/public/NewestCoachCard";


import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { HomeHeroSearch } from "@/components/home/HeroSearch";


import heroCoaching from "@/assets/home-hero-coaching.jpg.asset.json";
import ctaTrainersAsset from "@/assets/cta-band.jpg.asset.json";
const ctaTrainers = ctaTrainersAsset.url;
import proJames from "@/assets/pro-james.jpg";
import proSophie from "@/assets/pro-sophie.jpg";
import proDaniel from "@/assets/pro-daniel.jpg";
import outcomeMark from "@/assets/outcomes/outcome-mark.jpg";
import outcomePriya from "@/assets/outcomes/outcome-priya.jpg";
import outcomeTom from "@/assets/outcomes/outcome-tom.jpg";
import proLaura from "@/assets/pro-laura.jpg";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "REPS — Find. Trust. Train. Transform." },
      {
        name: "description",
        content:
          "REPS connects you with verified fitness professionals you can trust to help you reach your goals.",
      },
      { property: "og:title", content: "REPS — Find. Trust. Train. Transform." },
      {
        property: "og:description",
        content:
          "Search verified personal trainers, Pilates instructors, nutritionists and coaches.",
      },
      { property: "og:url", content: "https://repsuk.org/" },
    ],
    links: [
      { rel: "canonical", href: "https://repsuk.org/" },
      { rel: "preload", as: "image", href: heroCoaching.url, fetchPriority: "high" },
    ],

  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(heroAvatarsQueryOptions);
  },
  component: HomeV2,
});

const goalChips: { label: string; specialism: string }[] = [
  { label: "Fat loss", specialism: "fat-loss" },
  { label: "Strength", specialism: "strength" },
  { label: "Mobility", specialism: "mobility" },
  { label: "Pre/post-natal", specialism: "pre-post-natal" },
  { label: "Rehab", specialism: "rehab-injury" },
  { label: "Sport-specific", specialism: "sports-performance" },
];


const stats = [
  { icon: Users, value: "25,000+", label: "Verified Professionals" },
  { icon: Star, value: "50,000+", label: "Client Reviews" },
  { icon: Globe, value: "120+", label: "Countries Worldwide" },
  { icon: Calendar, value: "1M+", label: "Sessions Booked" },
];

const steps = [
  { icon: Search, t: "Search", body: "Tell us your goal, your city and how you want to train." },
  { icon: ShieldCheck, t: "Verify", body: "Every REP is qualified, insured and credential-checked." },
  { icon: Users, t: "Connect", body: "Read reviews, compare profiles, message your shortlist." },
  { icon: Target, t: "Transform", body: "Train with a coach who actually knows what they're doing." },
];

type SpecialismSearch = {
  page: 1;
  sort: "nearest";
  profession?: string;
  specialism?: string;
  mode?: "online";
};

const specialisms: { icon: typeof Dumbbell; label: string; search: SpecialismSearch }[] = [
  { icon: Dumbbell, label: "Personal Trainer", search: { page: 1, sort: "nearest", profession: "personal-trainer" } },
  { icon: Target, label: "Strength Coach", search: { page: 1, sort: "nearest", profession: "strength-coach" } },
  { icon: Activity, label: "Pilates", search: { page: 1, sort: "nearest", profession: "pilates-instructor" } },
  { icon: Apple, label: "Nutritionist", search: { page: 1, sort: "nearest", profession: "nutritionist" } },
  { icon: Sparkles, label: "Yoga Teacher", search: { page: 1, sort: "nearest", profession: "yoga-teacher" } },
  { icon: Users, label: "Fitness Instructor", search: { page: 1, sort: "nearest", profession: "fitness-instructor" } },
];

// Static fallback in case the rail query fails — REPLACED at runtime by
// `featuredCards` derived from `getFeaturedPros`. See HomeV2.


const outcomes = [
  {
    img: outcomeMark,
    coach: "James Carter",
    headline: "Down 12kg in 6 months.",
    quote: "I'd tried every app. James gave me a plan I actually stuck to and a coach who held me to it.",
    name: "Mark, 38",
    metric: "12kg lost · 24-week plan",
  },
  {
    img: outcomePriya,
    coach: "Sophie Williams",
    headline: "Back to running pain-free.",
    quote: "After my second pregnancy I thought running was over. Sophie rebuilt my core and I'm doing 10ks again.",
    name: "Priya, 34",
    metric: "Post-natal · 12-week return",
  },
  {
    img: outcomeTom,
    coach: "Daniel Roberts",
    headline: "Deadlift PB +40kg.",
    quote: "Programmed properly for the first time in my life. The progression was relentless and the results showed.",
    name: "Tom, 29",
    metric: "Strength · 16-week block",
  },
];

const trustPillars = [
  { icon: ShieldCheck, title: "Verified Professionals", body: "Every REP is qualified, insured and credential-checked. No exceptions." },
  { icon: Award, title: "Standards & CPD", body: "Ongoing education so the people coaching you stay current." },
  { icon: MessageCircle, title: "Real Client Reviews", body: "Reviews come from real bookings — no fake five-stars, no review farms." },
  { icon: Globe, title: "Global Community", body: "120+ countries. One global standard for exercise professionals." },
];

const PROFESSION_LABEL_HOME: Record<string, string> = {
  "personal-trainer": "Personal Trainer",
  "pilates-instructor": "Pilates Instructor",
  "strength-coach": "Strength Coach",
  "nutritionist": "Nutritionist",
  "online-coach": "Online Coach",
  "yoga-teacher": "Yoga Teacher",
  "group-exercise-instructor": "Group Exercise Instructor",
  "fitness-instructor": "Fitness Instructor",
};

function rowToNewestCoach(r: NewestCoachRow): NewestCoach {
  const mode: NewestCoach["mode"] =
    r.in_person_available && r.online_available
      ? "In-person & Online"
      : r.online_available
        ? "Online"
        : "In-person";
  const primaryLabel =
    getTitleLabel(r.primary_title_slug) ??
    (r.primary_profession ? (PROFESSION_LABEL_HOME[r.primary_profession] ?? "Fitness Professional") : "Fitness Professional");
  const secondaryLabel = getTitleLabel(r.secondary_title_slug);
  const role = secondaryLabel && secondaryLabel !== primaryLabel
    ? `${primaryLabel} & ${secondaryLabel}`
    : primaryLabel;
  return {
    name: r.full_name,
    role,
    city: r.city ?? (r.online_available ? "Online" : "—"),
    mode,
    image: r.avatar_url,
    slug: r.slug,
    rating: r.rating_avg,
    reviews: r.review_count,
    verified: r.verification_status === "verified",
  };
}

function HomeV2() {
  const { data: newestResult } = useQuery({
    queryKey: ["home-newest-coaches", 16],
    queryFn: () => getNewestCoaches({ data: { limit: 12 } }),
    staleTime: 5 * 60_000,
  });
  const newestCoaches: NewestCoach[] = (newestResult?.pros ?? []).map(rowToNewestCoach);
  const hasNewest = newestCoaches.length > 0;


  return (
    <div className="min-h-screen bg-reps-ivory">
      <PublicHeader variant="transparent" />




      {/* ============ HERO (locked) ============ */}
      <section className="relative isolate overflow-hidden bg-reps-black text-white">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          {/* Desktop: image anchored right, dark wash on the left so the copy column stays readable. Mobile/tablet: solid black, no image. */}
          <div className="absolute inset-0 hidden md:block">
            <img
              src={heroCoaching.url}
              alt=""
              width={1920}
              height={1080}
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-[88%_30%] lg:object-[78%_30%]"
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(11,13,16,0.78) 0%, rgba(11,13,16,0.6) 32%, rgba(11,13,16,0.25) 52%, rgba(11,13,16,0) 65%), linear-gradient(to bottom, rgba(11,13,16,0) 30%, rgba(11,13,16,0.35) 100%)",

              }}
            />




          </div>
        </div>


        <div className="mx-auto max-w-[1320px] px-6 pb-16 pt-[140px] lg:px-10 lg:pb-24 lg:pt-[160px]">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_minmax(0,440px)] lg:items-center lg:gap-16">
            <div>
              <h1
                className="animate-rise-in font-display font-bold leading-[0.94] tracking-[-0.035em] text-white text-balance text-[44px] sm:text-[60px] lg:text-[80px]"
                style={{ animationDelay: "120ms" }}
              >
                Find a coach <span className="text-reps-orange">worth trusting.</span>
              </h1>
              <p
                className="animate-rise-in mt-6 max-w-[520px] text-[18px] font-light leading-relaxed text-white/75"
                style={{ animationDelay: "220ms" }}
              >
                25,000+ verified fitness professionals. Real qualifications. Real reviews —&nbsp;
                <span className="text-white">Book in 30 seconds.</span>
              </p>

              <HomeHeroSearch />

              <div
                className="animate-rise-in mt-5 flex flex-wrap gap-2"
                style={{ animationDelay: "420ms" }}
              >
                {goalChips.map((g) => (
                  <Link
                    key={g.specialism}
                    to="/find-a-professional"
                    search={{ specialism: g.specialism, page: 1, sort: "recommended" }}
                    className="inline-flex h-9 items-center rounded-full border border-white/15 bg-white/[0.04] px-3.5 text-[13px] font-medium text-white/85 transition-colors hover:border-reps-orange-border hover:bg-[rgba(255,122,0,0.08)] hover:text-white"
                  >
                    {g.label}
                  </Link>
                ))}
              </div>

              <div
                className="animate-rise-in mt-7 flex items-center gap-4"
                style={{ animationDelay: "520ms" }}
              >
                <HomeHeroAvatars />

                <div className="text-[13px] leading-snug text-white/70">
                  <div>
                    Trusted by <strong className="font-semibold text-white">25,000+</strong> clients worldwide
                  </div>
                  <div className="mt-0.5">
                    <Star className="mr-1 inline h-3.5 w-3.5 fill-reps-orange text-reps-orange align-[-2px]" aria-hidden />
                    <strong className="font-semibold text-white">4.9</strong>
                    <span className="mx-1.5 text-white/55">·</span>
                    <strong className="font-semibold text-white">50,000+</strong> verified reviews
                  </div>
                </div>
              </div>
            </div>
            <div aria-hidden />
          </div>
        </div>
      </section>

      {/* ============ NEWEST COACHES — just joined ============ */}
      {hasNewest && (
      <section className="bg-reps-warm-white">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">NEW TO REPS</span>
              <h2 className="mt-1 font-display text-[30px] font-bold leading-tight text-reps-charcoal lg:text-[34px]">
                Recently joined professionals
              </h2>
              <p className="mt-2 max-w-[520px] text-[13.5px] text-reps-muted-light">
                Meet the latest fitness professionals building their trusted profiles on REPS
              </p>
            </div>
            <Link
              to="/find-a-professional"
              search={{ page: 1, sort: "nearest" }}
              className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-reps-orange transition-opacity hover:opacity-80"
            >
              View all professionals →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {newestCoaches.map((pro) => (
              <NewestCoachCard key={pro.slug} pro={pro} />
            ))}
          </div>

        </div>
      </section>
      )}


      {/* ============ EXPLORE BY SPECIALISM ============ */}
      <section className="bg-reps-ivory">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[260px_1fr]">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">Explore by</div>
              <h2 className="mt-1 font-display text-[34px] font-bold leading-tight text-reps-charcoal">Profession</h2>
              <p className="mt-2 max-w-[220px] text-[14px] text-reps-muted-light">
                Find the right expert for your goals.
              </p>
              <Link
                to="/find-a-professional"
                className="mt-5 inline-flex items-center gap-2 rounded-[10px] border border-reps-stone bg-reps-warm-white px-4 py-2.5 text-[13px] font-medium text-reps-charcoal shadow-none transition-colors hover:bg-reps-ivory"
              >
                View all specialisms <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4 lg:grid-cols-6">
              {specialisms.map((sp) => (
                <Link
                  key={sp.label}
                  to="/find-a-professional"
                  search={sp.search}
                  className="group flex flex-col items-center gap-3 text-center transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-reps-orange/60 focus-visible:ring-offset-2 focus-visible:ring-offset-reps-ivory"
                >
                  <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-reps-stone bg-reps-warm-white text-reps-charcoal transition-all group-hover:border-reps-orange/40 group-hover:text-reps-orange">
                    <sp.icon className="h-7 w-7" strokeWidth={1.6} />
                  </span>
                  <span className="text-[13px] font-medium text-reps-charcoal">{sp.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS (4 steps) ============ */}
      <section className="bg-reps-warm-white">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="max-w-[680px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">How it works</span>
            <h2 className="mt-2 font-display text-[34px] font-bold leading-tight text-reps-charcoal lg:text-[42px]">
              Find the right coach in four steps.
            </h2>
            <p className="mt-3 text-[15px] text-reps-muted-light">
              Every REPS professional clears the same bar — qualifications, insurance and CPD — so you start with a shortlist of people you can actually trust.
            </p>
          </div>
          <div className="relative mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.t} className="relative flex flex-col rounded-[18px] border border-reps-stone bg-reps-ivory p-6">
                <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-muted-light">
                  Step 0{i + 1}
                </span>
                <span className="mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-reps-warm-white text-reps-orange">
                  <s.icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <h3 className="mt-5 font-display text-[19px] font-bold text-reps-charcoal">{s.t}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-reps-muted-light">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ OUTCOMES ============ */}
      <section className="bg-reps-ivory">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="max-w-[680px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">Real results</span>
            <h2 className="mt-2 font-display text-[34px] font-bold leading-tight text-reps-charcoal lg:text-[42px]">
              Outcomes from people who train with REPS.
            </h2>
            <p className="mt-3 text-[15px] text-reps-muted-light">
              These aren't testimonials. They're outcomes — measured, dated and tied to a real coach.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {outcomes.map((o) => (
              <article key={o.name} className="overflow-hidden rounded-[18px] border border-reps-stone bg-reps-warm-white">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={o.img} alt={o.headline} className="h-full w-full object-cover" loading="lazy" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-reps-ink/85 via-reps-ink/40 to-transparent p-4 text-white">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-reps-orange/90 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white">
                      {o.metric}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-display text-[22px] font-bold leading-tight text-reps-charcoal">{o.headline}</h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-reps-charcoal/75">"{o.quote}"</p>
                  <div className="mt-5 flex items-center justify-between border-t border-reps-stone pt-4 text-[12px]">
                    <span className="font-semibold text-reps-charcoal">{o.name}</span>
                    <span className="text-reps-muted-light">with {o.coach}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>




      {/* ============ WHY TRUST REPS — stats + pillars + closing quote folded in ============ */}
      <section className="bg-reps-warm-white">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-start">
            <div>
              <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">Why REPS</span>
              <h2 className="mt-2 font-display text-[34px] font-bold leading-tight text-reps-charcoal lg:text-[42px]">
                We set the bar every fitness professional should clear.
              </h2>
              <p className="mt-4 text-[15px] text-reps-muted-light">
                The fitness industry doesn't have a regulator. REPS is the closest thing it has — a global register of verified, insured, continuously-educated exercise professionals.
              </p>
              <Link
                to="/standards"
                className="mt-6 inline-flex items-center gap-2 rounded-[10px] border border-reps-charcoal/15 bg-transparent px-4 py-2.5 text-[13px] font-semibold text-reps-charcoal shadow-none transition-colors hover:bg-reps-ivory"
              >
                Read the REPS standard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {trustPillars.map((c) => (
                <article key={c.title} className="flex flex-col gap-3 rounded-[18px] border border-reps-stone bg-reps-ivory p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-reps-warm-white text-reps-orange">
                    <c.icon className="h-5 w-5" strokeWidth={1.6} />
                  </span>
                  <h3 className="font-display text-[17px] font-bold text-reps-charcoal">{c.title}</h3>
                  <p className="text-[13.5px] leading-relaxed text-reps-muted-light">{c.body}</p>
                </article>
              ))}
            </div>
          </div>

          {/* Inlined stats row — was a standalone band, now anchors the trust block */}
          <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-[22px] border border-reps-stone bg-reps-stone sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1.5 bg-reps-ivory p-5 sm:p-6 text-center">
                <div className="font-display text-[26px] font-bold leading-none tracking-[-0.02em] tabular-nums text-reps-charcoal sm:text-[32px] lg:text-[44px]">
                  {s.value}
                </div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-reps-muted-light sm:text-[12px]">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Folded-in editorial pull-quote — now the closing line of the trust crescendo */}
          <figure className="mx-auto mt-14 max-w-[860px] text-center">
            <Quote className="mx-auto h-7 w-7 text-reps-orange" />
            <blockquote className="mt-5 font-display text-[24px] font-bold leading-tight text-reps-charcoal sm:text-[30px] lg:text-[34px]">
              "The world's register of verified fitness professionals — so you never have to guess who you're trusting your body with."
            </blockquote>
            <figcaption className="mt-5 text-[12px] uppercase tracking-[0.18em] text-reps-muted-light">
              REPS — SINCE 2002
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ============ PROFESSIONAL CTA BAND ============ */}
      <section className="bg-reps-ivory py-16 lg:py-20">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <div className="relative isolate overflow-hidden rounded-[24px] bg-reps-ink text-white shadow-[var(--reps-shadow-card)]">
            <div className="relative w-full md:absolute md:inset-0">
              <img src={ctaTrainers} alt="" className="aspect-[5/4] w-full object-cover object-[100%_20%] md:aspect-auto md:h-full md:object-[100%_15%] lg:object-[100%_20%]" loading="lazy" />
              <div
                className="absolute inset-0 hidden md:block"
                style={{ backgroundImage: "linear-gradient(to bottom, transparent 0%, transparent 18%, rgba(11,13,16,0.38) 42%, rgba(11,13,16,0.72) 65%, #0B0D10 88%)" }}
              />
              <div
                className="absolute inset-0 hidden lg:block"
                style={{ backgroundImage: "linear-gradient(to right, #0B0D10 0%, rgba(11,13,16,0.95) 25%, rgba(11,13,16,0.55) 38%, rgba(11,13,16,0) 50%)" }}
              />
            </div>
            <div className="relative px-6 py-10 md:min-h-[480px] md:px-10 md:py-12 lg:min-h-[440px] lg:px-14 lg:py-14">
              <div className="max-w-[520px]">
                <span className="inline-flex items-center gap-2 rounded-full border border-reps-orange-border bg-reps-orange-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
                  <Sparkles className="h-3 w-3 fill-reps-orange" /> For professionals
                </span>
                <h2 className="mt-4 font-display text-[28px] font-bold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:text-[32px] lg:text-[38px]">
                  Are you a fitness professional?
                </h2>
                <p className="mt-3 max-w-[420px] text-[14.5px] leading-relaxed text-white/85">
                  Join 25,000+ verified pros. Get discovered, take bookings and run your practice — all in one place.
                </p>
                <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  {["Verified profile that ranks", "Built-in bookings & payments", "Clients, CRM & messaging", "CPD on rails"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-[14px] text-white">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-reps-orange/70 text-reps-orange">
                        <Star className="h-3 w-3 fill-reps-orange" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    to="/for-professionals"
                    className="inline-flex h-[48px] items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14.5px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-dark"
                  >
                    Become a REPS Pro <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/pricing"
                    className="inline-flex h-[48px] items-center rounded-[10px] border border-white/30 px-6 text-[14.5px] font-semibold text-white shadow-none transition-colors hover:bg-white/10"
                  >
                    See plans
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      <PublicFooter />
    </div>
  );
}

const FALLBACK_AVATARS: { src: string; alt: string }[] = [
  { src: proJames, alt: "" },
  { src: proSophie, alt: "" },
  { src: proDaniel, alt: "" },
  { src: proLaura, alt: "" },
];

function HomeHeroAvatars() {
  const { data } = useSuspenseQuery(heroAvatarsQueryOptions);
  const pool: HeroAvatar[] = data ?? [];

  if (pool.length < 4) {
    return null;
  }

  // Server already shuffles per request; just take the first four.
  const visible = pool.slice(0, 4);
  return (
    <div className="flex items-center -space-x-3">
      {visible.map((p) => (
        <Link
          key={p.id}
          to="/c/$slug"
          params={{ slug: p.slug }}
          className="inline-block size-10 overflow-hidden rounded-full ring-2 ring-reps-black"
          title={p.full_name}
        >
          <img src={p.avatar_url} alt={p.full_name} className="h-full w-full object-cover" />
        </Link>
      ))}
    </div>
  );
}

