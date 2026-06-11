import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarCheck,
  ChevronRight,
  Dumbbell,
  Eye,
  Flag,
  GraduationCap,
  Leaf,
  MapPin,
  MessageSquare,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { MarketingHeroEyebrow } from "@/components/marketing/MarketingHeroEyebrow";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { MarketingFaq } from "@/components/marketing/MarketingFaq";
import { FinalCta } from "@/components/marketing/FinalCta";
import proDaniel from "@/assets/pro-daniel.jpg";
import proJames from "@/assets/pro-james.jpg";
import proLaura from "@/assets/pro-laura.jpg";
import proSophie from "@/assets/pro-sophie.jpg";

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "Reviews on REPS — every review tied to a real booking" },
      {
        name: "description",
        content:
          "Verified-booking reviews of coaches, studios, gyms, nutritionists and training providers on REPS. Only real clients. Pros own the response.",
      },
      { property: "og:title", content: "Reviews on REPS" },
      {
        property: "og:description",
        content:
          "Every review on REPS came from a real booking. Read reviews for coaches, gyms, studios, nutritionists and training providers.",
      },
      { property: "og:url", content: "/reviews" },
    ],
    links: [{ rel: "canonical", href: "/reviews" }],
  }),
  component: ReviewsPage,
});

/* ------------------------------------------------------------------ */
/* Data (Phase 1 placeholder)                                          */
/* ------------------------------------------------------------------ */

type Review = {
  id: string;
  author: string;
  authorCity: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  helpful: number;
  proName: string;
  proSlug: string;
  proRole: string;
  proImage: string;
  programme: string;
};

const EDITOR_PICKS: Review[] = [
  {
    id: "ep1",
    author: "Natalie S.",
    authorCity: "London",
    rating: 5,
    date: "2 weeks ago",
    title: "Changed how I think about training",
    body:
      "Six months in, I'm stronger than I've ever been and — more importantly — actually enjoy my sessions. The programming is thoughtful and James adjusts when life gets in the way.",
    helpful: 42,
    proName: "James Wilson",
    proSlug: "james-wilson",
    proRole: "Personal Trainer",
    proImage: proJames,
    programme: "1:1 Strength · 24 sessions",
  },
  {
    id: "ep2",
    author: "Marcus H.",
    authorCity: "Manchester",
    rating: 5,
    date: "1 month ago",
    title: "Best Pilates teacher I've worked with",
    body:
      "Sophie is patient, knowledgeable and genuinely cares about long-term mobility, not just \"feeling the burn\". My lower back issues have basically vanished.",
    helpful: 38,
    proName: "Sophie Taylor",
    proSlug: "sophie-taylor",
    proRole: "Pilates Instructor",
    proImage: proSophie,
    programme: "Reformer · Weekly",
  },
  {
    id: "ep3",
    author: "Tom W.",
    authorCity: "Edinburgh",
    rating: 5,
    date: "2 months ago",
    title: "Genuinely transformed my running",
    body:
      "Started with Liam to prep for a marathon and ended up rebuilding my whole training base. PB'd by 14 minutes. Couldn't recommend more highly.",
    helpful: 31,
    proName: "Liam Roberts",
    proSlug: "liam-roberts",
    proRole: "Strength Coach",
    proImage: proDaniel,
    programme: "Marathon Prep · 20 weeks",
  },
];

const REVIEWS: Review[] = [
  {
    id: "r4",
    author: "Priya M.",
    authorCity: "Bristol",
    rating: 5,
    date: "3 weeks ago",
    title: "Finally a nutritionist who gets it",
    body:
      "Laura gave me a plan I can actually live with. No food rules, no shame. We adjust monthly based on what's working. Down 8kg in 5 months and energy is the best it's been in years.",
    helpful: 27,
    proName: "Laura Bennett",
    proSlug: "laura-bennett",
    proRole: "Nutritionist",
    proImage: proLaura,
    programme: "Nutrition Plan · 6 months",
  },
  {
    id: "r5",
    author: "Daniel O.",
    authorCity: "Leeds",
    rating: 5,
    date: "5 days ago",
    title: "Took 30kg off my deadlift in 4 months",
    body:
      "Liam knows his stuff. Programming is challenging but never reckless, and he picks up form issues I'd never have noticed.",
    helpful: 19,
    proName: "Liam Roberts",
    proSlug: "liam-roberts",
    proRole: "Strength Coach",
    proImage: proDaniel,
    programme: "Powerlifting · 16 weeks",
  },
  {
    id: "r6",
    author: "Aisha K.",
    authorCity: "Birmingham",
    rating: 5,
    date: "1 month ago",
    title: "Postnatal Pilates that understands postpartum",
    body:
      "Sophie's postnatal sessions have been a lifeline. She knows when to push and when to ease back. Felt safe from session one.",
    helpful: 23,
    proName: "Sophie Taylor",
    proSlug: "sophie-taylor",
    proRole: "Pilates Instructor",
    proImage: proSophie,
    programme: "Postnatal Pilates · 12 weeks",
  },
  {
    id: "r7",
    author: "Ben J.",
    authorCity: "Glasgow",
    rating: 5,
    date: "2 weeks ago",
    title: "First gym I've actually stuck with",
    body:
      "Coaches know your name, programming is on the wall every week, the kit is properly maintained. Two years in and still showing up.",
    helpful: 14,
    proName: "James Wilson",
    proSlug: "james-wilson",
    proRole: "Personal Trainer",
    proImage: proJames,
    programme: "Open Gym Membership",
  },
];

