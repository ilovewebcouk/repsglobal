import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  CalendarCheck,
  ChevronRight,
  Dumbbell,
  Eye,
  Flag,
  Leaf,
  Lock,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Timer,
  Users,
} from "lucide-react";

import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { MarketingHeroEyebrow } from "@/components/marketing/MarketingHeroEyebrow";
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
      { title: "Reviews you can actually trust | REPs" },
      {
        name: "description",
        content:
          "Verified-booking reviews of REPs professionals. Critical reviews stay live, pros can respond, and we never sell placement. See how it works.",
      },
      { property: "og:title", content: "Reviews you can actually trust — REPs" },
      {
        property: "og:description",
        content:
          "Only clients who actually booked through REPs can leave a review. Critical feedback stays live. No paid placement.",
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
  response?: { author: string; body: string; date: string };
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
  ...EDITOR_PICKS,
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
];

// Critical reviews that stay live, with public pro response
const CRITICAL_REVIEWS: Review[] = [
  {
    id: "c1",
    author: "Hannah R.",
    authorCity: "London",
    rating: 4,
    date: "1 week ago",
    title: "Great trainer, scheduling can be tricky",
    body:
      "James is a brilliant coach — sessions are always well-planned and I'm seeing real progress. Sometimes hard to book the slot I want at short notice, which is the only reason this isn't a 5.",
    helpful: 12,
    proName: "James Wilson",
    proSlug: "james-wilson",
    proRole: "Personal Trainer",
    proImage: proJames,
    programme: "1:1 Strength · 12 sessions",
    response: {
      author: "James Wilson",
      date: "5 days ago",
      body:
        "Thanks Hannah — totally fair. I've opened two more evening slots a week from next month and prioritised existing clients on the new times. Appreciate the honest feedback.",
    },
  },
  {
    id: "c2",
    author: "Ravi S.",
    authorCity: "Reading",
    rating: 3,
    date: "3 weeks ago",
    title: "Programme was solid, communication slipped mid-block",
    body:
      "Training itself was good and I made real progress. Replies between sessions went quiet for about a fortnight which knocked momentum. We've talked it through and it's improved.",
    helpful: 9,
    proName: "Liam Roberts",
    proSlug: "liam-roberts",
    proRole: "Strength Coach",
    proImage: proDaniel,
    programme: "Strength · 8 weeks",
    response: {
      author: "Liam Roberts",
      date: "2 weeks ago",
      body:
        "Fair call, Ravi. I was juggling exam-period clients and dropped the ball on async check-ins. New rule: every client gets a Monday and Thursday message, no exceptions.",
    },
  },
];

const STATS = [
  { value: "4.9", label: "Average rating", suffix: "/ 5" },
  { value: "12,840", label: "Verified reviews", suffix: "" },
  { value: "94%", label: "5-star reviews", suffix: "" },
  { value: "2,341", label: "Reviewed pros", suffix: "" },
];

const RATING_BREAKDOWN: { stars: number; pct: number; count: string }[] = [
  { stars: 5, pct: 94, count: "12,070" },
  { stars: 4, pct: 4, count: "513" },
  { stars: 3, pct: 1, count: "128" },
  { stars: 2, pct: 0.5, count: "64" },
  { stars: 1, pct: 0.5, count: "65" },
];

const HONEST_STATS = [
  { value: "0", label: "Reviews removed for being critical" },
  { value: "100%", label: "From verified bookings" },
  { value: "4hr", label: "Median time to publish" },
];

const METHODOLOGY = [
  {
    icon: CalendarCheck,
    title: "Book through REPs",
    body: "Reviews are tied to a booking on the platform. No booking, no review.",
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
    body: "Checked for legality and personal data — not sentiment. Critical reviews stay live.",
  },
];

const PROFESSION_TILES = [
  { name: "Personal Training", slug: "personal-trainer", rating: "4.9", count: "6,420", icon: Dumbbell },
  { name: "Strength Coaching", slug: "strength-coach", rating: "4.9", count: "1,890", icon: Dumbbell },
  { name: "Pilates", slug: "pilates-instructor", rating: "4.9", count: "1,340", icon: Sparkles },
  { name: "Yoga", slug: "yoga-teacher", rating: "4.9", count: "1,120", icon: Leaf },
  { name: "Nutrition", slug: "nutritionist", rating: "4.8", count: "980", icon: Leaf },
  { name: "Group Exercise", slug: "group-exercise", rating: "4.8", count: "1,090", icon: Users },
];

