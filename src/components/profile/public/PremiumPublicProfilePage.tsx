import * as React from "react";
import { Link } from "@tanstack/react-router";
import {

  BadgeCheck,
  Bookmark,
  Calendar,
  Check,
  ChevronDown,
  GraduationCap,
  Image as ImageIcon,
  Laptop,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  Umbrella,
  Users,
  type LucideIcon,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LocationMap } from "@/components/pro/LocationMap";
import { Monogram } from "@/components/directory/Monogram";
import {
  getProfessionLabel,
  getProfessionPlural,
  getProfessionSlugFromLabel,
} from "@/lib/professions";

type ProfileService = {
  title: string;
  desc: string;
  price: string;
  unit: string;
  image: string | null;
  mode?: string | null;
  bullets?: string[];
  ctaLabel?: string | null;
  isFeatured?: boolean;
};

type ProfileQualification = {
  badge: string;
  title: string;
  issuer: string;
  id: string;
  issued: string;
  verified?: boolean;
  expires?: string | null;
};

type ProfileTrust = {
  verified: boolean;
  insuranceExpiry: string | null;
  cpd?: { done: number; total: number } | null;
  qualificationsCheckedAt?: string | null;
  identityVerifiedAt?: string | null;
};

type PremiumProfile = {
  slug: string;
  name: string;
  firstName: string;
  role: string;
  professionSlug?: string | null;
  location: string;
  region: string;
  rating: number;
  reviews: number;
  modes: ("In-person" | "Online")[];
  blurb: string;
  image: string | null;
  years: number;
  clients: string;
  bio: string[];
  specialisms: string[];
  services: ProfileService[];
  qualifications: ProfileQualification[];
  gyms?: { label: string; branch: string }[];
  lat?: number | null;
  lng?: number | null;
  memberSince?: string | null;
  trust?: ProfileTrust;
  gallery?: { id: string; url: string }[];
  faqs: { q: string; a: string; open?: boolean }[];
};

type PublicReview = {
  id: string;
  client_name: string;
  rating: number;
  title?: string | null;
  body: string;
  published_at?: string | null;
  created_at: string;
};

type ReviewSummary = {
  rating: number;
  count: number;
  dist: { stars: number; count: number }[];
  maxCount: number;
};

type Props = {
  pro: PremiumProfile;
  slug: string;
  professionalId: string | null;
  reviewSummary: ReviewSummary;
  reviews: PublicReview[];
  formatReviewWhen: (iso: string) => string;
  onTrackCta?: (cta: string) => void;
  onSaveProfile?: () => void;
};

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDateShort(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function verifiedReviewLabel(count: number): string {
  if (count <= 0) return "No verified reviews yet";
  return `${count} verified ${count === 1 ? "review" : "reviews"}`;
}

function buildBestFor(pro: PremiumProfile): string[] {
  const items: string[] = [];
  if (pro.modes.includes("In-person")) {
    items.push(`People looking for in-person coaching in ${pro.location}`);
  }
  if (pro.modes.includes("Online")) {
    items.push("Clients who want online coaching and accountability");
  }
  for (const s of pro.specialisms.slice(0, 3)) {
    items.push(`People focused on ${s.toLowerCase()}`);
  }
  if (pro.services.length > 0) {
    items.push("People ready to enquire about structured coaching");
  }
  return Array.from(new Set(items)).slice(0, 4);
}

function enquiryHref(slug: string): string {
  return `/pro/${slug}/enquire`;
}

export function PremiumPublicProfilePage({
  pro,
  slug,
  professionalId: _professionalId,
  reviewSummary,
  reviews,
  formatReviewWhen,
  onTrackCta,
  onSaveProfile,
}: Props) {
  const profSlug = pro.professionSlug ?? getProfessionSlugFromLabel(pro.role);
  const profPlural = profSlug ? getProfessionPlural(profSlug) ?? getProfessionLabel(profSlug) : null;
  const bestFor = buildBestFor(pro);

  return (
    <div className="min-h-screen bg-reps-ivory pb-24 lg:pb-0">
      <PublicHeader variant="solid" />

      <div className="mx-auto max-w-[1280px] px-4 pt-4 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Find a professional", to: "/find-a-pro" },
            ...(profPlural && profSlug
              ? [{ label: profPlural, to: `/find-a-pro?profession=${profSlug}` }]
              : []),
            { label: pro.name },
          ]}
        />
      </div>

      {/* HERO */}
      <section className="mx-auto max-w-[1280px] px-4 pt-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <HeroImage pro={pro} />
          </div>
          <div className="lg:col-span-4">
            <HeroIdentity
              pro={pro}
              reviewSummary={reviewSummary}
              onSaveProfile={onSaveProfile}
              onTrackCta={onTrackCta}
            />
          </div>
          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-24">
              <EnquiryCard
                pro={pro}
                slug={slug}
                professionalId={_professionalId}
                onTrackCta={onTrackCta}
              />
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="mx-auto mt-10 max-w-[1280px] px-4 lg:px-8">
        <TrustStrip pro={pro} />
      </section>

      {/* BEST FOR */}
      {bestFor.length > 0 ? (
        <section className="mx-auto mt-10 max-w-[1280px] px-4 lg:px-8">
          <BestForSection items={bestFor} firstName={pro.firstName} />
        </section>
      ) : null}

      {/* MAIN GRID */}
      <div className="mx-auto mt-10 grid max-w-[1280px] gap-8 px-4 lg:grid-cols-3 lg:px-8">
        <div className="space-y-8 lg:col-span-2">
          <AboutSection pro={pro} />
          <ServicesSection pro={pro} slug={slug} onTrackCta={onTrackCta} />
          <QualificationsSection pro={pro} />
          <ReviewsSection
            reviewSummary={reviewSummary}
            reviews={reviews}
            formatReviewWhen={formatReviewWhen}
          />
          <FaqSection faqs={pro.faqs} />
        </div>

        <aside className="space-y-6">
          <QuickDetails pro={pro} />
          <LocationCoverage pro={pro} />
          <TrustAssurance pro={pro} />
        </aside>
      </div>

      {/* BOTTOM CTA */}
      <section className="mx-auto mt-16 max-w-[1280px] px-4 lg:px-8">
        <BottomCta pro={pro} slug={slug} onTrackCta={onTrackCta} />
      </section>

      <PublicFooter />

      <MobileStickyCta pro={pro} slug={slug} onTrackCta={onTrackCta} />
    </div>
  );
}

