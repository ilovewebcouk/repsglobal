import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Clock,
  ExternalLink,
  FileText,
  Flag,
  ShieldCheck,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { VerificationCard } from "@/components/marketing/VerificationCard";
import proJames from "@/assets/pro-james.jpg";

interface VerificationRecord {
  id: string;
  slug: string;
  name: string;
  role: string;
  location: string;
  photo: string;
  joined: string;
  lastVerified: string;
  renewsOn: string;
  chain: Array<{
    title: string;
    detail: string;
    source: string;
    verifiedOn: string;
  }>;
  cpd: { logged: number; periodLabel: string; lastEntry: string };
  professionalSince: string;
}

const RECORDS: Record<string, VerificationRecord> = {
  "reps-2024-08147": {
    id: "REPS-2024-08147",
    slug: "james-carter",
    name: "James Carter",
    role: "Personal Trainer",
    location: "London, UK",
    photo: proJames,
    joined: "March 2024",
    lastVerified: "Mar 2026",
    renewsOn: "Mar 2027",
    professionalSince: "2018",
    chain: [
      {
        title: "Qualifications",
        detail: "Level 3 Diploma in Personal Training · Level 4 Lower Back Pain Management",
        source: "Ofqual-regulated awarding body · matched on register",
        verifiedOn: "12 Mar 2026",
      },
      {
        title: "Insurance",
        detail: "Public Liability £5m · Professional Indemnity £2m",
        source: "Specialist sports insurer · policy in date",
        verifiedOn: "01 Mar 2026",
      },
      {
        title: "Identity",
        detail: "Government photo ID · biometric selfie match",
        source: "Independent ID verification provider",
        verifiedOn: "08 Mar 2026",
      },
      {
        title: "CPD",
        detail: "32 hours logged in the last 12 months",
        source: "REPs CPD register · linked to provider receipts",
        verifiedOn: "Rolling — last entry 02 Jun 2026",
      },
    ],
    cpd: { logged: 32, periodLabel: "last 12 months", lastEntry: "02 Jun 2026" },
  },
};

export const Route = createFileRoute("/verify/$id")({
  loader: ({ params }) => {
    const record = RECORDS[params.id.toLowerCase()];
    if (!record) throw notFound();
    return { record };
  },
  head: ({ loaderData }) => {
    const r = loaderData?.record;
    const title = r
      ? `Verified — ${r.name} (${r.id}) | REPs`
      : "Verification record — REPs";
    const description = r
      ? `Public verification record for ${r.name}, ${r.role} in ${r.location}. Qualifications, insurance, identity and CPD — all checked on ${r.lastVerified}.`
      : "Public verification record on REPs.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        // Verification pages are public proof — never noindex
        { name: "robots", content: "index,follow" },
      ],
    };
  },
  notFoundComponent: VerifyNotFound,
  errorComponent: () => (
    <div className="min-h-screen bg-reps-ink text-white">
      <PublicHeader />
      <main className="mx-auto max-w-[760px] px-6 py-24 text-center">
        <h1 className="font-display text-[28px] font-bold">Something went wrong</h1>
        <p className="mt-3 text-white/65">
          We couldn't load this verification record. Try refreshing, or return to the register.
        </p>
        <Link
          to="/find-a-professional"
          className="mt-6 inline-flex items-center gap-2 rounded-[10px] bg-reps-orange px-5 py-3 text-[13.5px] font-semibold"
        >
          Browse the register <ArrowRight className="h-4 w-4" />
        </Link>
      </main>
      <PublicFooter />
    </div>
  ),
  component: VerifyRecordPage,
});