const FILTERS = ["All reviews", "5 stars", "4★ and under", "Most helpful", "Most recent"];

const TRUST_MECHANICS = [
  {
    icon: ShieldCheck,
    title: "Verified-booking only",
    body: "If you didn't book through REPs, you can't review. That's the whole point.",
  },
  {
    icon: BadgeCheck,
    title: "Critical reviews stay live",
    body: "We don't remove a 1, 2 or 3-star review because a pro asks us to. Ever.",
  },
  {
    icon: MessageSquare,
    title: "Pros can publicly respond",
    body: "One on-the-record reply per review. No deleting, no editing your way out of feedback.",
  },
  {
    icon: Flag,
    title: "Report a review, transparently",
    body: "If a review breaks our policy (defamation, personal data, hate), report it. We publish what we remove and why.",
  },
];

const FAQ_ITEMS = [
  {
    q: "Who can leave a review?",
    a: "Only clients who booked and completed a session with a REPs professional through the platform. Off-platform clients can't post here — by design.",
  },
  {
    q: "Can a pro pay to hide a bad review?",
    a: "No. There is no commercial path to removing a critical review. We don't sell placement on this page and we don't sell placement in search results either.",
  },
  {
    q: "Can REPs ever remove a review?",
    a: "Only if it breaks policy — defamatory claims, personal data, hate speech, or content unrelated to the service. Negative opinions don't qualify. We log every removal with a reason.",
  },
  {
    q: "What about reviews from off-platform clients?",
    a: "We don't import them. Other directories let pros paste in screenshots and old testimonials; we don't, because there's no way to verify they happened.",
  },
  {
    q: "Can I edit my review later?",
    a: "You can update a review once, up to 12 months after publishing. The previous version stays visible on the same card so the timeline is transparent.",
  },
  {
    q: "What's a \"Phase 1 placeholder\" stat?",
    a: "The headline numbers on this page are illustrative while we open the platform to early cohorts. They'll be replaced with live, automatically-refreshed numbers once we hit launch volume.",
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function ReviewsPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-[1320px] px-6 pt-6 lg:px-10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] text-white/55">
          <Link to="/" className="hover:text-white">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-white">Client Reviews</span>
        </nav>
      </div>

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
        <div className="relative mx-auto grid max-w-[1320px] gap-12 px-6 pt-20 pb-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-start lg:gap-16 lg:px-10 lg:pt-24 lg:pb-24">
          <div className="max-w-[640px]">
            <MarketingHeroEyebrow icon={Star}>Reviews</MarketingHeroEyebrow>

            <h1 className="mt-6 font-display text-[40px] font-bold leading-[1.05] text-white sm:text-[52px] lg:text-[64px]">
              Reviews you can <span className="text-reps-orange">actually trust.</span>
            </h1>

            <p className="mt-6 max-w-[560px] text-[16px] leading-relaxed text-white/80">
              Every review on REPs is tied to a booking that actually happened. We don't hide critical
              feedback, we don't sell placement, and we never trade reviews for discounts.
            </p>

            <form
              className="mt-8 grid gap-2 rounded-[18px] border border-reps-border bg-reps-panel/60 p-2 sm:grid-cols-[1fr_auto]"
              role="search"
            >
              <label className="flex items-center gap-2 rounded-[12px] bg-reps-ink/60 px-3 py-2.5">
                <Search className="h-4 w-4 text-white/55" />
                <input
                  type="text"
                  placeholder="Search reviews by pro, city or specialism"
                  className="w-full bg-transparent text-[14px] text-white placeholder:text-white/45 focus:outline-none"
                />
              </label>
              <button
                type="button"
                className="inline-flex h-[44px] items-center justify-center rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
              >
                Search reviews
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] text-white/55">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="size-3.5 text-reps-orange" /> Verified bookings only
              </span>
              <span className="inline-flex items-center gap-2">
                <Lock className="size-3.5 text-reps-orange" /> No paid placement
              </span>
              <span className="inline-flex items-center gap-2">
                <Timer className="size-3.5 text-reps-orange" /> Median publish 4hr
              </span>
            </div>
          </div>

          {/* Headline rating panel */}
          <aside className="rounded-[22px] border border-reps-border bg-reps-panel/60 p-6 backdrop-blur">
            <div className="flex items-center gap-4">
              <div className="font-display text-[56px] font-bold leading-none text-white">4.9</div>
              <div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-reps-orange text-reps-orange" />
                  ))}
                </div>
                <p className="mt-1 text-[12px] text-white/55">From 12,840 verified reviews</p>
              </div>
            </div>
            <ul className="mt-5 space-y-2">
              {RATING_BREAKDOWN.map((r) => (
                <li key={r.stars} className="flex items-center gap-2 text-[12px]">
                  <span className="w-3 text-white/55">{r.stars}</span>
                  <Star className="h-3 w-3 fill-reps-orange text-reps-orange" />
                  <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-reps-ink/70">
                    <span
                      className="absolute inset-y-0 left-0 rounded-full bg-reps-orange"
                      style={{ width: `${r.pct}%` }}
                    />
                  </span>
                  <span className="w-12 text-right text-white/55">{r.count}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-reps-border pt-5">
              {HONEST_STATS.map((s) => (
                <div key={s.label} className="rounded-[12px] bg-reps-ink/40 p-3 text-center">
                  <div className="font-display text-[20px] font-bold text-reps-orange">{s.value}</div>
                  <div className="mt-1 text-[10.5px] leading-tight text-white/55">{s.label}</div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {/* Stat strip */}
      <section className="bg-reps-panel/15">
        <div className="mx-auto max-w-[1320px] px-6 py-10 lg:px-10 lg:py-14">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-[16px] border border-reps-border bg-reps-panel/40 p-5 text-center"
              >
                <div className="font-display text-[28px] font-bold text-white lg:text-[36px]">
                  {s.value}
                  <span className="text-[14px] text-white/55"> {s.suffix}</span>
                </div>
                <div className="mt-1 text-[11.5px] font-semibold uppercase tracking-wider text-white/55">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-[11.5px] text-white/45">
            Updated weekly · Phase 1 placeholder data while we onboard early cohorts
          </p>
        </div>
      </section>

      {/* Methodology */}
      <section className="bg-reps-panel/30">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <SectionHeader
            eyebrow="How a REPs review is made"
            heading={
              <>
                Four steps. <span className="text-reps-orange">No shortcuts.</span>
              </>
            }
            lede="A REPs review can only come from a real booking. Here's the exact path it takes — and what we will and won't do at each step."
            align="center"
            className="mx-auto"
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {METHODOLOGY.map((m, i) => (
              <div
                key={m.title}
                className="relative rounded-[18px] border border-reps-border bg-reps-panel/40 p-6"
              >
                <span className="absolute right-4 top-4 text-[11px] font-semibold text-white/35">
                  0{i + 1}
                </span>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] border border-reps-orange-border bg-reps-orange-soft text-reps-orange">
                  <m.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 font-display text-[17px] font-bold text-white">{m.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">{m.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-[12.5px] text-white/55">
            Read the full{" "}
            <Link to="/" className="text-reps-orange hover:underline">
              review policy
            </Link>{" "}
            · Last reviewed June 2026
          </p>
        </div>
      </section>

      {/* Editor's Picks */}
      <section>
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <SectionHeader
            eyebrow="Editor's picks"
            heading={
              <>
                This week's <span className="text-reps-orange">stand-out reviews.</span>
              </>
            }
            lede="Three reviews from across the register, chosen for the detail and context they give a future client — not the score."
          />
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {EDITOR_PICKS.map((r) => (
              <ReviewCard key={r.id} review={r} variant="pick" />
            ))}
          </div>
        </div>
      </section>

      {/* Profession breakdown */}
      <section className="bg-reps-panel/15">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <SectionHeader
            eyebrow="By specialism"
            heading={
              <>
                Filter the register <span className="text-reps-orange">by what you train for.</span>
              </>
            }
            lede="Jump straight to verified reviews for the kind of pro you're looking for."
          />
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PROFESSION_TILES.map((p) => (
              <Link
                key={p.slug}
                to="/professions/$profession"
                params={{ profession: p.slug }}
                className="group flex items-center justify-between rounded-[18px] border border-reps-border bg-reps-panel/40 p-5 transition-colors hover:border-reps-orange-border hover:bg-reps-panel/60"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[12px] border border-reps-border bg-reps-ink/60 text-white/70 group-hover:text-reps-orange">
                    <p.icon className="h-5 w-5" strokeWidth={1.6} />
                  </span>
                  <div>
                    <div className="text-[14.5px] font-semibold text-white">{p.name}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-white/55">
                      <Star className="h-3 w-3 fill-reps-orange text-reps-orange" />
                      <span className="font-semibold text-white">{p.rating}</span>
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

      {/* Filters + grid */}
      <section>
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeader
              eyebrow="The full feed"
              heading={
                <>
                  Latest reviews from <span className="text-reps-orange">verified clients.</span>
                </>
              }
              className="max-w-[560px]"
            />
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f, i) => (
                <button
                  key={f}
                  type="button"
                  className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
                    i === 0
                      ? "border-reps-orange-border bg-reps-orange-soft text-reps-orange"
                      : "border-reps-border bg-reps-panel/40 text-white/75 hover:border-reps-orange-border hover:text-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {REVIEWS.slice(3).map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>

          <div className="mt-10 flex items-center justify-center">
            <button
              type="button"
              className="inline-flex h-11 items-center rounded-[10px] border border-reps-border bg-reps-panel/40 px-6 text-[14px] font-semibold text-white hover:border-reps-orange-border hover:text-reps-orange"
            >
              Load more reviews
            </button>
          </div>
        </div>
      </section>

      {/* Critical reviews — proof */}
      <section className="bg-reps-panel/30">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <SectionHeader
            eyebrow="We don't hide critical feedback"
            heading={
              <>
                Real 3 and 4-star reviews, <span className="text-reps-orange">with real responses.</span>
              </>
            }
            lede="Most directories quietly bury anything below 5 stars. We don't. Critical reviews stay live, and pros get exactly one on-the-record reply."
          />
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {CRITICAL_REVIEWS.map((r) => (
              <ReviewCard key={r.id} review={r} variant="critical" />
            ))}
          </div>
        </div>
      </section>

      {/* Trust mechanics */}
      <section>
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <SectionHeader
            eyebrow="Our commitments"
            heading={
              <>
                Four mechanics that make a review <span className="text-reps-orange">worth reading.</span>
              </>
            }
            lede="Not vibes. Hard-wired rules we'll publish, repeat and stick to as the platform grows."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_MECHANICS.map((t) => (
              <div
                key={t.title}
                className="rounded-[18px] border border-reps-border bg-reps-panel/40 p-6"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] border border-reps-orange-border bg-reps-orange-soft text-reps-orange">
                  <t.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 font-display text-[16.5px] font-bold text-white">{t.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <MarketingFaq
        heading={
          <>
            Reviews — <span className="text-reps-orange">straight answers.</span>
          </>
        }
        items={FAQ_ITEMS}
      />

      {/* Final CTA */}
      <FinalCta
        eyebrow={{ icon: Star, label: "Verified-booking reviews" }}
        heading="Find a coach"
        headingAccent="by what their clients actually said."
        lede="Search the register, filter by specialism and city, and read every review — including the critical ones."
        primary={{ to: "/find-a-professional", label: "Find a professional" }}
        secondary={{ to: "/for-professionals", label: "How reviews work for pros" }}
      />

      <PublicFooter />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Review card                                                         */
/* ------------------------------------------------------------------ */

function ReviewCard({
  review: r,
  variant = "default",
}: {
  review: Review;
  variant?: "default" | "pick" | "critical";
}) {
  const isPick = variant === "pick";
  const isCritical = variant === "critical";

  return (
    <article
      className={`flex flex-col gap-4 rounded-[18px] border bg-reps-panel/40 p-6 ${
        isPick
          ? "border-reps-orange-border bg-reps-panel/60"
          : "border-reps-border"
      }`}
    >
      {isPick ? (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-reps-orange-border bg-reps-orange-soft px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-reps-orange">
          <Sparkles className="h-3 w-3" /> Editor's pick
        </span>
      ) : null}

      {/* Reviewer */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-reps-border bg-reps-ink/60 text-[12.5px] font-bold text-white">
            {r.author.split(" ").map((n) => n[0]).join("")}
          </span>
          <div>
            <div className="flex items-center gap-1.5 text-[13.5px] font-semibold text-white">
              {r.author}
              <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-emerald-300">
                <BadgeCheck className="h-2.5 w-2.5" /> Verified
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11.5px] text-white/55">
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
        <h3 className="font-display text-[16.5px] font-bold leading-snug text-white">
          {r.title}
        </h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-white/80">{r.body}</p>
      </div>

      {/* Pro response */}
      {r.response ? (
        <div className="rounded-[12px] border border-reps-border bg-reps-ink/50 p-4">
          <div className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-wider text-white/55">
            <MessageSquare className="h-3 w-3 text-reps-orange" />
            Response from {r.response.author} · {r.response.date}
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-white/75">{r.response.body}</p>
        </div>
      ) : null}

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
          {isCritical ? null : (
            <Link
              to="/pro/$slug"
              params={{ slug: r.proSlug }}
              className="inline-flex items-center gap-1 font-semibold text-reps-orange hover:underline"
            >
              View pro <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
