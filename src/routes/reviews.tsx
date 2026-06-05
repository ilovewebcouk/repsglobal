import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  ChevronRight,
  MapPin,
  Quote,
  Search,
  ShieldCheck,
  Star,
  ThumbsUp,
  Users,
} from "lucide-react";

import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import proDaniel from "@/assets/pro-daniel.jpg";
import proJames from "@/assets/pro-james.jpg";
import proLaura from "@/assets/pro-laura.jpg";
import proSophie from "@/assets/pro-sophie.jpg";

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "Client Reviews of REPs Professionals | REPs" },
      {
        name: "description",
        content:
          "Real reviews from real clients of REPs-verified personal trainers, Pilates instructors, nutritionists and coaches. Only verified clients can leave a review.",
      },
      { property: "og:title", content: "Client Reviews — REPs" },
      {
        property: "og:description",
        content: "Verified-client reviews of REPs professionals worldwide.",
      },
      { property: "og:url", content: "/reviews" },
    ],
    links: [{ rel: "canonical", href: "/reviews" }],
  }),
  component: ReviewsPage,
});

/* ------------------------------------------------------------------ */
/* Data                                                                */
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
  verified: true;
};

const REVIEWS: Review[] = [
  {
    id: "r1",
    author: "Natalie S.",
    authorCity: "London",
    rating: 5,
    date: "2 weeks ago",
    title: "Changed how I think about training",
    body:
      "I came to James after years of half-hearted gym memberships. Six months in, I'm stronger than I've ever been and — more importantly — actually enjoy my sessions. The programming is thoughtful and he adjusts when life gets in the way. The REPs verification gave me confidence to commit; he completely earned it after that.",
    helpful: 42,
    proName: "James Wilson",
    proSlug: "james-wilson",
    proRole: "Personal Trainer",
    proImage: proJames,
    programme: "1:1 Strength · 24 sessions",
    verified: true,
  },
  {
    id: "r2",
    author: "Marcus H.",
    authorCity: "Manchester",
    rating: 5,
    date: "1 month ago",
    title: "Best Pilates teacher I've worked with",
    body:
      "Sophie is patient, knowledgeable and genuinely cares about long-term mobility, not just \"feeling the burn\". My lower back issues have basically vanished. Booking through REPs made the whole thing simple — payments, scheduling, all in one place.",
    helpful: 38,
    proName: "Sophie Taylor",
    proSlug: "sophie-taylor",
    proRole: "Pilates Instructor",
    proImage: proSophie,
    programme: "Reformer · Weekly",
    verified: true,
  },
  {
    id: "r3",
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
    verified: true,
  },
  {
    id: "r4",
    author: "Daniel O.",
    authorCity: "Leeds",
    rating: 5,
    date: "5 days ago",
    title: "Took 30kg off my deadlift in 4 months",
    body:
      "Liam knows his stuff. Programming is challenging but never reckless, and he picks up form issues I'd never have noticed. The weekly progress check-ins kept me honest.",
    helpful: 19,
    proName: "Liam Roberts",
    proSlug: "liam-roberts",
    proRole: "Strength Coach",
    proImage: proDaniel,
    programme: "Powerlifting · 16 weeks",
    verified: true,
  },
  {
    id: "r5",
    author: "Hannah R.",
    authorCity: "London",
    rating: 4,
    date: "1 week ago",
    title: "Great trainer, scheduling can be tricky",
    body:
      "James is a brilliant coach — sessions are always well-planned and I'm seeing real progress. Sometimes hard to book the slot I want at short notice, which is the only reason this isn't a 5. Worth the wait though.",
    helpful: 12,
    proName: "James Wilson",
    proSlug: "james-wilson",
    proRole: "Personal Trainer",
    proImage: proJames,
    programme: "1:1 Strength · 12 sessions",
    verified: true,
  },
  {
    id: "r6",
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
    verified: true,
  },
  {
    id: "r7",
    author: "Aisha K.",
    authorCity: "Birmingham",
    rating: 5,
    date: "1 month ago",
    title: "Postnatal Pilates that actually understands postpartum",
    body:
      "Sophie's postnatal sessions have been a lifeline. She knows when to push and when to ease back. Felt safe from session one.",
    helpful: 23,
    proName: "Sophie Taylor",
    proSlug: "sophie-taylor",
    proRole: "Pilates Instructor",
    proImage: proSophie,
    programme: "Postnatal Pilates · 12 weeks",
    verified: true,
  },
  {
    id: "r8",
    author: "Ben A.",
    authorCity: "London",
    rating: 5,
    date: "3 weeks ago",
    title: "Nutrition coaching that respects busy lives",
    body:
      "Laura works around shift patterns and travel. Plans are practical, not aesthetic Instagram fluff. Down 12% body fat, sleeping better, training harder.",
    helpful: 18,
    proName: "Laura Bennett",
    proSlug: "laura-bennett",
    proRole: "Nutritionist",
    proImage: proLaura,
    programme: "Nutrition Plan · 4 months",
    verified: true,
  },
];