const STATS = [
  { v: "12,400+", k: "Verified reviews" },
  { v: "4.9", k: "Average rating" },
  { v: "96%", k: "Would rebook" },
  { v: "100%", k: "Booking-verified" },
];

const RATING_BREAKDOWN: { stars: number; pct: number; count: string }[] = [
  { stars: 5, pct: 94, count: "12,070" },
  { stars: 4, pct: 4, count: "513" },
  { stars: 3, pct: 1, count: "128" },
  { stars: 2, pct: 0.5, count: "64" },
  { stars: 1, pct: 0.5, count: "65" },
];

const METHODOLOGY = [
  {
    icon: CalendarCheck,
    title: "Book through REPS",
    body: "Reviews are tied to a real booking on the platform. No booking, no review.",
  },
  {
    icon: Dumbbell,
    title: "Train with your pro",
    body: "Session, programme or course actually takes place — confirmed on both sides.",
  },
  {
    icon: MessageSquare,
    title: "Invited to review",
    body: "Automatic invite after your session. Never traded for a discount, prize or upgrade.",
  },
  {
    icon: Eye,
    title: "Moderated, then published",
    body: "Checked for legality, abuse and personal data — not for sentiment.",
  },
];

const PROFESSION_TILES = [
  { name: "Personal Training", slug: "personal-trainer", rating: "4.9", count: "6,420", icon: Dumbbell },
  { name: "Strength Coaching", slug: "strength-coach", rating: "4.9", count: "1,890", icon: Dumbbell },
  { name: "Group Exercise", slug: "group-exercise", rating: "4.8", count: "1,090", icon: Users },
  { name: "Online Coaching", slug: "online-coach", rating: "4.9", count: "1,440", icon: MessageSquare },
  { name: "Pilates", slug: "pilates-instructor", rating: "4.9", count: "1,340", icon: Sparkles },
  { name: "Yoga", slug: "yoga-teacher", rating: "4.9", count: "1,120", icon: Leaf },
  { name: "Nutrition", slug: "nutritionist", rating: "4.8", count: "980", icon: Leaf },
  { name: "Gyms & Studios", slug: "personal-trainer", rating: "4.8", count: "740", icon: Building2 },
  { name: "Training Providers", slug: "personal-trainer", rating: "4.8", count: "320", icon: GraduationCap },
];

const SORT_OPTIONS = ["Most recent", "Highest rated", "Most helpful"];

const WHY_PROS = [
  {
    icon: BadgeCheck,
    title: "Real clients only — no anonymous trolls.",
    body: "Only people who actually booked you through REPS can review you. No drive-by ratings, no competitors, no off-platform noise.",
  },
  {
    icon: MessageSquare,
    title: "You own the response.",
    body: "Every review comes with a public right of reply. Show future clients how you handle feedback — on the record, in your voice.",
  },
  {
    icon: Sparkles,
    title: "Reviews follow you everywhere on REPS.",
    body: "Verified reviews show on your shop-front, profile, enquire pages, and across profession and city search results. One source of truth.",
  },
];

const TRUST_MECHANICS = [
  {
    icon: BadgeCheck,
    title: "Verified-booking only",
    body: "If a client didn't book through REPS, they can't review. That's the whole point.",
  },
  {
    icon: Eye,
    title: "Moderated for legality, not sentiment",
    body: "We screen for defamation, abuse, spam and personal data. Honest opinions — positive or critical — stay live.",
  },
  {
    icon: MessageSquare,
    title: "Pros respond publicly",
    body: "One on-the-record reply per review. The response sits underneath every review for future clients to see.",
  },
  {
    icon: Flag,
    title: "Transparent reporting",
    body: "Anything removed is logged with a reason. We never let a pro quietly bury feedback, and we never let a reviewer break our policy.",
  },
];

