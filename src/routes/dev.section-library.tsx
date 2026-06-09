import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, ShieldCheck, Sparkles } from "lucide-react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { BlockHeading } from "@/components/marketing/BlockHeading";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { MarketingHeroEyebrow } from "@/components/marketing/MarketingHeroEyebrow";
import { ProductBlock } from "@/components/marketing/ProductBlock";
import { VerifySteps } from "@/components/marketing/VerifySteps";
import { PressMarquee } from "@/components/marketing/PressMarquee";
import { RegisterProof } from "@/components/marketing/RegisterProof";
import { TestimonialFeature } from "@/components/marketing/TestimonialFeature";
import { FinalCta } from "@/components/marketing/FinalCta";
import { MarketingFaq } from "@/components/marketing/MarketingFaq";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/dev/section-library")({
  head: () => ({
    meta: [
      { title: "Section Library — REPs (internal)" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SectionLibrary,
});

const GROUPS = [
  { id: "headings", label: "Headings & eyebrows" },
  { id: "heroes", label: "Hero eyebrow" },
  { id: "blocks", label: "50/50 blocks" },
  { id: "proof", label: "Trust & proof" },
  { id: "cta", label: "CTA" },
  { id: "faq", label: "FAQ" },
  { id: "status", label: "Status accents" },
  { id: "donts", label: "What NOT to do" },
];

function SectionLibrary() {
  return (
    <div className="min-h-screen bg-reps-ink text-white">
      <SiteHeader />

      {/* Banner */}
      <div className="border-b border-reps-border bg-reps-panel/40">
        <div className="mx-auto max-w-[1320px] px-6 py-10 lg:px-10">
          <MarketingHeroEyebrow icon={Sparkles}>Internal · noindex</MarketingHeroEyebrow>
          <h1 className="mt-4 font-display text-[32px] font-bold leading-tight text-white lg:text-[44px]">
            REPs Section Library
          </h1>
          <p className="mt-3 max-w-[720px] text-[15px] leading-relaxed text-white/70">
            Every reusable marketing primitive, rendered live. Compose pages from these — never hand-roll
            section headers, hero eyebrows, FAQ blocks or 50/50s. Rules live in{" "}
            <code className="rounded-[6px] bg-reps-ink px-1.5 py-0.5 text-[12.5px] text-reps-orange">
              docs/07_design_system.md
            </code>
            .
          </p>
        </div>
      </div>

      {/* Sticky in-page nav */}
      <nav className="sticky top-[72px] z-30 border-b border-reps-border bg-reps-ink/85 backdrop-blur">
        <div className="mx-auto flex h-[52px] max-w-[1320px] items-center gap-1 overflow-x-auto px-6 lg:px-10">
          {GROUPS.map((g) => (
            <a
              key={g.id}
              href={`#${g.id}`}
              className="shrink-0 rounded-[8px] px-3 py-1.5 text-[12.5px] font-semibold text-white/70 hover:bg-reps-panel hover:text-white"
            >
              {g.label}
            </a>
          ))}
        </div>
      </nav>

      <Group id="headings" title="Headings & eyebrows">
        <Demo label="MarketingHeroEyebrow (with icon)">
          <MarketingHeroEyebrow icon={BadgeCheck} animate={false}>
            Verified register
          </MarketingHeroEyebrow>
        </Demo>
        <Demo label="MarketingHeroEyebrow (no icon)">
          <MarketingHeroEyebrow animate={false}>For professionals</MarketingHeroEyebrow>
        </Demo>
        <Demo label="SectionEyebrow — orange small-caps, bare">
          <SectionEyebrow>How it works</SectionEyebrow>
        </Demo>
        <Demo label="SectionHeading — H2, 30 → 40">
          <SectionHeading>The verified register clients already search</SectionHeading>
        </Demo>
        <Demo label="BlockHeading — H3, 28 → 36 (inside ProductBlock / in-block)">
          <BlockHeading>Reviews on the record</BlockHeading>
        </Demo>
        <Demo label="SectionHeader — eyebrow + heading + lede composite">
          <SectionHeader
            eyebrow="Pillar 1 · Visibility"
            heading="Where clients actually find you"
            lede="Verified profile, directory placement, reviews on the record — built so the work walks back to your door."
          />
        </Demo>
      </Group>

      <Group id="heroes" title="Hero eyebrow + trust chips">
        <p className="text-[14px] text-white/65">
          Full hero template (top-anchored copy, staggered fade-up, PressMarquee) lives on every marketing
          page. The hero <em>eyebrow</em> + chip row is the reusable atom — see{" "}
          <code className="rounded-[6px] bg-reps-ink px-1.5 py-0.5 text-[12.5px] text-reps-orange">
            mem://design/marketing-hero-template
          </code>
          .
        </p>
        <div className="mt-6 rounded-[18px] border border-reps-border bg-reps-panel p-6">
          <MarketingHeroEyebrow icon={ShieldCheck} animate={false}>
            REPs · Verified
          </MarketingHeroEyebrow>
          <h2 className="mt-4 font-display text-[34px] font-bold leading-tight text-white lg:text-[48px]">
            The personal trainer register clients already search
          </h2>
          <p className="mt-4 max-w-[640px] text-[16px] leading-relaxed text-white/75">
            Verify your qualifications, claim your profile, and turn the badge into bookings.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Qualifications verified", "Insurance on file", "Reviews on the record"].map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1.5 rounded-full border border-reps-border bg-reps-ink px-3 py-1 text-[11.5px] font-semibold text-white/70"
              >
                <BadgeCheck className="h-3.5 w-3.5 text-reps-orange" /> {c}
              </span>
            ))}
          </div>
        </div>
      </Group>

      <Group id="blocks" title="50/50 blocks — ProductBlock + DeviceMockup">
        <p className="text-[14px] text-white/65">
          Every feature/pillar page uses <code>ProductBlock</code> with a real REPs route inside{" "}
          <code>DeviceMockup</code>. No bespoke mockup files.
        </p>
        <div className="mt-10 grid gap-16">
          <ProductBlock
            eyebrow="Capability · Verified profile"
            title="Your verified shop-front on the register"
            body="The page clients land on after they search. Qualifications, insurance and reviews — all checked."
            bullets={["Qualifications verified", "Insurance on file", "Reviews on the record"]}
            imageLabel="Pro profile"
            mockup={{ device: "laptop", src: "/pro/james-carter", title: "Verified profile" }}
          />
          <ProductBlock
            reverse
            eyebrow="Capability · Coach shop-front"
            title="A premium page for your services"
            body="Pro-tier shop-front with tiered services, transformations and proof."
            bullets={["Three-tier services", "Transformation proof", "Embedded booking"]}
            imageLabel="Coach shop-front"
            mockup={{ device: "phone", src: "/c/james-wilson", title: "Coach shop-front" }}
          />
        </div>
      </Group>

      <Group id="proof" title="Trust & proof strips">
        <Demo label="VerifySteps — numbered 3-step strip with banner">
          <VerifySteps
            eyebrow="How verification works"
            heading="Three checks, one verified badge"
            steps={[
              { icon: BadgeCheck, title: "Qualifications", body: "Upload, we verify against the awarding body." },
              { icon: ShieldCheck, title: "Insurance", body: "Live policy on file — we check it stays live." },
              { icon: Sparkles, title: "CPD", body: "Tracked annually. Badge lapses if CPD lapses." },
            ]}
            bannerText="Free to verify. Free to stay verified."
          />
        </Demo>
        <Demo label="PressMarquee — auto-scrolling editorial wordmarks">
          <PressMarquee />
        </Demo>
        <Demo label="RegisterProof — 3-up proof card grid">
          <RegisterProof />
        </Demo>
        <Demo label="TestimonialFeature — quote + stat tiles">
          <TestimonialFeature />
        </Demo>
      </Group>

      <Group id="cta" title="End-of-page CTA">
        <FinalCta
          heading="Get on the verified register"
          headingAccent=" today."
          lede="Founding pricing locked for life. Cancel anytime."
          primary={{ to: "/signup", label: "Verify my profile" }}
          secondary={{ to: "/pricing", label: "See pricing" }}
        />
      </Group>

      <Group id="faq" title="FAQ block">
        <MarketingFaq
          heading="Common questions"
          items={[
            { q: "How long does verification take?", a: "Most pros are verified within 48 hours of uploading qualifications and insurance." },
            { q: "Do reviews stay on the record?", a: "Yes. Reviews are tied to your verified profile and cannot be deleted by you or the platform." },
            { q: "What happens if my CPD lapses?", a: "Your badge changes state and clients see it on your profile until CPD is renewed." },
          ]}
        />
      </Group>

      <Group id="status" title="Status accents (emerald — status only)">
        <p className="text-[14px] text-white/65">
          Emerald is the ONLY non-orange accent and ONLY for status semantics. Never decorative.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-[12px] font-semibold text-emerald-300">
            <BadgeCheck className="h-3.5 w-3.5" /> Verified
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-[12px] font-semibold text-emerald-300">
            Active
          </span>
          <Badge variant="secondary">Secondary badge</Badge>
        </div>
      </Group>

      <Group id="donts" title="What NOT to do" tone="danger">
        <ul className="grid gap-3">
          {[
            "Hand-roll <h2 className=\"font-display text-[40px]...\"> — use <SectionHeading>.",
            "Hand-roll <h3 className=\"font-display text-[36px]...\"> inside a 50/50 — use <BlockHeading>.",
            "rounded-xl / rounded-2xl / rounded-3xl / rounded-[14|20|28|32]px — use the 9-step scale.",
            "Decorative emerald or any non-orange accent outside status semantics.",
            "Gold/yellow rating stars — stars are brand orange.",
            "shadow-* on buttons — buttons are flat.",
            "\"UK\" / \"REPs UK\" / country qualifiers in product or marketing copy.",
            "Naming CIMSPA — use \"Ofqual-regulated\" or \"recognised awarding body\".",
          ].map((t) => (
            <li
              key={t}
              className="rounded-[12px] border border-red-500/30 bg-red-500/5 px-4 py-3 text-[13.5px] text-white/80"
            >
              {t}
            </li>
          ))}
        </ul>
      </Group>

      <div className="border-t border-reps-border py-12 text-center">
        <Link to="/" className="text-[13px] font-semibold text-reps-orange hover:underline">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}

function Group({
  id,
  title,
  tone = "default",
  children,
}: {
  id: string;
  title: string;
  tone?: "default" | "danger";
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-[140px] border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
        <div className="flex items-center gap-3">
          <span
            className={
              tone === "danger"
                ? "rounded-[6px] bg-red-500/15 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-red-300"
                : "rounded-[6px] bg-reps-orange-soft px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-reps-orange"
            }
          >
            #{id}
          </span>
          <h2 className="font-display text-[24px] font-bold text-white lg:text-[28px]">{title}</h2>
        </div>
        <div className="mt-8 space-y-10">{children}</div>
      </div>
    </section>
  );
}

function Demo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
        {label}
      </p>
      <div className="rounded-[16px] border border-dashed border-reps-border bg-reps-panel/30 p-6">
        {children}
      </div>
    </div>
  );
}