const STATS = [
  { value: "4.9", label: "Average rating", suffix: "/ 5" },
  { value: "12,840", label: "Verified reviews", suffix: "" },
  { value: "94%", label: "5-star reviews", suffix: "" },
  { value: "2,341", label: "Active pros", suffix: "" },
];

const RATING_BREAKDOWN: { stars: number; pct: number; count: string }[] = [
  { stars: 5, pct: 94, count: "12,070" },
  { stars: 4, pct: 4, count: "513" },
  { stars: 3, pct: 1, count: "128" },
  { stars: 2, pct: 0.5, count: "64" },
  { stars: 1, pct: 0.5, count: "65" },
];

const FILTERS = ["All reviews", "5 stars", "4 stars", "Most helpful", "Most recent", "Verified only"];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function ReviewsPage() {
  return (
    <div className="min-h-screen bg-reps-ivory text-reps-charcoal">
      <PublicHeader variant="solid" />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-[1320px] px-6 pt-6 lg:px-10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] text-reps-muted-light">
          <Link to="/" className="hover:text-reps-charcoal">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-reps-charcoal">Client Reviews</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-[1320px] px-6 pb-10 pt-6 lg:px-10 lg:pb-14 lg:pt-10">
        <div className="grid items-end gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-reps-stone bg-reps-warm-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-reps-muted-light">
              <ShieldCheck className="h-3 w-3 text-reps-orange" />
              Verified-client reviews only
            </span>
            <h1 className="mt-4 font-display text-[40px] font-bold leading-[1.05] text-reps-charcoal lg:text-[56px]">
              Real reviews from <span className="text-reps-orange">real clients</span>
            </h1>
            <p className="mt-4 max-w-[620px] text-[16px] leading-relaxed text-reps-muted-light">
              Every review on REPs comes from someone who actually trained, coached or worked with the professional through our platform. No fake reviews, no paid placements.
            </p>

            <form className="mt-6 grid gap-2 rounded-[18px] border border-reps-stone bg-reps-warm-white p-2 sm:grid-cols-[1fr_auto]">
              <label className="flex items-center gap-2 rounded-[12px] bg-reps-ivory px-3 py-2.5">
                <Search className="h-4 w-4 text-reps-muted-light" />
                <input
                  type="text"
                  placeholder="Search reviews by trainer, city or specialism"
                  className="w-full bg-transparent text-[14px] text-reps-charcoal placeholder:text-reps-muted-light focus:outline-none"
                />
              </label>
              <button
                type="button"
                className="inline-flex h-[44px] items-center justify-center rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-dark"
              >
                Search reviews
              </button>
            </form>
          </div>

          {/* Headline rating panel */}
          <aside className="rounded-[22px] border border-reps-stone bg-reps-warm-white p-6">
            <div className="flex items-center gap-4">
              <div className="font-display text-[48px] font-bold leading-none text-reps-charcoal">4.9</div>
              <div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-reps-orange text-reps-orange" />
                  ))}
                </div>
                <p className="mt-1 text-[12px] text-reps-muted-light">From 12,840 verified reviews</p>
              </div>
            </div>
            <ul className="mt-5 space-y-2">
              {RATING_BREAKDOWN.map((r) => (
                <li key={r.stars} className="flex items-center gap-2 text-[12px]">
                  <span className="w-3 text-reps-muted-light">{r.stars}</span>
                  <Star className="h-3 w-3 fill-reps-orange text-reps-orange" />
                  <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-reps-ivory">
                    <span
                      className="absolute inset-y-0 left-0 rounded-full bg-reps-orange"
                      style={{ width: `${r.pct}%` }}
                    />
                  </span>
                  <span className="w-12 text-right text-reps-muted-light">{r.count}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      {/* Stat strip */}
      <section className="border-y border-reps-stone bg-reps-warm-white">
        <div className="mx-auto grid max-w-[1320px] grid-cols-2 gap-px bg-reps-stone px-6 py-0 lg:grid-cols-4 lg:px-10">
          {STATS.map((s) => (
            <div key={s.label} className="bg-reps-warm-white p-6 text-center">
              <div className="font-display text-[32px] font-bold text-reps-orange lg:text-[40px]">
                {s.value}
                <span className="text-[16px] text-reps-charcoal/70"> {s.suffix}</span>
              </div>
              <div className="mt-1 text-[12px] font-semibold uppercase tracking-wider text-reps-muted-light">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Filters + grid */}
      <section className="mx-auto max-w-[1320px] px-6 py-12 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-[26px] font-bold leading-tight text-reps-charcoal lg:text-[30px]">
            Latest verified reviews
          </h2>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f, i) => (
              <button
                key={f}
                type="button"
                className={`rounded-full border px-3 py-1.5 text-[12.5px] font-semibold ${
                  i === 0
                    ? "border-reps-orange bg-reps-orange/10 text-reps-orange"
                    : "border-reps-stone bg-reps-warm-white text-reps-charcoal hover:border-reps-orange hover:text-reps-orange"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {REVIEWS.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center">
          <button
            type="button"
            className="inline-flex h-11 items-center rounded-[10px] border border-reps-stone bg-reps-warm-white px-6 text-[14px] font-semibold text-reps-charcoal hover:border-reps-orange hover:text-reps-orange"
          >
            Load more reviews
          </button>
        </div>
      </section>

      {/* Trust callout */}
      <section className="bg-reps-warm-white py-14">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <div className="grid items-center gap-6 rounded-[22px] border border-reps-stone bg-reps-ivory p-8 lg:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Verified clients only", sub: "Only people who booked through REPs can leave a review." },
              { icon: BadgeCheck, title: "Moderated for honesty", sub: "Both positive and negative reviews stay live — we don't hide critical feedback." },
              { icon: Users, title: "Real names, real cities", sub: "No anonymous trolls. Reviewers verify their identity at booking." },
            ].map((t) => (
              <div key={t.title} className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-reps-warm-white text-reps-charcoal">
                  <t.icon className="h-6 w-6" strokeWidth={1.6} />
                </span>
                <div>
                  <div className="text-[15px] font-semibold text-reps-charcoal">{t.title}</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-reps-muted-light">{t.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-reps-ivory py-16">
        <div className="mx-auto max-w-[860px] px-6 text-center lg:px-10">
          <h2 className="font-display text-[32px] font-bold leading-tight text-reps-charcoal lg:text-[40px]">
            Find your next coach with confidence
          </h2>
          <p className="mt-3 text-[15px] text-reps-muted-light">
            Search verified professionals near you and read what real clients say before you commit.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/find-a-professional"
              className="inline-flex h-12 items-center rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-dark"
            >
              Find a professional
            </Link>
            <Link
              to="/for-professionals"
              className="inline-flex h-12 items-center rounded-[10px] border border-reps-stone bg-reps-warm-white px-7 text-[14px] font-semibold text-reps-charcoal hover:border-reps-orange hover:text-reps-orange"
            >
              I'm a professional
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Review card                                                         */
/* ------------------------------------------------------------------ */

function ReviewCard({ review: r }: { review: Review }) {
  return (
    <article className="flex flex-col gap-4 rounded-[18px] border border-reps-stone bg-reps-warm-white p-5">
      {/* Header — reviewer */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-reps-ivory text-[13px] font-bold text-reps-charcoal">
            {r.author
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </span>
          <div>
            <div className="flex items-center gap-1.5 text-[13.5px] font-semibold text-reps-charcoal">
              {r.author}
              <span className="inline-flex items-center gap-0.5 rounded-full bg-reps-green/15 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-reps-green ring-1 ring-reps-green/30">
                <BadgeCheck className="h-2.5 w-2.5" /> Verified
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11.5px] text-reps-muted-light">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {r.authorCity}</span>
              <span>·</span>
              <span>{r.date}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${i <= r.rating ? "fill-reps-orange text-reps-orange" : "text-reps-stone"}`}
            />
          ))}
        </div>
      </div>

      {/* Body */}
      <div>
        <h3 className="font-display text-[16px] font-bold leading-snug text-reps-charcoal">
          <Quote className="-mt-1 mr-1 inline h-3.5 w-3.5 text-reps-orange" />
          {r.title}
        </h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-reps-charcoal/85">{r.body}</p>
      </div>

      {/* Pro context + actions */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-reps-stone pt-3">
        <Link
          to="/pro/$slug"
          params={{ slug: r.proSlug }}
          className="group flex items-center gap-2.5"
        >
          <img
            src={r.proImage}
            alt={r.proName}
            className="h-9 w-9 rounded-full object-cover"
            loading="lazy"
          />
          <div>
            <div className="text-[13px] font-semibold text-reps-charcoal group-hover:text-reps-orange">
              {r.proName}
            </div>
            <div className="text-[11.5px] text-reps-muted-light">{r.proRole} · {r.programme}</div>
          </div>
        </Link>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-reps-stone bg-reps-ivory px-3 py-1.5 text-[12px] font-semibold text-reps-charcoal hover:border-reps-orange hover:text-reps-orange"
        >
          <ThumbsUp className="h-3 w-3" /> Helpful · {r.helpful}
        </button>
      </div>
    </article>
  );
}