const FAQ_ITEMS = [
  {
    q: "Who can leave a review on REPS?",
    a: "Only clients who booked and completed a session, programme or course with a REPS professional through the platform. Off-platform clients can't post here — by design.",
  },
  {
    q: "Can a business respond to a review?",
    a: "Yes — every pro, gym, studio and training provider on REPS gets one on-the-record public response per review. The response sits underneath the original review for every future client to see.",
  },
  {
    q: "How does REPS handle fake reviews?",
    a: "Reviews are gated to verified bookings, so the most common fake-review vector is closed off entirely. Anything flagged as suspicious (multi-account, off-platform incentives, paid posting) is investigated and removed, with the reason logged.",
  },
  {
    q: "Can a review be edited later?",
    a: "Reviewers can update a review once, up to 12 months after publishing. The previous version stays visible on the same card so the timeline is transparent.",
  },
  {
    q: "Where do reviews show up across REPS?",
    a: "On the pro's profile and shop-front, on their enquire page, on profession and city search results, and here on the public reviews hub. One verified source — everywhere.",
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function ReviewsPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-reps-ink text-reps-text">
      <PublicHeader />

      {/* ============ 1. HERO (dark) ============ */}
      <section className="relative isolate overflow-hidden bg-reps-black text-white">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(60%_70%_at_20%_0%,rgba(255,122,0,0.10),transparent_70%)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(55%_60%_at_85%_30%,rgba(255,122,0,0.06),transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-reps-ink"
        />

        <div className="relative mx-auto max-w-[1320px] px-6 pt-24 pb-20 lg:px-10 lg:pt-28 lg:pb-24">
          <div className="grid items-start gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            {/* Copy column */}
            <div>
              <MarketingHeroEyebrow icon={Star}>Reviews on REPS</MarketingHeroEyebrow>

              <h1
                className="mt-6 font-display text-[40px] font-bold leading-[1.05] text-white sm:text-[52px] lg:text-[64px] animate-fade-in"
                style={{ animationDelay: "80ms", animationDuration: "640ms" }}
              >
                Every review here came from{" "}
                <span className="text-reps-orange">a real booking.</span>
              </h1>

              <p
                className="mt-6 max-w-[560px] text-[16px] leading-relaxed text-white/80 animate-fade-in"
                style={{ animationDelay: "180ms", animationDuration: "560ms" }}
              >
                Coaches, studios, gyms, nutritionists and training providers — reviewed only by
                people who actually trained with them. Moderated for legality, not sentiment. Pros
                get a public right of reply.
              </p>

              <div
                className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-white/55 animate-fade-in"
                style={{ animationDelay: "260ms", animationDuration: "560ms" }}
              >
                <span className="inline-flex items-center gap-2">
                  <BadgeCheck className="size-3.5 text-reps-orange" /> Verified bookings only
                </span>
                <span className="inline-flex items-center gap-2">
                  <Eye className="size-3.5 text-reps-orange" /> Moderated for legality
                </span>
                <span className="inline-flex items-center gap-2">
                  <MessageSquare className="size-3.5 text-reps-orange" /> Pro right of reply
                </span>
              </div>

              <div
                className="mt-8 flex flex-wrap items-center gap-3 animate-fade-in"
                style={{ animationDelay: "340ms", animationDuration: "560ms" }}
              >
                <Link
                  to="/find-a-professional"
                  className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-reps-orange px-5 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
                >
                  Find a professional <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#methodology"
                  className="inline-flex h-11 items-center rounded-[10px] border border-reps-border bg-reps-panel/40 px-5 text-[14px] font-semibold text-white/80 hover:text-white"
                >
                  How a review gets here
                </a>
              </div>
            </div>

            {/* Score panel — anchored in hero */}
            <div
              className="relative rounded-[22px] border border-reps-border bg-reps-panel p-7 lg:p-8 animate-fade-in"
              style={{ animationDelay: "260ms", animationDuration: "640ms" }}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-[64px] font-bold leading-none text-white">
                      4.9
                    </span>
                    <span className="text-[13px] font-medium text-white/55">/ 5</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-reps-orange text-reps-orange" />
                    ))}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-emerald-300">
                  <BadgeCheck className="h-3 w-3" /> 100% verified
                </span>
              </div>

              <p className="mt-3 text-[12.5px] text-white/55">
                From 12,400+ verified reviews across REPS
              </p>

              <ul className="mt-6 space-y-2.5">
                {RATING_BREAKDOWN.map((r) => (
                  <li key={r.stars} className="flex items-center gap-3 text-[12.5px]">
                    <span className="w-3 text-right font-semibold text-white/80">{r.stars}</span>
                    <Star className="h-3 w-3 fill-reps-orange text-reps-orange" />
                    <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-reps-border">
                      <span
                        className="absolute inset-y-0 left-0 rounded-full bg-reps-orange"
                        style={{ width: `${Math.max(r.pct, 1)}%` }}
                      />
                    </span>
                    <span className="w-14 text-right tabular-nums text-white/55">{r.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 2. STAT STRIP (matches /about) ============ */}
      <section>
        <div className="mx-auto max-w-[1320px] px-6 pt-10 pb-16 lg:px-10 lg:pt-12 lg:pb-20">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px] border border-reps-border bg-reps-border lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.k} className="bg-reps-panel px-6 py-8 text-center">
                <div className="font-display text-[32px] font-bold leading-none text-white lg:text-[40px]">
                  {s.v}
                </div>
                <div className="mt-3 text-[12px] uppercase tracking-[0.14em] text-white/55 lg:tracking-[0.18em]">
                  {s.k}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 3. METHODOLOGY (dark, tinted) ============ */}
      <section id="methodology" className="bg-reps-panel/15">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <SectionHeader
            eyebrow="How a review gets here"
            heading="Four steps. No shortcuts."
            lede="A REPS review can only come from a real booking. Here's the exact path it takes — and what we will and won't do at each step."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {METHODOLOGY.map((m, i) => (
              <div
                key={m.title}
                className="relative flex flex-col rounded-[18px] border border-reps-border bg-reps-panel p-6"
              >
                <span className="absolute right-4 top-4 text-[11px] font-semibold uppercase tracking-wider text-white/45">
                  0{i + 1}
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-reps-border bg-reps-ink text-reps-orange">
                  <m.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 font-display text-[17px] font-bold text-white">{m.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 4. EDITOR'S PICKS (dark) ============ */}
      <section>
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <SectionHeader
            eyebrow="Editor's picks"
            heading="This week's stand-out reviews."
            lede="Three reviews from across the register, chosen for the detail and context they give a future client — not the score."
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {EDITOR_PICKS.map((r) => (
              <ReviewCard key={r.id} review={r} variant="pick" />
            ))}
          </div>
        </div>
      </section>

      {/* ============ 5. BROWSE BY SPECIALISM (dark, tinted) ============ */}
      <section className="bg-reps-panel/30">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <SectionHeader
            eyebrow="Browse by specialism"
            heading="Reviews across every kind of fitness pro."
            lede="Trainers, coaches, gyms, studios, nutritionists, Pilates and yoga teachers, and the training providers behind them."
          />
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PROFESSION_TILES.map((p) => (
              <Link
                key={p.name}
                to="/professions/$profession"
                params={{ profession: p.slug }}
                className="group flex items-center justify-between rounded-[18px] border border-reps-border bg-reps-panel p-5 transition-colors hover:border-reps-orange/40 hover:bg-reps-panel/70"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-reps-border bg-reps-ink text-white/70 transition-colors group-hover:text-reps-orange">
                    <p.icon className="h-5 w-5" strokeWidth={1.6} />
                  </span>
                  <div>
                    <div className="text-[14.5px] font-semibold text-white">{p.name}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-white/55">
                      <Star className="h-3 w-3 fill-reps-orange text-reps-orange" />
                      <span className="font-semibold text-white/80">{p.rating}</span>
                      <span>·</span>
                      <span>{p.count} reviews</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-white/45 transition-transform group-hover:translate-x-0.5 group-hover:text-reps-orange" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 6. THE FEED (dark) ============ */}
      <section>
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-[560px]">
              <SectionEyebrow>The full feed</SectionEyebrow>
              <SectionHeading className="mt-3">
                Latest reviews from verified clients.
              </SectionHeading>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                Sort
              </span>
              {SORT_OPTIONS.map((f, i) => (
                <button
                  key={f}
                  type="button"
                  className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
                    i === 0
                      ? "border-reps-orange/40 bg-reps-orange/15 text-reps-orange"
                      : "border-reps-border bg-reps-panel text-white/70 hover:border-reps-orange/40 hover:text-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {REVIEWS.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>

          <div className="mt-10 flex items-center justify-center">
            <button
              type="button"
              className="inline-flex h-11 items-center rounded-[10px] border border-reps-border bg-reps-panel px-6 text-[14px] font-semibold text-white/80 shadow-none hover:border-reps-orange/40 hover:text-white"
            >
              Load more reviews
            </button>
          </div>
        </div>
      </section>

      {/* ============ 7. WHY PROS CHOOSE REPS REVIEWS (dark, tinted) ============ */}
      <section className="bg-reps-panel/15">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <SectionHeader
            eyebrow="For professionals"
            heading="Why pros choose to be reviewed on REPS."
            lede="REPS reviews are built to work for the pro as much as the client. Real feedback, a fair right of reply, and one verified source that follows you across the platform."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {WHY_PROS.map((w) => (
              <article
                key={w.title}
                className="flex flex-col gap-3 rounded-[18px] border border-reps-border bg-reps-panel p-6"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-reps-border bg-reps-ink text-reps-orange">
                  <w.icon className="h-5 w-5" strokeWidth={1.7} />
                </span>
                <h3 className="font-display text-[17.5px] font-bold leading-tight text-white">
                  {w.title}
                </h3>
                <p className="text-[13.5px] leading-relaxed text-white/70">{w.body}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to="/for-professionals"
              className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-reps-orange px-5 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
            >
              List your business on REPS <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/features/visibility"
              className="text-[13.5px] font-semibold text-white/80 underline-offset-4 hover:text-white hover:underline"
            >
              See how reviews show on your profile →
            </Link>
          </div>
        </div>
      </section>

      {/* ============ 8. TRUST MECHANICS (dark) ============ */}
      <section>
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <SectionHeader
            eyebrow="Our commitments"
            heading="Four mechanics that make a review worth reading."
            lede="Not vibes. Hard-wired rules we publish, repeat and stick to as the platform grows."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_MECHANICS.map((t) => (
              <div
                key={t.title}
                className="flex flex-col rounded-[18px] border border-reps-border bg-reps-panel p-6"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-reps-border bg-reps-ink text-reps-orange">
                  <t.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 font-display text-[16.5px] font-bold text-white">{t.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 9. FAQ (dark, shared primitive) ============ */}
      <MarketingFaq heading="Reviews — straight answers." items={FAQ_ITEMS} />

      {/* ============ 10. FINAL CTA (dark, shared) ============ */}
      <FinalCta
        eyebrow={{ icon: Star, label: "Verified-booking reviews" }}
        heading="Find a coach"
        headingAccent="by what their clients actually said."
        lede="Search the register, filter by specialism and city, and read every review tied to a real booking."
        primary={{ to: "/find-a-professional", label: "Find a professional" }}
        secondary={{ to: "/for-professionals", label: "List your business" }}
      />

      <PublicFooter />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Review card (dark)                                                  */
/* ------------------------------------------------------------------ */

function ReviewCard({
  review: r,
  variant = "default",
}: {
  review: Review;
  variant?: "default" | "pick";
}) {
  const isPick = variant === "pick";

  return (
    <article
      className={`flex flex-col gap-4 rounded-[18px] border bg-reps-panel p-6 ${
        isPick ? "border-reps-orange/40" : "border-reps-border"
      }`}
    >
      {isPick ? (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-reps-orange/40 bg-reps-orange/15 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-reps-orange">
          <Sparkles className="h-3 w-3" /> Editor's pick
        </span>
      ) : null}

      {/* Reviewer */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-reps-border bg-reps-ink text-[12.5px] font-bold text-white">
            {r.author.split(" ").map((n) => n[0]).join("")}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-1.5 text-[13.5px] font-semibold text-white">
              {r.author}
              <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-emerald-300">
                <BadgeCheck className="h-2.5 w-2.5" /> Verified
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-white/55">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {r.authorCity}
              </span>
              <span>·</span>
              <span>{r.date}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${
                i <= r.rating ? "fill-reps-orange text-reps-orange" : "text-white/20"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Body */}
      <div>
        <h3 className="font-display text-[16.5px] font-bold leading-snug text-white">{r.title}</h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-white/75">{r.body}</p>
      </div>

      {/* Pro context */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-reps-border pt-4">
        <Link
          to="/pro/$slug"
          params={{ slug: r.proSlug }}
          className="group flex items-center gap-2.5"
        >
          <img
            src={r.proImage}
            alt={r.proName}
            className="h-9 w-9 rounded-[14px] object-cover"
            loading="lazy"
          />
          <div>
            <div className="text-[13px] font-semibold text-white group-hover:text-reps-orange">
              {r.proName}
            </div>
            <div className="text-[11.5px] text-white/55">
              {r.proRole} · {r.programme}
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-3 text-[11.5px] text-white/55">
          <span>{r.helpful} found helpful</span>
          <Link
            to="/pro/$slug"
            params={{ slug: r.proSlug }}
            className="inline-flex items-center gap-1 font-semibold text-reps-orange hover:underline"
          >
            View pro <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}
