import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarCheck,
  ChevronRight,
  Dumbbell,
  Eye,
  GraduationCap,
  Leaf,
  MessageSquare,
  Quote,
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
import { HeroOverlay } from "@/components/marketing/HeroOverlay";

import heroImage from "@/assets/hero-trainer.jpg";
import proDaniel from "@/assets/pro-daniel.jpg";
import proJames from "@/assets/pro-james.jpg";
import proLaura from "@/assets/pro-laura.jpg";
import proSophie from "@/assets/pro-sophie.jpg";

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "Reviews on REPs — every review tied to a real booking" },
      {
        name: "description",
        content:
          "Verified-booking reviews of coaches, studios, gyms, nutritionists and training providers on REPs. Only real clients. Pros own the response.",
      },
      { property: "og:title", content: "Reviews on REPs" },
      {
        property: "og:description",
        content:
          "Every review on REPs came from a real booking. Read reviews for coaches, gyms, studios, nutritionists and training providers.",
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

const HERO_REVIEW: Review = {
  id: "h1",
  author: "Natalie S.",
  authorCity: "London",
  rating: 5,
  date: "14 Nov",
  title: "Changed how I think about training",
  body: "Six months in, I'm stronger than I've ever been and actually enjoy my sessions. The programming is thoughtful and James adjusts when life gets in the way.",
  helpful: 42,
  proName: "James Wilson",
  proSlug: "james-wilson",
  proRole: "Personal Trainer",
  proImage: proJames,
  programme: "1:1 Strength · 24 sessions",
};

const FEATURE_REVIEW: Review = {
  id: "f1",
  author: "Tom W.",
  authorCity: "Edinburgh",
  rating: 5,
  date: "2 months ago",
  title: "Genuinely transformed my running",
  body: "Started with Liam to prep for a marathon and ended up rebuilding my whole training base. PB'd by 14 minutes. The programming was relentless without ever feeling reckless — and the weekly check-ins meant nothing slipped.",
  helpful: 31,
  proName: "Liam Roberts",
  proSlug: "liam-roberts",
  proRole: "Strength Coach",
  proImage: proDaniel,
  programme: "Marathon Prep · 20 weeks",
};

const EDITOR_PICKS: Review[] = [
  {
    id: "ep1",
    author: "Marcus H.",
    authorCity: "Manchester",
    rating: 5,
    date: "1 month ago",
    title: "Best Pilates teacher I've worked with",
    body: "Sophie is patient, knowledgeable and genuinely cares about long-term mobility, not just \"feeling the burn\". My lower back issues have basically vanished.",
    helpful: 38,
    proName: "Sophie Taylor",
    proSlug: "sophie-taylor",
    proRole: "Pilates Instructor",
    proImage: proSophie,
    programme: "Reformer · Weekly",
  },
  {
    id: "ep2",
    author: "Priya M.",
    authorCity: "Bristol",
    rating: 5,
    date: "3 weeks ago",
    title: "Finally a nutritionist who gets it",
    body: "Laura gave me a plan I can actually live with. No food rules, no shame. We adjust monthly. Down 8kg in 5 months and energy is the best it's been in years.",
    helpful: 27,
    proName: "Laura Bennett",
    proSlug: "laura-bennett",
    proRole: "Nutritionist",
    proImage: proLaura,
    programme: "Nutrition Plan · 6 months",
  },
  {
    id: "ep3",
    author: "Daniel O.",
    authorCity: "Leeds",
    rating: 5,
    date: "5 days ago",
    title: "Took 30kg off my deadlift in 4 months",
    body: "Liam knows his stuff. Programming is challenging but never reckless, and he picks up form issues I'd never have noticed.",
    helpful: 19,
    proName: "Liam Roberts",
    proSlug: "liam-roberts",
    proRole: "Strength Coach",
    proImage: proDaniel,
    programme: "Powerlifting · 16 weeks",
  },
];

const REVIEWS: Review[] = [
  {
    id: "r4",
    author: "Aisha K.",
    authorCity: "Birmingham",
    rating: 5,
    date: "1 month ago",
    title: "Postnatal Pilates that understands postpartum",
    body: "Sophie's postnatal sessions have been a lifeline. She knows when to push and when to ease back. Felt safe from session one.",
    helpful: 23,
    proName: "Sophie Taylor",
    proSlug: "sophie-taylor",
    proRole: "Pilates Instructor",
    proImage: proSophie,
    programme: "Postnatal Pilates · 12 weeks",
  },
  {
    id: "r5",
    author: "Ben J.",
    authorCity: "Glasgow",
    rating: 5,
    date: "2 weeks ago",
    title: "First gym I've actually stuck with",
    body: "Coaches know your name, programming is on the wall every week, the kit is properly maintained. Two years in and still showing up.",
    helpful: 14,
    proName: "James Wilson",
    proSlug: "james-wilson",
    proRole: "Personal Trainer",
    proImage: proJames,
    programme: "Open Gym Membership",
  },
  {
    id: "r6",
    author: "Hannah R.",
    authorCity: "Cardiff",
    rating: 5,
    date: "1 week ago",
    title: "Online coaching that doesn't feel remote",
    body: "Weekly written check-ins, video form reviews, and a coach who actually reads what I send. Down two clothes sizes and lifting more than I ever did in a gym.",
    helpful: 17,
    proName: "Laura Bennett",
    proSlug: "laura-bennett",
    proRole: "Online Coach",
    proImage: proLaura,
    programme: "Online Coaching · 12 weeks",
  },
  {
    id: "r7",
    author: "Sam P.",
    authorCity: "Brighton",
    rating: 4,
    date: "3 weeks ago",
    title: "Solid programming, good communication",
    body: "Daniel knows his stuff and writes good plans. Took a week or two to dial in the right volume for me, but once we did it clicked.",
    helpful: 9,
    proName: "Daniel Roberts",
    proSlug: "daniel-roberts",
    proRole: "Strength Coach",
    proImage: proDaniel,
    programme: "Hybrid · 12 weeks",
  },
];

const TRUST_RAIL = [
  { v: "12,400+", k: "Verified reviews" },
  { v: "4.9", k: "Average rating" },
  { v: "96%", k: "Would rebook" },
  { v: "100%", k: "Booking-verified" },
];

const METHODOLOGY = [
  {
    icon: CalendarCheck,
    title: "Book through REPs",
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
    body: "Only people who actually booked you through REPs can review you. No drive-by ratings, no competitors, no off-platform noise.",
  },
  {
    icon: MessageSquare,
    title: "You own the response.",
    body: "Every review comes with a public right of reply. Show future clients how you handle feedback — on the record, in your voice.",
  },
  {
    icon: Sparkles,
    title: "Reviews follow you everywhere on REPs.",
    body: "Verified reviews show on your shop-front, profile, enquire pages, and across profession and city search results. One source of truth.",
  },
];

const FAQ_ITEMS = [
  {
    q: "How do you make sure reviews are real?",
    a: "Every review on REPs is tied to a real booking made through the platform. You can't review a pro you've never trained with. We never trade reviews for discounts, prizes or upgrades.",
  },
  {
    q: "Can pros remove reviews they don't like?",
    a: "No. Pros cannot remove honest reviews. They can flag a review for moderation (e.g. abuse, personal data, factual misrepresentation) and they always have a public right of reply on the same card.",
  },
  {
    q: "How does REPs handle fake reviews?",
    a: "Booking-tied identity, automated invite-after-session, behavioural checks on submission, and a human moderation step before publishing. We publicly remove fakes and don't quietly hide them.",
  },
  {
    q: "Can a review be edited later?",
    a: "Reviewers can update a review once, up to 12 months after publishing. The previous version stays visible on the same card so the timeline is transparent.",
  },
  {
    q: "Where do reviews show up across REPs?",
    a: "On the pro's profile and shop-front, on their enquire page, on profession and city search results, and here on the public reviews hub. One verified source — everywhere.",
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function ReviewsPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-reps-ivory">
      <PublicHeader variant="transparent" />

      {/* ============ 1. HERO (dark, image-led editorial) ============ */}
      <section className="relative isolate overflow-hidden bg-reps-black text-white">
        <img
          src={heroImage}
          alt="A REPs-registered personal trainer in a charcoal tee with an embroidered white REPS wordmark on the left chest, mid-coaching cue in a sunlit studio."
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
        />
        <HeroOverlay copySide="left" />

        <div className="relative mx-auto max-w-[1320px] px-6 pt-24 pb-20 lg:px-10 lg:pt-28 lg:pb-24">
          <div className="grid items-start gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            {/* Copy column */}
            <div>
              <MarketingHeroEyebrow icon={Star}>Reviews on REPs</MarketingHeroEyebrow>

              <h1
                className="mt-6 font-display text-[40px] font-bold leading-[1.05] text-white animate-fade-in sm:text-[52px] lg:text-[64px]"
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
                  className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
                >
                  Find a professional <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#methodology"
                  className="inline-flex h-12 items-center rounded-[10px] border border-white/25 bg-white/5 px-6 text-[14px] font-semibold text-white/85 shadow-none hover:bg-white/10 hover:text-white"
                >
                  How a review gets here
                </a>
              </div>
            </div>

            {/* Floating verified-review card — proof, not dashboard */}
            <div
              className="relative animate-fade-in lg:mt-2"
              style={{ animationDelay: "260ms", animationDuration: "640ms" }}
            >
              <div className="relative overflow-hidden rounded-[22px] border border-white/15 bg-reps-panel/85 p-7 backdrop-blur-md lg:p-8">
                <Quote className="absolute right-6 top-6 h-8 w-8 text-reps-orange/30" aria-hidden />

                <div className="flex items-center gap-1 text-reps-orange">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-reps-orange" />
                  ))}
                </div>

                <h2 className="mt-4 font-display text-[20px] font-bold leading-snug text-white lg:text-[22px]">
                  {HERO_REVIEW.title}
                </h2>
                <p className="mt-3 text-[14px] leading-relaxed text-white/80">
                  &ldquo;{HERO_REVIEW.body}&rdquo;
                </p>

                <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-reps-ink text-[12.5px] font-bold text-white">
                    {HERO_REVIEW.author.split(" ").map((n) => n[0]).join("")}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[13.5px] font-semibold text-white">
                      {HERO_REVIEW.author}
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-emerald-300">
                        <BadgeCheck className="h-2.5 w-2.5" /> Verified
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-[12px] text-white/55">
                      {HERO_REVIEW.programme} · with{" "}
                      <span className="text-white/75">{HERO_REVIEW.proName}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 2. TRUST RAIL (dark, slim — single stat moment) ============ */}
      <section className="bg-reps-ink">
        <div className="mx-auto max-w-[1320px] px-6 pt-10 pb-16 lg:px-10 lg:pt-12 lg:pb-20">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px] border border-reps-border bg-reps-border lg:grid-cols-4">
            {TRUST_RAIL.map((s) => (
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

      {/* ============ 3. EDITORIAL FEATURE REVIEW (light, magazine 50/50) ============ */}
      <section className="bg-reps-ivory">
        <div className="mx-auto grid max-w-[1320px] items-center gap-12 px-6 py-20 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:px-10 lg:py-28">
          <div className="relative">
            <div className="overflow-hidden rounded-[22px] border border-reps-stone bg-reps-warm-white">
              <img
                src={FEATURE_REVIEW.proImage}
                alt={`${FEATURE_REVIEW.proName}, ${FEATURE_REVIEW.proRole}, on REPs.`}
                className="aspect-[4/5] w-full object-cover"
                loading="lazy"
              />
            </div>
            <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-emerald-700 backdrop-blur">
              <BadgeCheck className="h-3 w-3" /> Verified booking
            </span>
          </div>

          <div>
            <SectionEyebrow>Featured review</SectionEyebrow>
            <Quote className="mt-5 h-10 w-10 text-reps-orange" aria-hidden />
            <p className="mt-4 font-display text-[28px] font-bold leading-[1.15] text-reps-ink lg:text-[36px]">
              &ldquo;{FEATURE_REVIEW.body}&rdquo;
            </p>
            <div className="mt-6 flex items-center gap-1 text-reps-orange">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-4 w-4 fill-reps-orange" />
              ))}
            </div>
            <div className="mt-4 text-[14px] text-reps-muted-light">
              <span className="font-semibold text-reps-ink">{FEATURE_REVIEW.author}</span>{" "}
              · {FEATURE_REVIEW.authorCity} · {FEATURE_REVIEW.programme}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                to="/c/$slug"
                params={{ slug: FEATURE_REVIEW.proSlug }}
                className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-reps-orange px-5 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
              >
                View {FEATURE_REVIEW.proName.split(" ")[0]}&rsquo;s shop-front
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#feed"
                className="text-[13.5px] font-semibold text-reps-ink/80 underline-offset-4 hover:text-reps-ink hover:underline"
              >
                Read more reviews →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 4. METHODOLOGY (light warm-white, numbered rail) ============ */}
      <section id="methodology" className="bg-reps-warm-white">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="max-w-[680px]">
            <SectionEyebrow>How a review gets here</SectionEyebrow>
            <SectionHeading className="mt-3 text-reps-ink">
              Four steps. No shortcuts.
            </SectionHeading>
            <p className="mt-5 text-[15.5px] leading-relaxed text-reps-muted-light">
              A REPs review can only come from a real booking. Here&rsquo;s the exact path it
              takes — and what we will and won&rsquo;t do at each step.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {METHODOLOGY.map((m, i) => (
              <div
                key={m.title}
                className="relative flex flex-col rounded-[18px] border border-reps-stone bg-reps-ivory p-6"
              >
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-reps-orange">
                  0{i + 1}
                </span>
                <span className="mt-4 flex h-11 w-11 items-center justify-center rounded-full border border-reps-stone bg-reps-warm-white text-reps-orange">
                  <m.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 font-display text-[17px] font-bold text-reps-ink">
                  {m.title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-reps-muted-light">
                  {m.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 5. EDITOR'S PICKS (light ivory) ============ */}
      <section className="bg-reps-ivory">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="max-w-[680px]">
            <SectionEyebrow>Editor&rsquo;s picks</SectionEyebrow>
            <SectionHeading className="mt-3 text-reps-ink">
              This week&rsquo;s stand-out reviews.
            </SectionHeading>
            <p className="mt-5 text-[15.5px] leading-relaxed text-reps-muted-light">
              Three reviews from across the register, chosen for the detail and context they give a
              future client — not the score.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {EDITOR_PICKS.map((r) => (
              <ReviewCard key={r.id} review={r} variant="pick" />
            ))}
          </div>
        </div>
      </section>

      {/* ============ 6. BROWSE BY SPECIALISM (light warm-white, mosaic) ============ */}
      <section className="bg-reps-warm-white">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="max-w-[680px]">
            <SectionEyebrow>Browse by specialism</SectionEyebrow>
            <SectionHeading className="mt-3 text-reps-ink">
              Reviews across every kind of fitness pro.
            </SectionHeading>
            <p className="mt-5 text-[15.5px] leading-relaxed text-reps-muted-light">
              Trainers, coaches, gyms, studios, nutritionists, Pilates and yoga teachers, and the
              training providers behind them.
            </p>
          </div>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PROFESSION_TILES.map((p) => (
              <Link
                key={p.name}
                to="/professions/$profession"
                params={{ profession: p.slug }}
                className="group flex items-center justify-between rounded-[18px] border border-reps-stone bg-reps-ivory p-5 transition-colors hover:border-reps-orange-border hover:bg-reps-warm-white"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-reps-stone bg-reps-warm-white text-reps-ink/70 transition-colors group-hover:text-reps-orange">
                    <p.icon className="h-5 w-5" strokeWidth={1.6} />
                  </span>
                  <div>
                    <div className="text-[14.5px] font-semibold text-reps-ink">{p.name}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-reps-muted-light">
                      <Star className="h-3 w-3 fill-reps-orange text-reps-orange" />
                      <span className="font-semibold text-reps-ink/80">{p.rating}</span>
                      <span>·</span>
                      <span>{p.count} reviews</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-reps-muted-light transition-transform group-hover:translate-x-0.5 group-hover:text-reps-orange" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 7. THE FEED (light ivory) ============ */}
      <section id="feed" className="bg-reps-ivory">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-[560px]">
              <SectionEyebrow>The full feed</SectionEyebrow>
              <SectionHeading className="mt-3 text-reps-ink">
                Latest reviews from verified clients.
              </SectionHeading>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-muted-light">
                Sort
              </span>
              {SORT_OPTIONS.map((f, i) => (
                <button
                  key={f}
                  type="button"
                  className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
                    i === 0
                      ? "border-reps-orange-border bg-reps-orange-soft text-reps-orange"
                      : "border-reps-stone bg-reps-warm-white text-reps-muted-light hover:border-reps-orange-border hover:text-reps-ink"
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
              className="inline-flex h-11 items-center rounded-[10px] border border-reps-stone bg-reps-warm-white px-6 text-[14px] font-semibold text-reps-ink/80 shadow-none hover:border-reps-orange-border hover:text-reps-ink"
            >
              Load more reviews
            </button>
          </div>
        </div>
      </section>

      {/* ============ 8. WHY PROS CHOOSE REPs REVIEWS (dark inset moment) ============ */}
      <section className="bg-reps-ivory">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="relative overflow-hidden rounded-[24px] border border-reps-border bg-reps-ink p-10 lg:p-16">
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(70%_70%_at_20%_0%,rgba(255,122,0,0.16),transparent_70%)]"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(55%_60%_at_85%_100%,rgba(255,122,0,0.08),transparent_70%)]"
            />
            <div className="relative">
              <div className="max-w-[680px]">
                <SectionEyebrow>For professionals</SectionEyebrow>
                <SectionHeading className="mt-3">
                  Why pros choose to be reviewed on REPs.
                </SectionHeading>
                <p className="mt-5 text-[15.5px] leading-relaxed text-white/70">
                  REPs reviews are built to work for the pro as much as the client. Real feedback,
                  a fair right of reply, and one verified source that follows you across the
                  platform.
                </p>
              </div>

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
                  List your business on REPs <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/features/visibility"
                  className="text-[13.5px] font-semibold text-white/80 underline-offset-4 hover:text-white hover:underline"
                >
                  See how reviews show on your profile →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 9. FAQ (light, shared primitive) ============ */}
      <MarketingFaq
        tone="light"
        heading="Reviews — straight answers."
        items={FAQ_ITEMS}
      />

      {/* ============ 10. FINAL CTA + footer (dark, shared) ============ */}
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
/* Review card (light)                                                 */
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
      className={`flex flex-col gap-4 rounded-[18px] border bg-reps-warm-white p-6 ${
        isPick ? "border-reps-orange-border" : "border-reps-stone"
      }`}
    >
      {isPick ? (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-reps-orange-border bg-reps-orange-soft px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-reps-orange">
          <Sparkles className="h-3 w-3" /> Editor&rsquo;s pick
        </span>
      ) : null}

      {/* Reviewer */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-reps-stone bg-reps-ivory text-[12.5px] font-bold text-reps-ink">
            {r.author.split(" ").map((n) => n[0]).join("")}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-1.5 text-[13.5px] font-semibold text-reps-ink">
              {r.author}
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-emerald-700">
                <BadgeCheck className="h-2.5 w-2.5" /> Verified
              </span>
            </div>
            <div className="mt-0.5 text-[12px] text-reps-muted-light">
              {r.authorCity} · {r.date}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5 text-reps-orange">
          {Array.from({ length: r.rating }).map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-reps-orange" />
          ))}
        </div>
      </div>

      {/* Body */}
      <div>
        <h3
          className={`font-display font-bold text-reps-ink ${
            isPick ? "text-[18px] leading-snug" : "text-[15.5px]"
          }`}
        >
          {r.title}
        </h3>
        <p
          className={`mt-2 leading-relaxed text-reps-muted-light ${
            isPick ? "text-[14px]" : "text-[13.5px]"
          }`}
        >
          {r.body}
        </p>
      </div>

      {/* Pro footer */}
      <Link
        to="/c/$slug"
        params={{ slug: r.proSlug }}
        className="mt-auto flex items-center gap-3 rounded-[12px] border border-reps-stone bg-reps-ivory p-3 transition-colors hover:border-reps-orange-border"
      >
        <img
          src={r.proImage}
          alt=""
          className="h-10 w-10 rounded-[14px] object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-reps-ink">{r.proName}</div>
          <div className="mt-0.5 truncate text-[11.5px] text-reps-muted-light">
            {r.proRole} · {r.programme}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-reps-muted-light" />
      </Link>
    </article>
  );
}
