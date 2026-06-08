/**
 * Visibility pillar mockups — presentation only, pure Tailwind + REPs tokens.
 * Used on /features/visibility 50/50 alternating sections.
 */
import {
  BadgeCheck,
  Camera,
  ChevronRight,
  Eye,
  Filter,
  Globe,
  MapPin,
  QrCode,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";

import proJames from "@/assets/pro-james.jpg";
import proSophie from "@/assets/pro-sophie.jpg";
import proLaura from "@/assets/pro-laura.jpg";
import proDaniel from "@/assets/pro-daniel.jpg";

/* ---------------- 1. Directory search results ---------------- */

export function SearchResultsMockup() {
  const results = [
    {
      img: proSophie,
      name: "Sophie Williams",
      tag: "Pilates Instructor",
      area: "Manchester · 0.8 mi",
      rating: 4.9,
      reviews: 128,
      pinned: true,
    },
    {
      img: proJames,
      name: "James O'Connor",
      tag: "Strength & Conditioning",
      area: "Manchester · 1.2 mi",
      rating: 4.8,
      reviews: 96,
    },
    {
      img: proLaura,
      name: "Laura Adebayo",
      tag: "Pre/post-natal · Rehab",
      area: "Salford · 2.4 mi",
      rating: 5.0,
      reviews: 64,
    },
  ];
  return (
    <div className="h-[420px] overflow-hidden bg-reps-ivory text-reps-charcoal">
      {/* Search bar */}
      <div className="flex items-center gap-2 border-b border-reps-stone bg-white px-4 py-2.5">
        <div className="flex flex-1 items-center gap-2 rounded-[10px] border border-reps-stone bg-reps-warm-white px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 text-reps-muted-light" />
          <span className="text-[11px] font-medium">Pilates</span>
          <span className="text-[10px] text-reps-muted-light">in</span>
          <MapPin className="h-3 w-3 text-reps-orange" />
          <span className="text-[11px] font-medium">Manchester</span>
        </div>
        <button className="inline-flex items-center gap-1 rounded-[10px] border border-reps-stone bg-white px-2.5 py-1.5 text-[10px] font-semibold">
          <Filter className="h-3 w-3" /> Filters
        </button>
      </div>
      {/* Result count + chips */}
      <div className="flex items-center justify-between border-b border-reps-stone bg-reps-warm-white px-4 py-1.5 text-[10px] text-reps-muted-light">
        <span>
          <span className="font-semibold text-reps-charcoal">48 verified pros</span> · within 5 mi
        </span>
        <span className="inline-flex items-center gap-1">
          <BadgeCheck className="h-3 w-3 text-reps-orange" />
          REPs Verified only
        </span>
      </div>
      {/* Results list */}
      <ul className="divide-y divide-reps-stone overflow-y-auto" style={{ maxHeight: "calc(100% - 76px)" }}>
        {results.map((r) => (
          <li
            key={r.name}
            className={`flex gap-3 px-4 py-3 ${r.pinned ? "bg-reps-orange-soft/40" : "bg-white"}`}
          >
            <img src={r.img} alt="" className="h-16 w-16 rounded-[14px] object-cover" />
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-semibold">{r.name}</span>
                <BadgeCheck className="h-3 w-3 text-reps-orange" />
                {r.pinned && (
                  <span className="ml-auto rounded-full bg-reps-orange px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
                    Featured
                  </span>
                )}
              </div>
              <div className="text-[10.5px] text-reps-muted-light">{r.tag}</div>
              <div className="mt-0.5 flex items-center gap-2 text-[10px] text-reps-muted-light">
                <span className="inline-flex items-center gap-0.5">
                  <Star className="h-2.5 w-2.5 fill-reps-orange text-reps-orange" />
                  <span className="font-semibold text-reps-charcoal">{r.rating}</span>
                  <span>· {r.reviews}</span>
                </span>
                <span>·</span>
                <span>{r.area}</span>
              </div>
            </div>
            <ChevronRight className="my-auto h-4 w-4 text-reps-muted-light" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- 2. Reviews on the record ---------------- */

export function ReviewsMockup() {
  const reviews = [
    {
      who: "Maria G.",
      when: "2 days ago",
      stars: 5,
      verified: true,
      text:
        "Six weeks in and I'm lifting heavier than I have in years. Sophie's programming is sharp and the check-ins keep me honest.",
    },
    {
      who: "Olu N.",
      when: "1 week ago",
      stars: 5,
      verified: true,
      text:
        "Came in post-injury and nervous. Felt safe from session one. The rehab progression has been brilliant.",
    },
    {
      who: "Aoife M.",
      when: "3 weeks ago",
      stars: 4,
      verified: true,
      text: "Loved the pre-natal block. Very knowledgeable and adaptable when I needed lighter days.",
    },
  ];
  return (
    <div className="h-[420px] overflow-hidden bg-reps-ivory text-reps-charcoal">
      <div className="border-b border-reps-stone bg-white px-4 py-3">
        <div className="flex items-end gap-3">
          <div className="font-display text-[36px] font-bold leading-none">4.9</div>
          <div>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-reps-orange text-reps-orange" />
              ))}
            </div>
            <div className="mt-0.5 text-[10.5px] text-reps-muted-light">
              <span className="font-semibold text-reps-charcoal">128 verified reviews</span> · collected by REPs
            </div>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-reps-orange-soft px-2 py-0.5 text-[10px] font-semibold text-reps-orange">
            <ShieldCheck className="h-3 w-3" />
            Cannot be deleted
          </span>
        </div>
        {/* breakdown bars */}
        <div className="mt-3 space-y-1">
          {[
            [5, 92],
            [4, 6],
            [3, 1],
            [2, 0],
            [1, 1],
          ].map(([s, pct]) => (
            <div key={s} className="flex items-center gap-2 text-[10px]">
              <span className="w-3 text-reps-muted-light">{s}</span>
              <Star className="h-2.5 w-2.5 fill-reps-orange text-reps-orange" />
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-reps-stone">
                <div className="h-full bg-reps-orange" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-7 text-right text-reps-muted-light">{pct}%</span>
            </div>
          ))}
        </div>
      </div>
      <ul className="divide-y divide-reps-stone overflow-y-auto" style={{ maxHeight: "calc(100% - 154px)" }}>
        {reviews.map((r) => (
          <li key={r.who} className="px-4 py-3">
            <div className="flex items-center gap-2 text-[11px]">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${i < r.stars ? "fill-reps-orange text-reps-orange" : "text-reps-stone"}`}
                  />
                ))}
              </div>
              <span className="font-semibold">{r.who}</span>
              {r.verified && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-reps-orange-soft px-1.5 py-0.5 text-[9px] font-semibold text-reps-orange">
                  <BadgeCheck className="h-2.5 w-2.5" />
                  Verified client
                </span>
              )}
              <span className="ml-auto text-[10px] text-reps-muted-light">{r.when}</span>
            </div>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-reps-charcoal/85">{r.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- 3. City & specialism SEO pages ---------------- */

export function SeoLandingMockup() {
  const pros = [
    { img: proSophie, name: "Sophie W.", spec: "Pilates", rating: 4.9 },
    { img: proJames, name: "James O.", spec: "Strength", rating: 4.8 },
    { img: proLaura, name: "Laura A.", spec: "Pre-natal", rating: 5.0 },
    { img: proDaniel, name: "Daniel K.", spec: "Hybrid", rating: 4.9 },
  ];
  return (
    <div className="h-[420px] overflow-hidden bg-reps-ivory text-reps-charcoal">
      {/* breadcrumb */}
      <div className="border-b border-reps-stone bg-white px-4 py-2 text-[10px] text-reps-muted-light">
        repsglobal.org / <span className="text-reps-charcoal">Find a pro</span> /{" "}
        <span className="text-reps-charcoal">Manchester</span> /{" "}
        <span className="font-semibold text-reps-orange">Pilates</span>
      </div>
      {/* H1 */}
      <div className="border-b border-reps-stone bg-white px-4 py-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-reps-orange-soft px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-reps-orange">
          <Globe className="h-2.5 w-2.5" />
          SEO landing
        </span>
        <h4 className="mt-1.5 font-display text-[16px] font-bold leading-tight">
          Pilates instructors in Manchester
        </h4>
        <p className="mt-0.5 text-[10.5px] leading-snug text-reps-muted-light">
          48 REPs-verified pros · ranked by reviews, recency and proximity. Updated daily.
        </p>
      </div>
      {/* featured grid */}
      <div className="grid grid-cols-2 gap-2 p-3">
        {pros.map((p) => (
          <div
            key={p.name}
            className="overflow-hidden rounded-[14px] border border-reps-stone bg-white"
          >
            <div className="relative h-[78px]">
              <img src={p.img} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full bg-white/95 px-1.5 py-0.5 text-[9px] font-semibold text-reps-orange">
                <BadgeCheck className="h-2.5 w-2.5" />
                Verified
              </span>
            </div>
            <div className="px-2 py-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span>{p.name}</span>
                <span className="inline-flex items-center gap-0.5 text-[10px] text-reps-orange">
                  <Star className="h-2.5 w-2.5 fill-reps-orange" />
                  {p.rating}
                </span>
              </div>
              <div className="text-[10px] text-reps-muted-light">{p.spec}</div>
            </div>
          </div>
        ))}
      </div>
      {/* ranking signal */}
      <div className="mx-3 mb-3 inline-flex items-center gap-1 rounded-[10px] bg-reps-orange-soft px-2 py-1 text-[10px] font-semibold text-reps-orange">
        <TrendingUp className="h-3 w-3" />
        Ranks for &ldquo;pilates manchester&rdquo; · powered by REPs
      </div>
    </div>
  );
}

/* ---------------- 4. Share kit, QR & social proof ---------------- */

export function ShareKitMockup() {
  return (
    <div className="flex h-[420px] flex-col bg-reps-ivory p-4 text-reps-charcoal">
      <div className="flex items-center gap-2 text-[11px] font-semibold">
        <Sparkles className="h-3.5 w-3.5 text-reps-orange" />
        Your share kit
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-reps-orange-soft px-2 py-0.5 text-[10px] text-reps-orange">
          <Eye className="h-3 w-3" /> 1,284 profile views · 30d
        </span>
      </div>
      <div className="mt-3 grid flex-1 grid-cols-2 gap-3">
        {/* Share card preview */}
        <div className="overflow-hidden rounded-[14px] border border-reps-stone bg-reps-ink text-white">
          <div className="relative h-[150px]">
            <img src={proSophie} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-reps-ink via-reps-ink/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-2">
              <div className="inline-flex items-center gap-1 rounded-full bg-reps-orange px-1.5 py-0.5 text-[9px] font-semibold">
                <BadgeCheck className="h-2.5 w-2.5" />
                REPs Verified
              </div>
              <div className="mt-1 font-display text-[14px] font-bold">Sophie Williams</div>
              <div className="text-[10px] text-white/75">repsglobal.org/c/sophie-w</div>
            </div>
          </div>
          <div className="flex items-center justify-between px-2.5 py-1.5 text-[10px] text-white/70">
            <span>Open Graph · 1200×630</span>
            <button className="inline-flex items-center gap-1 rounded-[8px] bg-white/10 px-2 py-0.5 font-semibold text-white">
              <Share2 className="h-3 w-3" />
              Share
            </button>
          </div>
        </div>
        {/* QR + asset list */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-1 flex-col items-center justify-center rounded-[14px] border border-reps-stone bg-white p-3">
            <div className="flex h-[88px] w-[88px] items-center justify-center rounded-[10px] border-2 border-reps-orange/30 bg-white">
              <QrCode className="h-16 w-16 text-reps-charcoal" strokeWidth={1.25} />
            </div>
            <div className="mt-2 text-[10px] font-semibold">QR · in-gym poster</div>
            <div className="text-[9.5px] text-reps-muted-light">Print, sticker or table card</div>
          </div>
          <ul className="space-y-1.5 text-[10.5px]">
            {[
              ["Instagram story", "1080×1920"],
              ["LinkedIn header", "1584×396"],
              ["Email signature", "PNG"],
            ].map(([n, s]) => (
              <li
                key={n}
                className="flex items-center justify-between rounded-[10px] border border-reps-stone bg-white px-2 py-1.5"
              >
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Camera className="h-3 w-3 text-reps-orange" />
                  {n}
                </span>
                <span className="text-[9.5px] text-reps-muted-light">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
