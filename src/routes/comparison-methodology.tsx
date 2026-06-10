import { createFileRoute, Link } from"@tanstack/react-router";
import { ArrowRight, ShieldCheck, FileSearch, RefreshCw, MailQuestion, Scale } from"lucide-react";

import { PublicHeader } from"@/components/public/PublicHeader";
import { PublicFooter } from"@/components/public/PublicFooter";
import { DATA_VERIFIED_DATE } from"@/data/competitor-data";

const URL ="https://repsglobal.lovable.app/comparison-methodology";
const TITLE ="Comparison Methodology — How REPs Compares Competitor Software";
const DESC =
"How REPs compiles, reviews and maintains its competitor comparisons. Based on publicly available information, with a stated 'last checked' date and an open correction-request process.";

export const Route = createFileRoute("/comparison-methodology")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name:"description", content: DESC },
      { property:"og:title", content: TITLE },
      { property:"og:description", content: DESC },
      { property:"og:url", content: URL },
    ],
    links: [{ rel:"canonical", href: URL }],
  }),
  component: MethodologyPage,
});

const PRINCIPLES = [
  {
    icon: FileSearch,
    title:"Publicly available information only",
    body:"Competitor pricing, tiers, client limits, add-ons and feature lists are taken from each vendor's publicly available pricing and feature pages. We do not use leaked, confidential or paywalled material, and we do not claim privileged access to any competitor's internal data.",
  },
  {
    icon: ShieldCheck,
    title:"Source records are kept internally",
    body:"We keep internal evidence of the page state on the date we checked it — purely so we can defend a specific claim if a competitor challenges it. We do not republish raw scraped HTML or full vendor screenshots on this site. The on-page comparison itself is the published artefact.",
  },
  {
    icon: RefreshCw,
    title:"Re-checked on a stated date",
    body: `Every comparison page shows a"Last checked" date. That date reflects the most recent review of the underlying vendor pricing page. Pricing and features change — when we re-check, the date moves and any affected claims are updated or removed.`,
  },
  {
    icon: Scale,
    title:"Honest where the competitor wins",
    body: 'Each head-to-head page includes a"When [competitor] is the right choice" section. If your needs fit a competitor better, we say so. The goal is a comparison a reader can trust, not a sales sheet.',
  },
  {
    icon: MailQuestion,
    title:"Corrections welcome",
    body:"If a claim is out of date, incomplete or wrong, we'd rather know. Email a correction request and we'll review the source page, update the claim or remove it.",
  },
];

function MethodologyPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(255,122,0,0.10),transparent)]" />
        <div className="relative mx-auto max-w-[820px] px-6 py-20 lg:px-10 lg:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
            <ShieldCheck className="h-3.5 w-3.5 text-reps-orange" aria-hidden /> Comparison methodology
          </span>
          <h1 className="mt-5 font-display text-[40px] font-bold leading-tight text-white lg:text-[52px]">
            How REPs compares competitor software.
          </h1>
          <p className="mt-5 text-[16px] leading-relaxed text-white/70">
            Our /compare pages are written to be factual, objective, verifiable
            and non-misleading. This page explains how we compile them, what
            sources we use, how often we re-check, and how to request a
            correction.
          </p>
          <p className="mt-4 text-[13px] text-white/50">
            Last full review of comparison data: <span className="text-white/75">{DATA_VERIFIED_DATE}</span>.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-[820px] px-6 py-16 lg:px-10 lg:py-20">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
            How we compile a comparison
          </span>
          <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-white lg:text-[36px]">
            Sourced from each vendor&apos;s public pricing page.
          </h2>
          <div className="prose prose-invert mt-6 max-w-none text-[15px] leading-relaxed text-white/75">
            <p>
              For each competitor, we record their published pricing tiers,
              client limits, free-trial terms, paid add-ons, and any features
              they explicitly list as included or excluded. The source is the
              vendor&apos;s own pricing and feature pages on the date we check.
            </p>
            <p>
              Where a claim depends on a specific paid add-on (for example, a
              branded app, an AI module, or per-client charges), we cite the
              add-on by the name the vendor uses on their page so the reader
              can verify it directly.
            </p>
            <p>
              REPs&apos; own pricing is taken from the live REPs{""}
              <Link to="/pricing" className="text-reps-orange underline underline-offset-2 hover:text-white">
                pricing page
              </Link>
              . REPs has a 3-tier ladder (Verified, Pro, Studio). When we say a
              feature is &quot;included in your tier&quot;, we mean it&apos;s
              included on the REPs tier shown next to the claim — not that
              REPs ships a single universal plan.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-reps-panel/30">
        <div className="mx-auto max-w-[1100px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="max-w-[640px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
              Our principles
            </span>
            <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-white lg:text-[36px]">
              What we do — and what we don&apos;t.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {PRINCIPLES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-[18px] border border-reps-border bg-reps-panel p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange/15 text-reps-orange">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 font-display text-[18px] font-semibold text-white">
                  {title}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/70">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-[820px] px-6 py-16 lg:px-10 lg:py-20">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
            What this page is — and isn&apos;t
          </span>
          <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-white lg:text-[36px]">
            Language we deliberately don&apos;t use.
          </h2>
          <div className="prose prose-invert mt-6 max-w-none text-[15px] leading-relaxed text-white/75">
            <ul>
              <li>
                We don&apos;t describe our comparisons as &quot;legally
                guaranteed&quot;. They&apos;re an honest read of publicly
                available information at a stated point in time.
              </li>
              <li>
                We don&apos;t describe our process as &quot;legally
                scraped&quot;. We use &quot;publicly available information&quot;
                or &quot;publicly available source data&quot;.
              </li>
              <li>
                We don&apos;t republish raw scraped HTML, full vendor
                screenshots, or anything that could be passed off as the
                vendor&apos;s own marketing material. Source captures are kept
                internally as evidence only.
              </li>
              <li>
                We don&apos;t treat REPs as a single flat plan in comparison
                copy. REPs has a 3-tier ladder, and any &quot;everything
                included&quot; framing always means &quot;inside your chosen
                REPs tier&quot;.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-reps-panel/30">
        <div className="mx-auto max-w-[820px] px-6 py-16 lg:px-10 lg:py-20">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
            Corrections & contact
          </span>
          <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-white lg:text-[36px]">
            Spotted something wrong? Tell us.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/70">
            If you&apos;re a competitor, a customer, or just a reader who&apos;s
            checked the source and thinks we&apos;ve got something out of date
            or incorrect, please get in touch. We&apos;ll review the source page
            and either update the claim, add context, or remove it.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/contact"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
            >
              Request a correction <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/compare"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-6 text-[14px] font-semibold text-white hover:bg-white/10"
            >
              See all comparisons
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