function VerifyNotFound() {
  return (
    <div className="min-h-screen bg-reps-ink text-white">
      <PublicHeader />
      <main className="mx-auto max-w-[760px] px-6 py-24">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
          <Flag className="h-3 w-3" />
          Record not found
        </span>
        <h1 className="mt-4 font-display text-[34px] font-bold leading-tight">
          We can't find that verification ID.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-white/70">
          The ID may have been mistyped, the professional may have left the register, or the QR code may be from a fake credential. If you were shown this code in person, ask to see the live card on the professional's REPs app — and report it below if anything feels off.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            to="/find-a-professional"
            className="inline-flex items-center gap-2 rounded-[10px] bg-reps-orange px-5 py-3 text-[13.5px] font-semibold"
          >
            Browse the register <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/verify"
            className="inline-flex items-center gap-2 rounded-[10px] border border-white/15 bg-white/5 px-5 py-3 text-[13.5px] font-semibold text-white/85 hover:bg-white/10"
          >
            How verification works
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

function VerifyRecordPage() {
  const { record } = Route.useLoaderData();
  const verifyUrl = `https://repsglobal.lovable.app/verify/${record.id.toLowerCase()}`;

  return (
    <div className="min-h-screen bg-reps-ink text-white">
      <PublicHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/10">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 right-[-10%] h-[420px] w-[420px] rounded-full bg-reps-orange/10 blur-[120px]"
          />
          <div className="relative mx-auto max-w-[1200px] px-6 pt-20 pb-14 lg:px-10 lg:pt-24 lg:pb-20">
            <Link
              to="/verify"
              className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-white/70 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to How verification works
            </Link>

            <div className="mt-6 grid items-start gap-12 lg:grid-cols-[1fr_minmax(340px,420px)]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-300">
                  <BadgeCheck className="h-3 w-3" />
                  Verified Professional · Active
                </span>
                <h1 className="mt-5 font-display text-[40px] font-bold leading-[1.05] tracking-tight text-white lg:text-[52px]">
                  {record.name}
                </h1>
                <p className="mt-3 text-[16px] text-white/70">
                  {record.role} · {record.location}
                </p>

                <dl className="mt-8 grid max-w-[520px] grid-cols-2 gap-4 text-[12.5px]">
                  <div className="rounded-[14px] border border-white/10 bg-white/[0.04] p-4">
                    <dt className="text-white/55">Verification ID</dt>
                    <dd className="mt-1 font-mono text-[13px] text-white">{record.id}</dd>
                  </div>
                  <div className="rounded-[14px] border border-white/10 bg-white/[0.04] p-4">
                    <dt className="text-white/55">On REPs since</dt>
                    <dd className="mt-1 text-[13px] text-white">{record.joined}</dd>
                  </div>
                  <div className="rounded-[14px] border border-white/10 bg-white/[0.04] p-4">
                    <dt className="text-white/55">Last verified</dt>
                    <dd className="mt-1 text-[13px] text-white">{record.lastVerified}</dd>
                  </div>
                  <div className="rounded-[14px] border border-white/10 bg-white/[0.04] p-4">
                    <dt className="text-white/55">Next renewal</dt>
                    <dd className="mt-1 text-[13px] text-white">{record.renewsOn}</dd>
                  </div>
                </dl>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to="/pro/$slug"
                    params={{ slug: record.slug }}
                    className="inline-flex items-center gap-2 rounded-[10px] bg-reps-orange px-5 py-3 text-[13.5px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover"
                  >
                    View {record.name.split(" ")[0]}'s profile
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/verify"
                    className="inline-flex items-center gap-2 rounded-[10px] border border-white/15 bg-white/5 px-5 py-3 text-[13.5px] font-semibold text-white/85 hover:bg-white/10"
                  >
                    How we verify
                  </Link>
                </div>
              </div>

              <div className="flex justify-center lg:justify-end">
                <VerificationCard
                  name={record.name}
                  role={record.role}
                  location={record.location}
                  photo={record.photo}
                  verifiedId={record.id}
                  verifyUrl={verifyUrl}
                  lastVerified={record.lastVerified}
                  renewsOn={record.renewsOn}
                  size="lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Verification chain */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-[1200px] px-6 py-16 lg:px-10 lg:py-20">
            <div className="max-w-[760px]">
              <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-reps-orange">
                Verification chain
              </span>
              <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[36px]">
                What we checked, when, and how.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-white/70">
                REPs verification is a chain — not a badge. Every link below was checked against a third-party source on the date shown. If any link expires, the verified status is paused until it's renewed.
              </p>
            </div>

            <ol className="mt-10 grid gap-4 md:grid-cols-2">
              {record.chain.map((c, i) => (
                <li
                  key={c.title}
                  className="rounded-[18px] border border-white/10 bg-white/[0.04] p-6"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/45">
                      Link {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.12em] text-emerald-300 ring-1 ring-emerald-400/30">
                      <ShieldCheck className="h-3 w-3" />
                      Verified
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-[20px] font-bold text-white">{c.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-white/75">{c.detail}</p>
                  <div className="mt-4 space-y-1.5 border-t border-white/10 pt-4 text-[12.5px] text-white/60">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5" />
                      {c.source}
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Verified on <span className="text-white/85">{c.verifiedOn}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            {/* CPD strip */}
            <div className="mt-10 flex flex-wrap items-center justify-between gap-6 rounded-[22px] border border-white/10 bg-white/[0.04] p-6 lg:p-8">
              <div className="flex items-center gap-5">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-reps-orange/15 text-reps-orange ring-1 ring-reps-orange/30">
                  <Clock className="h-6 w-6" strokeWidth={1.8} />
                </span>
                <div>
                  <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/55">
                    CPD activity
                  </div>
                  <div className="mt-1 font-display text-[24px] font-bold text-white">
                    {record.cpd.logged} hours logged · {record.cpd.periodLabel}
                  </div>
                  <div className="mt-0.5 text-[13px] text-white/65">
                    Last entry {record.cpd.lastEntry} · professionally active since {record.professionalSince}
                  </div>
                </div>
              </div>
              <Link
                to="/cpd-v2"
                className="inline-flex items-center gap-2 text-[13px] font-semibold text-white/80 hover:text-white"
              >
                What counts as CPD
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Trust / report */}
        <section>
          <div className="mx-auto max-w-[1200px] px-6 py-16 lg:px-10 lg:py-20">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-8">
                <ShieldCheck className="h-6 w-6 text-emerald-300" />
                <h3 className="mt-4 font-display text-[20px] font-bold text-white">
                  This record is live.
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                  Bookmark or share this page — the URL is permanent. If anything in the chain expires, this page updates within 24 hours and the verified badge on {record.name.split(" ")[0]}'s profile is paused until it's renewed.
                </p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-8">
                <Flag className="h-6 w-6 text-reps-orange" />
                <h3 className="mt-4 font-display text-[20px] font-bold text-white">
                  Something not right?
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                  If you've been shown this credential in person and the photo, name or ID doesn't match the live record above, report it. We investigate every report within two working days.
                </p>
                <Link
                  to="/contact"
                  className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-reps-orange hover:underline"
                >
                  Report a verification issue
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