/* -------------------------- Sub-components -------------------------- */

function HeroImage({ pro }: { pro: PremiumProfile }) {
  const hasGallery = (pro.gallery?.length ?? 0) > 0;
  return (
    <div className="relative overflow-hidden rounded-[20px] bg-reps-warm-white ring-1 ring-reps-stone">
      <div className="aspect-[4/5] w-full">
        {pro.image ? (
          <img src={pro.image} alt={pro.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-reps-ivory">
            <Monogram name={pro.name} size={140} />
          </div>
        )}
      </div>
      {hasGallery ? (
        <button
          type="button"
          className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full bg-reps-charcoal/85 px-3 py-1.5 text-[12px] font-semibold text-reps-warm-white backdrop-blur"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          View photos
        </button>
      ) : null}
    </div>
  );
}

function HeroIdentity({
  pro,
  reviewSummary,
  onSaveProfile,
  onTrackCta,
}: {
  pro: PremiumProfile;
  reviewSummary: ReviewSummary;
  onSaveProfile?: () => void;
  onTrackCta?: (cta: string) => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {pro.trust?.verified ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            REPS Verified Professional
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-reps-ivory px-3 py-1 text-[12px] font-semibold text-reps-muted-light ring-1 ring-reps-stone">
            Verification pending
          </span>
        )}
      </div>

      <h1 className="mt-4 font-display text-[34px] font-bold leading-[1.1] tracking-tight text-reps-charcoal lg:text-[40px]">
        {pro.name}
      </h1>
      <div className="mt-1 text-[15px] font-semibold text-reps-charcoal/80">{pro.role}</div>

      {pro.blurb ? (
        <p className="mt-4 text-[15px] leading-relaxed text-reps-muted-light">{pro.blurb}</p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-reps-muted-light">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-4 w-4" />
          {pro.location}
          {pro.region ? `, ${pro.region}` : ""}
        </span>
        {reviewSummary.count > 0 ? (
          <span className="inline-flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            <span className="font-semibold text-reps-charcoal">{reviewSummary.rating.toFixed(1)}</span>
            <span>{verifiedReviewLabel(reviewSummary.count)}</span>
          </span>
        ) : (
          <span>{verifiedReviewLabel(0)}</span>
        )}
      </div>

      {pro.modes.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {pro.modes.map((mode) => (
            <span
              key={mode}
              className="inline-flex items-center gap-1.5 rounded-full bg-reps-warm-white px-3 py-1 text-[12px] font-semibold text-reps-charcoal ring-1 ring-reps-stone"
            >
              {mode === "Online" ? <Laptop className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
              {mode}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          to={enquiryHref(pro.slug)}
          onClick={() => onTrackCta?.("hero_enquiry")}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-reps-orange px-6 text-[14px] font-bold text-white transition hover:bg-reps-orange-dark"
        >
          <MessageCircle className="h-4 w-4" />
          Send enquiry
        </Link>
        {onSaveProfile ? (
          <button
            type="button"
            onClick={onSaveProfile}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-reps-warm-white px-5 text-[14px] font-semibold text-reps-charcoal ring-1 ring-reps-stone transition hover:bg-reps-ivory"
          >
            <Bookmark className="h-4 w-4" />
            Save profile
          </button>
        ) : null}
      </div>
    </div>
  );
}

function EnquiryCard({
  pro,
  professionalId: _pid,
  onTrackCta,
}: {
  pro: PremiumProfile;
  slug: string;
  professionalId: string | null;
  onTrackCta?: (cta: string) => void;
}) {
  return (
    <div className="rounded-[20px] bg-reps-warm-white p-6 shadow-sm ring-1 ring-reps-stone">
      <div className="text-[13px] font-semibold uppercase tracking-wide text-reps-muted-light">
        Contact
      </div>
      <h2 className="mt-1 font-display text-[22px] font-bold text-reps-charcoal">
        Work with {pro.firstName}
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-reps-muted-light">
        Send a private enquiry. Your details are shared only with this professional.
      </p>

      <ul className="mt-4 space-y-2 text-[13px] text-reps-charcoal">
        <CheckRow>Private platform enquiry</CheckRow>
        <CheckRow>No obligation to book</CheckRow>
        <CheckRow>Verified profile evidence shown above</CheckRow>
      </ul>

      {pro.services[0] ? (
        <div className="mt-5 rounded-[12px] bg-reps-ivory p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-reps-muted-light">
            From
          </div>
          <div className="mt-0.5 font-display text-[22px] font-bold text-reps-charcoal">
            {pro.services[0].price}
          </div>
          {pro.services[0].unit ? (
            <div className="text-[12px] text-reps-muted-light">{pro.services[0].unit}</div>
          ) : null}
        </div>
      ) : null}

      <Link
        to={enquiryHref(pro.slug)}
        onClick={() => onTrackCta?.("sidebar_enquiry")}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-reps-orange px-5 text-[14px] font-bold text-white transition hover:bg-reps-orange-dark"
      >
        <MessageCircle className="h-4 w-4" />
        Send enquiry
      </Link>
    </div>
  );
}

function TrustStrip({ pro }: { pro: PremiumProfile }) {
  const insuranceDate = formatDateShort(pro.trust?.insuranceExpiry);
  const qualDate = formatDateShort(pro.trust?.qualificationsCheckedAt);
  return (
    <div className="grid gap-4 rounded-[16px] bg-reps-warm-white p-5 ring-1 ring-reps-stone sm:grid-cols-3">
      <TrustTile
        icon={ShieldCheck}
        title="Verified identity"
        body={pro.trust?.verified ? "Identity confirmed" : "Not fully verified"}
        positive={!!pro.trust?.verified}
      />
      <TrustTile
        icon={GraduationCap}
        title="Qualifications"
        body={qualDate ? `Checked ${qualDate}` : `${pro.qualifications.length} evidenced`}
        positive={pro.qualifications.length > 0}
      />
      <TrustTile
        icon={Umbrella}
        title="Insurance"
        body={insuranceDate ? `Active until ${insuranceDate}` : "Not shown"}
        positive={!!insuranceDate}
      />
    </div>
  );
}

function BestForSection({ items, firstName }: { items: string[]; firstName: string }) {
  return (
    <div className="rounded-[16px] bg-reps-warm-white p-6 ring-1 ring-reps-stone">
      <div className="mb-4">
        <h2 className="font-display text-[20px] font-bold text-reps-charcoal">Best for</h2>
        <p className="mt-1 text-[13px] text-reps-muted-light">
          {firstName} may be a good fit if you are looking for:
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-[14px] text-reps-charcoal">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
              <Check className="h-3 w-3" />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AboutSection({ pro }: { pro: PremiumProfile }) {
  return (
    <section className="rounded-[16px] bg-reps-warm-white p-6 ring-1 ring-reps-stone">
      <h2 className="font-display text-[22px] font-bold text-reps-charcoal">About {pro.firstName}</h2>
      {pro.bio.length > 0 ? (
        <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-reps-charcoal/85">
          {pro.bio.slice(0, 3).map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-[14px] text-reps-muted-light">
          {pro.firstName} has not added a full bio yet. You can still send an enquiry to ask about
          services, experience and availability.
        </p>
      )}
      {pro.specialisms.length > 0 ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {pro.specialisms.slice(0, 3).map((s) => (
            <div key={s} className="rounded-[12px] bg-reps-ivory p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-reps-muted-light">
                Focus
              </div>
              <div className="mt-0.5 text-[14px] font-semibold text-reps-charcoal">{s}</div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ServicesSection({
  pro,
  onTrackCta,
}: {
  pro: PremiumProfile;
  slug: string;
  onTrackCta?: (cta: string) => void;
}) {
  return (
    <section className="rounded-[16px] bg-reps-warm-white p-6 ring-1 ring-reps-stone">
      <div className="mb-5">
        <h2 className="font-display text-[22px] font-bold text-reps-charcoal">Services &amp; pricing</h2>
        <p className="mt-1 text-[13px] text-reps-muted-light">
          Compare available services and enquire about the right option.
        </p>
      </div>

      {pro.services.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3">
          {pro.services.map((service) => (
            <div
              key={service.title}
              className="relative flex flex-col rounded-[14px] bg-reps-ivory p-5 ring-1 ring-reps-stone"
            >
              {service.isFeatured ? (
                <span className="absolute -top-2.5 left-4 rounded-full bg-reps-orange px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                  Featured
                </span>
              ) : null}

              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-warm-white text-reps-charcoal ring-1 ring-reps-stone">
                {service.mode === "online" ? <Laptop className="h-5 w-5" /> : <Users className="h-5 w-5" />}
              </div>

              <h3 className="mt-3 font-display text-[16px] font-bold text-reps-charcoal">
                {service.title}
              </h3>
              {service.desc ? (
                <p className="mt-1 text-[13px] leading-relaxed text-reps-muted-light">{service.desc}</p>
              ) : null}

              {service.bullets && service.bullets.length > 0 ? (
                <ul className="mt-3 space-y-1.5 text-[13px] text-reps-charcoal">
                  {service.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-auto pt-5">
                <div className="font-display text-[20px] font-bold text-reps-charcoal">
                  {service.price}
                </div>
                {service.unit ? (
                  <div className="text-[12px] text-reps-muted-light">{service.unit}</div>
                ) : null}
                <Link
                  to={enquiryHref(pro.slug)}
                  onClick={() => onTrackCta?.(`service_${service.title}`)}
                  className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[12px] bg-reps-charcoal px-4 text-[13px] font-bold text-reps-warm-white transition hover:brightness-110"
                >
                  {service.ctaLabel || "Enquire"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[12px] bg-reps-ivory p-6 text-center">
          <div className="font-display text-[16px] font-bold text-reps-charcoal">Services coming soon</div>
          <p className="mt-1 text-[13px] text-reps-muted-light">
            {pro.firstName} has not published detailed services yet. Send an enquiry to ask about
            coaching options and prices.
          </p>
          <Link
            to={enquiryHref(pro.slug)}
            onClick={() => onTrackCta?.("services_empty_enquiry")}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-[12px] bg-reps-orange px-5 text-[13px] font-bold text-white"
          >
            Ask about services
          </Link>
        </div>
      )}
    </section>
  );
}

function QuickDetails({ pro }: { pro: PremiumProfile }) {
  const rows: Array<{ label: string; value: string }> = [];
  if (pro.specialisms.length) rows.push({ label: "Specialisms", value: pro.specialisms.slice(0, 5).join(", ") });
  if (pro.modes.length) rows.push({ label: "Training modes", value: pro.modes.join(" · ") });
  if (pro.services[0]) rows.push({ label: "Starting from", value: [pro.services[0].price, pro.services[0].unit].filter(Boolean).join(" ") });
  if (pro.qualifications.length) rows.push({ label: "Qualifications", value: `${pro.qualifications.length} verified item${pro.qualifications.length === 1 ? "" : "s"}` });
  if (!rows.length) return null;
  return (
    <div className="rounded-[16px] bg-reps-warm-white p-5 ring-1 ring-reps-stone">
      <h3 className="font-display text-[16px] font-bold text-reps-charcoal">Quick details</h3>
      <dl className="mt-3 divide-y divide-reps-stone/60 text-[13px]">
        {rows.map((row) => (
          <div key={row.label} className="flex gap-3 py-2.5">
            <dt className="w-1/3 shrink-0 text-reps-muted-light">{row.label}</dt>
            <dd className="min-w-0 flex-1 font-medium text-reps-charcoal">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function LocationCoverage({ pro }: { pro: PremiumProfile }) {
  return (
    <div className="rounded-[16px] bg-reps-warm-white p-5 ring-1 ring-reps-stone">
      <h3 className="font-display text-[16px] font-bold text-reps-charcoal">Location &amp; coverage</h3>
      <div className="mt-3 overflow-hidden rounded-[12px] ring-1 ring-reps-stone">
        <div className="relative h-40 w-full">
          {pro.lat != null && pro.lng != null ? (
            <LocationMap lat={pro.lat} lng={pro.lng} label={pro.location} />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-reps-ivory text-reps-muted-light">
              <MapPin className="h-5 w-5" />
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 text-[14px] font-semibold text-reps-charcoal">Based in {pro.location}</div>
      {pro.region ? <div className="text-[12px] text-reps-muted-light">{pro.region}</div> : null}
      <Link
        to={enquiryHref(pro.slug)}
        className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-[10px] bg-reps-ivory text-[13px] font-semibold text-reps-charcoal ring-1 ring-reps-stone transition hover:bg-reps-warm-white"
      >
        Ask if {pro.firstName} covers your area
      </Link>
    </div>
  );
}

function QualificationsSection({ pro }: { pro: PremiumProfile }) {
  return (
    <section className="rounded-[16px] bg-reps-warm-white p-6 ring-1 ring-reps-stone">
      <h2 className="font-display text-[22px] font-bold text-reps-charcoal">Qualifications &amp; credentials</h2>
      {pro.qualifications.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {pro.qualifications.map((q) => (
            <li key={q.id} className="flex items-start gap-4 rounded-[12px] bg-reps-ivory p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-reps-warm-white text-[11px] font-bold text-reps-charcoal ring-1 ring-reps-stone">
                {q.badge}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold text-reps-charcoal">{q.title}</div>
                <div className="text-[12px] text-reps-muted-light">{q.issuer}</div>
                <div className="mt-0.5 text-[12px] text-reps-muted-light">Issued: {q.issued}</div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                <BadgeCheck className="h-3 w-3" />
                {q.verified === false ? "Approved" : "Verified"}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-[14px] text-reps-muted-light">
          Verified qualifications will appear here once added.
        </p>
      )}
    </section>
  );
}

function TrustAssurance({ pro }: { pro: PremiumProfile }) {
  const trust = pro.trust;
  const insurance = formatDateShort(trust?.insuranceExpiry);
  const identity = formatDateShort(trust?.identityVerifiedAt);
  const quals = formatDateShort(trust?.qualificationsCheckedAt);
  const items = [
    {
      label: "Identity verification",
      value: identity ? `Confirmed ${identity}` : trust?.verified ? "Confirmed on file" : "Not fully verified",
      on: !!identity || !!trust?.verified,
    },
    {
      label: "Qualifications",
      value: quals ? `Checked ${quals}` : pro.qualifications.length ? "Evidence on file" : "Not shown",
      on: !!quals || pro.qualifications.length > 0,
    },
    {
      label: "Professional indemnity",
      value: insurance ? `Active until ${insurance}` : "No active policy shown",
      on: !!insurance,
    },
  ];
  return (
    <div className="rounded-[16px] bg-reps-warm-white p-5 ring-1 ring-reps-stone">
      <h3 className="font-display text-[16px] font-bold text-reps-charcoal">Trust &amp; assurance</h3>
      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <li key={item.label} className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-1 ${
                item.on
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-reps-ivory text-reps-muted-light ring-reps-stone"
              }`}
            >
              <Check className="h-3 w-3" />
            </span>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-reps-charcoal">{item.label}</div>
              <div className="text-[12px] text-reps-muted-light">{item.value}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReviewsSection({
  reviewSummary,
  reviews,
  formatReviewWhen,
}: {
  reviewSummary: ReviewSummary;
  reviews: PublicReview[];
  formatReviewWhen: (iso: string) => string;
}) {
  return (
    <section className="rounded-[16px] bg-reps-warm-white p-6 ring-1 ring-reps-stone">
      <h2 className="font-display text-[22px] font-bold text-reps-charcoal">Verified reviews</h2>
      {reviewSummary.count > 0 ? (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="font-display text-[32px] font-bold text-reps-charcoal">
              {reviewSummary.rating.toFixed(1)}
            </div>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.round(reviewSummary.rating)
                      ? "fill-amber-500 text-amber-500"
                      : "text-reps-stone"
                  }`}
                />
              ))}
            </div>
            <div className="text-[13px] text-reps-muted-light">
              Based on {verifiedReviewLabel(reviewSummary.count)}
            </div>
          </div>

          <ul className="mt-5 space-y-4">
            {reviews.slice(0, 3).map((review) => (
              <li key={review.id} className="rounded-[12px] bg-reps-ivory p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-[13px] font-semibold text-reps-charcoal">{review.client_name}</div>
                    <div className="text-[11px] text-reps-muted-light">
                      {formatReviewWhen(review.published_at ?? review.created_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < Math.round(review.rating)
                            ? "fill-amber-500 text-amber-500"
                            : "text-reps-stone"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {review.title ? (
                  <div className="mt-2 text-[14px] font-semibold text-reps-charcoal">{review.title}</div>
                ) : null}
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-reps-charcoal/85">
                  &ldquo;{review.body}&rdquo;
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-4 rounded-[12px] bg-reps-ivory p-5 text-center">
          <p className="text-[13px] text-reps-muted-light">
            No verified reviews yet. Reviews will appear here once clients publish them.
          </p>
        </div>
      )}
    </section>
  );
}

function FaqSection({ faqs }: { faqs: PremiumProfile["faqs"] }) {
  const validFaqs = faqs.filter((f) => f.q.trim() && f.a.trim());
  if (!validFaqs.length) return null;
  return (
    <section className="rounded-[16px] bg-reps-warm-white p-6 ring-1 ring-reps-stone">
      <h2 className="font-display text-[22px] font-bold text-reps-charcoal">Frequently asked questions</h2>
      <div className="mt-4 divide-y divide-reps-stone/60">
        {validFaqs.map((faq, index) => (
          <details key={index} open={!!faq.open} className="group py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[14px] font-semibold text-reps-charcoal">
              <span>{faq.q}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-reps-muted-light transition group-open:rotate-180" />
            </summary>
            <p className="mt-2 text-[13.5px] leading-relaxed text-reps-charcoal/85">{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function BottomCta({
  pro,
  onTrackCta,
}: {
  pro: PremiumProfile;
  slug: string;
  onTrackCta?: (cta: string) => void;
}) {
  return (
    <section>
      <div className="rounded-[20px] bg-reps-charcoal p-8 text-reps-warm-white">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="font-display text-[24px] font-bold">Ready to contact {pro.firstName}?</h2>
            <p className="mt-2 text-[14px] text-reps-warm-white/80">
              Send a private enquiry to ask about services, pricing, location coverage and next steps.
            </p>
          </div>
          <Link
            to={enquiryHref(pro.slug)}
            onClick={() => onTrackCta?.("bottom_enquiry")}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-reps-orange px-6 text-[14px] font-bold text-white transition hover:bg-reps-orange-dark"
          >
            <Calendar className="h-4 w-4" />
            Send enquiry
          </Link>
        </div>
      </div>
    </section>
  );
}

function MobileStickyCta({
  pro,
  onTrackCta,
}: {
  pro: PremiumProfile;
  slug: string;
  onTrackCta?: (cta: string) => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-reps-stone bg-reps-warm-white p-3 shadow-lg lg:hidden">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-2">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-bold text-reps-charcoal">{pro.firstName}</div>
          <div className="truncate text-[11px] text-reps-muted-light">
            {pro.services[0] ? `${pro.services[0].price} ${pro.services[0].unit}` : "Enquire for services"}
          </div>
        </div>
        <Link
          to={enquiryHref(pro.slug)}
          onClick={() => onTrackCta?.("mobile_sticky_enquiry")}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[12px] bg-reps-orange px-5 text-[14px] font-bold text-white"
        >
          <MessageCircle className="h-4 w-4" />
          Enquire
        </Link>
      </div>
    </div>
  );
}

function TrustTile({
  icon: Icon,
  title,
  body,
  positive,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  positive: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ${
          positive
            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
            : "bg-reps-ivory text-reps-muted-light ring-reps-stone"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-reps-charcoal">{title}</div>
        <div className="text-[12px] text-reps-muted-light">{body}</div>
      </div>
    </div>
  );
}

function CheckRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
      <span>{children}</span>
    </li>
  );
}

